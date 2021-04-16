import m from 'mithril'


export const Statusbar = (state) => ({
  view: vnode => {
    let status = state.connected ? 'connected' : 'disconnected'
    return m('.statusbar', {}, [
    m('.status', {class: status, title: status}, ''),
    m('', {}, status),
  ])}
})