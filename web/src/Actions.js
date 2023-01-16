import m from 'mithril'
let Stream = require('mithril/stream')
import { Chess } from 'chess.js'
import { COLORS } from './Color'
import { uci } from './ChessMaths'
import { playOtherSide } from './utils'
import { auth } from './User'

export const range = (start, end) =>
  Array.apply(0, Array(end - 1)).map((element, index) => index + start)

export const State = () => ({
  theme: 'dark',
  input: null,
  output: null,
  inputName: null,
  outputName: null,
  inputs: Stream([]),
  outputs: Stream([]),
  deviceId: null,
  deviceName: null,
  deviceType: null,
  connected: false,
  top: range(91, 10),
  header: null,
  layout: null,
  changeLayout: null,
  game: null,
  games: Stream([]),
  opponent: null,
  chess: new Chess(),
  ground: null,
  color: 'w',
  selectedSquare: null,
  selectedPiece: null,
  invert: Stream(false),
  grid: true,
  pieces: true,
  influence: false,
  history: Stream(1),
  animationDuration: 400,
  animations: [],
  colors: COLORS,
})

export const Actions = (state, actions) => ({
  incrementHistory: () => {
    state.history(state.history() + 1)
    actions.lightBoard()
  },
  decrementHistory: () => {
    state.history(Math.max(0, state.history() - 1))
    actions.lightBoard()
  },
  send: (type, message) => {
    try {
      state.output.send(type, message)
    } catch (error) {
      console.debug('failed to send message', error)
    }
  },
  sendSysex: (header, message) => {
    try {
      state.output.sendSysex(header, message)
    } catch (error) {
      console.debug('failed to send sysex', error)
    }
  },
  lightMatrix: () => null,
  lightGame: () => null,
  clearAnimations: () => null,
  clear: () => null,
  highlightAvailableMoves: () => null,
  setColor: (piece, color) => {
    console.debug(`setting {piece} to {color}`)
    state.colors[piece] = color
  },
})

export const OnlineActions = (state, actions) => ({
  onmove: (orig, dest) => {
    let move = { from: orig, to: dest }
    let piece = state.chess.get(move.from)
    if (
      piece.type == 'p' &&
      ((piece.color == 'w' && move.to.charAt(1) == 8) ||
        (piece.color == 'b' && move.to.charAt(1) == 1))
    ) {
      console.log('promotion! Auto promote to Queen')
      move.promotion = 'q'
    }
    state.chess.move(move)
    console.log('moved', move, piece, state.chess.ascii())
    state.ground.set({ fen: state.chess.fen() })

    actions.lightBoard(true)
    playOtherSide(state.chess, state.ground)(orig, dest)
    m.redraw()
    // send to lichess api
    let move_uci = uci(move)
    auth(
      'https://lichess.org/api/board/game/' +
        m.route.param('id') +
        '/move/' +
        move_uci,
      {
        method: 'post',
      }
    ).then(e => {
      console.log('played move', move_uci, e)
    })
  },
  afterInit: () => {
    console.log('initing online actions')
    actions.afterInit()
    actions.streamGame()
  },
})
