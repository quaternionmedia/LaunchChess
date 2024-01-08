import m from 'mithril'
import { defaults, confirm, message } from 'alertifyjs'
import '../node_modules/alertifyjs/build/css/alertify.min.css'
import '../node_modules/alertifyjs/build/css/themes/semantic.css'
import './forms.css'

defaults.glossary.title = 'LaunchChess'
defaults.transition = 'zoom'
defaults.theme.ok = 'ui positive button'
defaults.theme.cancel = 'ui black button'
defaults.notifier.delay = 10

export function ProfilePage(state, actions) {
  return {
    view: vnode => {
      return [
        m(Profile, {}, state.user.profile),
        m(
          'i',
          {
            onclick: e => {
              confirm(
                'Are you sure you want to deauthorize this device?',
                affirm => {
                  actions.logout()
                  m.route.set('/')
                  message('logged out', 3)
                },
                deny => {
                  console.log('That was a close one!')
                }
              )
            },
          },
          'deauthorize this device'
        ),
      ]
    },
  }
}

export function Profile() {
  return {
    view: vnode => {
      return m(
        'table.profile',
        vnode.attrs,
        Object.keys(vnode.children[0]).map((k, i) => {
          // console.log(k, i)
          return m('tr.entry', {}, [
            m('td.key', {}, k),
            // m('td.seperator', {}, ' - '),
            m('td.value', {}, JSON.stringify(vnode.children[0][k])),
          ])
        })
      )
    },
  }
}
