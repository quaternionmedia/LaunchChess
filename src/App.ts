import { MeiosisCell, MeiosisViewComponent } from 'meiosis-setup/types'
import { Chess } from 'chess.js'
import { State } from './State'
import { Game } from './Game.ts'
import { Toolbar } from './meiosis.ts'
import { toDests } from './utils'

export const DEFAULT_POSITION =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export const state: State = JSON.parse(
  localStorage.getItem('launchchess') || '{}'
)?.state

export const chess: Chess = new Chess()

if (state) {
  console.log('loading from pgn', state)
  chess.loadPgn(state.pgn)
  state.fen = chess.fen()
  state.history = chess.history({ verbose: true }).map(move => move.san)
  state.historyIndex = state.history.length
  state.orientation = state.orientation || 'white'
}

export const App: MeiosisViewComponent<State> = {
  initial: {
    page: state?.page || 'Home',
    chess: chess,
    fen: state?.fen || chess.fen(),
    pgn: state?.pgn || chess.pgn(),
    history: state?.history || [],
    historyIndex: state?.historyIndex || 0,
    orientation: state?.orientation || 'white',
    isHistoryCollapsed: false,
    isFENCollapsed: true,
    isPGNCollapsed: true,
    isInfoCollapsed: false,
  },

  services: [
    {
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
        // if (cell.state.historyIndex != cell.state.history.length) {
        let move = cell.state.chess.history({ verbose: true })[
          cell.state.historyIndex - 1
        ]
        window.ground?.set({
          fen: move ? move.after : DEFAULT_POSITION,
          lastMove: move ? [move.from, move.to] : undefined,
          turnColor: move?.color == 'w' ? 'white' : 'black',
        })
        if (cell.state.historyIndex == cell.state.history.length) {
          // Back to current game state. Set movable color to current turn
          window.ground?.set({
            turnColor: cell.state.chess.turn() == 'w' ? 'white' : 'black',
            movable: {
              color: cell.state.chess.turn() == 'w' ? 'white' : 'black',
              dests: toDests(cell.state.chess),
            },
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
    },
    // },
  ],

  view: (cell: MeiosisCell<State>) => [Toolbar(cell), Game(cell)],
}
