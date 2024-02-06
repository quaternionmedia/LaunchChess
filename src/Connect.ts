import m from 'mithril'
import { WebMidi } from 'webmidi'
import { NOVATION, HEADERS } from './config.ts'

function deviceNames(devices: Array<WebMidi.MIDIPort>) {
  return devices.map(device => device.name)
}

const re = /^Launchpad/
const equals = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])

export const ConnectActions = {
  init: ({ state, update }) => {
    try {
      console.log('init webmidi')
      WebMidi.enable(function (err) {
        console.log(WebMidi.inputs)
        console.log(WebMidi.outputs)
        ConnectActions.updateMidiDevices({ state, update })

        WebMidi.addListener('connected', e => {
          ConnectActions.updateMidiDevices({ state, update }, e)
        })
        WebMidi.addListener('disconnected', e => {
          console.log('device disconnected', e)
          ConnectActions.updateMidiDevices({ state, update }, e)
        })
        for (let input of WebMidi.inputs) {
          ConnectActions.detectDevice({ state, update }, input)
        }
      }, true)
      window.onunload = e => {
        console.log('unloading')
        ConnectActions.disconnect({ state, update })
      }
    } catch (err) {
      console.log('error setting up WebMidi', err)
    }
  },
  connect: ({ state, update }) => {
    console.log('connecting')
  },
  disconnect: ({ state, update }) => {
    if (!state.input) return
    console.log('disconnecting')
    try {
      update({ midi: { live: false } })
    } catch (err) {
      console.log('error disconnecting', err)
    }
    state.input.removeListener()
    update({ midi: { input: undefined, output: undefined } })
    WebMidi.disable()
  },
  updateMidiDevices: ({ state, update }) => {
    console.log('updating midi devices')
    update({
      midi: {
        inputs: deviceNames(WebMidi.inputs),
        outputs: deviceNames(WebMidi.outputs),
      },
    })
  },
  detectDevice: ({ state, update }, device) => {
    console.log('detecting device', device)
    device.addListener('sysex', 'all', sysex => {
      let data = sysex.data
      console.log('got sysex message', sysex)
      if (
        equals(data.slice(0, 5), [240, 126, 0, 6, 2]) &&
        equals(data.slice(5, 8), NOVATION)
      ) {
        console.log('found Novation product')
        let output = WebMidi.getOutputByName(device.name.replace(' Out', ''))
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
            device.removeListener('sysex')
            actions.toggleLive(true)
          }
        }
      }
    })
    let output = WebMidi.getOutputByName(device.name.replace(' Out', ''))
    output.sendSysex([126, 127, 6], [1])
    // const input = WebMidi.getInputByName(name)
    // const output = WebMidi.getOutputByName(name)
    // if (input && output) {
    //   console.log('found device', input, output)
    //   update({ midi: { input, output, live: true } })
    // }
  },
}

export const ConnectionPage = cell => [
  m('h1', 'Connect your Launchpad'),
  m('h2', 'Inputs'),
  m('', {}, [WebMidi.inputs.map(input => m('', {}, input.name))]),
  m('h2', 'Outputs'),
  m('', {}, [WebMidi.outputs.map(output => m('', {}, output.name))]),
]

window.midi = WebMidi