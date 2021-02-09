import m from 'mithril'
import { Board } from './Board'
import { Chess } from 'chess.js'
import { Midi } from './Midi'
import { fetcher } from './ndjson'
import { LICHESS_API_URL } from './config'
import { User, auth } from './User'
import { Game } from './Games'
import { Chessground } from 'chessground'

import '../node_modules/material-design-icons-iconfont/dist/material-design-icons.css'

const NOTE_ON = 144
const CONTROL_CHANGE = 176

const colors = {'p': 13,'r': 9,'n': 45,'b': 37,'q': 53,'k': 49}
export const uci = move => {
  let uci = move.from + move.to
  if (move.promotion) {
    uci += move.promotion
  }
  return uci
}
export function Connect() {
  var selected, square, piece_moves
  var invert = false
  var chess = new Chess()
  var game, ground

  
  const find_piece = piece => {
    var index = null
    chess.board().map((rank, r) => {
      rank.map((p, f) => {
        if (p != null && p.type == piece.type && p.color == piece.color) {
          console.log('found piece', p, r, f)
          index = (7-r)*8+f
        }
      })
    })  
    return index
  }
  
  function nToLaunch(n) {
    // 0-63 mapped to launchpad notes
    if (invert) {
      n = 63 - n
    }
    return 11 + (n>>3)*10 + n%8
  }
  function launchToN(n) {
    // launchpad note mapped to 0-63
    const s = Math.floor((n-11)/ 10)*8 + (n-11) % 10
    return invert ? 63 - s : s
  }
  function squareToN(sq) {
    return (Number(sq[1]) - 1)*8 + sq.charCodeAt(0) - 97
  }
  function nToSquare(n) {
    return String.fromCharCode(97+(n%8), 49+(n>>3))
  }
  function grid() {
    for (var y=0; y<8; y++) {
      for (var x=0; x<8; x++) {
        Midi.output.send(NOTE_ON, [11+x+y*10, (x+y) % 2 == 0 ? 0 : 1])
      }
    }
  }
  function lightBoard() {
    const board = chess.board()
    for (let i=0; i<64; i++) {
      if (board[(63-i) >> 3][i % 8]) {
        var piece = board[(63-i) >> 3][i % 8]
        // console.log('piece at i', i, piece)
      } else {
        var piece = null
      }
      const l = nToLaunch(i)
      // console.log(i, piece, l)
      const c = piece ? colors[piece.type] : (i + (i >> 3)) % 2 == 0 ? 0 : 1
      // console.log(NOTE_ON, l, c)
      
      Midi.output.send(NOTE_ON, [l, piece ? (piece.color == 'w' ? c : c + 2) : c])
    }
    let history = chess.history()
    if (history.length) {
      highlightMove(history.length-1)
      if (history.length > 1) {
        highlightMove(history.length-2)
      }
    }
    Midi.output.send(NOTE_ON, [99, chess.turn() == 'w' ? 3 : 83])
  }
  function highlightMove(index) {
    var lastMove = chess.history({verbose:true})[index]
    if (lastMove) {
      var from_square = lastMove.from
      var to_square = lastMove.to
      console.log('highlighting', lastMove, from_square, to_square)
      if (! chess.get(from_square)) {
        Midi.output.send(NOTE_ON | 2, [nToLaunch(squareToN(from_square)), 70])
      }
      if (chess.get(to_square)) {
        let c = colors[chess.get(to_square).type]
        Midi.output.send(NOTE_ON | 2, [nToLaunch(squareToN(to_square)), chess.get(to_square).color == 'w' ? c : c + 2])
      }
      
      if (chess.in_check()) {
        let k = find_piece({type:'k', color: chess.turn() })
        console.log('check!', k)
        Midi.output.send(NOTE_ON | 1, [nToLaunch(k), 5])
      }
      if (chess.in_checkmate()) {
        let k = find_piece({type:'k', color: chess.turn() })
        console.log('mate!', k)
        Midi.output.send(NOTE_ON, [nToLaunch(k), 5])
      }
    }
    
  }
  function flipBoard() {
    invert = !invert
    lightBoard()
    ground.toggleOrientation()
    m.redraw()
  }
  function onInput(message) {
    message = message.data
    console.log('input', message)
    if (message[2]) {
      const s = launchToN(message[1])
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
              console.log('capture', nToLaunch(squareToN(p.to)))
              Midi.output.send(NOTE_ON | 1, [nToLaunch(squareToN(p.to)), 21])
            } else {
              console.log('regular move', p.to, squareToN(p.to), nToLaunch(squareToN(p.to)))
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
      }
    }
  }
  function init() {
    console.log('connecting')
    Midi.init(onInput, onCC, () => {
      Midi.toggleLive()
      lightBoard()
      m.redraw()
    })
  }
  return {
    oninit: vnode => {
      init()
    },
    view: vnode => {
      return [
        m('.status', {class: Midi.input && Midi.output ? 'connected' : 'disconnected'}, ''),
        m('button.button', {
          onclick: e => {
            if (Midi.connected) {
              console.log('disconnecting')
              Midi.close()
              m.redraw()
            } else {
              console.log('connecting')
              Midi.connect(onInput, onCC, () => {
                Midi.toggleLive()
                lightBoard()
                m.redraw()
              })
            }
          },
        }, Midi.input && Midi.output ? 'disconnect' : 'connect'),
        m('i.material-icons', {
          title: 'flip board',
          onclick: e => {
            flipBoard()
          }
        }, 'wifi_protected_setup'),
        game ? m('', {}, JSON.stringify(invert ? game.white : game.black)) : null,
        User.token ? m(fetcher, {
          style: {display: 'none',},
          endpoint: LICHESS_API_URL + 'board/game/stream/' + m.route.param('id'),
          token: User.token,
          callback: v => {
            console.log('calling back', v)
            if (v.type == 'gameFull') {
              game = v
              console.log('loading game', v.state.moves)
              console.log('loaded?', chess.load_pgn(v.state.moves, {sloppy: true}))
              if (v.black.id == 'mr_harpo') {
                invert = true
              }
              // ground.set({fen:chess.fen()})
              lightBoard()
              m.redraw()
            } else if (v.type == 'gameState') {
              console.log('move played', v.moves)
              chess.load_pgn(v.moves, {sloppy: true})
              lightBoard()
              m.redraw()
            }
          }
        }) : null,
        m('.board', {
          // fen: chess.fen(), 
          viewOnly: true,
          highlight: {
            lastMove: true,
            check: true,
          },
          oncreate: v => {
            ground = Chessground(v.dom, v.attrs)
            ground.set({fen:chess.fen()})
          },
          onupdate: v => {
            console.log('updating board', v)
            ground.set({fen:chess.fen()})
            if (chess.history().length) {
              let hist = chess.history({verbose: true})
              let last = hist.pop()
              console.log('highlighting chessground last move', hist, last, [last.from, last.to])
              ground.set({lastMove: [last.from, last.to]})
            }
          }
        }),
        game ? m('', {}, JSON.stringify(invert ? game.black : game.white)) : null,

      ]
    },
    onremove: vnode => {
      Midi.close()
    }
  }
}

