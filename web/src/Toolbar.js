import m from 'mithril'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'

export const StatusIcon = state => m('.status', {class: state.connected ? 'connected' : 'disconnected', title: state.connected ? 'connected' : 'disconnected'}, '')

export const ConnectToggle = (state, actions) => m('i.material-icons', {
  title: state.connected ? 'disconnect' : 'connect',
  onclick: e => {
    if (state.connected) {
      console.log('disconnecting')
      actions.close()
    } else {
      console.log('connecting')
      actions.connect(actions.noteCallback, actions.ccCallback, () => {
        actions.toggleLive()
        actions.lightBoard()
      })
    }
  },
}, state.connected ? 'power_off' : 'power')

export const FlipButton = (state, actions) => m('i.material-icons', {
  title: 'flip board',
  onclick: e => {
    actions.flipBoard()
  }
}, 'wifi_protected_setup')

export const InfluenceToggle = (state, actions) => m('i.material-icons', {
  title: state.influence ? 'hide influence' : 'show influence',
  onclick: e => {
    actions.toggleInfluence()
  }
}, 'compare_arrows')


export const Toolbar = (state, actions) => m('.toolbar', {}, [
  StatusIcon(state),
  ConnectToggle(state, actions),
  FlipButton(state, actions),
  InfluenceToggle(state, actions),
])