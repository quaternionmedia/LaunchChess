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
      actions.connect()
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

export const TakebackButton = (state, actions) => m('i.material-icons', {
  title: 'takeback',
  onclick: e => {
    actions.takeback()
  }
}, 'arrow_left')

export const ForwardsButton = (state, actions) => m('i.material-icons', {
  title: 'does nothing',
  onclick: e => {
  }
}, 'arrow_right')

export const GridToggle = (state, actions) => m('i.material-icons', {
  title: state.grid ? 'hide grid' : 'show grid',
  onclick: e => {
    state.grid = !state.grid
    actions.lightBoard()
  }
}, state.grid ? 'grid_off' : 'grid_on')

export const PiecesToggle = (state, actions) => m('i.material-icons', {
  title: state.pieces ? 'hide pieces' : 'show pieces',
  onclick: e => {
    state.pieces = !state.pieces
    actions.lightBoard()
  }
}, m('img.oneem', {src: 'static/Chess_tile_ql.svg'}))

export const HistoryIncrement = (state, actions) => m('i.material-icons', {
  title: 'increace history',
  onclick: e => {
    state.history += 1
    actions.lightBoard()
  }}, 'history')

  export const HistoryDecrement = (state, actions) => m('i.material-icons', {
    title: 'decreace history',
    onclick: e => {
      state.history = Math.max(0, state.history - 1)
      actions.lightBoard()
    }}, 'history_toggle_off')


export const Toolbar = (state, actions) => m('.toolbar', {}, [
  StatusIcon(state),
  ConnectToggle(state, actions),
  m('.inline.tool', {title: 'history'}, state.history),
  HistoryIncrement(state, actions),
  HistoryDecrement(state, actions),
  TakebackButton(state, actions),
  ForwardsButton(state, actions),
  FlipButton(state, actions),
  GridToggle(state, actions),
  PiecesToggle(state, actions),
  InfluenceToggle(state, actions),
])