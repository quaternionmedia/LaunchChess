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

let cell = cells()

// Handle left and right arrow key presses
document.removeEventListener('keydown', cell.state.onkeydown)
document.addEventListener('keydown', function (event) {
  switch (event.key) {
    case 'ArrowLeft':
      cell.update({ historyIndex: cell.getState().historyIndex - 1 })
      event.preventDefault()
      break
    case 'ArrowRight':
      cell.update({ historyIndex: cell.getState().historyIndex + 1 })
      event.preventDefault()
      break
    case 'ArrowUp':
      cell.update({ historyIndex: 0 })
      event.preventDefault()
      break
    case 'ArrowDown':
      cell.update({ historyIndex: cell.getState().history.length })
      event.preventDefault()
      break
  }
})

// Debug

meiosisTracer({
  selector: '#tracer',
  rows: 25,
  streams: [cells],
})

window.cells = cells
