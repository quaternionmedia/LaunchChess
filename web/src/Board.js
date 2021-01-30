import m from 'mithril'
import { Chessground } from 'chessground'
import './chessground.css'
import './chessground-brown.css'

export function Board() {
  var ground = null
  return {
    oncreate: vnode => {
      ground = Chessground(vnode.dom, {})
    },
    view: vnode => {
      return m('.board', {}, 'board')
    }
  }
}
