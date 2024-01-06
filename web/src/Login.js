import m from 'mithril'
import { Auth } from './Auth'

export const Login = (state, actions) => {
  return {
    view: vnode => {
      return m('', { onclick: actions.login }, m('i', {}, 'Login with lichess'))
    },
  }
}

export const LoginActions = (state, actions) => ({
  login: () => {
    console.log('logging in')
    state.auth.login()
  },
  initLogin: () => {
    state.auth = new Auth()
    state.auth.init()
  }
})