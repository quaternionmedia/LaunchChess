import { Api } from 'chessground/api';
import { Color, Key } from 'chessground/types';
import { getPieceLocations } from './ChessMaths'

export function toDests(chess) {
  const dests = new Map();
  chess.SQUARES.forEach(s => {
    const ms = chess.moves({square: s, verbose: true});
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;
}

export function toColor(chess) {
  return (chess.turn() === 'w') ? 'white' : 'black';

}

export function playOtherSide(chess, cg) {
  return (orig, dest) => {
    chess.move({from: orig, to: dest});
    cg.set({
      check: chess.in_check() ? getPieceLocations(chess, {type: 'k', color: chess.turn()})[0] : null,
      turnColor: toColor(chess),
      movable: {
        color: toColor(chess),
        dests: toDests(chess)
      }
    });
  };
}
