import m from 'mithril'
import WebMidi from 'webmidi'
import { StatusIcon, ConnectToggle } from './Toolbar'



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
    if (state.input) actions.toggleLive(true)
  },
  disconnect: () => {
    if (state.input) {
      if (state.connected) actions.toggleLive(false)
      state.input.removeListener()
      state.input = null
      state.output = null
    }
    state.connected = false
    
  },
  initConnector: () => {
    WebMidi.enable(function (err) {
      console.log(WebMidi.inputs)
      console.log(WebMidi.outputs)
      state.inputs(WebMidi.inputs.map(i => {
        return i.name
      }).filter(Boolean)
      // console.log('inputs', state.inputs
    )
  }, true)
  window.onunload = e => {
   console.log('unloading')
   actions.disconnect()
  }
  
  },
  initMidi: (noteCallback, ccCallback, afterInit) => {
    // WebMidi.enable(function (err) {
    console.log(WebMidi.inputs)
    console.log(WebMidi.outputs)
    state.input.removeListener()
    state.input.addListener('noteon', "all", noteCallback)
    state.input.addListener('controlchange', "all", ccCallback)
    
    afterInit()      
  }
})

export const MidiSelector = (state, actions) => m('select', {
  value: null,
  oninput: e => actions.connect(e.target.value)}, state.inputs().map(c => {
      return m('option', {value: c}, c)
    }))

export const ConnectionPage = (state, actions) => ({
  view: vnode => m('.ConnectionPage', {}, [
    StatusIcon(state),
    m('h1', 'connect your Launchpad'),
    MidiSelector(state, actions),
    ConnectToggle(state, actions)
  ])
})