import m from 'mithril'
import { UserIcon } from './User.ts'
import './toolbar.css'

export const Toolbar = ({ state, update }) =>
  m('#toolbar.component.toolbar-flex', {}, [
    m(
      '',
      {
        class: state.page === 'Home' ? 'active' : '',
        onclick: () => update({ page: 'Home' }),
      },
      'Home'
    ),
    m(
      '',
      {
        class: state.page === 'Connect' ? 'active' : '',
        onclick: () => update({ page: 'Connect' }),
      },
      'Connect'
    ),
    m(
      '',
      {
        class: state.page === 'Game' ? 'active' : '',
        onclick: () => update({ page: 'Game' }),
      },
      'Game'
    ),
    state.user
      ? UserIcon({ state, update })
      : m(
          '',
          {
            class: state.page === 'Login' ? 'active' : '',
            onclick: () => update({ page: 'Login' }),
          },
          'Login'
        ),
  ])
