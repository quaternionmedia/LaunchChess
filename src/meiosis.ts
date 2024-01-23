import m from 'mithril'
import { meiosisSetup } from 'meiosis-setup'
import { MeiosisCell, MeiosisViewComponent } from 'meiosis-setup/types'
import meiosisTracer from 'meiosis-tracer'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import './chessground.css'
// import '../node_modules/chessground/assets/chessground.base.css'
import '../node_modules/chessground/assets/chessground.brown.css'
import '../node_modules/chessground/assets/chessground.cburnett.css'
import './moves.css'
import { toDests } from './utils'
import { getPieceLocations } from './ChessMaths'
// const chess = new Chess()
// var ground //: typeof Chessground //= Chessground(

const Board = cell =>
  m('#board', {
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
            console.log('move', orig, dest)
            cell.state.chess.move({ from: orig, to: dest })
            // console.log(cell.state.chess.fen())
            ground.set({
              // fen: cell.state.chess.fen(),
              movable: {
                color: cell.state.chess.turn() == 'w' ? 'white' : 'black',
                dests: toDests(cell.state.chess),
              },
              check: cell.state.chess.inCheck(),
            })
            console.log('move', orig, dest)
            cell.update({
              fen: cell.state.chess.fen(),
              moves: cell.state.chess
                .history({ verbose: true })
                .map(move => move.san),
              // ground: ground,
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
  moves?: string[]
}

const app: MeiosisViewComponent<State> = {
  initial: {
    page: 'Home',
    chess: new Chess(),
  },

  services: [],

  view: (cell: MeiosisCell<State>) => [
    m('', {}, cell.state.page),
    m(
      'button',
      {
        onclick: () => cell.update({ page: 'Login' }),
      },
      'Login'
    ),
    m('#fen', {}, 'fen: ' + cell.state.fen),
    Board(cell),
    History(cell),
    // m('#pgn', {}, cell.state.chess.pgn()),
  ],
}

const cells = meiosisSetup<State>({ app })

m.mount(document.getElementById('app'), {
  view: () => app.view(cells()),
})

cells.map(() => m.redraw())

window.cells = cells

// This is a handy dev tool, but it breaks the chess board
// meiosisTracer({ selector: '#tracer', rows: 25, streams: [cells] })
