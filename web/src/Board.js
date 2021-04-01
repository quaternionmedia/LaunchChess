import m from 'mithril'
import { Chessground } from 'chessground'
import './chessground.css'
import './chessground-brown.css'
import { Chess } from 'chess.js'
import { toDests, toColor, playOtherSide } from './utils'

export function Board() {
  let chess = new Chess()
  let ground = null
  let config = {
    movable: {
      color: 'white',
      free: false,
      dests: toDests(chess),
    },
    draggable: {
        showGhost: true
      },
  }

  return {
    oncreate: vnode => {
      ground = Chessground(vnode.dom, config)
      ground.set({
        movable: { events: { after: playOtherSide(chess, ground) } }
      })
      
    },
    view: vnode => {
      return m('.board', vnode.attrs)
    }
  }
}
