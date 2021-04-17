import { Chess } from 'chess.js'

export const FILES = 'abcdefgh'

let squares = []
let files = [...FILES]
files.forEach(f => {
  for (let i=1; i<=8; i++) {
      squares.push(f + i)
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
    let index = chess.SQUARES.indexOf(move.to)
    defenders[index] += 1
  })
  chess.SQUARES.forEach((square, i) => {
    if (chess.get(square) && chess.get(square).color == chess.turn()) {
      defenders[i] += 1
    }
  })
  return defenders
}

export function fenForOtherSide(fen) {
  let tokens = fen.split(' ')
  tokens[1] = tokens[1] == 'w' ? 'b' : 'w'
  // fix for en passant
  tokens[3] = '-'
  let newFen = tokens.join(' ')
  return newFen
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
  // console.log('all possible moves', dests)
  return dests
}


export function getPieceLocations(chess, piece) {
  let res = []
  chess.board().map((rank, r) => {
    rank.map((p, f) => {
      if (p && p.type == piece.type && p.color == piece.color) {
        res.push( FILES[f] + (8-r) )
      }
    })
  })  
  return res
}

