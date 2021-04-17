import m from 'mithril'


export const Statusbar = (state) => m('.statusbar', {}, [
    m('.status', {class: state.connected() ? 'connected' : 'disconnected', title: state.connected() ? 'connected' : 'disconnected'}, ''),
    m('', {}, state.connected() ? 'connected' : 'disconnected'),
  ])