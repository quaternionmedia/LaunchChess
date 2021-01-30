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
  return {
    oninit: vnode => {
      WebMidi.enable(function (err) {
        console.log(WebMidi.inputs);
        console.log(WebMidi.outputs);
        var input = WebMidi.getInputByName('Launchpad X MIDI 2')
        var output = WebMidi.getOutputByName('Launchpad X MIDI 2')
        console.log(input, output)
        output.playNote('F4')
        input.addListener('noteon', "all",
        function (e) {
          console.log("Received 'noteon' message (" + e.note.name + e.note.octave + ").");
        }
      );
      });
    },
    
    view: vnode => {
      return m('#connect', {}, 'connect')
    }
  }
}
console.log('magnus started!')

m.route(document.body, '/', {
  '/': { render: () => m(Layout, m(Home))},
  '/connect': { render: () => m(Layout, m(Connect))},
  '/board': { render: () => m(Layout, m(Board))},

})
