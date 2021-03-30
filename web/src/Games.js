import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { Chessground } from 'chessground'
import { fetcher } from './ndjson'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'

export function Games() {
  var games = []
  function getGames() {
    auth(LICHESS_API_URL + 'account/playing').then(res => {
      games = res.nowPlaying
      console.log('current games', games)
    })
  }
  return {
    oninit: vnode => {
      getGames()
    },
    view: vnode => {
      return [
        m('i.material-icons', {onclick: getGames}, 'refresh'),
        m('a', {href:'https://lichess.org/setup/ai', target:"_blank"}, m('i', {}, 'create game on lichess')),
        games.map(g => {
          return m('.gamecontainer', {}, [
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
          ])
      })
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