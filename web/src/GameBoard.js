import m from 'mithril'
import { Game } from './Games'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { toDests, toColor, playOtherSide } from './utils'
import { Chess } from 'chess.js'
import { Statusbar } from './Statusbar'
import { Toolbar } from './Toolbar'

export const GameBoard = (state, actions) => {
  function streamGame() {
    streamJson(LICHESS_API_URL + 'board/game/stream/' + m.route.param('id'),
      User.token, 
      v => {
      console.log('calling back', v)
      if (v.state.type == 'gameState') {
        console.log('loaded?', state.chess.load_pgn(v.state.moves, {sloppy: true}))
        // let turn = state.chess.turn() == 'w' ? 'white' : 'black'
        console.log('updated. turn is', toColor(state.chess))
        state.ground.set({
          fen: state.chess.fen(),
          turnColor: toColor(state.chess),
          movable: {
            dests: toDests(state.chess),
            events: { after: playOtherSide(state.chess, state.ground) }
          },
          events: {
            move: (orig, dest, captured) => {
              console.log('moved', orig, dest, captured)
            },
            change: () => {
              console.log('changed')
            },
            select: key => {
              console.log('selected', key)
            }
          },
        })
      }
    })} 
  function init(vnode) {
    state.chess = new Chess()
    streamGame()
  }
  return {
    oninit: init,
    view: vnode => m(Game(state, actions), {
      config: { 
        fen: state.game.fen,
        orientation: state.game.color,
        movable: {
          color: state.game.color,
          free: false,
        },
      },
      oninit: () => {
        return
      },
    })
  }
}

export const GamePage = (state, actions) => ({
  view: vnode => [
    m(Statusbar(state, actions)),
    m(Toolbar(state, actions)),
    m('', {}, JSON.stringify(state.invert ? User.username : state.game.opponent)),
    m(GameBoard(state, actions)),
    m('', {}, JSON.stringify(state.invert ? state.game.opponent : User.username)),
  ]
})
