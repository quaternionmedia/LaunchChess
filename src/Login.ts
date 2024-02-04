import m from 'mithril'
import { Auth, oauth } from './Auth'
import { HttpClient, OAuth2AuthCodePKCE } from '@bity/oauth2-auth-code-pkce'
export const lichessHost = 'https://lichess.org'
export const scopes = ['board:play']
export const clientId = 'launchchess-client'
export const clientUrl = `${location.protocol}//${location.host}${location.pathname}`

export const actions = {
  initAuth: async ({ state }) => {
    // if (localStorage.getItem('me')) {
    //   update({ user: JSON.parse(localStorage.getItem('me')) })
    //   console.log('loaded user from localstorage', state.user)
    // }
    try {
      const accessContext = await oauth.getAccessToken()
      if (accessContext) await Auth.authenticate({ state })
    } catch (err) {
      console.error(err)
    }
    if (!state.user) {
      try {
        const hasAuthCode = await oauth.isReturningFromAuthServer()
        if (hasAuthCode) await Auth.authenticate({ state })
      } catch (err) {
        console.error(err)
      }
    }
    console.log('auth inited')
  },
  login: async ({ state, update }) => {
    console.log('logging in')
    Auth.login()
    console.log('logged in as: ', state.user.username)
    state.user.profile = await Auth.fetchBody('/oauth/profile')
    state.user.username = state.user.profile.username
  },
  logout: ({ state, update }) => {
    console.log('logging out')
    Auth.logout({ state, update })
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
