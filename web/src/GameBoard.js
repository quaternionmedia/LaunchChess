import m from 'mithril'
import { Game } from './Games'

export const GameBoard = (state, actions) => ({
  view: vnode => m(Game(state, actions), state.game ? {config: { 
      fen: state.game.fen,
      orientation: state.game.color,
    }
  } : null)
})