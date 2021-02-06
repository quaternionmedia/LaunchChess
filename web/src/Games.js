import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { Chessground } from 'chessground'

export function Games() {
  var games = []
  return {
    oninit: vnode => {
      if (User.token) {
        auth(LICHESS_API_URL + 'account/playing').then(res => {
          games = res.nowPlaying
          console.log('current games', games)
        })
      }
    },
    view: vnode => {
      return games.length ? games.map(g => {
        return m(Game, {
          viewOnly: true,
          ...g,
          onclick: e => {
            console.log('game clicked', g)
            m.route.set('/connect', {id: g.gameId})
          }
        })
      }) : m('', {}, 'no games')
    }
  }
}

export function Game() {
  var ground = null
  return {
    oncreate: vnode => {
      ground = Chessground(vnode.dom, vnode.attrs)
    },
    view: vnode => {
      return m('.game', vnode.attrs, vnode.children)
    },
  }
}