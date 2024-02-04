import { MeiosisCell, MeiosisViewComponent } from 'meiosis-setup/types'
import { Chess } from 'chess.js'
import { State } from './State'
import { Game } from './Game.ts'
import { Toolbar } from './meiosis.ts'
import { HistoryService } from './Services'

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
    HistoryService,
    // },
  ],

  view: (cell: MeiosisCell<State>) => [Toolbar(cell), Game(cell)],
}
