import m from 'mithril'
import { User } from './User'
import { StatusIcon } from './Toolbar'
import { message } from 'alertifyjs'
import { Switch } from 'construct-ui'

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
  m(Switch, {
    checked: state.theme,
    onclick: e => {
      console.log('switched', e)
      if (state.theme) {
        document.body.className = document.body.className.replace('dark', '')
        state.theme = null
      } else {
        state.theme = 'dark'
        document.body.className += state.theme
      }
    }}),
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