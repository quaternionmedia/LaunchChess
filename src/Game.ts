import m from 'mithril'
import { Board } from './Board.ts'
import { History, Collapsible, Copy } from './meiosis'

export const Game = cell =>
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
  ])
