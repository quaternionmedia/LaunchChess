import m from 'mithril'
import { User } from './User'
import { confirm, message } from 'alertifyjs'

export function ProfilePage() {
  return {
    view: vnode => {
      return [
        m('.profile', vnode.attrs, JSON.stringify(User.profile)),
        m('i', {onclick: e => {
          confirm('Are you sure you want to deauthorize this device?', affirm => {
            User.logout()
            m.route.set('/')
            message('logged out', 3)
          }, deny => {
            console.log('That was a close one!')
          })
          
        }}, 'deauthorize this device'),
      ]
    }
  }
}