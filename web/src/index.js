import m from 'mithril'
import { Layout } from './Menu'
import { LaunchGame } from './LaunchGame'
import { Login } from './Login'
import './style.css'
import { User } from './User'
import { GamePage, GamePageOnline, Games, getGames } from './Games'
import { ProfilePage } from './Profile'
import { Connector, ConnectionPage } from './Connector'
import { Launchpad } from './Launchpad'
import { State, Actions, OnlineActions } from './Actions'

export const Home = () => ({
  view: () => m('#home', {}, 'LaunchChess')
})

console.log('launchchess started!')


let state = State()
let actions = Actions(state)
Object.assign(actions, Launchpad(state, actions))
Object.assign(actions, LaunchGame(state, actions))
Object.assign(actions, Connector(state, actions))
Object.assign(actions, getGames(state, actions))
let onlineActions = {
  ...actions,
  ...OnlineActions(state, actions)
}
actions.initConnector()

console.log(state, actions)


m.mount(document.body, Layout(state))
let main = document.getElementById('main')

m.route(main, '/', {
  '/': Home(),
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