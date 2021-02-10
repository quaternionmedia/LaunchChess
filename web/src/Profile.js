import m from 'mithril'
import { User } from './User'
export function Profile() {
  return {
    view: vnode => {
      return [
        m('.profile', vnode.attrs, JSON.stringify(User.profile)),
        m('button.button', {onclick: e => {
          User.logout()
          m.route.set('/')
        }}, 'logout'),
      ]
    }
  }
}