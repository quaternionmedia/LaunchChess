import m from 'mithril'


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
        m(Link, {href:'/connect', id: 'connect'}, 'connect'),
        m(Link, {href:'/board', id: 'board'}, 'board'),
        m(Link, {href:'/stream', id: 'stream'}, 'stream'),
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