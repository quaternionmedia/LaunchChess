import m from 'mithril'
import WebMidi from 'webmidi'
import { Launchpads } from './Launchpad'
import { Midi } from './Midi'
var Stream = require("mithril/stream")



export const Connector = (state, actions) => {
  // let inputs = ['a', 'b', 'c']
  var midiInputs = Stream([])
  let outputs = []
  function connect(name) {
    WebMidi.addListener("connected", function(e) {
      // console.log('midi connected', e, e.port.name)
      
      
      if (e.port.name in Launchpads) {
        if (e.port.type == 'output') {
          state.output = e.port
          console.log('output', state.output)
        } else {
          state.input = e.port
          console.log('input', state.input)
        }
      }
    })
    WebMidi.addListener("disconnected", function(e) {
      console.log('midi disconnected', e)
      if (e.port.name in Launchpads) {
        if (e.port.type == 'output') {
          state.output = null
        } else {
          state.input = null
        }
        // state.connected(false)
      }
    })
    
    // window.onunload = e => {
    //   console.log('unloading')
    //   // close()
  //   }
  // }, true)
  }
  return {
    oncreate: vnode => {
      WebMidi.enable(function (err) {
        console.log(WebMidi.inputs)
        console.log(WebMidi.outputs)
        let ins = WebMidi.inputs.map(i => {
          return i.name // in Launchpads ? i.name : null
        })
        console.log('inputs', ins)
        midiInputs(ins)
      })
    },
    view: vnode => {
      return [
        
        m('h1', 'connector'),
        midiInputs().map(c => { 
          console.log('button', c)
          return m('', c)
        }),
      // [
        // m('.connector', {}, [
          
        // ]),
        // m(List(), {}, inputs),
        // m(Statusbar(state))
        // m('button', {onclick: e => console.log(e)}, 'connect'),
      // ]
        
    ]
  }
  }
}

export const List = () => ({
  view: vnode => {
    return m('ul', {}, [
      vnode.children.map(i => m('li', {}, i))
    ])
  }
})