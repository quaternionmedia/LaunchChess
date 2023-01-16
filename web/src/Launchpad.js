import { getPieceLocations } from './ChessMaths'
import { range } from './Actions'
import { findPath } from './utils'
import { COLORS } from './Color'

export const NOTE_ON = 144
export const CONTROL_CHANGE = 176

export const NOVATION = [0, 32, 41]

export const HEADERS = {
  LaunchpadX: [2, 12],
  LaunchpadMk2: [2, 24],
  LaunchpadPro: [2, 16],
  LaunchpadMini: [2, 14],
  LaunchpadMiniMk3: [2, 13],
  LaunchpadS: [32, 0],
}

export const NAMES = {
  'Launchpad MK2 MIDI 1': 'LaunchpadMk2',
  'Launchpad MK2': 'LaunchpadMk2',
  'Launchpad X MIDI 2': 'LaunchpadX',
  'Launchpad X LPX MIDI In': 'LaunchpadX',
  'Launchpad X LPX MIDI Out': 'LaunchpadX',
  'MIDIIN2 (LPX MIDI)': 'LaunchpadX',
  'MIDIOUT2 (LPX MIDI)': 'LaunchpadX',
  'Launchpad Mini In': 'LaunchpadMini',
  'Launchpad Mini Out': 'LaunchpadMini',
  'LPMiniMK3 MIDI In': 'LaunchpadMiniMk3',
  'LPMiniMK3 MIDI Out': 'LaunchpadMiniMk3',
}

export const Launchpad = (state, actions) => ({
  nToLaunch: n => {
    /** Convert a 0-63 chess square into a Launchpad MIDI number
     * @param {int} n - 0-63, chess square
     */
    if (state.invert()) {
      n = 63 - n
    }
    return 11 + (n >> 3) * 10 + (n % 8)
  },
  launchToN: l => {
    /** Convert a Launchpad MIDI number into 0-63 for chess squares.
     * @param {int} l - Launchpad MIDI number
     */
    if ((l - 11) % 10 == 8) {
      // fix for LaunchpadMk2 sending side buttons as NOTE_ON
      return null
    }
    const n = Math.floor((l - 11) / 10) * 8 + ((l - 11) % 10)
    return state.invert() ? 63 - n : n
  },
  squareToN: sq => {
    return (Number(sq[1]) - 1) * 8 + sq.charCodeAt(0) - 97
  },
  nToSquare: n => {
    return String.fromCharCode(97 + (n % 8), 49 + (n >> 3))
  },
  toggleLive: mode => {
    if (mode === true) {
      state.connected = true
    } else if (mode === false) {
      state.connected = false
    } else {
      state.connected = !state.connected
    }
    actions.sendSysex(NOVATION, [
      ...state.header,
      state.changeLayout,
      state.connected ? state.layout[1] : state.layout[0],
    ])
  },
  clear: () => {
    for (var i = 0; i < 64; i++) {
      actions.send(NOTE_ON, [actions.nToLaunch(i), 0])
    }
    state.top.forEach((b, i) => {
      actions.send(CONTROL_CHANGE, [b, 0])
    })
  },
  grid: () => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        actions.send(NOTE_ON, [11 + x + y * 10, (x + y) % 2 == 0 ? 0 : 1])
      }
    }
  },
  lightMatrix: m => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        actions.send(NOTE_ON, [11 + x + y * 10, m[x + y * 8]])
      }
    }
  },
  lightGame: (animate = false) => {
    const board = state.chess.board()
    for (let i = 0; i < 64; i++) {
      let piece
      let color = 0
      const l = actions.nToLaunch(i)

      if (board[(63 - i) >> 3][i % 8]) {
        piece = board[(63 - i) >> 3][i % 8]
        // console.log('piece at i', i, piece)
        if (state.pieces) {
          color = COLORS[piece.type]
          if (piece.color == 'b') color += 2
        } else if (state.grid) color = (i + (i >> 3)) % 2 == 0 ? 0 : 1
      } else {
        piece = null
        if (state.grid) color = (i + (i >> 3)) % 2 == 0 ? 0 : 1
      }

      // console.log(i, piece, l)

      // console.log(NOTE_ON, l, c)

      actions.send(NOTE_ON, [l, color])
    }
    let history = state.chess.history()
    for (let i = 0; i < Math.min(history.length, state.history()); i++) {
      actions.highlightMove(i, animate)
    }
  },
  highlightMove: (index, animate = false) => {
    let lastMove = state.chess.history({ verbose: true }).reverse()[index]
    if (lastMove) {
      console.log('lastmove ', lastMove)
      let from_square = lastMove.from
      let to_square = lastMove.to
      console.log('highlighting', lastMove, from_square, to_square)
      let path = findPath(from_square, to_square)
      path.push(path[path.length - 1])
      let piece = lastMove.piece
      let color = COLORS[piece]
      if (lastMove.color == 'b') color += 2
      if (animate) {
        actions.animatePath(path, color, 0)
      }
      if (state.chess.in_check()) {
        actions.highlightCheck()
      }
      if (state.chess.in_checkmate()) {
        actions.highlightCheckmate()
      }
    }
  },
  animatePath: (path, color, step) => {
    // console.log('animating path', path, step)
    let current = path.splice(step, 1)[0]
    path.forEach((square, i) => {
      actions.send(NOTE_ON | 2, [
        actions.nToLaunch(square.y * 8 + square.x),
        COLORS.moved,
      ])
    })
    actions.send(NOTE_ON | 2, [
      actions.nToLaunch(current.y * 8 + current.x),
      color,
    ])
    path.splice(step, 0, current)
    // console.log('path', path.length)
    state.animations.push(
      setTimeout(
        actions.animatePath,
        state.animationDuration,
        path,
        color,
        (step + 1) % path.length
      )
    )
  },
  clearAnimations: () => {
    state.animations.forEach((a, i) => {
      clearTimeout(a)
    })
  },
  highlightCheck: () => {
    let k = getPieceLocations(state.chess, {
      type: 'k',
      color: state.chess.turn(),
    })[0]
    console.log('check!', k)
    actions.send(NOTE_ON | 1, [
      actions.nToLaunch(actions.squareToN(k)),
      COLORS.check,
    ])
  },
  highlightCheckmate: () => {
    let k = getPieceLocations(state.chess, {
      type: 'k',
      color: state.chess.turn(),
    })[0]
    console.log('mate!', k)
    actions.send(NOTE_ON, [
      actions.nToLaunch(actions.squareToN(k)),
      COLORS.check,
    ])
  },
  highlightAvailableMoves: square => {
    let s = actions.nToLaunch(actions.squareToN(square))
    console.log('highlighting', square, s, actions.squareToN(square))
    actions.send(NOTE_ON | 1, [s, COLORS.movable])
    let piece_moves = state.chess.moves({ square: square, verbose: true })
    console.log('possible moves', piece_moves)
    piece_moves.forEach((p, i) => {
      // console.log(p)
      if (state.chess.get(p.to)) {
        // piece at square. flash green
        // console.log('capture', actions.nToLaunch(actions.squareToN(p.to)))
        actions.send(NOTE_ON | 1, [
          actions.nToLaunch(actions.squareToN(p.to)),
          COLORS.movable,
        ])
      } else {
        // console.log('regular move', p.to, actions.squareToN(p.to), actions.nToLaunch(actions.squareToN(p.to)))
        actions.send(NOTE_ON | 2, [
          actions.nToLaunch(actions.squareToN(p.to)),
          COLORS.movable,
        ])
      }
    })
  },
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
    ...LaunchpadMk2(state, actions),
  }
}

