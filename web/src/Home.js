import m from 'mithril'
import { Connector, ConnectionPage } from './Connector'

export const website = 'https://quaternion.media/launchchess'


export const Home = (state, actions) => ({
  view: () => m('#home', {}, [
    m('h1#home', {}, 'LaunchChess.com'),
    m('h4#home', {}, ['Play chess on your ', m('a', {href: 'https://novationmusic.com/en/launch/'}, 'Novation Launchpad')]),
    m('br'),
    m('', {}, ['More details at the project homepage: ', m('a', {href: website}, website)]),
    m('br'),
    m(ConnectionPage(state, actions)),
    m('br'),
    state.connected ? [
      'Connected!',
      m('br'),
      m('button.button', {onclick: e => m.route.set('/otb')}, 'play over the board'),
      m('button.button', {onclick: e => m.route.set('/games')}, 'play over the internet'),
    ] : null
  ])
})