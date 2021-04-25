import m from 'mithril'
let Stream = require("mithril/stream")
import { Chess } from 'chess.js'
import { uci } from './ChessMaths'
import { playOtherSide } from './utils'
import { auth } from './User'

export const State = () => ({
  input: null, 
  output: null,
  inputs: Stream([]),
  outputs: [],
  deviceName: null,
  connected: false,
  header: null,
  layout: null,
  changeLayout: null,
  game: null,
  games: Stream([]),
  chess: new Chess(),
  ground: null,
  color: 'w',
  selectedSquare: null,
  selectedPiece: null,
  invert: false,
  grid: true,
  pieces: true,
  influence: false,
  history: Stream(1),
})

export const Actions = (state) => ({
  incrementHistory: () => {
    state.history(state.history() + 1)
    actions.lightBoard()
    m.redraw()
  },
  decrementHistory: () => {
    state.history(Math.max(0, state.history() - 1))
    actions.lightBoard()
    m.redraw()
  },
})


export const OnlineActions = (state, actions) => ({
  onmove: (orig, dest) => {
    // actions.onmove(orig, dest)
    
    
    let move = {from: orig, to: dest}
    let piece = state.chess.get(move.from)
    if (piece.type == 'p' && ((piece.color == 'w' && move.to.charAt(1) == 8 ) || (piece.color == 'b' && move.to.charAt(1) == 1 ))) {
      console.log('promotion! Auto promote to Queen')
      move.promotion = 'q'
    }
    state.chess.move(move)
    console.log('moved', move, piece, state.chess.ascii())
    state.ground.set({fen: state.chess.fen()})
    
    actions.lightBoard()
    playOtherSide(state.chess, state.ground)(orig, dest)
    m.redraw()
    // send to lichess api
    let move_uci = uci(move)
    auth('https://lichess.org/api/board/game/' + m.route.param('id') + '/move/' + move_uci, {
      method: 'post',
    }).then(e => {
      console.log('played move', move_uci, e)
    })
  },
  afterInit: () => {
    actions.afterInit()
    actions.streamGame()
  }
})
