import m from 'mithril'
import WebMidi from 'webmidi'
import { Board } from './Board'
import { Chess } from 'chess.js'

const deviceName = 'Launchpad X MIDI 2'
const NOTE_ON = 144

const colors = {'': 0,'P': 13,'R': 9,'N': 45,'B': 37,'K': 49,'Q': 53,'p': 15,'r': 11,'n': 47,'b': 39,'q': 55,'k': 51}

export function Connect() {
  var input, output
  var connected, invert = false
  var chess = new Chess()
  
  
  function toggleLive() {
    connected = !connected
    output.sendSysex([0, 32, 41], [2, 12, 14, connected ? 1 : 0])
  }
  function connect() {
    input = WebMidi.getInputByName(deviceName)
    input.addListener('noteon', "all", onInput)
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
    return [].concat(...chess.board()).map((p, index) => {
      if (p !== null && p.type === piece.type && p.color === piece.color) {
        return index
      }})
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
    function grid() {
      for (var y=0; y<8; y++) {
        for (var x=0; x<8; x++) {
          output.send(NOTE_ON, [11+x+y*10, (x+y) % 2 == 0 ? 0 : 1])
        }
      }
    }
    function lightBoard() {
      for (var i=0; i< 64; i++) {
        if (chess.board()[i >> 3][i % 8]) {
          var piece = chess.board()[i >> 3][i % 8]
          console.log('piece at i', i, piece)
        } else {
          var piece = null
        }
        var l = nToLaunch(i)
        console.log(i, piece, l)
        console.log(NOTE_ON, l, piece ? colors[piece.type] : (i + (i >> 3)) % 2 == 0 ? 0 : 1)
        
        output.send(NOTE_ON, [l, piece ? colors[piece.type] : (i + (i >> 3)) % 2 == 0 ? 0 : 1])
      }
      if (chess.history().length) {
        highlightMove()
        if (chess.history().length > 1)
        highlightMove(chess.history().length - 1)
      }
      output.send(NOTE_ON, [99, chess.turn() == 'w' ? 3 : 83])
    }
    function highlightMove(index=null) {
      var lastMove = chess.history()[index ? index : chess.history().length-1]
      if (lastMove) {
        var from_square = lastMove.from
        var to_square = lastMove.to
        if (! chess.get(from_square)) {
          output.send(NOTE_ON | 2, [nToLaunch(from_square), 70])
        }
        if (chess.get(to_square)) {
          output.send(NOTE_ON | 2, [nToLaunch(to_square), colors[chess.get(to_square).type]])
        }
        
        if (chess.in_check()) {
          output.send(NOTE_ON | 1, [nToLaunch(find_piece({type:'k', color: chess.turn() })), 5])
        }
      }
      
    }
    function onInput(message) {
      message = message.data
      console.log('input', message)
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
  
