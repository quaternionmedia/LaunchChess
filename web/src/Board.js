import m from 'mithril'
import { Chessground } from 'chessground'
import '../node_modules/chessground/assets/chessground.base.css'
import '../node_modules/chessground/assets/chessground.brown.css'
import '../node_modules/chessground/assets/chessground.cburnett.css'



export const Board = (state, actions) => ({
  oncreate: vnode => {
    state.ground = new Chessground(vnode.dom, vnode.attrs.config)
  },
  view: vnode => m('.board', {class: vnode.attrs.class, onclick: vnode.attrs.onclick})})