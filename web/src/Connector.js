import m from 'mithril'
import WebMidi from 'webmidi'
import { Launchpads } from './Launchpad'
import { Midi } from './Midi'
import { Statusbar } from './Statusbar'
var Stream = require("mithril/stream")
import { ConnectToggle } from './Toolbar'



export const Connector = (state, actions) => ({
  connect: (name) => {
    if (state.connected) {
      actions.disconnect()
    }
    state.output = WebMidi.getOutputByName(name || state.deviceName)
    state.input = WebMidi.getInputByName(name || state.deviceName)
    state.connected = true
    state.deviceName = name
    console.log('connected', state.input)
    actions.toggleLive(true)
  },
  disconnect: () => {
    state.output = null
    if (state.input) {
      state.input.removeListener()
      state.input = null
    }
    state.connected = false
    
  },
  initConnector: () => {
    WebMidi.enable(function (err) {
      console.log(WebMidi.inputs)
      console.log(WebMidi.outputs)
      state.inputs(WebMidi.inputs.map(i => {
        return i.name// in Launchpads ? i.name : null
      }).filter(Boolean)
      // console.log('inputs', state.inputs
    )
  }, true)
  },
})

export const MidiSelector = (state, actions) => m('select', {oninput: e => actions.connect(e.target.value)}, state.inputs().map(c => {
      return m('option', {value: c}, c)
    }))

export const ConnectionPage = (state, actions) => ({
  view: vnode => m('.ConnectionPage', {}, [
    Statusbar(state),
    m('h1', 'connector'),
    MidiSelector(state, actions),
    ConnectToggle(state, actions)
  ])
})