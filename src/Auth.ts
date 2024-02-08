import m from 'mithril'
import { User } from './State'
import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce'
import { readStream } from './ndJsonStream'
export const lichessHost = 'https://lichess.org'
export const scopes = ['board:play']
export const clientId = 'launchchess-client'
export const clientUrl = `${location.protocol}//${location.host}${location.pathname}`

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
  authenticate: async ({ state, update }) => {
    const httpClient = oauth.decorateFetchHTTPClient(window.fetch)
    const res = await httpClient(`${lichessHost}/api/account`)
    if (res.error) throw res.error
    const profile = await res.json()
    const me: User = {
      id: profile.id,
      username: profile.username,
      profile,
      httpClient,
    }
    update({ user: me })
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
    const res = await (state.user.httpClient || window.fetch)(
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
