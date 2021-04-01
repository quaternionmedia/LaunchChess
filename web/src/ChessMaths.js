import { Chess } from 'chess.js'

export const RANKS = 'abcdefgh'

let squares = []
let ranks = [...RANKS]
ranks.forEach(rank => {
  for (let f=1; f<=8; f++) {
      squares.push(rank + f)
    }
  })

export const SQUARES = squares

export function uci(move) {
  let uci = move.from + move.to
  if (move.promotion) {
    uci += move.promotion
  }
  return uci
}

export function calculateInfluence(fen) {
  let chess = new Chess(fen)
  let moves = chess.moves({verbose: true})//, legal: false})
  let defenders = Array(64).fill(0)
  moves.forEach((move, i) => {
    let index = SQUARES.indexOf(move.to)
    defenders[index] += 1
  })
  SQUARES.forEach((square, i) => {
    if (chess.get(square) && chess.get(square).color == chess.turn()) {
      defenders[SQUARES.indexOf(square)] += 1
    }
  })
  return defenders
}

export function fenForOtherSide(fen) {
    return fen.search(" w ") >= 0 ?
        fen.replace(' w ' , " b ") :
        fen.replace(' b ', " w ")
}

export function makeDests(fen) {
  let chess = new Chess(fen)
  let moves = chess.moves({verbose: true})
  let dests = {}
  moves.forEach((m, i) => {
    if (dests[m.from]) {
      dests[m.from].push(m.to)
    } else {
      dests[m.from] = [m.to]
    }
  })
  console.log('all possible moves', dests)
  return dests
}


export function getPieceLocations(chess, piece) {
  let res = []
  chess.board().map((rank, r) => {
    rank.map((p, f) => {
      if (p && p.type == piece.type && p.color == piece.color) {
        console.log('found piece', p, r, f)
        res.push( RANKS[r] + f )
      }
    })
  })  
  return res
}

