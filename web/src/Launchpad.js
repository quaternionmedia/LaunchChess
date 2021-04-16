import { Midi, NOTE_ON } from './Midi'

const colors = {'p': 13,'r': 9,'n': 45,'b': 37,'q': 53,'k': 49}

export const Launchpad = (state) => ({

  nToLaunch: n => {
    // 0-63 mapped to launchpad notes
    if (state.invert) {
      n = 63 - n
    }
    return 11 + (n>>3)*10 + n%8
  },
  launchToN: n => {
    // launchpad note mapped to 0-63
    const s = Math.floor((n-11)/ 10)*8 + (n-11) % 10
    return state.invert ? 63 - s : s
  },
  squareToN: sq => {
    return (Number(sq[1]) - 1)*8 + sq.charCodeAt(0) - 97
  },
  nToSquare: n => {
    return String.fromCharCode(97+(n%8), 49+(n>>3))
  },
  grid: () => {
    for (let y=0; y<8; y++) {
      for (let x=0; x<8; x++) {
        state.output.send(NOTE_ON, [11+x+y*10, (x+y) % 2 == 0 ? 0 : 1])
      }
    }
  },
  lightMatrix: m => {
    for (let y=0; y<8; y++) {
      for (let x=0; x<8; x++) {
        state.output.send(NOTE_ON, [11+x+y*10, m[x+y*8]])
      }
    }
  },
  lightGame: () => {
    const board = state.chess.board()
    for (let i=0; i<64; i++) {
      if (board[(63-i) >> 3][i % 8]) {
        let piece = board[(63-i) >> 3][i % 8]
        // console.log('piece at i', i, piece)
      } else {
        let piece = null
      }
      const l = nToLaunch(i)
      // console.log(i, piece, l)
      const c = piece ? colors[piece.type] : (i + (i >> 3)) % 2 == 0 ? 0 : 1
      // console.log(NOTE_ON, l, c)
      
      state.output.send(NOTE_ON, [l, piece ? (piece.color == 'w' ? c : c + 2) : c])
    }
    let history = state.chess.history()
    if (history.length) {
      highlightMove(history.length-1)
      if (history.length > 1) {
        highlightMove(history.length-2)
      }
    }
    state.output.send(NOTE_ON, [99, state.chess.turn() == 'w' ? 3 : 83])
  },
  highlightMove: index => {
    let lastMove = state.chess.history({verbose:true})[index]
    if (lastMove) {
      let from_square = lastMove.from
      let to_square = lastMove.to
      console.log('highlighting', lastMove, from_square, to_square)
      if (! state.chess.get(from_square)) {
        state.output.send(NOTE_ON | 2, [nToLaunch(squareToN(from_square)), 70])
      }
      if (state.chess.get(to_square)) {
        let c = colors[state.chess.get(to_square).type]
        state.output.send(NOTE_ON | 2, [nToLaunch(squareToN(to_square)), state.chess.get(to_square).color == 'w' ? c : c + 2])
      }
      
      if (state.chess.in_check()) {
        let k = getPieceIndex({type:'k', color: state.chess.turn() })
        console.log('check!', k)
        state.output.send(NOTE_ON | 1, [nToLaunch(k), 5])
      }
      if (state.chess.in_checkmate()) {
        let k = getPieceIndex({type:'k', color: state.chess.turn() })
        console.log('mate!', k)
        state.output.send(NOTE_ON, [nToLaunch(k), 5])
      }
    }
    
  },
  highlightAvailableMoves: square => {
    state.output.send(NOTE_ON | 1, [nToLaunch(squareToN(square), state.invert), 21])
    let piece_moves = state.chess.moves({square: square, verbose:true})
    console.log('possible moves', piece_moves)
    piece_moves.forEach((p, i) => {
      console.log(p)
      if (state.chess.get(p.to)) {
        // piece at square. flash green
        console.log('capture', nToLaunch(squareToN(p.to), state.invert))
        state.output.send(NOTE_ON | 1, [nToLaunch(squareToN(p.to), state.invert), 21])
      } else {
        console.log('regular move', p.to, squareToN(p.to), nToLaunch(squareToN(p.to), state.invert))
        state.output.send(NOTE_ON | 2, [nToLaunch(squareToN(p.to), state.invert), 21])
      }
    })
  }

})

export class LaunchpadX extends Launchpad {
  
}

export const Launchpads = {
  'Launchpad X MIDI 2': LaunchpadX,
}