import { Chess } from 'chess.js'

let squares = []
let files = [...'abcdefgh']
for (let i=1; i<=8; i++) {
  files.forEach(file => {
      squares.push(file + String(i))
    })
  }
export const SQUARES = squares


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