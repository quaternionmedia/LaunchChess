import m from 'mithril'
import { Game, game } from './Games'
import { Chess } from 'chess.js'
import { Midi, NOTE_ON, CONTROL_CHANGE } from './Midi'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { Chessground } from 'chessground'
import { SQUARES, calculateInfluence, fenForOtherSide, makeDests, uci } from './ChessMaths'
import { nToLaunch, launchToN, squareToN, nToSquare, grid, lightMatrix, lightGame, highlightMove } from './Launchpad'
import { toDests, toColor, playOtherSide } from './utils'

import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'


// let GREEN = [ 123, 23, 64, 22, 76, 87, 21, 122 ]
// let RED = [121, 7, 106, 6, 120, 5]
// let BLUE = [47, 46, 45, ]
export const COLORS = [5, 121, 9, 11, 15, 1, 23, 37, 45, 49, 69]

export function Connect() {
  let selected, square, piece_moves
  let invert = false
  let chess = new Chess()
  let ground
  let influence = false
  let color
  
  function lightBoard() {
    if (influence) {
      showInfluence()
    } else {
      lightGame(chess, invert)
    }
  }
  
  function flipBoard() {
    invert = !invert
    lightBoard()
    if (ground) ground.toggleOrientation()
    // m.redraw()
  }
  function showInfluence() {
    // let defenders = SQUARES.map(s => {countSquareDefenders(fen, s)})
    // var oppositeColor = chess.turn() == 'w' ? 'b' : 'w'
    let fen = chess.fen()
    let defenders = calculateInfluence(fen)
    let attackers = calculateInfluence(fenForOtherSide(fen))
    
    console.log(fen, fenForOtherSide(fen), defenders, attackers)
    let colorMap = defenders.map((s, i) => {
      let v = s - attackers[i]
      // return v == 0 ? 0 : v > 0 ? GREEN[v] : RED[-v]
      let c = Math.min(v+5, 9)
      return COLORS[chess.turn() == color ? c : 10 - c]
    })
    if (invert == (color == 'b')) colorMap.reverse()
    lightMatrix(colorMap)
  }
  
  
  function onInput(message) {
    message = message.data
    console.log('input', message)
    if (message[2]) {
      const s = launchToN(message[1], invert)
      console.log('touched', s)
      const legal_moves = chess.moves({verbose:true})
      console.log('legal moves', legal_moves)
      if (square && squareToN(square) == s) {
        // clear selected piece
        selected, square = null
        lightBoard()
      } else if (chess.get(nToSquare(s)) && chess.get(nToSquare(s)).color == chess.turn()) {
        if (selected) {
          // clear other selected piece
          lightBoard()
        }
        console.log('selecting piece')
        console.log('checking', nToSquare(s), chess.get(nToSquare(s)))
        if (chess.get(nToSquare(s)) && (chess.get(nToSquare(s)).color == chess.turn())) {
          // select piece
          square = nToSquare(s)
          selected = chess.get(square)
          console.log('selected', selected)
          Midi.output.send(NOTE_ON | 1, [message[1], 21])
          piece_moves = chess.moves({square: square, verbose:true})
          console.log('possible moves', piece_moves)
          piece_moves.forEach((p, i) => {
            console.log(p)
            if (chess.get(p.to)) {
              // piece at square. flash green
              console.log('capture', nToLaunch(squareToN(p.to, invert)))
              Midi.output.send(NOTE_ON | 1, [nToLaunch(squareToN(p.to, invert)), 21])
            } else {
              console.log('regular move', p.to, squareToN(p.to), nToLaunch(squareToN(p.to, invert)))
              Midi.output.send(NOTE_ON | 2, [nToLaunch(squareToN(p.to)), 21])
            }
          })
        }
      } else if (selected) {
        // move selected to square
        
        const move = {from: square, to: nToSquare(s)}
        if (selected.type == 'p' && (selected.color == 'w' && s >> 3 == 7 ) || (selected.color == 'b' && s >> 3 == 0 )) {
          console.log('promotion! Auto promote to Queen')
          move.promotion = 'q'
        }
        console.log('checking if ', move, ' is legal')
        const squares = piece_moves.map(m => m.to)
        if (squares.includes(move.to)) {
          console.log('moving', move)
          chess.move(move)
          selected, square = null
          lightBoard()
          console.log(chess.board())
          // send to lichess api
          let move_uci = uci(move)
          auth('https://lichess.org/api/board/game/' + m.route.param('id') + '/move/' + move_uci, {
            method: 'post',
          }).then(e => {
            console.log('played move', move_uci, e)
          })
        } else {
          console.log('illegal move', move)
        }
      }
    }
    
  }
  function onCC(message) {
    message = message.data
    if (message[2]) {
      console.log('cc', message)
      switch (message[1]) {
        case 93: {
          // left arrow
          // undo move
          chess.undo()
          selected, square = null
          lightBoard()
          break
        }
        case 95: {
          // Session button
          // flip board
          flipBoard()
          break
        }
        case 98: {
          // Custom Midi
          // toggle square influence / game
          influence = !influence
          Midi.output.send(NOTE_ON, [98, influence ? 5 : 0])
          lightBoard()
          break
        }
      }
    }
  }
  function streamGame() {
    streamJson(LICHESS_API_URL + 'board/game/stream/' + m.route.param('id'),
    User.token, v => {
      console.log('calling back', v)
      if (v.type == 'gameFull') {
        game.gameFull = v
        // TODO: change to Stream()
        m.redraw()
        console.log('loading game', v.state.moves)
        if (v.black.id == User.profile.id) {
          // if playing black, flip board
          flipBoard()
          color = 'b'
        } else {
          color = 'w'
        }
      } else if (v.type == 'gameState') {
        console.log('move played', v.moves)
      }
      console.log('loaded?', chess.load_pgn(v.state.moves, {sloppy: true}))
      ground.set({
        fen: chess.fen(),
        movable: {
          color: chess.turn() == 'w' ? 'white' : 'black',
          dests: toDests(chess),
          events: { after: playOtherSide(chess, ground) }
        }
      })
      if (chess.history().length) {
        let hist = chess.history({verbose: true})
        let last = hist.pop()
        ground.set({
          lastMove: [last.from, last.to]
        })
      }
      lightBoard()
    })
  }
  function init() {
    console.log('connecting')
    if (!Midi.connected()) {
      Midi.init(onInput, onCC, () => {
        Midi.toggleLive()
        lightBoard()
      })
    }
  }
  return {
    oninit: vnode => {
      init()
    },
    view: vnode => {
      let status = Midi.connected() ? 'connected' : 'disconnected'
      return [
        m('.status', {class: status, title: status}, ''),
        m('i.material-icons', {
          title: status == 'connected' ? 'disconnect' : 'connect',
          onclick: e => {
            if (Midi.connected()) {
              console.log('disconnecting')
              Midi.close()
            } else {
              console.log('connecting')
              Midi.connect(onInput, onCC, () => {
                Midi.toggleLive()
                lightBoard()
              })
            }
          },
        }, Midi.connected() ? 'power_off' : 'power'),
        m('i.material-icons', {
          title: 'flip board',
          onclick: e => {
            flipBoard()
          }
        }, 'wifi_protected_setup'),
        game.gameFull ? m('', {}, JSON.stringify(invert ? game.gameFull.white : game.gameFull.black)) : null,
        m(Game, {
          fen: chess.fen(),
          config: {
            orientation: invert ? 'black' : 'white', 
            movable: {
              color: chess.turn() == 'w' ? 'white' : 'black',
               free: false}},
          oncreate: v => {
            ground = Chessground(v.dom, {fen: v.attrs.fen, ...v.attrs.config})
            ground.set({
              movable: { dests: toDests(chess), events: { after: playOtherSide(chess, ground) } }
            })
            streamGame()

          },
             }),
        game.gameFull ? m('', {}, JSON.stringify(invert ? game.gameFull.black : game.gameFull.white)) : null,
        
      ]
    }
  }
}
