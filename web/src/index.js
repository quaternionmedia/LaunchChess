import m from 'mithril'
import { Layout } from './Menu'
import { LaunchGame } from './LaunchGame'
import { Login } from './Login'
import './style.css'
import { User, auth } from './User'
import { GamePage, GamePageOnline, Games } from './Games'
import { ProfilePage } from './Profile'
import { Connector, ConnectionPage } from './Connector'
import { Launchpad } from './Launchpad'
import { uci } from './ChessMaths'
import { playOtherSide } from './utils'

var Stream = require("mithril/stream")

export function Home() {
  return {
    view: vnode => {
      return m('#home', {}, 'LaunchChess')
    }
  }
}
console.log('launchchess started!')


export const State = () => ({
  input: null, 
  output: null,
  inputs: Stream([]),
  outputs: [],
  deviceName: null,
  connected: false,
  game: null,
  games: Stream([]),
  chess: null,
  ground: null,
  color: 'w',
  selectedSquare: null,
  selectedPiece: null,
  invert: false,
  grid: true,
  pieces: true,
  influence: false,
  history: Stream(1),
})
export const Actions = (state) => ({
  incrementHistory: () => {
    state.history(state.history() + 1)
    actions.lightBoard()
    m.redraw()
  },
  decrementHistory: () => {
    state.history(Math.max(0, state.history() - 1))
    actions.lightBoard()
    m.redraw()
  },
})

let state = State()
let actions = Actions(state)
Object.assign(actions, Launchpad(state, actions))
Object.assign(actions, LaunchGame(state, actions))
Object.assign(actions, Connector(state, actions))
actions.initConnector()
console.log(state, actions)

let onlineActions = {
  ...actions, 
  onmove: (orig, dest) => {
    actions.onmove(orig, dest)
    
    let move = {from: orig, to: dest}
    let piece = state.chess.get(move.to)
    if (piece.type == 'p' && ((piece.color == 'w' && move.to.charAt(1) == 8 ) || (piece.color == 'b' && move.to.charAt(1) == 1 ))) {
      console.log('promotion! Auto promote to Queen')
      move.promotion = 'q'
    }
    // send to lichess api
    let move_uci = uci(move)
    auth('https://lichess.org/api/board/game/' + m.route.param('id') + '/move/' + move_uci, {
      method: 'post',
    }).then(e => {
      console.log('played move', move_uci, e)
    })
  },
  afterInit: () => {
    actions.afterInit()
    actions.streamGame()
  }
}


m.mount(document.body, Layout(state))
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home,
  '/connect': ConnectionPage(state, actions),
  '/otb': GamePage(state, actions),
  '/games': Games(state, actions),
  '/online': GamePageOnline(state, onlineActions),
  '/login': Login,
  '/profile': ProfilePage,

})

// auto login
if (!User.username) {
  m.request('/oauth/token').then(res => {
    if (res) {
      console.log('session continued', res)
      User.login(res)
    }
  })
}