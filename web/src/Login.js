import m from 'mithril'

export const Login = () => {
  return {
    view: vnode => {
      return m('a', { href: '/oauth/' }, m('i', {}, 'Login with lichess'))
    },
  }
}
