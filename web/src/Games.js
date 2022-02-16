import m from 'mithril'
import { User, auth } from './User'
import { LICHESS_API_URL } from './config'
import { streamJson } from './ndjson'
import { Chessground } from 'chessground'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { Toolbar, OnlineToolbar } from './Toolbar'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
import { toDests, toColor, playOtherSide } from './utils'
import { NOTE_ON, CONTROL_CHANGE, COLORS } from './Launchpad'

export const getGames = (state, actions) => ({
  getGames: () => {
    let promise = new Promise((resolve, reject) => {
      auth(LICHESS_API_URL + 'account/playing').then(res => res.nowPlaying).then(state.games).then( res =>{
        console.log('currently playing games', res)
        if (res.length == 1) {
          console.log('one active game. loading now!')
          state.game = res[0]
          m.route.set('/online', {id: state.game.gameId})
        } else if (res.length == 0) {
          actions.streamGames()
        }
        resolve()
      })
    })
    return promise
    
  },
  streamGames: () => {
    streamJson(LICHESS_API_URL + 'stream/event', User.token, res => {
      console.log('new lichess event', res)
      if (res.type == 'gameStart' && state.games().length == 0) {
        console.log('auto starting game')
        actions.getGames()
      }
    })
  }
})


export const GameThumb = (state, game) => m(game.isMyTurn ? '.gamethumb.myturn': '.gamethumb', {}, [
      game.opponent.username,
      m(Board, {
        class: 'thumb',
        config: {
          fen: game.fen,
          viewOnly: true,
          orientation: game.color,
          lastMove: [game.lastMove.slice(0,2), game.lastMove.slice(2)],
          },
        onclick: e => {
          console.log('game clicked', game)
          state.game = game
          state.opponent = game.opponent
          m.route.set('/online', {id: game.gameId})
        },
      }
    ),
  ]
)


export const Games = (state, actions) => ({
  oninit: vnode => {
    if (!User.loggedIn) {
      m.route.set('/login')
    }
    state.invert(false)
    actions.getGames().then(e => {
      console.log('got games', e)
      actions.initMidi(message => {
        console.log('connector got message', message)
        let n = actions.launchToN(message.data[1])
        let g = (n % 8) + (7 - Math.floor(n/8))*8
        console.log('selected game', g)
        if (g < state.games().length) {
          m.route.set('/online', {id: state.games()[g].gameId})
        }
      }, ()=>{}, ()=>{
          state.games().map((g, i) => {
            let note = g.isMyTurn ? NOTE_ON | 2 : NOTE_ON
            let n = (i % 8) + 8 * (7 - Math.floor(i/8))
            let l = actions.nToLaunch(n)
            console.log('sending', g, i, l)
            actions.send(note, [l, g.color == 'white' ? 15 : 83])
          })
      })
    })
    actions.clearAnimations()
    actions.clear()
    actions.send(NOTE_ON, [state.top[state.top.length - 1], COLORS['q']])
    
  },
  view: vnode => [
    
  m('.toolbar', {}, [
    m('i.material-icons', {onclick: actions.getGames}, 'refresh'),
    m('a.inline', {href:'https://lichess.org/setup/ai', target:"_blank"}, 
      m('i.material-icons', {
        title: 'create new game on Lichess.com',
      }, m('img.svgicon', {src: state.theme == 'dark' ? 'static/lichess-logo-white.svg' : 'static/lichess-logo.svg'}))),
  ]),
  m('.selector', {}, [
    state.games().map(g => {
      return GameThumb(state, g)
    }),
  ]),
]})

let config = {
  movable: {
    color: 'both',
    free: false,
  },
}

export const Game = (state, actions) => m('.board', {
    oninit: vnode => {
      console.log('game loading', vnode.attrs, state.chess.ascii())
      actions.afterInit()
    },
    oncreate: vnode => {
      state.ground = Chessground(vnode.dom, {...config, ...vnode.attrs.config})
      state.ground.set({
        fen: state.chess.fen(),
        orientation: state.invert() ? 'black': 'white',
        movable: {
          dests: toDests(state.chess),
        },
        events: {
          select: key => {
            console.log('chessground selected', key)
            if (state.chess.get(key) && state.chess.get(key).color == state.chess.turn()) {
              // clear previous selection
              actions.lightBoard()
              state.selectedSquare = key
              state.selectedPiece = state.chess.get(key)
              actions.highlightAvailableMoves(key)
            }
          },
          move: (orig, dest) => {
            actions.onmove(orig, dest)
          },
        }
      })
    }
  })

export const GamePage = (state, actions) => ({
  view: vnode => m('.gamePage', {}, [
    Toolbar(state, actions),
    Game(state, actions),
])})

export const Player = () => m('.me', {}, User.username)
export const Opponent = state => state.opponent ? m('.opponent', {}, JSON.stringify(state.opponent)) : null )

export const GamePageOnline = (state, actions) => ({
  view: vnode => m('.gamePage', {}, [
    OnlineToolbar(state, actions),
      state.invert() != (state.color == 'b') ? Player() : Opponent(state),
    Game(state, actions),
      state.invert() != (state.color == 'b') ? Opponent(state) : Player(),
  ])
})