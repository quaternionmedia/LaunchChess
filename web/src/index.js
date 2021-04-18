import m from 'mithril'
import { Layout } from './Menu'
import { LaunchGame } from './Connect'
import { Login } from './Login'
import './style.css'
import { User, auth } from './User'
import { GamePage, GamePageOnline, Games } from './Games'
import { ProfilePage } from './Profile'
import { Connector, ConnectionPage } from './Connector'
import { Launchpad } from './Launchpad'
import { Midi } from './Midi'
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
  influence: false,
  grid: true,
  pieces: true,
})
export const Actions = (state) => ({
  
})

let state = State()
let actions = Actions(state)
Object.assign(actions, Launchpad(state, actions))
Object.assign(actions, Midi(state, actions))
Object.assign(actions, LaunchGame(state, actions))
Object.assign(actions, Connector(state, actions))
actions.initConnector()
console.log(state, actions)

let onlineActions = {
  ...actions, 
  onmove: (orig, dest) => {
    let move = {from: orig, to: dest}
    let piece = state.chess.get(move.from)
    if (piece.type == 'p' && ((piece.color == 'w' && move.to.charAt(1) == 8 ) || (piece.color == 'b' && move.to.charAt(1) == 1 ))) {
      console.log('promotion! Auto promote to Queen')
      move.promotion = 'q'
    }
    state.chess.move(move)
    console.log('moved', move, piece, state.chess.ascii())
    state.ground.set({fen: state.chess.fen()})
    
    actions.lightBoard()
    playOtherSide(state.chess, state.ground)(orig, dest)
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