import { Chess } from 'chess.js'
import { Chessground } from 'chessground'
import { HttpClient } from '@bity/oauth2-auth-code-pkce'

export interface State {
  page: string

  // Chess
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

  // User
  user?: {
    username: string
    profile: Object
    httpClient: HttpClient
  }
  // MIDI
  midi?: {
    input?: string
    output?: string
    inputs?: string[]
    outputs?: string[]
  }
}
