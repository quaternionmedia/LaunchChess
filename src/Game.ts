import m from 'mithril'
import { Board } from './Board.ts'
import { History, Collapsible, Copy } from './meiosis'
import { toDests } from './utils'
import { confirm } from 'alertifyjs'

export const restartGame = cell => {
  console.log('restartGame')
  confirm('Are you sure you want to start a new game?', () => {
    cell.state.chess.reset()
    window.ground.set({
      fen: cell.state.chess.fen(),
      turnColor: cell.state.chess.turn() == 'w' ? 'white' : 'black',
      lastMove: undefined,
      movable: {
        color: cell.state.chess.turn() == 'w' ? 'white' : 'black',
        dests: toDests(cell.state.chess),
      },
    })
    cell.update({
      fen: cell.state.chess.fen(),
      pgn: cell.state.chess.pgn(),
      history: cell.state.chess
        .history({ verbose: true })
        .map(move => move.san),
    })
  })
}

export const GameToolbar = cell =>
  m('.game-toolbar', {}, [
    m('button', { onclick: () => restartGame(cell) }, 'new game'),
    m(
      'button',
      {
        onclick: () =>
          cell.update({ historyIndex: cell.state.historyIndex - 1 }),
      },
      'previous'
    ),
    m(
      'button',
      {
        onclick: () =>
          cell.update({ historyIndex: cell.state.historyIndex + 1 }),
      },
      'next'
    ),
    m(
      'button',
      {
        onclick: () => {
          let orientation =
            cell.state.orientation == 'white' ? 'black' : 'white'
          window.ground.set({ orientation: orientation })
          cell.update({ orientation: orientation })
        },
      },
      'flip'
    ),
  ])

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
        GameToolbar(cell),
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
          m('#fen', {}, cell.state.fen)
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
          m('#pgn', {}, cell.state.pgn)
        ),
      ]
    ),
  ])
