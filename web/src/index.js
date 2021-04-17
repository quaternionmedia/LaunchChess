import m from 'mithril'
import { Layout } from './Menu'
import { LaunchGame } from './Connect'
import { Login } from './Login'
import './style.css'
import { User } from './User'
import { Game, Games } from './Games'
import { GamePage } from './GameBoard'
import { ProfilePage } from './Profile'
import { Connector, ConnectionPage } from './Connector'
import { Launchpad } from './Launchpad'
import { Midi } from './Midi'
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
  connected: Stream(false),
  game: null,
  games: Stream([]),
  chess: null,
  ground: null,
  selectedSquare: null,
  selectedPiece: null,
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

m.mount(document.body, Layout())
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home,
  '/connect': GamePage(state, actions),
  '/connector': ConnectionPage(state, actions),
  '/games': Games(state, actions),
  '/board': Game(state),
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