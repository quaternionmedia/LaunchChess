import m from 'mithril'
import { User } from './User'
import { StatusIcon } from './Toolbar'
import { message } from 'alertifyjs'

export const Link = () => ({
  view: (vnode) => {
    return m('.menu-item', [
      m(m.route.Link, vnode.attrs, vnode.children)
    ])
  }
})

export const Links = state => [
  m(Link, {href:'/connect', id: 'connectButton'}, StatusIcon(state)),
  m(Link, {href:'/otb', id: 'otbButton'}, 'Local'),
  m(Link, {href:'/games', id: 'gamesButton'}, 'Online'),
  // ,
  User.username ? m(Link, {href: '/profile'}, User.username) : m(Link, {
      href:'/login',
      id: 'loginButton',
    }, 'Login'),
]

export const Menu = state => [
  m(Link, {href: '/'}, m('img.logo#logo', {src: '/static/logo.svg'})),
  Links(state),
]

export const Layout = state => ({
  view: vnode => {
    return m('main.layout', {}, [
      m('nav.menu', {}, Menu(state)),
      m('section#main', vnode.attrs),
    ])
  }
})