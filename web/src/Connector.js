import m from 'mithril'
import WebMidi from 'webmidi'
import { Launchpads } from './Launchpad'
import { Midi } from './Midi'
import { Statusbar } from './Statusbar'
var Stream = require("mithril/stream")



export const Connector = (state, actions) => {
  actions.connect = (name) => {
    state.output = WebMidi.getOutputByName(name)
    state.input = WebMidi.getInputByName(name)
    state.connected = true
    state.deviceName = name
    console.log('connected', state.input)
  }
  actions.disconnect = () => {
    state.output = null
    state.input.removeListener()
    state.input = null
    state.connected = false
    
  }
  return {
    oninit: vnode => {
      WebMidi.enable(function (err) {
        console.log(WebMidi.inputs)
        console.log(WebMidi.outputs)
        state.inputs(WebMidi.inputs.map(i => {
          return i.name in Launchpads ? i.name : null
        }).filter(Boolean)
        // console.log('inputs', state.inputs
      )
      })
    },
    view: vnode => {
      return [
        m(Statusbar(state)),
        m('h1', 'connector'),
        state.inputs().map(c => { 
          // console.log('button', c)
          return m('button.button', {onclick: e => actions.connect(c)}, c)
        }),
      // [
        // m('.connector', {}, [
          
        // ]),
        // m(List(), {}, state.inputs()),
        // m('button', {onclick: e => console.log(e)}, 'connect'),
      ]
        
  //   ]
}}
}

export const List = () => ({
  view: vnode => {
    return m('ul', {}, [
      vnode.children.map(i => m('li', {}, i))
    ])
  }
})