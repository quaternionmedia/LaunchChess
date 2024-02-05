import m from 'mithril'
import { State } from './State'
import './chessground.css'

import './meiosis.css'
// import '../node_modules/chessground/assets/chessground.base.css'
import '../node_modules/chessground/assets/chessground.brown.css'
import '../node_modules/chessground/assets/chessground.cburnett.css'

import '@fortawesome/fontawesome-free/css/all.css'
import alertify, { notify } from 'alertifyjs'
import 'alertifyjs/build/css/alertify.css'
import 'alertifyjs/build/css/themes/semantic.css'

alertify.defaults.transition = 'zoom'
// alertify.defaults.theme.ok = 'ui positive button'
// alertify.defaults.theme.cancel = 'ui black button'



export const History = cell =>
  m(
    'table.history',
    {},
    Array.from(
      { length: Math.ceil(cell.state.history?.length / 2) },
      (_, i) => i
    ).map(index =>
      m('tr', {}, [
        m('td.move-number', {}, index + 1),
        m(
          'td.move',
          {
            class: 2 * index + 1 === cell.state.historyIndex ? 'highlight' : '',
            onclick: () => cell.update({ historyIndex: 2 * index + 1 }),
          },
          cell.state.history[2 * index]
        ),
        m(
          'td.move',
          {
            class: 2 * index + 2 === cell.state.historyIndex ? 'highlight' : '',
            onclick: () => cell.update({ historyIndex: 2 * index + 2 }),
          },
          cell.state.history[2 * index + 1]
        ),
      ])
    )
  )

export const Menu = cell =>
  m('#toolbar.component', {}, [
    m('', {}, cell.state.page),
    m(
      'button',
      {
        onclick: () => cell.update({ page: 'Login' }),
      },
      'Login'
    ),
  ])
export const Collapsible = {
  view: ({
    attrs: { title, isCollapsed, toggle, header, className },
    children,
  }) =>
    m('.component.collapsible', [
      m('.collapsible-header', { class: className }, [
        m('h4', title),
        header,
        m('button', { onclick: toggle }, isCollapsed ? '+' : '-'),
      ]),
      isCollapsed ? null : m('.content', children),
    ]),
}

export const Copy = {
  view: ({ attrs: { content, name } }) => [
    m('i.fas.fa-copy', {
      onclick: () => {
        navigator.clipboard.writeText(content)
        notify(`copied ${name} to clipboard!`, 'success', 2)
      },
      title: `Copy ${name} to clipboard`,
    }),
  ],
}

