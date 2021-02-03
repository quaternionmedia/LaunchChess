import m from 'mithril'
import WebMidi from 'webmidi'
import { Board } from './Board'
import { Chess } from 'chess.js'

const deviceName = 'Launchpad X MIDI 2'
const NOTE_ON = 144
const CONTROL_CHANGE = 176

const colors = {'p': 13,'r': 9,'n': 45,'b': 37,'q': 53,'k': 49}

export function Connect() {
  var input, output, selected, square, piece_moves
  var connected, invert = false
  var chess = new Chess()
  
  
  function toggleLive() {
    connected = !connected
    output.sendSysex([0, 32, 41], [2, 12, 14, connected ? 1 : 0])
  }
  function connect() {
    input = WebMidi.getInputByName(deviceName)
    input.addListener('noteon', "all", onInput)
    input.addListener('controlchange', "all", onCC)
    output = WebMidi.getOutputByName(deviceName)
    console.log('connecting', input, output)
  }
  function close() {
    if (connected) toggleLive()
    input, output = null
    input.removeListener()
  }
  function init() {
    WebMidi.enable(function (err) {
      console.log(WebMidi.inputs)
      console.log(WebMidi.outputs)
      WebMidi.addListener("connected", function(e) {
        // console.log('midi connected', e, e.port.name)
        if (e.port.name == deviceName) {
          if (e.port.type == 'output') {
            output = e.port
            console.log('output', output)
            // output.playNote('F4')
            toggleLive()
            lightBoard()
            
          } else {
            input = e.port
            console.log('input', input)
            input.addListener('noteon', "all", onInput)
            input.addListener('controlchange', "all", onCC)
          }
          m.redraw()
        }
      })
      WebMidi.addListener("disconnected", function(e) {
        console.log('midi disconnected', e)
        if (e.port.name == deviceName) {
          if (e.port.type == 'output') {
            output = null
            connected = false
          } else {
            input = null
          }
          m.redraw()
        }
      })
      
      window.onunload = e => {
        console.log('unloading')
        close()
      }
    }, true)
  }
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
          output.send(NOTE_ON, [11+x+y*10, (x+y) % 2 == 0 ? 0 : 1])
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
        
        output.send(NOTE_ON, [l, piece ? (piece.color == 'w' ? c : c + 2) : c])
      }
      if (chess.history().length) {
        highlightMove()
        if (chess.history().length > 1)
        highlightMove(chess.history().length - 1)
      }
      output.send(NOTE_ON, [99, chess.turn() == 'w' ? 3 : 83])
    }
    function highlightMove(index=null) {
      var lastMove = chess.history({verbose:true})[index ? index : chess.history().length-1]
      if (lastMove) {
        var from_square = lastMove.from
        var to_square = lastMove.to
        console.log('highlighting', lastMove, from_square, to_square)
        if (! chess.get(from_square)) {
          output.send(NOTE_ON | 2, [nToLaunch(squareToN(from_square)), 70])
        }
        if (chess.get(to_square)) {
          output.send(NOTE_ON | 2, [nToLaunch(squareToN(to_square)), colors[chess.get(to_square).type]])
        }
        
        if (chess.in_check() && ! index) {
          console.log('check!', find_piece({type:'k', color: chess.turn() }))
          output.send(NOTE_ON | 1, [nToLaunch(find_piece({type:'k', color: chess.turn() })), 5])
        }
      }
      
    }
    function onInput(message) {
      message = message.data
      console.log('input', message)
      if (message[2]) {
        const s = launchToN(message[1])
        console.log('touched', s)
        const legal_moves = chess.moves({verbose:true})
        console.log('legal moves', legal_moves)
        if (selected != null) {
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
            console.log(chess.board())
            
          } else {
            console.log('illegal move', move)
          }
          lightBoard()
          selected = null
        } else {
          console.log('checking', nToSquare(s), chess.get(nToSquare(s)))
            if (chess.get(nToSquare(s)) && (chess.get(nToSquare(s)).color == chess.turn())) {
              // select piece
              square = nToSquare(s)
              selected = chess.get(square)
              console.log('selected', selected)
              output.send(NOTE_ON | 1, [message[1], 21])
              piece_moves = chess.moves({square: square, verbose:true})
              console.log('possible moves', piece_moves)
              piece_moves.forEach((p, i) => {
                console.log(p)
                if (chess.get(p.to)) {
                  // piece at square. flash green
                  console.log('capture', nToLaunch(squareToN(p.to)))
                  output.send(NOTE_ON | 1, [nToLaunch(squareToN(p.to)), 21])
                } else {
                  console.log('regular move', p.to, squareToN(p.to), nToLaunch(squareToN(p.to)))
                  output.send(NOTE_ON, [nToLaunch(squareToN(p.to)), 21])
                }
              })
          }
        }
    }
    
  }
  function onCC(message) {
    message = message.data
    if (message[2]) {
      console.log('cc', message)
    }
  }
    return {
      oninit: vnode => {
        init()
      },
      
      view: vnode => {
        return [
          m('.status', {class: input && output ? 'connected' : 'disconnected'}, ''),
          m('button.button', {
            onclick: e => {
              if (connected) {
                console.log('disconnecting')
                close()
                m.redraw()
              } else {
                console.log('connecting')
                connect()
                toggleLive()
                lightBoard()
                m.redraw()
              }
            },
          }, input && output ? 'disconnect' : 'connect')
        ]
      }
    }
  }
  
