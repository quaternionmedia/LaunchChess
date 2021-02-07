import WebMidi from 'webmidi'
import { deviceName } from './config'

export var Midi = {
  input: null, 
  output: null,
  connected: false,
  toggleLive: () => {
    Midi.connected = !Midi.connected
    Midi.output.sendSysex([0, 32, 41], [2, 12, 14, Midi.connected ? 1 : 0])
  },
  connect: (noteCallback, ccCallback, afterInit) => {
    Midi.input = WebMidi.getInputByName(deviceName)
    Midi.input.addListener('noteon', "all", noteCallback)
    Midi.input.addListener('controlchange', "all", ccCallback)
    Midi.output = WebMidi.getOutputByName(deviceName)
    console.log('connecting', Midi.input, Midi.output)
    afterInit()
  },
  close: () => {
    if (Midi.connected) Midi.toggleLive()
    if (Midi.input) {
      Midi.input.removeListener()
      Midi.input = null
    }
    if (Midi.output) Midi.output = null
  },
  init: (noteCallback, ccCallback, afterInit) => {
    WebMidi.enable(function (err) {
      console.log(WebMidi.inputs)
      console.log(WebMidi.outputs)
      WebMidi.addListener("connected", function(e) {
        // console.log('midi connected', e, e.port.name)
        if (e.port.name == deviceName) {
          if (e.port.type == 'output') {
            Midi.output = e.port
            console.log('output', Midi.output)
            // output.playNote('F4')
            // Midi.toggleLive()
            afterInit()
          } else {
            Midi.input = e.port
            console.log('input', Midi.input)
            Midi.input.addListener('noteon', "all", noteCallback)
            Midi.input.addListener('controlchange', "all", ccCallback)
          }
        }
      })
      WebMidi.addListener("disconnected", function(e) {
        console.log('midi disconnected', e)
        if (e.port.name == deviceName) {
          if (e.port.type == 'output') {
            Midi.output = null
            Midi.connected = false
          } else {
            Midi.input = null
          }
        }
      })
      
      window.onunload = e => {
        console.log('unloading')
        close()
      }
    }, true)
    
  }
}