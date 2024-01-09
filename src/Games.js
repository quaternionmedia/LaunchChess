import m from 'mithril'
import { LICHESS_API_URL } from './config'
import { streamJson } from './ndjson'
import { Chessground } from 'chessground'
import { Board } from './Board'
import { Toolbar, OnlineToolbar } from './Toolbar'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'
import { toDests } from './utils'
import { NOTE_ON, CONTROL_CHANGE, COLORS } from './Launchpad'

export const GamesActions = (state, actions) => ({
  getGames: async () => {
    state.stream = await state.auth.openStream('/api/stream/event', {}, msg => {
      console.log('got game stream msg', msg)
      switch (msg.type) {
        case 'gameStart':
          let games = state.games()
          games.push(msg.game)
          state.games(games)
          if (games.length == 1) {
            console.log('one active game. loading now!')
            state.game = games[0]
          }
          break
        case 'gameFinish':
          state.games(state.games().filter(g => g.gameId != msg.game.gameId))
          break
        case 'challenge':
          // TODO
          break
        case 'challengeCanceled':
          // TODO
          break
        case 'challengeDeclined':
          // TODO
          break
      }
    })
  }
})

export const GameThumb = (state, game) =>
  m(game.isMyTurn ? '.gamethumb.myturn' : '.gamethumb', {}, [
    game.opponent.username,
    m(Board, {
      class: 'thumb',
      config: {
        fen: game.fen,
        viewOnly: true,
        orientation: game.color,
        lastMove: [game.lastMove.slice(0, 2), game.lastMove.slice(2)],
      },
      onclick: e => {
        console.log('game clicked', game)
        state.game = game
        state.opponent = game.opponent
        m.route.set('/online', { id: game.gameId })
      },
    }),
  ])

export const Games = (state, actions) => {
  let listener
  return {
    listener: null,
    oninit: vnode => {
      if (!state.loggedIn()) {
        m.route.set('/login')
      }
      state.invert(false)
      let games = state.games()
      console.log('games', games)
      state.games(games)
      if (state.input) {
        listener = state.input.addListener('noteon', 'all', message => {
          console.log('connector got message', message)
          let n = actions.launchToN(message.data[1])
          /* n is 0-63, but represented bottom to top.
        We need to invert the row to make it read top to bottom, left to right. */
          let g = (n % 8) + (7 - Math.floor(n / 8)) * 8
          console.log('selected game', g)
          if (g < games.length) {
            m.route.set('/online', { id: games[g].gameId })
          }
        })

        games.map((g, i) => {
          let note = g.isMyTurn ? NOTE_ON | 2 : NOTE_ON
          /* Invert the row to get buttons to go top to bottom. */
          let n = (i % 8) + 8 * (7 - Math.floor(i / 8))
          let l = actions.nToLaunch(n)
          console.log('sending', g, i, l)
          actions.send(note, [l, g.color == 'white' ? 15 : 83])
        })
        actions.clearAnimations()
        actions.clear()
        actions.send(NOTE_ON, [state.top[state.top.length - 1], COLORS['q']])
      }
      if (games.length == 1) {
        console.log('one active game. loading now!')
        state.game = games[0]
        m.route.set('/online', { id: state.game.gameId })
      }
    },
    onremove: vnode => {
      if (state.input) state.input.removeListener(listener)
    },
    view: vnode => [
      m('.toolbar', {}, [
        m('i.material-icons', { onclick: actions.getGames }, 'refresh'),
        m(
          'a.inline',
          { href: 'https://lichess.org/?any#ai', target: '_blank' },
          m(
            'i.material-icons',
            {
              title: 'create new game on Lichess.com',
            },
            m('img.svgicon', {
              src:
                state.theme == 'dark'
                  ? 'static/lichess-logo-white.svg'
                  : 'static/lichess-logo.svg',
            })
          )
        ),
      ]),
      m('.selector', {}, [
        state.games().map(g => {
          return GameThumb(state, g)
        }),
      ]),
    ],
  }
}

let config = {
  movable: {
    color: 'both',
    free: false,
  },
}

export const Game = (state, actions) =>
  m('.board', {
    oninit: vnode => {
      console.log('game loading', vnode.attrs, state.chess.ascii())
      actions.streamGame()
      actions.afterInit()
    },
    oncreate: vnode => {
      state.ground = Chessground(vnode.dom, {
        ...config,
        ...vnode.attrs.config,
      })
      state.ground.set({
        fen: state.chess.fen(),
        orientation: state.invert() ? 'black' : 'white',
        movable: {
          dests: toDests(state.chess),
        },
        events: {
          select: key => {
            console.log('chessground selected', key)
            if (
              state.chess.get(key) &&
              state.chess.get(key).color == state.chess.turn()
            ) {
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
        },
      })
    },
  })

export const GamePage = (state, actions) => ({
  view: vnode =>
    m('.gamePage', {}, [Toolbar(state, actions), Game(state, actions)]),
})

export const Player = (state) => m('.me', {}, state.user.username)
export const Opponent = state =>
  state.opponent ? m('.opponent', {}, JSON.stringify(state.opponent)) : null

export const GamePageOnline = (state, actions) => ({
  oninit: vnode => {
    if (!state.loggedIn()) {
      console.log('not logged in. Redirecting to login')
      m.route.set('/login')
    }
  },
  view: vnode =>
    m('.gamePage', {}, [
      OnlineToolbar(state, actions),
      m(
        '.top_user',
        {},
        state.invert() != (state.color == 'b') ? Player(state) : Opponent(state)
      ),
      Game(state, actions),
      m(
        '.bottom_user',
        {},
        state.invert() != (state.color == 'b') ? Opponent(state) : Player(state)
      ),
    ]),
})
