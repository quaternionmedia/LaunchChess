import m from 'mithril'
import { WebMidi } from 'webmidi'

function deviceNames(devices: Array<WebMidi.MIDIPort>) {
  return devices.map(device => device.name)
}

const re = /^Launchpad/
export const ConnectActions = {
  init: ({ state, update }) => {
    try {
      console.log('init webmidi')
      WebMidi.enable(function (err) {
        console.debug(WebMidi.inputs)
        console.debug(WebMidi.outputs)
        WebMidi.addListener('connected', e => {
          console.log('device connected', e)
          update({
            midi: {
              inputs: deviceNames(WebMidi.inputs),
              outputs: deviceNames(WebMidi.outputs),
            },
          })
          if (e.port.type === 'output' && re.exec(e.port.name)) {
            console.log('found launchpad', e.port.name)
            update({ midi: { output: e.port.name } })
          }
        })

        WebMidi.addListener('disconnected', e => {
          console.log('device disconnected', e)
          update({
            midi: {
              inputs: deviceNames(WebMidi.inputs),
              outputs: deviceNames(WebMidi.outputs),
            },
          })
        })
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
}

export const ConnectionPage = cell => [
  m('h1', 'Connect your Launchpad'),
  m('h2', 'Inputs'),
  m('', {}, [WebMidi.inputs.map(input => m('', {}, input.name))]),
  m('h2', 'Outputs'),
  m('', {}, [WebMidi.outputs.map(output => m('', {}, output.name))]),
]

window.midi = WebMidi