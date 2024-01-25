import m from 'mithril'
import { meiosisSetup } from 'meiosis-setup'
import { MeiosisCell, MeiosisViewComponent } from 'meiosis-setup/types'
import meiosisTracer from 'meiosis-tracer'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import './chessground.css'
import './meiosis.css'
// import '../node_modules/chessground/assets/chessground.base.css'
import '../node_modules/chessground/assets/chessground.brown.css'
import '../node_modules/chessground/assets/chessground.cburnett.css'
import './moves.css'
import { toDests } from './utils'
import { getPieceLocations } from './ChessMaths'

interface State {
  page: string
  login?: {
    username: string
    password: string
  }
  data?: string[] | string
  chess: Chess
  ground?: typeof Chessground
  fen?: string
  moves?: []
  pgn?: string
  isHistoryCollapsed: boolean
  isFENCollapsed: boolean
  isPGNCollapsed: boolean
  isInfoCollapsed: boolean
}

const Board = cell =>
  m('#board.board', {
    oncreate: vnode => {
      let ground = Chessground(vnode.dom, {
        // fen: window.chess.fen(),
        movable: {
          free: false,
          color: 'white',
          dests: toDests(cell.state.chess),
        },
        highlight: {
          check: true,
        },
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
              moves: state.chess
                .history({ verbose: true })
                .map(move => move.san),
              // ground: ground,
              pgn: state.chess.pgn(),
            })
          },
        },
      })
      window.ground = ground
    },
  })

const History = cell =>
  m('.history', {}, [
    m('h3', {}, 'Moves'),
    m(
      'table',
      {},
      Array.from(
        { length: Math.ceil(cell.state.moves?.length / 2) },
        (_, i) => i
      ).map(index =>
        m('tr', {}, [
          m('td.move-number', {}, index + 1),
          m('td.move', {}, cell.state.moves[2 * index]),
          m('td.move', {}, cell.state.moves[2 * index + 1]),
        ])
      )
    ),
  ])

const Menu = cell =>
  m('#toolbar.component', {}, [
    m('', {}, cell.state.page),
    m(
      'button',
      {
        onclick: () => cell.update({ page: 'Login' }),
      },
      'Login'
    ),
  ])
const Collapsible = {
  view: ({ attrs: { title, isCollapsed, toggle }, children }) =>
    m('.component.collapsible', [
      m('span', m('h4', title)),
      m('button', { onclick: toggle }, isCollapsed ? '+' : '-'),
      isCollapsed ? null : m('.content', children),
    ]),
}

const Copyable = {
  view: ({ attrs: { content }, children }) => [
    children,
    m(
      'button',
      { onclick: () => navigator.clipboard.writeText(content) },
      'Copy'
    ),
  ],
}
const app: MeiosisViewComponent<State> = {
  initial: {
    page: 'Home',
    chess: new Chess(),
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
          isCollapsed: cell.state.isInfoCollapsed,
          toggle: () =>
            cell.update({ isInfoCollapsed: !cell.state.isInfoCollapsed }),
        },
        [
          m(
            Collapsible,
            {
              title: 'History',
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
            },
            m(
              Copyable,
              { content: cell.state.fen },
              m('#fen', {}, [m('h4', 'FEN'), cell.state.fen])
            )
          ),
          m(
            Collapsible,
            {
              title: 'PGN',
              isCollapsed: cell.state.isPGNCollapsed,
              toggle: () =>
                cell.update({ isPGNCollapsed: !cell.state.isPGNCollapsed }),
            },
            m(
              Copyable,
              { content: cell.state.pgn },
              m('#pgn', {}, [m('h4', 'PGN'), cell.state.pgn])
            )
          ),
        ]
      ),
    ]),
  ],
}

const cells = meiosisSetup<State>({ app })

m.mount(document.getElementById('app'), {
  view: () => app.view(cells()),
})

cells.map(() => m.redraw())

meiosisTracer({
  selector: '#tracer',
  rows: 25,
  streams: [cells],
})

window.cells = cells
