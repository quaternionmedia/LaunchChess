import m from 'mithril'
import { Chessground } from 'chessground'
import '../node_modules/chessground/assets/chessground.base.css'
import '../node_modules/chessground/assets/chessground.brown.css'
import '../node_modules/chessground/assets/chessground.cburnett.css'



export const Board = (state, actions) => m('.board', {
  oncreate: vnode => {
    state.ground = new Chessground(vnode.dom, vnode.attrs.config || {})
  }})