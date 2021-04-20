import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { Toolbar } from './Toolbar'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
import { toDests, toColor, playOtherSide } from './utils'

export const Games = (state, actions) => {
  function getGames() {
    auth(LICHESS_API_URL + 'account/playing').then(res => res.nowPlaying).then(state.games)
      console.log('current games', state.games())
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
            m(Board, {
              class: 'thumb',
              config: {
                fen: g.fen,
                viewOnly: true,
                orientation: g.color,
                lastMove: [g.lastMove.slice(0,2), g.lastMove.slice(2)],
                },
              onclick: e => {
                console.log('game clicked', g)
                state.game = g
                m.route.set('/online', {id: g.gameId})
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

let config = {
  movable: {
    color: 'both',
    free: false,
  },
}

export const Game = (state, actions) => m('.board.fullscreen', {
    oninit: vnode => {
      if (!state.chess) state.chess = new Chess()
      console.log('game loading', vnode.attrs, state.chess.ascii())
      actions.afterInit()
    },
    oncreate: vnode => {
      state.ground = Chessground(vnode.dom, {...config, ...vnode.attrs.config})
      state.ground.set({
        fen: state.chess.fen(),
        movable: {
          dests: toDests(state.chess),
        },
        events: {
          select: key => {
            console.log('chessground selected', key)
            if (state.chess.get(key) && state.chess.get(key).color == state.chess.turn()) {
              // clear previous selection
              actions.lightBoard()
              state.selectedSquare = key
              state.selectedPiece = state.chess.get(key)
              actions.highlightAvailableMoves(key)
            }
          },
          move: (orig, dest) => {
            actions.onmove(orig, dest)
          },
        }
      })
    }
  })

export const GamePage = (state, actions) => ({
  view: vnode => m('.gamePage', {}, [
    Toolbar(state, actions),
    Game(state, actions),
])})

export const Player = () => m('', {}, JSON.stringify(User.username))
export const Opponent = state => m('', {}, JSON.stringify(state.game.opponent))

export const GamePageOnline = (state, actions) => ({
  view: vnode => [
    Toolbar(state, actions),
    state.invert ? Player() : Opponent(state),
    Game(state, actions),
    state.invert ? Opponent(state) : Player(),
  ]
})