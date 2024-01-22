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
import { toDests } from './utils'

let chess = new Chess()

interface State {
  page: string
  login?: {
    username: string
    password: string
  }
  data?: string[] | string
}

const app: MeiosisViewComponent<State> = {
  initial: {
    page: 'Home',
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
    m('#board', {
      oncreate: vnode => {
        console.log('creating board', chess.fen())
        let ground = Chessground(vnode.dom, {
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
            },
          },
        })
        window.ground = ground
        window.chess = chess
        console.log(window.ground)
      },
    }),
  ],
}

const cells = meiosisSetup<State>({ app })

m.mount(document.getElementById('app'), {
  view: () => app.view(cells()),
})

cells.map(() => m.redraw())

// meiosisTracer({ selector: '#tracer', rows: 25, streams: [cells] });
window.cells = cells
