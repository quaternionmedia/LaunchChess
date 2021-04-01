import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { fetcher } from './ndjson'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
import { toDests, toColor, playOtherSide } from './utils'

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
            m(Board, {
              viewOnly: true,
              class: 'thumb',
              ...g,
              orientation: g.color == 'w' ? 'white' : 'black',
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
  let chess = null
  let ground = null
  let config = {
    movable: {
      color: 'white',
      free: false,
    },
  }

  return {
    oninit: vnode => {
      chess = new Chess(vnode.attrs.fen)
    },
    // onupdate: vnode => {
    //   console.log('updating board')
    // },
    view: vnode => {
      return m(Board, {
        oncreate: vnode => {
          ground = Chessground(vnode.dom, {
            fen: vnode.attrs.fen, 
            orientation: vnode.attrs.invert, 
            ...config
          })
          ground.set({
            movable: { dests: toDests(chess), events: { after: playOtherSide(chess, ground) } }
          })
        },
        ...vnode.attrs
      })
    }
  }
}
