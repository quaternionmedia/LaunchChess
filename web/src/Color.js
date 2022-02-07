import m from 'mithril'
import './color.css'

export const Color = color => m('input[type=color]', {
  value: color
}, )

export const ColorSelector = state => m('.colors', {}, [
  Object.keys(state.colors).map((k, n) => m('span.color', {}, [
    m('p.type', {}, k),
    Color(state.colors[k]),
  ])),
  ColorGrid(),
])
