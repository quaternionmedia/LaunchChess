import m from 'mithril'
import { App } from './App'
import { State } from './State'
import meiosisTracer from 'meiosis-tracer'
import { meiosisSetup } from 'meiosis-setup'

const cells = meiosisSetup<State>({ app: App })

m.mount(document.getElementById('app'), {
  view: () => App.view(cells()),
})

cells.map(state => {
  console.log('cells', state)
  localStorage.setItem('launchchess', JSON.stringify(state))
  m.redraw()
})

meiosisTracer({
  selector: '#tracer',
  rows: 25,
  streams: [cells],
})

window.cells = cells
