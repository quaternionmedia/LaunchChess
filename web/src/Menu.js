import m from 'mithril'
import { User } from './User'
import { message } from 'alertifyjs'
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
        // m(Link, {href:'/connect', id: 'connectButton'}, 'connect'),
        m(Link, {href:'/board', id: 'boardButton'}, 'board'),
        m(Link, {href:'/games', id: 'gamesButton'}, 'games'),
        // m('.status', {class: User.username ? 'connected' : 'disconnected'}, ''),
        User.username ? m(Link, {href: '/profile'}, User.username) : m(Link, {
            href:'/login',
            id: 'loginButton',
          }, 'login'),
      ]
    }
  }
}

export function Menu() {
  return {
    view: vnode => {
      return [m(Link, {href: '/'}, m('img.logo#logo', {src: '/static/logo.svg'})),
      m(Links),]
    }
  }
}

export const Layout = () => ({
    view: vnode => {
      return m('main.layout', {}, [
        m('nav.menu', {}, m(Menu)),
        m('section#main', vnode.attrs),
      ])
    }
})