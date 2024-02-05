import m from 'mithril'
import { WebMidi } from 'webmidi'

function deviceNames(devices: Array<WebMidi.MIDIPort>) {
  return devices.map(device => device.name)
}

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
        })

        WebMidi.addListener('disconnected', e => {
          console.log('device disconnected', e)
          update({
            midi: {
              inputs: deviceNames(WebMidi.inputs),
              outputs: deviceNames(WebMidi.outputs),
            },
          })
          //   if (e.port.name == state.deviceName) {
          //     console.log('active device disconnected!')
          //     state.connected = false
          //     m.redraw()
          //   }
          //   actions.reloadInputs()
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
}

export const ConnectionPage = cell => [
  m('h1', 'Connect your Launchpad'),
  m('h2', 'Inputs'),
  m('', {}, [WebMidi.inputs.map(input => m('', {}, input.name))]),
  m('h2', 'Outputs'),
  m('', {}, [WebMidi.outputs.map(output => m('', {}, output.name))]),
]
