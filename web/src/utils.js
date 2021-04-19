import { Api } from 'chessground/api'
import { Color, Key } from 'chessground/types'
import { getPieceLocations } from './ChessMaths'

export function toDests(chess) {
  const dests = new Map()
  chess.SQUARES.forEach(s => {
    const ms = chess.moves({square: s, verbose: true})
    if (ms.length) dests.set(s, ms.map(m => m.to))
  })
  console.log('all moves', dests)
  return dests
}

export function toColor(chess) {
  return (chess.turn() === 'w') ? 'white' : 'black'

}

export function playOtherSide(chess, ground) {
  return (orig, dest) => {
    chess.move({from: orig, to: dest})
    setBoard(chess, ground)
  }
}

export function setBoard(chess, ground) {
  ground.set({
    check: chess.in_check(),
    turnColor: toColor(chess),
    movable: {
      color: toColor(chess),
      dests: toDests(chess)
    }
  })
}