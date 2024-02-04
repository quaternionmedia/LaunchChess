import { MeiosisCell, MeiosisViewComponent } from 'meiosis-setup/types'
import { Chess } from 'chess.js'
import { State } from './State'
import { Game } from './Game.ts'
import { Toolbar } from './meiosis.ts'
import { Login } from './Login.ts'
import { HistoryService, PageService } from './Services'
import { UserIcon, UserProfile } from './User.ts'
import m from 'mithril'

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
  state.user = state.user || undefined
}

export const App: MeiosisViewComponent<State> = {
  initial: {
    // page: state?.page || 'Home',
    page: 'Home',
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

    user: state?.user || undefined,
  },

  services: [HistoryService, PageService],

  view: (cell: MeiosisCell<State>) => [
    Toolbar(cell),
    cell.state.page === 'Game' && Game(cell),
    cell.state.page === 'Home' && m('h1', 'Home'),
    cell.state.page === 'Login' && Login(cell),
    cell.state.page === 'User' && cell.state.user && UserProfile(cell),
  ],
}
