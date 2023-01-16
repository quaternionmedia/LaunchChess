import m from 'mithril'
import { WebMidi } from 'webmidi'
import { StatusIcon, ConnectToggle } from './Toolbar'
import { Button } from 'construct-ui'
import { Launchpads, NOVATION, HEADERS, NAMES } from './Launchpad'
import { onlineActions } from './index'
import { ColorConfig } from './Color'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'

const equals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

export const Connector = (state, actions) => ({
  connect: name => {
    // search on device name only
    name = name.replace(' Out', '')
    if (state.connected) {
      actions.disconnect()
    }
    state.output = WebMidi.getOutputByName(name || state.inputName)
    state.outputName = state.output.name
    state.input = WebMidi.getInputByName(name || state.outputName)
    state.inputName = state.input.name
    console.log('connected', state.input)
    if (state.input) {
      // send sysex to see if device is a launchpad
      state.connected = true
      state.deviceName = name
      actions.detectDevice(state.input, state.output)
    } else {
      state.connected = false
    }
  },
  connectInput: id => {
    state.input = WebMidi.getInputById(id)
    state.inputName = state.input.name
    console.log('connected', state.input)
    if (state.input) {
      // send sysex to see if device is a launchpad
      state.connected = true
    } else {
      state.connected = false
    }
  },

  connectOutput: id => {
    state.output = WebMidi.getOutputById(id)
    state.outputName = state.output.name
    console.log('connected', state.output)
    if (state.output) {
      // send sysex to see if device is a launchpad
      state.connected = true
      let launchpad = NAMES[state.output.name]
      console.log('assigning ', launchpad)
      Object.assign(actions, Launchpads[launchpad](state, actions))
      Object.assign(onlineActions, Launchpads[launchpad](state, actions))
      actions.toggleLive(state.connected)
    } else {
      state.connected = false
    }
  },
  disconnect: () => {
    if (state.input) {
      if (state.connected)
        try {
          actions.toggleLive(false)
        } catch (err) {
          console.log('error disconnecting', err)
        }
      state.input.removeListener()
      state.input = null
      state.output = null
    }
    state.connected = false
  },
  reloadInputs: () => {
    state.inputs(WebMidi.inputs)
    state.outputs(WebMidi.outputs)
    if (!state.connected && state.inputs().length == 1) {
      let name = state.inputs()[0].name
      console.log('single input: auto connecting', name)
      let launchpad = NAMES[name]
      console.log('auto connecting to ', name, launchpad)
      Object.assign(actions, Launchpads[launchpad](state, actions))
      Object.assign(onlineActions, Launchpads[launchpad](state, actions))
      actions.connect(name)
      actions.toggleLive(state.connected)
    }
    m.redraw()
  },
  initConnector: () => {
    try {
      WebMidi.enable(function (err) {
        console.debug(WebMidi.inputs)
        console.debug(WebMidi.outputs)
        actions.reloadInputs()

        WebMidi.addListener('connected', e => {
          console.log('device connected')
          actions.reloadInputs()
        })

        WebMidi.addListener('disconnected', e => {
          console.log('device disconnected', e)
          if (e.port.name == state.deviceName) {
            console.log('active device disconnected!')
            state.connected = false
            m.redraw()
          }
          actions.reloadInputs()
        })
      }, true)
      window.onunload = e => {
        console.log('unloading')
        actions.disconnect()
      }
    } catch (err) {
      console.log('error setting up WebMidi', err)
    }
  },
  initMidi: (noteCallback, ccCallback, afterInit) => {
    console.log(WebMidi.inputs)
    console.log(WebMidi.outputs)
    if (state.input) {
      state.input.removeListener()
      state.input.addListener('noteon', 'all', noteCallback)
      state.input.addListener('controlchange', 'all', ccCallback)
      // state.input.addListener('midimessage', m => console.log('MIDI', m))
    } else {
      console.log('error, not connected')
    }
    afterInit()
  },
  detectDevice: (input, output) => {
    input.addListener('sysex', 'all', sysex => {
      let data = sysex.data
      console.log('got sysex message', sysex)
      if (
        equals(data.slice(0, 5), [240, 126, 0, 6, 2]) &&
        equals(data.slice(5, 8), NOVATION)
      ) {
        console.log('found Novation product')
        Object.values(HEADERS).map(value => {
          output.sendSysex(NOVATION, [...value, 14])
        })
      }
      if (equals(data.slice(0, 4), [240, ...NOVATION]) && data[6] == 14) {
        let header = data.slice(4, 6)
        console.log('identified device!', header)
        state.header = header
        for (const key in HEADERS) {
          if (equals(header, HEADERS[key])) {
            console.log('this is a ', key)
            state.deviceType = key
            Object.assign(actions, Launchpads[key](state, actions))
            Object.assign(onlineActions, Launchpads[key](state, actions))
            input.removeListener('sysex')
            actions.toggleLive(true)
          }
        }
      }
    })
    output.sendSysex([126, 127, 6], [1])
  },
})

export const MidiInputSelector = (state, actions) =>
  m(
    'select',
    {
      oninput: e => actions.connectInput(e.target.value),
    },
    state.inputs().map(c => {
      return m(
        'option',
        { value: c.id, selected: c.name == state.inputName },
        c.name
      )
    })
  )
export const MidiOutputSelector = (state, actions) =>
  m(
    'select',
    {
      oninput: e => actions.connectOutput(e.target.value),
    },
    state.outputs().map(c => {
      return m(
        'option',
        { value: c.id, selected: c.name == state.outputName },
        c.name
      )
    })
  )
export const LaunchpadSelector = (state, actions) =>
  m(
    'select',
    {
      value: state.deviceType,
      oninput: e => {
        let value = e.target.value
        console.log('selected', e, value)
        state.deviceType = value
        if (state.connected) {
          Object.assign(actions, Launchpads[value](state, actions))
          Object.assign(onlineActions, Launchpads[value](state, actions))
          state.input.removeListener('sysex')
          actions.toggleLive(true)
        } else {
        }
      },
    },
    [m('option'), Object.keys(HEADERS).map(h => m('option', { value: h }, h))]
  )

export const LaunchpadButton = (name, state, actions) =>
  m(
    Button,
    {
      label: name,
      class: state.connected && state.inputName == name ? 'glow active' : '',
      onclick: e => {
        if (state.connected) {
          actions.disconnect()
        } else {
          actions.connect(name)
        }
      },
    },
    name
  )

export const Disconnect = (state, actions) =>
  m(Button, {
    onclick: e => {
      actions.disconnect()
    },
    iconLeft: 'zap-off',
    label: 'disconnect',
  })

export const ConnectionPage = (state, actions) => ({
  view: vnode =>
    m('.ConnectionPage', {}, [
      m('h1', 'Connect your Launchpad'),
      StatusIcon(state),
      state.inputs().length
        ? state.inputs().map(i => {
            if (i.name in NAMES) {
              let matches = Object.keys(NAMES).filter(n => i.name.includes(n))
              console.log(`checking ${i.name}`, matches)
              if (matches.length) {
                return LaunchpadButton(i.name, state, actions)
              }
            }
          })
        : 'no Launchpads detected',
      state.connected ? Disconnect(state, actions) : null,
      m('h3', {}, 'Input'),
      MidiInputSelector(state, actions),
      m('h3', {}, 'Output'),
      MidiOutputSelector(state, actions),
      m('h3', {}, 'Type'),
      LaunchpadSelector(state, actions),
      // m('br'),
      // ConnectToggle(state, actions),
      ColorConfig(state, actions),
    ]),
})
