import m from 'mithril'
import { Layout } from './Menu'
import { Board } from './Board'
import { Connect } from './Connect'
import { Login } from './Login'
import './style.css'


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
  '/board': { render: () => m(Layout, m(Board))},
  '/login': { render: () => m(Layout, m(Login))},

})
