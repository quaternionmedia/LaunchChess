import WebMidi from 'webmidi'

export const NOTE_ON = 144
export const CONTROL_CHANGE = 176

export const Midi = (state, actions) => ({
  
toggleLive: () => {
    state.connected = !state.connected
    state.output.sendSysex([0, 32, 41], [2, 12, 14, state.connected ? 1 : 0])
  },
  connect: (noteCallback, ccCallback, afterInit) => {
    state.input = WebMidi.getInputByName(state.deviceName)
    state.input.addListener('noteon', "all", noteCallback)
    state.input.addListener('controlchange', "all", ccCallback)
    state.output = WebMidi.getOutputByName(state.deviceName)
    console.log('connecting', state.input, state.output)
    afterInit()
  },
  close: () => {
    if (state.connected) actions.toggleLive()
    if (state.input) {
      state.input.removeListener()
      state.input = null
    }
    if (state.output) state.output = null
    state.connected = false
  },
  initMidi: (noteCallback, ccCallback, afterInit) => {
    // WebMidi.enable(function (err) {
    console.log(WebMidi.inputs)
    console.log(WebMidi.outputs)
    state.input.addListener('noteon', "all", noteCallback)
    state.input.addListener('controlchange', "all", ccCallback)
    window.onunload = e => {
      console.log('unloading')
      close()
    }
    
    afterInit()      
  }
})