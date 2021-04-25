import m from 'mithril'
import { Connector, ConnectionPage } from './Connector'




export const Home = (state, actions) => ({
  view: () => m('#home', {}, [
    m('h1#home', {}, 'LaunchChess.com'),
    m('h4#home', {}, ['Play chess on your ', m('a', {href: 'https://novationmusic.com/en/launch/'}, 'Novation Launchpad')]),
    m(ConnectionPage(state, actions))
    
  ])
})