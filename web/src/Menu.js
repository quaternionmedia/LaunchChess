import m from 'mithril'
import { User } from './User'

export function Link() {
  return {
    view: (vnode) => {
      return m('.menu-item', [
        m(m.route.Link, vnode.attrs, vnode.children)
      ])
    }
  }
}

export function Links() {
  return {
    view: vnode => {
      return [
        m(Link, {href:'/connect', id: 'connectButton'}, 'connect'),
        m(Link, {href:'/board', id: 'boardButton'}, 'board'),
        m(Link, {
            href:'/login',
            id: 'loginButton',
            onclick: vnode => {
              if (User.username) {
                message(`${User.username} logged out`)
                User.logout()
              }
            }
          }, User.username ? 'logout' : 'login'),
      ]
    }
  }
}

export function Menu() {
  return {
    view: vnode => {
      return [m(Link, {href: '/'}, 'magnus'),
      m(Links),]
    }
  }
}

export function Layout() {
  return {
    view: vnode => {
      return m('main.layout', {}, [
        m('nav.menu', {}, m(Menu)),
        m('section', vnode.attrs, vnode.children)
      ])
    }
  }
}