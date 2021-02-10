import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { Chessground } from 'chessground'
import { fetcher } from './ndjson'

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
        return [
          g.opponent.username, 
          m(Game, {
            viewOnly: true,
            class: 'thumb',
            ...g,
            orientation: g.color,
            lastMove: [g.lastMove.slice(0,2), g.lastMove.slice(2)],
            onclick: e => {
              console.log('game clicked', g)
              m.route.set('/connect', {id: g.gameId})
            }
          })
        ]
      }) : [m('a', {href:'https://lichess.org/setup/ai', target:"_blank"}, 'create game on lichess'),
    ]
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
      return m('.board', vnode.attrs, vnode.children)
    },
  }
}