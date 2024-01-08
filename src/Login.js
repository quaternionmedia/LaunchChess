import m from 'mithril'

export const Login = (state, actions) => {
  return {
    oninit: vnode => {
      if (state.loggedIn()) {
        console.log('already logged in. Not sure how we got here.')
        m.route.set('/')
      }
    },
    view: vnode => {
      return m('', { onclick: actions.login }, m('i', {}, 'Login with lichess'))
    },
  }
}
