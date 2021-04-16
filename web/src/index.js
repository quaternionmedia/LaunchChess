import m from 'mithril'
import { Layout } from './Menu'
import { Connect } from './Connect'
import { Login } from './Login'
import './style.css'
import { User } from './User'
import { Game, Games } from './Games'
import { GamePage } from './GameBoard'
import { ProfilePage } from './Profile'
import { Connector } from './Connector'
import { CounterPage } from './Counter'
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
  connected: false,
  game: null,
  games: Stream([]),
  chess: null,
  ground: null,
})
export const Actions = (state) => ({
  
})

let state = State()
let actions = Launchpad(state)
Object.assign(actions, Midi(state, actions))
console.log(state, actions)

m.mount(document.body, Layout())
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home,
  '/connect': GamePage(state, actions),
  '/counter': CounterPage({count:5}),
  '/connector': Connector(state, actions),
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