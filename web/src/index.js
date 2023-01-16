import m from 'mithril'
import { Layout } from './Menu'
import { LaunchGame } from './LaunchGame'
import { Login } from './Login'
import 'construct-ui/lib/index.css'
import './style.css'
import { User } from './User'
import { GamePage, GamePageOnline, Games, getGames } from './Games'
import { ProfilePage } from './Profile'
import { Connector, ConnectionPage } from './Connector'
import { State, Actions, OnlineActions } from './Actions'
import { LaunchpadX } from './Launchpad'
import { Home } from './Home'
import { WebMidi } from 'webmidi'

console.log('launchchess started!')

var state = State()
export var actions = {}
Object.assign(actions, Actions(state, actions))
Object.assign(actions, LaunchGame(state, actions))
Object.assign(actions, Connector(state, actions))
Object.assign(actions, getGames(state, actions))
export var onlineActions = {
  ...actions,
  ...OnlineActions(state, actions),
}
actions.initConnector()

console.log(state, actions)

m.mount(document.body, Layout(state))
let main = document.getElementById('main')
document.body.className += state.theme
m.route(main, '/', {
  '/': Home(state, actions),
  '/connect': ConnectionPage(state, actions),
  '/otb': GamePage(state, actions),
  '/games': Games(state, actions),
  '/online': GamePageOnline(state, onlineActions),
  '/login': Login,
  '/profile': ProfilePage,
})

// auto login
if (!User.loggedIn) {
  m.request('/oauth/token').then(res => {
    if (res) {
      console.log('session continued', res)
      User.login(res)
    }
  })
}

window.state = state
window.actions = actions
window.midi = WebMidi
