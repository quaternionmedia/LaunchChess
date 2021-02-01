import m from 'mithril'
import { Layout } from './Menu'
import WebMidi from 'webmidi'
import { Board } from './Board'
import './style.css'

const deviceName = 'Launchpad X MIDI 2'

export function Home() {
  return {
    view: vnode => {
      return m('#home', {}, 'magnus')
    }
  }
}
export function Connect() {
  var input, output
  var connected = false
  
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
            output.playNote('F4')
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
          } else {
            input = null
          }
          m.redraw()
        }
      })
    })
  }

  return {
    oninit: vnode => {
      midiConnect()
    },
    
    view: vnode => {
      return m('#connect', {}, input && output ? 'connected!' : 'disconnected')
    }
  }
}
console.log('magnus started!')

m.route(document.body, '/', {
  '/': { render: () => m(Layout, m(Home))},
  '/connect': { render: () => m(Layout, m(Connect))},
  '/board': { render: () => m(Layout, m(Board))},

})
