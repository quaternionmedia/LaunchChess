import m from 'mithril'
import { Connector, ConnectionPage } from './Connector'
import { Button } from 'construct-ui'

export const Home = (state, actions) => ({
  view: () => m('#home', {}, [
    m('h1#home', {}, 'LaunchChess.com'),
    m('h4#home', {}, ['Play chess on your ', m('a', {href: 'https://novationmusic.com/en/launch/'}, 'Novation Launchpad')]),
    m('br'),
    m('', {}, ['More details at the project homepage: ', m('a', {href: 'https://quaternion.media/launchchess'}, 'quaternion.media/launchchess')]),
    m('br'),
    m(ConnectionPage(state, actions)),
    m('br'),
    state.connected ? [
      'Connected!',
      m('br'),
      m(Button, {
        label: 'play over the board',
        onclick: e => m.route.set('/otb')
      }),
      m(Button, {
        label: 'play over the internet',
        onclick: e => m.route.set('/games')
      }),
    ] : null
  ])
})