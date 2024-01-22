import m from 'mithril'
import { Auth } from './Auth'


export const UserActions = (state, actions) => ({
  login: async token => {
    console.log('logging in')
    state.auth.login()
    console.log('logged in as: ', state.user.username)
    state.loggedIn(true)
    if (m.route.param('redirect')) {
      m.route.set(m.route.param('redirect'))
    } else if (m.route.get() == '/login') {
      m.route.set('/')
    }
    // m.redraw()
    state.user.profile = await state.auth.fetchBody('/oauth/profile')
    state.user.username = state.user.profile.username
  },
  logout: () => {
    console.log('logging out')
    state.auth.logout()
    state.user.username = null
    state.loggedIn(false)
    window.localStorage.setItem('CREDENTIALS_FLUSH', Date.now().toString())
    window.localStorage.removeItem('CREDENTIALS_FLUSH')
    // m.redraw()
  },
  initAuth: async () => {
    if (localStorage.getItem('me')) {
      state.user = JSON.parse(localStorage.getItem('me'))
      console.log('loaded user from localstorage', state.user)
    }
    state.auth = Auth(state, actions)
    await state.auth.init()
    console.log('auth inited')
  }
})
