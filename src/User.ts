import m from 'mithril'
import './user.css'

export const UserIcon = ({ state, update }) =>
  m(
    'span.profile-icon',
    {
      onclick: () => update({ page: 'User' }),
    },
    state.user.username[0].toUpperCase()
  )

export const UserProfile = cell =>
  m(
    '.user-profile',
    {},
    m('h2', {}, cell.state.user.username),
    m('', {}, JSON.stringify(cell.state.user.profile))
    // m('button', { onclick: () => cell.update({ page: 'Login' }) }, 'Logout')
  )
