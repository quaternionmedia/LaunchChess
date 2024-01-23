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

const chess = new Chess()
var ground //: typeof Chessground //= Chessground(

interface State {
  page: string
  login?: {
    username: string
    password: string
  }
  data?: string[] | string
  chess?: Chess
  ground?: typeof Chessground
  fen?: string
  moves?: string[]
}

const app: MeiosisViewComponent<State> = {
  initial: {
    page: 'Home',
    fen: chess.fen(),
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
    m('#board', {
      oncreate: vnode => {
        ground = Chessground(vnode.dom, {
          // fen: window.chess.fen(),
          movable: {
            free: false,
            color: 'both',
            dests: toDests(chess),
          },
          drawable: {
            enabled: true,
            eraseOnClick: false,
          },
          trustAllEvents: true,
          events: {
            move: (orig, dest) => {
              console.log('move', orig, dest)
              chess.move({ from: orig, to: dest })
              console.log(chess.fen())
              ground.set({
                fen: chess.fen(),
                movable: {
                  color: chess.turn() == 'w' ? 'white' : 'black',
                  dests: toDests(chess),
                },
              })
              console.log('move', orig, dest)
              cell.update({
                fen: chess.fen(),
                moves: chess.history({ verbose: true }).map(move => move.san),
              })
            },
          },
        })
      },
    }),
    m('.history', {}, [
      m('h3', {}, 'moves'),
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
    ]),
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
