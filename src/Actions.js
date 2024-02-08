import m from 'mithril'
let Stream = require('mithril/stream')
import { Chess } from 'chess.js'
import { COLORS } from './Launchpad'
import { uci } from './ChessMaths'
import { playOtherSide } from './utils'
import { auth } from './User'
import { Auth } from './Auth'

export const range = (start, end) =>
  Array.apply(0, Array(end - 1)).map((element, index) => index + start)

export const State = () => ({
  auth: null,
  loggedIn: Stream(false),
  user: {
    username: null,
    profile: null,
  },
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
  stream: null, // NDJson stream of games from API
  opponent: null,
  chess: new Chess(),
  ground: null,
  color: 'w',
  selectedSquare: null,
  selectedPiece: null,
  invert: Stream(false), // flip board
  grid: true, // show / hide grid
  pieces: true, // show / hide pieces
  influence: false, // showInfluence mode
  history: Stream([]), // history of moves
  viewHistory: Stream(1), // number of plys of history to show
  fen: Stream(''), // fen of current position
  pgn: Stream(''), // pgn of current position
  animationDuration: 400,
  animations: [],
  colors: COLORS,
})

export const Actions = (state, actions) => ({
  incrementHistory: () => {
    state.viewHistory(state.viewHistory() + 1)
    actions.lightBoard()
  },
  decrementHistory: () => {
    state.viewHistory(Math.max(0, state.viewHistory() - 1))
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
    // state.history(state.history().push(move))

    actions.lightBoard(true)
    m.redraw()
    // send to lichess api
    let move_uci = uci(move)
    let body = state.auth.fetchBody('/api/board/game/' +
      m.route.param('id') +
      '/move/' +
      move_uci,
      {
        method: 'post',
      })
    console.log('played move', move_uci, body)
  },
})
