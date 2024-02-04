import { State } from './State'
import { toDests } from './utils'

export const DEFAULT_POSITION =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export const HistoryService = {
  // Watch for changes to historyIndex and update the board
  onchange: (state: State) => state.historyIndex,
  run: cell => {
    console.log('historyIndex', cell.state.historyIndex)
    if (cell.state.historyIndex < 0) {
      cell.update({ historyIndex: 0 })
      return
    }
    if (cell.state.historyIndex > cell.state.history.length) {
      cell.update({ historyIndex: cell.state.history.length })
      return
    }
    let move = cell.state.chess.history({ verbose: true })[
      cell.state.historyIndex - 1
    ]
    window.ground?.set({
      fen: move ? move.after : DEFAULT_POSITION,
      lastMove: move ? [move.from, move.to] : undefined,
      turnColor: move?.color == 'w' ? 'white' : 'black',
      check: cell.state.chess.inCheck(),
    })
    if (cell.state.historyIndex == cell.state.history.length) {
      // Back to current game state. Set movable color to current turn
      window.ground?.set({
        turnColor: cell.state.chess.turn() == 'w' ? 'white' : 'black',
        movable: {
          color: cell.state.chess.turn() == 'w' ? 'white' : 'black',
          dests: toDests(cell.state.chess),
        },
        check: cell.state.chess.inCheck(),
      })
    } else {
      // Disable moving pieces while viewing history
      // TODO: Implement variation navigation
      window.ground?.set({
        movable: {
          color: undefined,
          dests: {},
        },
      })
    }
  },
}
