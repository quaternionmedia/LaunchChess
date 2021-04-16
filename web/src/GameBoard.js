import m from 'mithril'
import { Game } from './Games'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { toDests, toColor, playOtherSide } from './utils'
import { Chess } from 'chess.js'

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
          }
        })
      }
    })} 
  function init(vnode) {
    state.chess = new Chess()
    streamGame()
  }
  return {
    oninit: init,
    view: vnode => m(Game(state, actions), state.game ? {config: { 
        fen: state.game.fen,
        orientation: state.game.color,
      },
      
    } : {})
  }
}