import m from 'mithril'
import { Chessground } from 'chessground'
import './chessground.css'
import './chessground-brown.css'
import { Chess } from 'chess.js'

var config = {
}

export function Board() {
  const chess = new Chess()
  var ground = null
  
  return {
    oncreate: vnode => {
      ground = Chessground(vnode.dom, config)
      function makeMove() {
        if (!chess.game_over()) {
          const moves = chess.moves({verbose:true})
          const move = moves[Math.floor(Math.random() * moves.length)]
          // console.log(move)
          chess.move(move)
          // ground = Chessground(vnode.dom, {fen: chess.fen()})
          console.log(move.from, move.to)
          ground.move(move.from, move.to)
          setTimeout(makeMove, 100)
        } else {
          console.log(chess.pgn())
        }
      }
      makeMove()
    },
    view: vnode => {
      return m('')
    }
  }
}
