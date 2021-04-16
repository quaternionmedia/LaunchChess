import m from 'mithril'

export const Toolbar = (state, actions) => ({view: vnode => m('.toolbar', {}, [
  m('.status', {class: status, title: status}, ''),
  m('i.material-icons', {
    title: status == 'connected' ? 'disconnect' : 'connect',
    onclick: e => {
      if (state.connected()) {
        console.log('disconnecting')
        actions.close()
      } else {
        console.log('connecting')
        // state.connect(onInput, onCC, () => {
        //   actions.toggleLive()
        //   lightBoard()
        // })
      }
    },
  }, state.connected() ? 'power_off' : 'power'),
  m('i.material-icons', {
    title: 'flip board',
    onclick: e => {
      actions.flipBoard()
    }
  }, 'wifi_protected_setup'),
  m('i.material-icons', {
    title: state.influence ? 'hide influence' : 'show influence',
    onclick: e => {
      actions.toggleInfluence()
    }
  }, 'compare_arrows'),
]),
})