import m from 'mithril'
import { Layout } from './Menu'
import { LaunchGame } from './Connect'
import { Login } from './Login'
import './style.css'
import { User, auth } from './User'
import { GamePage, Games } from './Games'
import { GameBoardPage } from './GameBoard'
import { ProfilePage } from './Profile'
import { Connector, ConnectionPage } from './Connector'
import { Launchpad } from './Launchpad'
import { Midi } from './Midi'
import { uci } from './ChessMaths'
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
  color: 'white',
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

let onlineActions = {...actions, onmove: (orig, dest) => {
  // actions.makeMove(move)
  console.log('sending to lichess api')
  let move_uci = uci({from: orig, to: dest})
  auth('https://lichess.org/api/board/game/' + m.route.param('id') + '/move/' + move_uci, {
    method: 'post',
  }).then(e => {
    console.log('played move', move_uci, e)
  })
}}

m.mount(document.body, Layout())
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home,
  '/connect': GamePage(state, onlineActions),
  '/connector': ConnectionPage(state, actions),
  '/games': Games(state, actions),
  '/board': GamePage(state, actions),
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