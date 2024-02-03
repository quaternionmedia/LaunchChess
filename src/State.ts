import { Chess } from 'chess.js'
import { Chessground } from 'chessground'

export interface State {
  page: string
  login?: {
    username: string
    password: string
  }
  data?: string[] | string
  chess: Chess
  ground?: typeof Chessground
  orientation?: string
  fen?: string
  history?: string[]
  historyIndex?: number
  pgn?: string
  isHistoryCollapsed: boolean
  isFENCollapsed: boolean
  isPGNCollapsed: boolean
  isInfoCollapsed: boolean
}
