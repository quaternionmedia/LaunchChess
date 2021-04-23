import { getPieceLocations } from './ChessMaths'

export const NOTE_ON = 144
export const CONTROL_CHANGE = 176

export const NOVATION = [0, 32, 41]

export const HEADERS = {
  LaunchpadX: [2, 12],
  LaunchpadMk2: [2, 24],
  LaunchpadPro: [2, 16],
  LaunchpadMini: [2, 14],
  // LaunchpadS: [9],
  LaunchpadS: [32, 0],
}

const colors = {'p': 13,'r': 9,'n': 45,'b': 37,'q': 53,'k': 49}

export const Launchpad = (state, actions) => ({

  nToLaunch: n => {
    // 0-63 mapped to launchpad notes
    if (state.invert) {
      n = 63 - n
    }
    return 11 + (n>>3)*10 + n%8
  },
  launchToN: l => {
    // launchpad note mapped to 0-63
    const n = Math.floor((l-11)/ 10)*8 + (l-11) % 10
    return state.invert ? 63 - n : n
  },
  squareToN: sq => {
    return (Number(sq[1]) - 1)*8 + sq.charCodeAt(0) - 97
  },
  nToSquare: n => {
    return String.fromCharCode(97+(n%8), 49+(n>>3))
  },
  toggleLive: (mode) => {
    if (mode === true) {
      state.connected = true
    } else if (mode === false) {
      state.connected = false
    } else {
      state.connected = !state.connected
    }
    state.output.sendSysex(NOVATION, [...state.header, state.changeLayout, state.connected ? state.layout[1] : state.layout[0]])
  },
  grid: () => {
    for (let y=0; y<8; y++) {
      for (let x=0; x<8; x++) {
        state.output.send(NOTE_ON, [11+x+y*10, (x+y) % 2 == 0 ? 0 : 1])
      }
    }
  },
  lightMatrix: m => {
    for (let y=0; y<8; y++) {
      for (let x=0; x<8; x++) {
        state.output.send(NOTE_ON, [11+x+y*10, m[x+y*8]])
      }
    }
  },
  lightGame: () => {
    const board = state.chess.board()
    for (let i=0; i<64; i++) {
      let piece
      let color = 0
      const l = actions.nToLaunch(i)
      
      if (board[(63-i) >> 3][i % 8]) {
        piece = board[(63-i) >> 3][i % 8]
        // console.log('piece at i', i, piece)
        if (state.pieces) {
          color = colors[piece.type]
          if (piece.color == 'b') color += 2
        } else if (state.grid) color = (i + (i >> 3)) % 2 == 0 ? 0 : 1
      } else {
        piece = null
        if (state.grid) color = (i + (i >> 3)) % 2 == 0 ? 0 : 1
      }
      
      // console.log(i, piece, l)
      
      // console.log(NOTE_ON, l, c)
      
      state.output.send(NOTE_ON, [l, color])
    }
    let history = state.chess.history()
      for (let i=0; i<Math.min(history.length, state.history()); i++) {
        actions.highlightMove(i)
    }
  },
  highlightMove: index => {
    let lastMove = state.chess.history({verbose:true}).reverse()[index]
    if (lastMove) {
      let from_square = lastMove.from
      let to_square = lastMove.to
      console.log('highlighting', lastMove, from_square, to_square)
      if (! state.chess.get(from_square)) {
        // if no piece currently on from square, send flashing neutral
        state.output.send(NOTE_ON | 2, [actions.nToLaunch(actions.squareToN(from_square)), 70])
      }
      if (state.chess.get(to_square)) {
        // if there is a piece, send flashing piece color
        let c = colors[state.chess.get(to_square).type]
        state.output.send(NOTE_ON | 2, [actions.nToLaunch(actions.squareToN(to_square)), state.chess.get(to_square).color == 'w' ? c : c + 2])
      }
      
      if (state.chess.in_check()) {
        let k = getPieceLocations(state.chess, {type:'k', color: state.chess.turn() })[0]
        console.log('check!', k)
        state.output.send(NOTE_ON | 1, [actions.nToLaunch(actions.squareToN(k)), 5])
      }
      if (state.chess.in_checkmate()) {
        let k = getPieceLocations(state.chess, {type:'k', color: state.chess.turn() })[0]
        console.log('mate!', k)
        state.output.send(NOTE_ON, [actions.nToLaunch(actions.squareToN(k)), 5])
      }
    }
    
  },
  highlightAvailableMoves: square => {
    let s = actions.nToLaunch(actions.squareToN(square))
    console.log('highlighting', square, s, actions.squareToN(square))
    state.output.send(NOTE_ON | 1, [s, 21])
    let piece_moves = state.chess.moves({square: square, verbose:true})
    console.log('possible moves', piece_moves)
    piece_moves.forEach((p, i) => {
      console.log(p)
      if (state.chess.get(p.to)) {
        // piece at square. flash green
        console.log('capture', actions.nToLaunch(actions.squareToN(p.to)))
        state.output.send(NOTE_ON | 1, [actions.nToLaunch(actions.squareToN(p.to)), 21])
      } else {
        console.log('regular move', p.to, actions.squareToN(p.to), actions.nToLaunch(actions.squareToN(p.to)))
        state.output.send(NOTE_ON | 2, [actions.nToLaunch(actions.squareToN(p.to)), 21])
      }
    })
  }

})

export const LaunchpadX = (state, actions) => {
  state.header = [2, 12]
  state.changeLayout = 14
  state.layout = [0, 1]
  return {
  ...Launchpad(state, actions),
  }
}

export const LaunchpadPro = (state, actions) => {
  state.header = [2, 16]
  state.changeLayout = 44
  state.layout = [0, 3]
  return {
  ...Launchpad(state, actions),
  }
}

export const LaunchpadMini = (state, actions) => {
  state.header = [2, 13]
  state.changeLayout = 14
  state.layout = [0, 1]
  return {
  ...Launchpad(state, actions),
  }
}

export const LaunchpadMk2 = (state, actions) => {
  state.header = [2, 24]
  state.changeLayout = 22
  state.layout = [0, 2]
  return {
  ...Launchpad(state, actions),
  }
}

export const Launchpad1 = (state, actions) => ({
  ...Launchpad(state, actions),
  nToLaunch: n => {
    if (state.invert) return 8 - (n % 8) + (n >> 3)*16
    else return 112 + (n % 8) - (n >> 3)*16
  },
  launchToN: l => {
    if (state.invert) return (Math.floor(l/16) )*8 + 7 - ( (l % 8) >> 3 )
    else return (7 - Math.floor(l/16) )*8 + ( (l % 8) >> 3 )
  },
  toggleLive: (mode) => {
    if (mode === true) {
      state.connected = true
    } else if (mode === false) {
      state.connected = false
    } else {
      state.connected = !state.connected
    }
    state.output.send(CONTROL_CHANGE, [0, state.connected ? 1 : 2])
  }
})


export const Launchpads = {
  LaunchpadX: LaunchpadX,
  LaunchpadPro: LaunchpadPro,
  LaunchpadMini: LaunchpadMini,
  LaunchpadMk2: LaunchpadMk2,
  Launchpad: Launchpad1,
  LaunchpadS: Launchpad1,
}