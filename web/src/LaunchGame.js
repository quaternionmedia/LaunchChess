import m from 'mithril'
import { NOTE_ON, CONTROL_CHANGE } from './Midi'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { calculateInfluence, fenForOtherSide } from './ChessMaths'
import { toDests, toColor, playOtherSide, setBoard } from './utils'


// let GREEN = [ 123, 23, 64, 22, 76, 87, 21, 122 ]
// let RED = [121, 7, 106, 6, 120, 5]
// let BLUE = [47, 46, 45, ]
export const COLORS = [5, 121, 9, 11, 15, 1, 23, 37, 45, 49, 69]

export const LaunchGame = (state, actions) => ({
  lightBoard: () => {
    if (state.chess) {
      if (state.influence) {
        actions.showInfluence()
      } else {
        actions.lightGame()
      }
    } else {
      if (state.grid) actions.grid()
    }
    state.output.send(CONTROL_CHANGE, [95, state.invert ? 83 : 3])
    state.output.send(CONTROL_CHANGE, [96, state.grid ? 3 : 1])
    state.output.send(CONTROL_CHANGE, [97, state.pieces ? 55 : 52])
    state.output.send(CONTROL_CHANGE, [98, state.influence ? 5 : 7])
    state.output.send(CONTROL_CHANGE, [99, state.chess.turn() == 'w' ? 3 : 83])
  },
  
  flipBoard: () => {
    state.invert = !state.invert
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
    let colorMap = defenders.map((s, i) => {
      let v = s - attackers[i]
      let c = Math.min(v+5, 9)
      return COLORS[toColor(state.chess) == state.color ? c : 10 - c]
    })
    if (state.invert != (state.color == 'b')) colorMap.reverse()
    console.log(colorMap)
    actions.lightMatrix(colorMap)
  },
  
  
  onInput: message => {
    message = message.data
    console.log('input', message)
    if (message[2]) {
      const s = actions.launchToN(message[1])
      console.log('touched', s)
      const legal_moves = state.chess.moves({verbose:true})
      console.log('legal moves', legal_moves)
      if (state.selectedSquare && actions.squareToN(state.selectedSquare) == s) {
        // clear selected piece
        state.selectedSquare = null
        actions.lightBoard()
        state.ground.selectSquare(null)
      } else if (state.chess.get(actions.nToSquare(s)) && state.chess.get(actions.nToSquare(s)).color == state.chess.turn()) {
        if (state.selectedSquare) {
          // clear other selected piece
          actions.lightBoard()
          // ground.selectSquare(null)
        }
        console.log('checking', actions.nToSquare(s), state.chess.get(actions.nToSquare(s)))
        if (state.chess.get(actions.nToSquare(s)) && (state.chess.get(actions.nToSquare(s)).color == state.chess.turn())) {
          // select piece
          state.selectedSquare = actions.nToSquare(s)
          state.selectedPiece = state.chess.get(actions.nToSquare(s))
          state.ground.selectSquare(state.selectedSquare)
          actions.highlightAvailableMoves(state.selectedSquare)
        }
      } else if (state.selectedSquare) {
        // move selected to square
        
        const move = {from: state.selectedSquare, to: actions.nToSquare(s)}
        
        console.log('checking if ', move, ' is legal')
        const squares = state.chess.moves({square: state.selectedSquare, verbose: true}).map(m => m.to)
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
        case 93: {
          // left arrow
          // undo move
          actions.takeback()
          break
        }
        case 95: {
          // Session button
          // flip board
          actions.flipBoard()
          break
        }
        case 96: {
          // Custom button
          // Toggle grid
          state.grid = !state.grid
          actions.lightBoard()
          break
        }
        case 97: {
          // Note button
          // Toggle pieces
          state.pieces = !state.pieces
          actions.lightBoard()
          break
        }
        case 98: {
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
    streamJson(LICHESS_API_URL + 'board/game/stream/' + m.route.param('id'),
      User.token, 
      v => {
      console.log('calling back', v)
      if (v.type == 'gameFull') {
        state.game = v
        // TODO: change to Stream()
        // m.redraw()
        console.log('loading game', v.state.moves)
        console.log('loaded?', state.chess.load_pgn(v.state.moves, {sloppy: true}))
        if (v.black.id == User.profile.id) {
          // if playing black, flip board
          actions.flipBoard()
          state.color = 'b'
        } else {
          state.color = 'w'
        }
      } else if (v.type == 'gameState') {
        console.log('move played', v.moves)
        console.log('loaded?', state.chess.load_pgn(v.moves, {sloppy: true}))

      }
      let turn = state.chess.turn() == 'w' ? 'white' : 'black'
      console.log('updated. turn is', turn)
      state.ground.set({
        fen: state.chess.fen(),
        turnColor: toColor(state.chess),
        movable: {
          dests: toDests(state.chess),
          events: { after: playOtherSide(state.chess, state.ground) }
        }
      })
      if (state.chess.history().length) {
        let hist = state.chess.history({verbose: true})
        let last = hist.pop()
        state.ground.set({
          lastMove: [last.from, last.to]
        })
      }
      actions.lightBoard()
    })
  },
  makeMove: move => {
    
    state.ground.move(move.from, move.to)
    state.ground.selectSquare(null)
    
  },
  onmove: (orig, dest) => {
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
  },
  afterInit: () => {
    actions.initMidi(actions.onInput, actions.onCC, () => {
      actions.lightBoard()
    })
  },
  takeback: () => {
    state.chess.undo()
    state.selectedPiece, state.selectedSquare = null
    state.ground.set({fen: state.chess.fen()})
    actions.lightBoard()
    setBoard(state.chess, state.ground)
  }
})
