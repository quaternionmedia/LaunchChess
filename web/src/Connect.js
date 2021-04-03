import m from 'mithril'
import { Game, game } from './Games'
import { Chess } from 'chess.js'
import { Midi, NOTE_ON, CONTROL_CHANGE } from './Midi'
import { streamJson } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { Chessground } from 'chessground'
import { SQUARES, calculateInfluence, fenForOtherSide, makeDests, uci } from './ChessMaths'
import { nToLaunch, launchToN, squareToN, nToSquare, grid, lightMatrix, lightGame, highlightMove, highlightAvailableMoves } from './Launchpad'
import { toDests, toColor, playOtherSide } from './utils'

import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'


// let GREEN = [ 123, 23, 64, 22, 76, 87, 21, 122 ]
// let RED = [121, 7, 106, 6, 120, 5]
// let BLUE = [47, 46, 45, ]
export const COLORS = [5, 121, 9, 11, 15, 1, 23, 37, 45, 49, 69]

export function Connect() {
  let selected, selectedSquare
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
    // if (ground) 
    ground.toggleOrientation()
    // m.redraw()
  }
  function showInfluence() {
    let fen = chess.fen()
    let defenders = calculateInfluence(fen)
    let attackers = calculateInfluence(fenForOtherSide(fen))
    
    console.log(fen, fenForOtherSide(fen), defenders, attackers)
    let colorMap = defenders.map((s, i) => {
      let v = s - attackers[i]
      let c = Math.min(v+5, 9)
      return COLORS[chess.turn() == color ? c : 10 - c]
    })
    if (invert == (color == 'w')) colorMap.reverse()
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
      if (selectedSquare && squareToN(selectedSquare) == s) {
        // clear selected piece
        selected, selectedSquare = null
        lightBoard()
        ground.selectSquare(null)
      } else if (chess.get(nToSquare(s)) && chess.get(nToSquare(s)).color == chess.turn()) {
        if (selected) {
          // clear other selected piece
          lightBoard()
          // ground.selectSquare(null)
        }
        console.log('checking', nToSquare(s), chess.get(nToSquare(s)))
        if (chess.get(nToSquare(s)) && (chess.get(nToSquare(s)).color == chess.turn())) {
          // select piece
          selected = true
          selectedSquare = nToSquare(s)
          ground.selectSquare(selectedSquare)
          highlightAvailableMoves(chess, selectedSquare, invert)
        }
      } else if (selected) {
        // move selected to square
        
        const move = {from: selectedSquare, to: nToSquare(s)}
        if (selected.type == 'p' && (selected.color == 'w' && s >> 3 == 7 ) || (selected.color == 'b' && s >> 3 == 0 )) {
          console.log('promotion! Auto promote to Queen')
          move.promotion = 'q'
        }
        console.log('checking if ', move, ' is legal')
        const squares = chess.moves({square: selectedSquare, verbose: true}).map(m => m.to)
        if (squares.includes(move.to)) {
          makeMove(move)
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
          selected, selectedSquare = null
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
      User.token, 
      v => {
      console.log('calling back', v)
      if (v.type == 'gameFull') {
        game.gameFull = v
        // TODO: change to Stream()
        // m.redraw()
        console.log('loading game', v.state.moves)
        console.log('loaded?', chess.load_pgn(v.state.moves, {sloppy: true}))
        if (v.black.id == User.profile.id) {
          // if playing black, flip board
          flipBoard()
          color = 'b'
        } else {
          color = 'w'
        }
      } else if (v.type == 'gameState') {
        console.log('move played', v.moves)
        console.log('loaded?', chess.load_pgn(v.moves, {sloppy: true}))

      }
      let turn = chess.turn() == 'w' ? 'white' : 'black'
      console.log('updated. turn is', turn)
      ground.set({
        fen: chess.fen(),
        turnColor: toColor(chess),
        movable: {
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
  function makeMove(move) {
      console.log('moving', move)
      chess.move(move)
      selected, selectedSquare = null
      lightBoard()
      console.log(chess.board())
      // send to lichess api
      let move_uci = uci(move)
      auth('https://lichess.org/api/board/game/' + m.route.param('id') + '/move/' + move_uci, {
        method: 'post',
      }).then(e => {
        console.log('played move', move_uci, e)
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
        m('.board.fullscreen', {
          // fen: chess.fen(),
          // config: ,
          oncreate: v => {
            ground = Chessground(v.dom, {fen: v.attrs.fen,
              orientation: invert ? 'black' : 'white',
              premovable: {
                enabled: false
              },
              movable: {
                 free: false
              },
              events: {
                select: key => {
                  console.log('chessground selected', key)
                  //clear previous selection
                  lightBoard()
                  selected = true
                  selectedSquare = key
                  highlightAvailableMoves(chess, key, invert)
                },
                move: (orig, dest, captured) => {
                  console.log('chessground moved', orig, dest, captured)
                  ground.move(orig, dest)
                  makeMove({from: orig, to: dest})
                }
              }
            })
            
            let c = game.isMyTurn ? game.color : game.color == 'white' ? 'black' : 'white'
            console.log('my color', c)
            ground.set({
              movable: { 
                dests: toDests(chess), events: { after: playOtherSide(chess, ground) },
                color: c,
              }
            })
            streamGame()

          },
             }),
        game.gameFull ? m('', {}, JSON.stringify(invert ? game.gameFull.black : game.gameFull.white)) : null,
        
      ]
    }
  }
}
