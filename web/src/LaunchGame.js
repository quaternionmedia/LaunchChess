import m from 'mithril'
import { Chess } from 'chess.js'
import { NOTE_ON, CONTROL_CHANGE, COLORS } from './Launchpad'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { calculateInfluence, fenForOtherSide } from './ChessMaths'
import { toDests, toColor, playOtherSide, setBoard } from './utils'

// let GREEN = [ 123, 23, 64, 22, 76, 87, 21, 122 ]
// let RED = [121, 7, 106, 6, 120, 5]
// let BLUE = [47, 46, 45, ]
export const INFLUENCE_COLORS = [5, 121, 9, 11, 15, 1, 23, 37, 45, 49, 69]

export const LaunchGame = (state, actions) => ({
  lightBoard: (animate = false) => {
    actions.clearAnimations()
    if (state.chess) {
      if (state.influence) {
        actions.showInfluence()
      } else {
        actions.lightGame(animate)
      }
    } else {
      if (state.grid) actions.grid()
    }
    actions.send(CONTROL_CHANGE, [
      state.top[0],
      Math.min(state.history() + 1, 3),
    ])
    actions.send(CONTROL_CHANGE, [state.top[1], Math.min(state.history(), 3)])
    actions.send(CONTROL_CHANGE, [state.top[2], 67])
    actions.send(CONTROL_CHANGE, [
      state.top[4],
      state.invert() ? COLORS.brown : 3,
    ])
    actions.send(CONTROL_CHANGE, [
      state.top[5],
      state.grid ? COLORS.white : COLORS.dim_white,
    ])
    actions.send(CONTROL_CHANGE, [state.top[6], state.pieces ? COLORS.q : 82])
    // actions.send(CONTROL_CHANGE, [state.top[7], state.influence ? 5 : 7])
    actions.send(CONTROL_CHANGE, [
      state.top[state.top.length - 1],
      state.chess.turn() == 'w' ? 3 : COLORS.brown,
    ])
  },
  togglePieces: (mode = null) => {
    state.pieces = mode ? mode : !state.pieces
    state.ground.set({ drawable: { visible: false } })
    actions.lightBoard()
  },
  flipBoard: () => {
    state.invert(!state.invert())
    actions.lightBoard()
    // if (ground)
    state.ground.toggleOrientation()
    // m.redraw()
  },
  showInfluence: () => {
    let fen = state.chess.fen()
    let defenders = calculateInfluence(fen)
    let attackers = calculateInfluence(fenForOtherSide(fen))

    console.log(fen, defenders, attackers)
    let heatMap = defenders.map((s, i) => {
      return s - attackers[i]
    })
    console.log('heatmap', heatMap)
    let colorMap = heatMap.map((v, i) => {
      let c = Math.min(v + 5, 9)
      return INFLUENCE_COLORS[state.chess.turn() == state.color ? c : 10 - c]
    })
    if (state.invert() != (state.color == 'b')) {
      colorMap.reverse()
    }
    // reverse ranks
    colorMap = colorMap.map((s, i) => {
      return colorMap[(7 - Math.floor(i / 8)) * 8 + (i % 8)]
    })
    console.log('colorMap', colorMap)
    actions.lightMatrix(colorMap)
  },
  newGame: () => {
    state.chess = new Chess()
    setBoard(state.chess, state.ground)
  },
  onInput: message => {
    message = message.data
    console.log('input', message)
    if (message[2]) {
      const s = actions.launchToN(message[1])
      if (s === null) {
        return
      }
      const square = actions.nToSquare(s)
      console.log('touched', s)
      const legal_moves = state.chess.moves({ verbose: true })
      console.log('legal moves', legal_moves)
      if (
        state.selectedSquare &&
        actions.squareToN(state.selectedSquare) == s
      ) {
        // clear selected piece
        actions.lightBoard()
        state.selectedSquare = null
        state.ground.selectSquare(null)
      } else if (
        state.chess.get(square) &&
        state.chess.get(square).color == state.chess.turn()
      ) {
        if (state.selectedSquare) {
          // clear other selected piece
          actions.lightBoard()
          state.selectedSquare = null
          state.ground.selectSquare(null)
        }
        console.log('checking', square, state.chess.get(square))
        if (
          state.chess.get(square) &&
          state.chess.get(square).color == state.chess.turn()
        ) {
          // select piece
          state.selectedSquare = square
          state.selectedPiece = state.chess.get(square)
          state.ground.selectSquare(state.selectedSquare)
          actions.highlightAvailableMoves(state.selectedSquare)
        }
      } else if (
        state.chess.history().length &&
        s == actions.squareToN(state.chess.history({ verbose: true }).pop().to)
      ) {
        console.log('clear animations and resend current position')
        actions.lightBoard()
      }
      if (state.selectedSquare) {
        // move selected to square

        const move = { from: state.selectedSquare, to: square }

        console.log('checking if ', move, ' is legal')
        const squares = state.chess
          .moves({ square: state.selectedSquare, verbose: true })
          .map(legal_move => legal_move.to)
        if (squares.includes(move.to)) {
          actions.makeMove(move)
        } else {
          console.log('illegal move', move)
        }
      }
    }
  },
  onCC: message => {
    message = message.data
    if (message[2]) {
      console.log('cc', message)
      switch (message[1]) {
        case state.top[0]: {
          // up arrow
          // increase history
          actions.incrementHistory()
          break
        }
        case state.top[1]: {
          // down arrow
          // decreace history
          actions.decrementHistory()
          break
        }
        case state.top[2]: {
          // left arrow
          // undo move
          actions.takeback()
          break
        }
        case state.top[4]: {
          // Session button
          // flip board
          actions.flipBoard()
          m.redraw()
          break
        }
        case state.top[5]: {
          // Custom button
          // Toggle grid
          state.grid = !state.grid
          actions.lightBoard()
          break
        }
        case state.top[6]: {
          // Note button
          // Toggle pieces
          state.pieces = !state.pieces
          actions.lightBoard()
          break
        }
        case state.top[7]: {
          // Custom Midi
          // toggle square influence / game
          actions.toggleInfluence()
          break
        }
      }
    }
  },
  toggleInfluence: () => {
    state.influence = !state.influence
    actions.lightBoard()
  },
  streamGame: () => {
    streamJson(
      LICHESS_API_URL + 'board/game/stream/' + m.route.param('id'),
      User.token,
      v => {
        console.log('calling back', v)
        if (v.type == 'gameFull') {
          state.game = v
          // TODO: change to Stream()
          // m.redraw()
          console.log('loading game', v.state.moves)
          console.log(
            'loaded?',
            state.chess.load_pgn(v.state.moves, { sloppy: true })
          )
          if (v.black.id == User.profile.id && !state.invert()) {
            // if playing black, and not already inverted, flip board
            actions.flipBoard()
            state.color = 'b'
          } else {
            state.color = 'w'
          }
        } else if (v.type == 'gameState') {
          console.log('move played', v.moves)
          console.log(
            'loaded?',
            state.chess.load_pgn(v.moves, { sloppy: true })
          )
        }
        let turn = state.chess.turn() == 'w' ? 'white' : 'black'
        console.log('updated. turn is', turn)

        setBoard(state.chess, state.ground)

        actions.lightBoard(true)
      }
    )
  },
  newGame: () => {
    state.chess = new Chess()
    console.log('new game', state.chess.ascii())
    setBoard(state.chess, state.ground)
    state.ground.selectSquare(null)
    actions.lightBoard()
  },
  makeMove: move => {
    state.ground.move(move.from, move.to)
    state.ground.selectSquare(null)
  },
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
  },
  afterInit: () => {
    actions.initMidi(actions.onInput, actions.onCC, () => {
      actions.lightBoard()
    })
  },
  takeback: () => {
    state.chess.undo()
    state.selectedPiece, (state.selectedSquare = null)
    state.ground.set({ fen: state.chess.fen() })
    actions.lightBoard()
    setBoard(state.chess, state.ground)
  },
})
