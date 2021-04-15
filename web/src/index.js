import m from 'mithril'
import { Layout } from './Menu'
import { Connect } from './Connect'
import { Login } from './Login'
import './style.css'
import { User } from './User'
import { Game, Games } from './Games'
import { ProfilePage } from './Profile'
import { Connector } from './Connector'

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
  connected: Stream(false),
  games: Stream([]),
})

let state = State()
let actions = {}

m.mount(document.body, Layout())
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home,
  '/connect': Connect,
  '/games': Games,
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