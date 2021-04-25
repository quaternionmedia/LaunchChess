import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { streamJson } from './ndjson'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { Toolbar, OnlineToolbar } from './Toolbar'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
import { toDests, toColor, playOtherSide } from './utils'

export const getGames = (state, actions) => ({
  getGames: () => {
    auth(LICHESS_API_URL + 'account/playing').then(res => res.nowPlaying).then(state.games).then( res =>{
      console.log('currently playing games', res)
      if (res.length == 1) {
        console.log('one active game. loading now!')
        state.game = res[0]
        m.route.set('/online', {id: state.game.gameId})
      } else if (res.length == 0) {
        actions.streamGames()
      }
    })
    
  },
  streamGames: () => {
    streamJson(LICHESS_API_URL + 'stream/event', User.token, res => {
      console.log('new lichess event', res)
      if (res.type == 'gameStart' && state.games().length == 0) {
        console.log('auto starting game')
        actions.getGames()
      }
    })
  }
})

export const Games = (state, actions) => ({
  oninit: vnode => {
    actions.getGames()
    
  },
  view: vnode => [
    
  m('.toolbar', {}, [
    m('i.material-icons', {onclick: actions.getGames}, 'refresh'),
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
]})

let config = {
  movable: {
    color: 'both',
    free: false,
  },
}

export const Game = (state, actions) => m('.board.fullscreen', {
    oninit: vnode => {
      console.log('game loading', vnode.attrs, state.chess.ascii())
      actions.afterInit()
    },
    oncreate: vnode => {
      state.ground = Chessground(vnode.dom, {...config, ...vnode.attrs.config})
      state.ground.set({
        fen: state.chess.fen(),
        orientation: state.invert ? 'black': 'white',
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

export const Player = () => m('', {}, User.username)
export const Opponent = state => m('', {}, state.game ? JSON.stringify(state.game.opponent) : '?' )

export const GamePageOnline = (state, actions) => ({
  view: vnode => [
    OnlineToolbar(state, actions),
    state.invert != (toColor(state.chess) == 'w') ? Player() : Opponent(state),
    Game(state, actions),
    state.invert != (toColor(state.chess) == 'w') ? Opponent(state) : Player(),
  ]
})