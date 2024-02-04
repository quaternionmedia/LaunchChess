import m from 'mithril'
import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce';
import { readStream } from './ndJsonStream';
export const lichessHost = 'https://lichess.org'
export const scopes = ['board:play']
export const clientId = 'launchchess-client'
export const clientUrl = `${location.protocol}//${location.host}${location.pathname}`

export interface Me {
  id: string
  username: string
  httpClient: HttpClient // with pre-set Authorization header
  perfs: { [key: string]: any }
}
export const oauth = new OAuth2AuthCodePKCE({
  authorizationUrl: `${lichessHost}/oauth`,
  tokenUrl: `${lichessHost}/api/token`,
  clientId,
  scopes,
  redirectUrl: clientUrl,
  onAccessTokenExpiry: refreshAccessToken => {
    console.log('Expired! Access token needs to be renewed.')
    return refreshAccessToken()
  },
  onInvalidGrant: console.warn,
})
export const Auth = {
  login: async () => {
    await oauth.fetchAuthorizationCode()
  },

  logout: async ({ state, update }) => {
    if (state.user)
      await state.user.httpClient(`${lichessHost}/api/token`, {
        method: 'DELETE',
      })
    localStorage.clear()
    update({ user: undefined })
  },

  authenticate: async ({ state }) => {
    const httpClient = oauth.decorateFetchHTTPClient(window.fetch)
    const res = await httpClient(`${lichessHost}/api/account`)
    if (res.error) throw res.error
    const profile = await res.json()
    const me = {
      username: profile.username,
      profile,
      httpClient,
    }
    state.user = me
    // state.loggedIn(true)
    localStorage.setItem('me', JSON.stringify(me))
    console.log('Authenticated as', me.username)
    // await actions.getGames()
    m.redraw()
  },

  openStream: async (path: string, config: any, handler: (_: any) => void) => {
    const stream = await state.auth.fetchResponse(path, config)
    return readStream(`STREAM ${path}`, stream, handler)
  },

  fetchBody: async (path: string, config: any = {}) => {
    const res = await state.auth.fetchResponse(path, config)
    const body = await res.json()
    return body
  },

  fetchResponse: async (path: string, config: any = {}) => {
    const res = await(state.user.httpClient || window.fetch)(
      `${lichessHost}${path}`,
      config
    )
    if (res.error || !res.ok) {
      const err = `${res.error} ${res.status} ${res.statusText}`
      alert(err)
      throw err
    }
    return res
  },
}
