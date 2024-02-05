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
    // Create a table row for each set of moves in the game.
    // Each row contains the move number, and two moves: one for white and one for black.
    // So we need to iterate over the history array in steps of 2.
    Array.from(
      { length: Math.ceil(cell.state.history?.length / 2) },
      (_, i) => i
    ).map(index =>
      // Create a table row for each move pair.
      m('tr', {}, [
        // Add move number
        m('td.move-number', {}, index + 1),
        // Add White's move
        m(
          'td.move',
          {
            // Highlight the move if it is the current move
            class: 2 * index + 1 === cell.state.historyIndex ? 'highlight' : '',
            // When the move is clicked, update the historyIndex to the move number
            onclick: () => cell.update({ historyIndex: 2 * index + 1 }),
          },
          cell.state.history[2 * index]
        ),
        // Add Black's move
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

// Collapsable component
// This component renders the `children` components in a collapsable frame with a dropdown toggle.
// It includes a customizable header, dropdown toggle, and accepts class names for styling.
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

// Generica Copy button icon, which copies the child contents to the clipboard
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

