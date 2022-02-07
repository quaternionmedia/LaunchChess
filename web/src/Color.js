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

export const LAUNCHPAD_COLORS = [
  '#000000',
  '#b3b3b3',
  '#dddddd',
  '#ffffff',
  '#ffb3b3 ',
  '#ff6161',
  '#dd6161',
  '#b36161',
  '#fff3d5',
  '#ffb361',
  '#dd8c61',
  '#b37661',
  '#ffeea1',
  '#ffff61',
  '#dddd61',
  '#b3b361',
  '#ddffa1',
  '#c2ff61',
  '#a1dd61',
  '#81b361',
  '#c2ffb3',
  '#61ff61',
  '#61dd61',
  '#61b361',
  '#c2ffc2',
  '#61ff8c',
  '#61dd76',
  '#61b36b',
  '#c2ffcc',
  '#61ffcc',
  '#61dda1',
  '#61b381',
  '#c2fff3',
  '#61ffe9',
  '#61ddc2',
  '#61b396',
  '#c2f3ff',
  '#61eeff',
  '#61c7dd',
  '#61a1b3',
  '#c2ddff',
  '#61c7ff',
  '#61a1dd',
  '#6181b3',
  '#a18cff',
  '#6161ff',
  '#6161dd',
  '#6161b3',
  '#ccb3ff',
  '#a161ff',
  '#8161dd',
  '#7761B2',
  '#FFB2FE',
  '#FF60FE',
  '#DD60DC',
  '#B360B2',
  '#FEB2D5',
  '#FF60C3',
  '#DD60A0',
  '#B3608D',
  '#FF7760',
  '#E8B360',
  '#DDC360',
  '#A1A161',
  '#60B261',
  '#61B28D',
  '#608CD4',
  '#6060FF',
  '#60B2B3',
  '#8C60F2',
  '#CDB3C3',
  '#8C7780',
  '#FF6060',
  '#F2FFA0',
  '#EEFD60',
  '#CCFE60',
  '#77DC61',
  '#60FFCD',
  '#61E8FE',
  '#61A0FE',
  '#8D61FE',
  '#CD61FD',
  '#EF8CDC',
  '#A17760',
  '#FEA160',
  '#DCF861',
  '#D5FF8C',
  '#60FF60',
  '#B3FEA0',
  '#CDFDD5',
  '#B3FFF6',
  '#CDE4FE',
  '#A1C2F6',
  '#D4C2F8',
  '#F88DFF',
  '#FE61CD',
  '#FEC361',
  '#F3EF60',
  '#E5FE61',
  '#DDCD60',
  '#B2A061',
  '#61BA76',
  '#77C38C',
  '#8080A1',
  '#808CCD',
  '#CCAA81',
  '#DD6161',
  '#F8B3A0',
  '#F8BA77',
  '#FEF28C',
  '#E8F9A0',
  '#D4EF76',
  '#8080A1',
  '#F8F9D4',
  '#DCFDE4',
  '#E9E8FE',
  '#E5D4FF',
  '#B3B3B3',
  '#D5D5D5',
  '#F9FFFF',
  '#E86160',
  '#AA6060',
  '#81F760',
  '#60B261',
  '#F3EF60',
  '#B2A061',
  '#EEC360',
  '#C37761',
]
