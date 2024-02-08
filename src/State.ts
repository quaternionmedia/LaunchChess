import { Chess } from 'chess.js'
import { Chessground } from 'chessground'
import { HttpClient } from '@bity/oauth2-auth-code-pkce'


export interface User {
  id: string
  username: string
  httpClient: HttpClient // with pre-set Authorization header
  profile: Object
}

export interface Launchpad {
  name: string
  input: string
  output: string
  type: string
}

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
  user?: User

  // MIDI
  midi?: {
    input?: string
    output?: string
    inputs?: string[]
    outputs?: string[]
    launchpads?: { [id: string]: Launchpad }
  }
}
