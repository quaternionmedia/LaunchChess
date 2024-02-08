import m from 'mithril'

export const MoveList = (state) => m('.movelist', {}, [
    m('h3', 'Moves'),
    m('table', {}, [
        m('tr', {}, [
            m('th', 'White'),
            m('th', 'Black'),
        ]),
        state.history.map(move => m('tr', {}, [m('td', move)])),
    ]),
])

export const Fen = (state) => m('.fen', {}, [
    m('h3', 'Fen'),
    m('pre', state.fen()),
])

export const Pgn = (state) => m('.pgn', {}, [
    m('h3', 'Pgn'),
    m('pre', state.pgn()),
])