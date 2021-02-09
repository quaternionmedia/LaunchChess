import m from 'mithril'
import { Layout } from './Menu'
import { Board } from './Board'
import { Connect } from './Connect'
import { Login } from './Login'
import './style.css'
import { User } from './User'
import { Games } from './Games'
import { Profile } from './Profile'

export function Home() {
  return {
    view: vnode => {
      return m('#home', {}, 'magnus')
    }
  }
}
console.log('magnus started!')

m.route(document.body, '/', {
  '/': { render: () => m(Layout, m(Home))},
  '/connect': { render: () => m(Layout, m(Connect))},
  '/games': { render: () => m(Layout, m(Games))},
  '/board': { render: () => m(Layout, m(Board))},
  '/login': { render: () => m(Layout, m(Login))},
  '/profile': { render: () => m(Layout, m(Profile))},

})

// auto login
if (!User.username) {
  m.request('/oauth/token').then(res => {
    if (res) {
      console.log('session continued', res)
      User.login(res)
    }
  })
}