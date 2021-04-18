import m from 'mithril'
import { Game, game } from './Games'
import { Chess } from 'chess.js'
import { NOTE_ON } from './Midi'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { Chessground } from 'chessground'
import { SQUARES, calculateInfluence, fenForOtherSide, makeDests, uci } from './ChessMaths'
import { LaunchpadX } from './Launchpad'
import { toDests, toColor, playOtherSide } from './utils'
import { Toolbar } from './Toolbar'
import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'


// let GREEN = [ 123, 23, 64, 22, 76, 87, 21, 122 ]
// let RED = [121, 7, 106, 6, 120, 5]
// let BLUE = [47, 46, 45, ]
export const COLORS = [5, 121, 9, 11, 15, 1, 23, 37, 45, 49, 69]

export const LaunchGame = (state, actions) => ({
  // let launchpad
  // let selected, selectedSquare
  // let invert = false
  // let chess = new Chess()
  // let ground
  // let influence = false
  // let color
  
  lightBoard: () => {
    if (state.chess) {
      if (state.influence) {
        actions.showInfluence()
      } else {
        actions.lightGame()
      }
    } else {
      actions.grid()
    }
  },
  
  flipBoard: () => {
    state.invert = !state.invert
    actions.lightBoard()
    // if (ground) 
    state.ground.toggleOrientation()
    // m.redraw()
  },
  showInfluence: () => {
    let fen = state.chess.fen()
    let defenders = calculateInfluence(fen)
    let attackers = calculateInfluence(fenForOtherSide(fen))
    
    console.log(fen, defenders, attackers)
    let colorMap = defenders.map((s, i) => {
      let v = s - attackers[i]
      let c = Math.min(v+5, 9)
      return COLORS[toColor(state.chess) == state.color ? c : 10 - c]
    })
    if (state.invert != (state.color == 'b')) colorMap.reverse()
    console.log(colorMap)
    actions.lightMatrix(colorMap)
  },
  
  
  onInput: message => {
    message = message.data
    console.log('input', message)
    if (message[2]) {
      const s = actions.launchToN(message[1])
      console.log('touched', s)
      const legal_moves = state.chess.moves({verbose:true})
      console.log('legal moves', legal_moves)
      if (state.selectedSquare && actions.squareToN(state.selectedSquare) == s) {
        // clear selected piece
        state.selectedSquare = null
        actions.lightBoard()
        state.ground.selectSquare(null)
      } else if (state.chess.get(actions.nToSquare(s)) && state.chess.get(actions.nToSquare(s)).color == state.chess.turn()) {
        if (state.selectedSquare) {
          // clear other selected piece
          actions.lightBoard()
          // ground.selectSquare(null)
        }
        console.log('checking', actions.nToSquare(s), state.chess.get(actions.nToSquare(s)))
        if (state.chess.get(actions.nToSquare(s)) && (state.chess.get(actions.nToSquare(s)).color == state.chess.turn())) {
          // select piece
          state.selectedSquare = actions.nToSquare(s)
          state.selectedPiece = state.chess.get(actions.nToSquare(s))
          state.ground.selectSquare(state.selectedSquare)
          actions.highlightAvailableMoves(state.selectedSquare)
        }
      } else if (state.selectedSquare) {
        // move selected to square
        
        const move = {from: state.selectedSquare, to: actions.nToSquare(s)}
        if (state.selectedPiece.type == 'p' && (state.selectedPiece.color == 'w' && s >> 3 == 7 ) || (state.selectedPiece.color == 'b' && s >> 3 == 0 )) {
          console.log('promotion! Auto promote to Queen')
          move.promotion = 'q'
        }
        console.log('checking if ', move, ' is legal')
        const squares = state.chess.moves({square: state.selectedSquare, verbose: true}).map(m => m.to)
        if (squares.includes(move.to)) {
          actions.makeMove(move)
        } else {
          console.log('illegal move', move)
        }
      }
    }
    
  },
  onCC: message => {
    message = message.data
    if (message[2]) {
      console.log('cc', message)
      switch (message[1]) {
        case 93: {
          // left arrow
          // undo move
          state.chess.undo()
          state.selectedPiece, state.selectedSquare = null
          actions.lightBoard()
          break
        }
        case 95: {
          // Session button
          // flip board
          actions.flipBoard()
          break
        }
        case 98: {
          // Custom Midi
          // toggle square influence / game
          actions.toggleInfluence()
          break
        }
      }
    }
  },
  toggleInfluence: () => {
    state.influence = !state.influence
    state.output.send(NOTE_ON, [98, state.influence ? 5 : 0])
    actions.lightBoard()
  },
  streamGame: () => {
    streamJson(LICHESS_API_URL + 'board/game/stream/' + m.route.param('id'),
      User.token, 
      v => {
      console.log('calling back', v)
      if (v.type == 'gameFull') {
        state.game = v
        // TODO: change to Stream()
        // m.redraw()
        console.log('loading game', v.state.moves)
        console.log('loaded?', state.chess.load_pgn(v.state.moves, {sloppy: true}))
        if (v.black.id == User.profile.id) {
          // if playing black, flip board
          actions.flipBoard()
          state.color = 'b'
        } else {
          state.color = 'w'
        }
      } else if (v.type == 'gameState') {
        console.log('move played', v.moves)
        console.log('loaded?', state.chess.load_pgn(v.moves, {sloppy: true}))

      }
      let turn = state.chess.turn() == 'w' ? 'white' : 'black'
      console.log('updated. turn is', turn)
      state.ground.set({
        fen: state.chess.fen(),
        turnColor: toColor(state.chess),
        movable: {
          dests: toDests(state.chess),
          events: { after: playOtherSide(state.chess, state.ground) }
        }
      })
      if (state.chess.history().length) {
        let hist = state.chess.history({verbose: true})
        let last = hist.pop()
        state.ground.set({
          lastMove: [last.from, last.to]
        })
      }
      actions.lightBoard()
    })
  },
  makeMove: move => {
    state.ground.move(move.from, move.to)
    state.ground.selectSquare(null)
  },
  onmove: (orig, dest) => {
      playOtherSide(state.chess, state.ground)(orig, dest)
      actions.lightBoard()
    // send to lichess api
    // let move_uci = uci(move)
    // auth('https://lichess.org/api/board/game/' + m.route.param('id') + '/move/' + move_uci, {
    //   method: 'post',
    // }).then(e => {
    //   console.log('played move', move_uci, e)
    // })
  },
  afterInit: () => {
    actions.initMidi(actions.onInput, actions.onCC, () => {
      actions.lightBoard()
    })
  },
  // initLaunchGame: () => {
  //   console.log('connecting')
  //   launchpad = new LaunchpadX()
  //   Midi.init(onInput, onCC, () => {
  //     Midi.toggleLive()
  //     actions.lightBoard()
  //   })
  // }
  // return {
  //   onremove: vnode => {
  //     Midi.close()
  //   },
  //   view: vnode => {
  //     let status = Midi.connected() ? 'connected' : 'disconnected'
  //     return [
  //       m(Toolbar()),
  //       game.gameFull ? m('', {}, JSON.stringify(invert ? game.gameFull.white : game.gameFull.black)) : null,
  //       m(Game()),
        // m('.board.fullscreen', {
        // 
        //     oninit: vnode => {
        //       init()
        //     },
        //   oncreate: v => {
        //     ground = Chessground(v.dom, {fen: v.attrs.fen,
        //       orientation: invert ? 'black' : 'white',
        //       premovable: {
        //         enabled: false
        //       },
        //       movable: {
        //          free: false
        //       },
        //       events: {
        //         select: key => {
        //           console.log('chessground selected', key)
        //           //clear previous selection
        //           lightBoard()
        //           selected = true
        //           selectedSquare = key
        //           actions.highlightAvailableMoves(chess, key, invert)
        //         },
        //         move: (orig, dest, captured) => {
        //           console.log('chessground moved', orig, dest, captured)
        //           ground.move(orig, dest)
        //           makeMove({from: orig, to: dest})
        //         }
        //       }
        //     })
        // 
        //     let c = game.isMyTurn ? game.color : game.color == 'white' ? 'black' : 'white'
        //     console.log('my color', c)
        //     ground.set({
        //       movable: { 
        //         dests: toDests(chess), events: { after: playOtherSide(chess, ground) },
        //         color: c,
        //       }
        //     })
        //     streamGame()
        // 
        //   },
        //      }),
  //       game.gameFull ? m('', {}, JSON.stringify(invert ? game.gameFull.black : game.gameFull.white)) : null,
  // 
  //     ]
  //   }
  // }
})
