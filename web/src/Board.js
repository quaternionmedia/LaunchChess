import m from 'mithril'
import { Chessground } from 'chessground'
import './chessground.css'
import './chessground-brown.css'
import { Chess } from 'chess.js'

export function Board() {
  const chess = new Chess()
  var ground = null
  var config = {
    movable: {
      showDests: true,
    },
    events: {
      select: key => {
        console.log('selected', key)
        const moves = chess.moves({'square': key})
        console.log('legal moves', moves)
        
      }
    }
  }

  return {
    oncreate: vnode => {
      ground = Chessground(vnode.dom, config)
      
    },
    view: vnode => {
      return m('.board')
    }
  }
}
