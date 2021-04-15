import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import { Board } from './Board'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
import { toDests, toColor, playOtherSide } from './utils'

export var game = {}

export const Games = (state, actions) => {
  // var games = []
  function getGames() {
    auth(LICHESS_API_URL + 'account/playing').then(res => res.nowPlaying).then(state.games)
      console.log('current games', state.games())
    // })
  }
  return {
    oninit: vnode => {
        getGames()
    },
    view: vnode => {
      return [
        m('.toolbar', {}, [
          m('i.material-icons', {onclick: getGames}, 'refresh'),
          m('a', {href:'https://lichess.org/setup/ai', target:"_blank"}, m('i', {}, 'create game on lichess')),
        ]),
        state.games().map(g => {
          return m('.gamecontainer', {}, [
            g.opponent.username,
            m(Board(), {
              class: 'thumb',
              config: {
                fen: g.fen,
                viewOnly: true,
                orientation: g.color,
                lastMove: [g.lastMove.slice(0,2), g.lastMove.slice(2)],
                },
              onclick: e => {
                console.log('game clicked', g)
                game = g
                m.route.set('/connect', {id: g.gameId})
              },
          })
          ])
        }),
        state.games().map(g => {
          return m('', {}, JSON.stringify(g))
        })
      ]
    }
  }
}

export const Game = (state, actions) => {
  let config = {
    movable: {
      color: 'white',
      free: false,
    },
  }
  function init(vnode) {
    state.ground = Chessground(vnode.dom, {fen: vnode.attrs.fen, ...config, ...vnode.attrs.config})
    state.ground.set({
      movable: { dests: toDests(state.chess), events: { after: playOtherSide(state.chess, state.ground) } }
    })
    console.log('game loaded', state.ground)
  }
  return {
    oninit: vnode => {
      state.chess = new Chess(vnode.attrs.fen)
      console.log('game loading', vnode.attrs.fen, state.chess.ascii())
    },
    view: vnode => {
      return m(Board(state, actions), {
        class: 'fullscreen',
        oncreate: init,
         ...vnode.attrs})
    }
  }
}