export const LaunchpadMk2 = (state, actions) => {
  state.top = range(104, 9)
  state.header = [2, 24]
  state.changeLayout = 34
  state.layout = [0, 0]
  return {
    ...Launchpad(state, actions),
  }
}

export const LaunchpadMiniMk3 = (state, actions) => {
  state.changeLayout = 14
  state.layout = [0, 1]
  return {
    ...Launchpad(state, actions),
  }
}

export const Launchpad1 = (state, actions) => ({
  ...Launchpad(state, actions),
  nToLaunch: n => {
    /** Convert a 0-63 chess square into a Launchpad MIDI number
     * @param {int} n - 0-63, chess square
     */
    if (state.invert()) return 8 - (n % 8) + (n >> 3) * 16
    else return 112 + (n % 8) - (n >> 3) * 16
  },
  launchToN: l => {
    /** Convert a Launchpad MIDI number into 0-63 for chess squares.
     * The original Launchpad uses a different grid numbering system than mk2+ Launchpads
     * @param {int} l - Launchpad MIDI number
     */
    if (state.invert()) return Math.floor(l / 16) * 8 + 7 - (l % 8 >> 3)
    else return (7 - Math.floor(l / 16)) * 8 + (l % 8 >> 3)
  },
  toggleLive: mode => {
    if (mode === true) {
      state.connected = true
    } else if (mode === false) {
      state.connected = false
    } else {
      state.connected = !state.connected
    }
    actions.send(CONTROL_CHANGE, [0, state.connected ? 1 : 2])
  },
  lightMatrix: m => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        actions.send(NOTE_ON, [actions.nToLaunch(x + y * 8), m[x + y * 8]])
      }
    }
  },
})

export const Launchpads = {
  Launchpad: Launchpad1,
  LaunchpadS: Launchpad1,
  LaunchpadMk2: LaunchpadMk2,
  LaunchpadX: LaunchpadX,
  LaunchpadMini: LaunchpadMini,
  LaunchpadMiniMk3: LaunchpadMiniMk3,
  LaunchpadPro: LaunchpadPro,
}
