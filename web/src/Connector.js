import m from 'mithril'
import WebMidi from 'webmidi'
import { StatusIcon, ConnectToggle } from './Toolbar'
import { Launchpads, NOVATION, HEADERS } from './Launchpad'
import { onlineActions } from './index'

const equals = (a, b) =>
  a.length === b.length &&
  a.every((v, i) => v === b[i])


export const Connector = (state, actions) => ({
  connect: (name) => {
    if (state.connected) {
      actions.disconnect()
    }
    state.output = WebMidi.getOutputByName(name || state.deviceName)
    state.input = WebMidi.getInputByName(name || state.deviceName)
    state.connected = true
    state.deviceName = name
    console.log('connected', state.input)
    if (state.input) {
      // send sysex to see if device is a launchpad
      actions.detectDevice(state.input, state.output)
    } else {
      
    }
  },
  disconnect: () => {
    if (state.input) {
      if (state.connected) actions.toggleLive(false)
      state.input.removeListener()
      state.input = null
      state.output = null
    }
    state.connected = false
    
  },
  reloadInputs: () => {
    state.inputs(WebMidi.inputs.map(i => {
      return i.name.startsWith('Launch') ? i: null
    }).filter(Boolean))
    m.redraw()
  },
  initConnector: () => {
    WebMidi.enable(function (err) {
      console.log(WebMidi.inputs)
      console.log(WebMidi.outputs)
      actions.reloadInputs()
      console.log('inputs', state.inputs())
      
      WebMidi.addListener('connected', e => {
        console.log('device connected')
        actions.reloadInputs()
      })
      
      WebMidi.addListener('disconnected', e => {
        console.log('device disconnected')
        actions.reloadInputs()
      })
      
  }, true)
  window.onunload = e => {
   console.log('unloading')
   actions.disconnect()
  }
  
  
  },
  initMidi: (noteCallback, ccCallback, afterInit) => {
    // WebMidi.enable(function (err) {
    console.log(WebMidi.inputs)
    console.log(WebMidi.outputs)
    if (state.input) {
      state.input.removeListener()
      state.input.addListener('noteon', "all", noteCallback)
      state.input.addListener('controlchange', "all", ccCallback)
      
      afterInit()      
    } else {
      console.log('error, not connected')
    }
  },
  detectDevice: (input, output) => {
    input.addListener('sysex', 'all', sysex => {
      let data = sysex.data
      console.log('got sysex message', sysex)
      if (equals(data.slice(0, 5), [240, 126, 0, 6, 2]) && equals(data.slice(5, 8), NOVATION)) {
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
            Object.assign(actions, Launchpads[key](state, actions))
            Object.assign(onlineActions, Launchpads[key](state, actions))
            input.removeListener('sysex')
            actions.toggleLive(true)
          }
        }
      }
    })
    output.sendSysex([126, 127, 6], [1])
  }
})

export const MidiSelector = (state, actions) => m('select', {
  value: null,
  oninput: e => actions.connect(e.target.value)}, state.inputs().map(c => {
      return m('option', {value: c.name}, c.name)
    }))

export const LaunchpadButton = (state, actions) => m('button.button.launchpad', {
    onclick: e => {
      actions.connect(state.name)
    },
}, state.name)

export const ConnectionPage = (state, actions) => ({
  view: vnode => m('.ConnectionPage', {}, [
    m('h1', 'Connect your Launchpad'),
    StatusIcon(state),
    state.inputs().length ? state.inputs().map(i => {
      return LaunchpadButton({name: i.name}, actions)
    }) : 'no Launchpads connected',
    // MidiSelector(state, actions),
    // ConnectToggle(state, actions)
  ])
})