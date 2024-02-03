import m from 'mithril'
import { MeiosisCell, MeiosisViewComponent } from 'meiosis-setup/types'
import { Chess } from 'chess.js'
import { Board } from './Board.ts'
import { State } from './State'
import { History, Collapsible, Copy } from './meiosis'

export const state: State = JSON.parse(
  localStorage.getItem('launchchess') || '{}'
)?.state

export const chess: Chess = new Chess()

if (state) {
  console.log('loading from pgn', state)
  chess.loadPgn(state.pgn)
  state.fen = chess.fen()
  state.moves = chess.history({ verbose: true }).map(move => move.san)
}

export const App: MeiosisViewComponent<State> = {
  initial: {
    page: state?.page || 'Home',
    chess: chess,
    fen: state?.fen || chess.fen(),
    pgn: state?.pgn || chess.pgn(),
    moves: state?.moves || [],
    isHistoryCollapsed: false,
    isFENCollapsed: true,
    isPGNCollapsed: true,
    isInfoCollapsed: false,
  },

  services: [],

  view: (cell: MeiosisCell<State>) => [
    m('#toolbar.component', {}, [
      m('', {}, cell.state.page),
      m(
        'button',
        {
          onclick: () => cell.update({ page: 'Login' }),
        },
        'Login'
      ),
    ]),
    m('#game.component', {}, [
      Board(cell),

      m(
        Collapsible,
        {
          title: 'Game Info',
          className: 'info',
          isCollapsed: cell.state.isInfoCollapsed,
          toggle: () =>
            cell.update({ isInfoCollapsed: !cell.state.isInfoCollapsed }),
        },
        [
          m(
            Collapsible,
            {
              title: 'History',
              className: 'history',
              isCollapsed: cell.state.isHistoryCollapsed,
              toggle: () =>
                cell.update({
                  isHistoryCollapsed: !cell.state.isHistoryCollapsed,
                }),
            },
            [History(cell)]
          ),
          m(
            Collapsible,
            {
              title: 'FEN',
              isCollapsed: cell.state.isFENCollapsed,
              toggle: () =>
                cell.update({ isFENCollapsed: !cell.state.isFENCollapsed }),

              header: m(Copy, { content: cell.state.fen, name: 'FEN' }),
            },
            m('#fen', {}, [m('h4', 'FEN'), cell.state.fen])
          ),
          m(
            Collapsible,
            {
              title: 'PGN',
              isCollapsed: cell.state.isPGNCollapsed,
              toggle: () =>
                cell.update({ isPGNCollapsed: !cell.state.isPGNCollapsed }),
              header: m(Copy, { content: cell.state.pgn, name: 'PGN' }),
            },
            m('#pgn', {}, [m('h4', 'PGN'), cell.state.pgn])
          ),
        ]
      ),
    ]),
  ],
}
