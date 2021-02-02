import m from 'mithril'
import WebMidi from 'webmidi'

const deviceName = 'Launchpad X MIDI 2'

export function Connect() {
  var input, output
  var connected = false
  function toggleLive() {
    connected = !connected
    output.sendSysex([0, 32, 41], [2, 12, 14, connected ? 1 : 0])
  }
  function exit() {
    if (connected) toggleLive()
  }
  function midiConnect() {
    WebMidi.enable(function (err) {
      console.log(WebMidi.inputs)
      console.log(WebMidi.outputs)
      WebMidi.addListener("connected", function(e) {
        // console.log('midi connected', e, e.port.name)
        if (e.port.name == deviceName) {
          if (e.port.type == 'output') {
            output = e.port
            console.log('output', output)
            // output.playNote('F4')
            toggleLive()
          } else {
            input = e.port
            console.log('input', input)
            input.addListener('noteon', "all", e => {
              console.log("Received 'noteon' message", e.note.name + e.note.octave, e)
            })
          }
          m.redraw()
        }
      })
      WebMidi.addListener("disconnected", function(e) {
        console.log('midi disconnected', e)
        if (e.port.name == deviceName) {
          if (e.port.type == 'output') {
            output = null
            connected = false
          } else {
            input = null
          }
          m.redraw()
        }
      })
      
      window.onunload = e => {
        console.log('unloading')
        exit()
      }
    }, true)
  }

  return {
    oninit: vnode => {
      midiConnect()
    },
    
    view: vnode => {
      return [
        m('.status', {class: input && output ? 'connected' : 'disconnected'}, ''),
        m('input[type=button].button', {
          onclick: e => {
            if (connected) {
              console.log('disconnecting')
              exit()
              m.redraw()
            } else {
              midiConnect()
            }
          },
        }, input && output ? 'disconnect' : 'connect')
      ]
    }
  }
}

