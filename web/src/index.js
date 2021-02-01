import m from 'mithril'
import { Layout } from './Menu'
import WebMidi from 'webmidi'
import { Board } from './Board'
import './style.css'

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
  return {
    oninit: vnode => {
      WebMidi.enable(function (err) {
        console.log(WebMidi.inputs)
        console.log(WebMidi.outputs)
        WebMidi.addListener("connected", function(e) {
          console.log('midi connected', e, e.port.name)
          if (e.port.name == 'Launchpad X MIDI 2') {
            if (e.port.type == 'output') {
              output = e.port
              console.log('output', output)
              output.playNote('F4')
            } else {
              input = e.port
            }
          }
        })
        WebMidi.addListener("disconnected", function(e) {
        console.log('midi disconnected', e)
        })
        // var input = WebMidi.getInputByName('Launchpad X MIDI 2')
        // var output = WebMidi.getOutputByName('Launchpad X MIDI 2')
        
        input.addListener('noteon', "all",
        function (e) {
          console.log("Received 'noteon' message (" + e.note.name + e.note.octave + ").")
        }
      )
      console.log(input, output)
      })
    },
    
    view: vnode => {
      return m('#connect', {}, connected ? 'connected!' : 'disconnected')
    }
  }
}
console.log('magnus started!')

m.route(document.body, '/', {
  '/': { render: () => m(Layout, m(Home))},
  '/connect': { render: () => m(Layout, m(Connect))},
  '/board': { render: () => m(Layout, m(Board))},

})
