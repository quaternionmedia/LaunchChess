import m from 'mithril'
import { Layout } from './Menu'
import { Connect } from './Connect'
import { Login } from './Login'
import './style.css'
import { User } from './User'
import { Game, Games } from './Games'
import { ProfilePage } from './Profile'
import { Connector } from './Connector'
import { State } from './Midi'

export function Home() {
  return {
    view: vnode => {
      return m('#home', {}, 'LaunchChess')
    }
  }
}
console.log('launchchess started!')


let state = State()

m.mount(document.body, Layout())
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home,
  '/connect': Connect,
  '/connector': Connector(state),
  '/games': Games,
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