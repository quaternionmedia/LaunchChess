import m from 'mithril'
import { Auth, oauth } from './Auth'
import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce'
export const lichessHost = 'https://lichess.org'
export const scopes = ['board:play']
export const clientId = 'launchchess-client'
export const clientUrl = `${location.protocol}//${location.host}${location.pathname}`

export const actions = {
  initAuth: async ({ state, update }) => {
    try {
      const accessContext = await oauth.getAccessToken()
      if (accessContext) await Auth.authenticate({ state, update })
    } catch (err) {
      console.error(err)
    }
    if (!state.user) {
      try {
        const hasAuthCode = await oauth.isReturningFromAuthServer()
        if (hasAuthCode) await Auth.authenticate({ state, update })
      } catch (err) {
        console.error(err)
      }
    }
    console.log('auth inited')
  },
  login: async ({ state, update }) => {
    console.log('logging in')
    await oauth.fetchAuthorizationCode()
  },
  logout: async ({ state, update }) => {
    console.log('logging out')
    if (state.user)
      await state.user.httpClient(`${lichessHost}/api/token`, {
        method: 'DELETE',
      })
    localStorage.clear()
    update({ user: undefined })
    window.localStorage.setItem('CREDENTIALS_FLUSH', Date.now().toString())
    window.localStorage.removeItem('CREDENTIALS_FLUSH')
  },
}

export const Login = cell =>
  m(
    'button',
    {
      onclick: () => actions.login(cell),
    },
    'Login with lichess'
  )

window.actions = actions
