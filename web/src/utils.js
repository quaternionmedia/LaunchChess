import { Api, Color, Key } from 'chessground'
import { getPieceLocations, SQUARES } from './ChessMaths'
import { Graph, astar } from 'javascript-astar'

export function toDests(chess) {
  const dests = new Map()
  SQUARES.forEach(s => {
    const ms = chess.moves({ square: s, verbose: true })
    if (ms.length)
      dests.set(
        s,
        ms.map(m => m.to)
      )
  })
  console.log('all moves', dests)
  return dests
}

export function toColor(chess) {
  return chess.turn() === 'w' ? 'white' : 'black'
}

export function playOtherSide(chess, ground) {
  return (orig, dest) => {
    chess.move({ from: orig, to: dest })
    setBoard(chess, ground)
  }
}

export function setBoard(chess, ground) {
  ground.set({
    fen: chess.fen(),
    check: chess.isCheck(),
    turnColor: toColor(chess),
    movable: {
      color: toColor(chess),
      dests: toDests(chess),
    },
  })

  let hist = chess.history({ verbose: true })
  if (hist.length) {
    let last = hist.pop()
    ground.set({
      lastMove: [last.from, last.to],
    })
  }
}

export function findPath(from, to) {
  let graph = new Graph(new Array(8).fill(new Array(8).fill(1)), {
    diagonal: true,
  })
  console.log('finding path', from, to, graph)
  let start = graph.grid[from.charCodeAt(0) - 97][from.charCodeAt(1) - 49]
  let end = graph.grid[to.charCodeAt(0) - 97][to.charCodeAt(1) - 49]
  let path = astar.search(graph, start, end, {
    heuristic: astar.heuristics.diagonal,
  })
  path.unshift(start)
  console.log('found path', path)
  return path
}
