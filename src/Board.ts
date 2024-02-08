import './moves.css'
import { toDests } from './utils'
import m from 'mithril'
import { Chessground } from 'chessground'

export const Board = cell =>
  m(
    '.board-wrapper',
    {},
    m('#board.board', {
      oncreate: vnode => {
        console.log(
          'Board oncreate',
          cell.state,
          cell.state.chess.history({ verbose: true })
        )
        let lastMove = cell.state.chess.history({ verbose: true }).pop()
        let ground = Chessground(vnode.dom, {
          fen: cell.state.fen,
          orientation: cell.state.orientation,
          turnColor: cell.state.chess.turn() == 'w' ? 'white' : 'black',
          lastMove: lastMove ? [lastMove.from, lastMove.to] : undefined,
          movable: {
            free: false,
            dests: toDests(cell.state.chess),
            color: cell.state.chess.turn() == 'w' ? 'white' : 'black',
          },
          highlight: {
            check: true,
          },
          check: cell.state.chess.inCheck(),
          events: {
            move: (orig, dest) => {
              let state = cell.getState()
              console.log('move', orig, dest)
              state.chess.move({ from: orig, to: dest })
              // console.log(cell.state.chess.fen())
              ground.set({
                // fen: cell.state.chess.fen(),
                movable: {
                  color: state.chess.turn() == 'w' ? 'white' : 'black',
                  dests: toDests(state.chess),
                },
                check: state.chess.inCheck(),
              })
              console.log('move', orig, dest)
              cell.update({
                fen: state.chess.fen(),
                pgn: state.chess.pgn(),
                history: state.chess
                  .history({ verbose: true })
                  .map(move => move.san),
                historyIndex: state.chess.history().length,
              })
            },
          },
        })
        window.ground = ground
        cell.update({
          fen: cell.state.chess.fen(),
          pgn: cell.state.chess.pgn(),
        })
      },
    })
  )
