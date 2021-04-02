import { Midi, NOTE_ON } from './Midi'

const colors = {'p': 13,'r': 9,'n': 45,'b': 37,'q': 53,'k': 49}


export function nToLaunch(n, invert=false) {
  // 0-63 mapped to launchpad notes
  if (invert) {
    n = 63 - n
  }
  return 11 + (n>>3)*10 + n%8
}
export function launchToN(n, invert=false) {
  // launchpad note mapped to 0-63
  const s = Math.floor((n-11)/ 10)*8 + (n-11) % 10
  return invert ? 63 - s : s
}
export function squareToN(sq) {
  return (Number(sq[1]) - 1)*8 + sq.charCodeAt(0) - 97
}
export function nToSquare(n) {
  return String.fromCharCode(97+(n%8), 49+(n>>3))
}
export function grid() {
  for (var y=0; y<8; y++) {
    for (var x=0; x<8; x++) {
      Midi.output.send(NOTE_ON, [11+x+y*10, (x+y) % 2 == 0 ? 0 : 1])
    }
  }
}
export function lightMatrix(m) {
  for (var y=0; y<8; y++) {
    for (var x=0; x<8; x++) {
      Midi.output.send(NOTE_ON, [11+x+y*10, m[x+y*8]])
    }
  }
}
export function lightGame(chess, invert=false) {
  const board = chess.board()
  for (let i=0; i<64; i++) {
    if (board[(63-i) >> 3][i % 8]) {
      var piece = board[(63-i) >> 3][i % 8]
      // console.log('piece at i', i, piece)
    } else {
      var piece = null
    }
    const l = nToLaunch(i, invert=invert)
    // console.log(i, piece, l)
    const c = piece ? colors[piece.type] : (i + (i >> 3)) % 2 == 0 ? 0 : 1
    // console.log(NOTE_ON, l, c)
    
    Midi.output.send(NOTE_ON, [l, piece ? (piece.color == 'w' ? c : c + 2) : c])
  }
  let history = chess.history()
  if (history.length) {
    highlightMove(chess, history.length-1, invert=invert)
    if (history.length > 1) {
      highlightMove(chess, history.length-2, invert=invert)
    }
  }
  Midi.output.send(NOTE_ON, [99, chess.turn() == 'w' ? 3 : 83])
}
export function highlightMove(chess, index, invert=false) {
  var lastMove = chess.history({verbose:true})[index]
  if (lastMove) {
    var from_square = lastMove.from
    var to_square = lastMove.to
    console.log('highlighting', lastMove, from_square, to_square)
    if (! chess.get(from_square)) {
      Midi.output.send(NOTE_ON | 2, [nToLaunch(squareToN(from_square), invert=invert), 70])
    }
    if (chess.get(to_square)) {
      let c = colors[chess.get(to_square).type]
      Midi.output.send(NOTE_ON | 2, [nToLaunch(squareToN(to_square), invert=invert), chess.get(to_square).color == 'w' ? c : c + 2])
    }
    
    if (chess.in_check()) {
      let k = getPieceIndex(chess, {type:'k', color: chess.turn() })
      console.log('check!', k)
      Midi.output.send(NOTE_ON | 1, [nToLaunch(k, invert=invert), 5])
    }
    if (chess.in_checkmate()) {
      let k = getPieceIndex(chess, {type:'k', color: chess.turn() })
      console.log('mate!', k)
      Midi.output.send(NOTE_ON, [nToLaunch(k, invert=invert), 5])
    }
  }
  
}

export function highlightAvailableMoves(chess, square, invert=false) {
  Midi.output.send(NOTE_ON | 1, [nToLaunch(squareToN(square), invert), 21])
  let piece_moves = chess.moves({square: square, verbose:true})
  console.log('possible moves', piece_moves)
  piece_moves.forEach((p, i) => {
    console.log(p)
    if (chess.get(p.to)) {
      // piece at square. flash green
      console.log('capture', nToLaunch(squareToN(p.to), invert))
      Midi.output.send(NOTE_ON | 1, [nToLaunch(squareToN(p.to), invert), 21])
    } else {
      console.log('regular move', p.to, squareToN(p.to), nToLaunch(squareToN(p.to), invert))
      Midi.output.send(NOTE_ON | 2, [nToLaunch(squareToN(p.to), invert), 21])
    }
  })
}