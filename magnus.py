import chess
from chess import Board
from stockfish import Stockfish
from rtmidi.midiutil import open_midioutput, open_midiinput
from time import sleep
from rtmidi.midiconstants import NOTE_ON, NOTE_OFF, CONTROL_CHANGE
from string import ascii_lowercase
import chess.engine

colors = {
'': 0,
'P': 13,
'R': 9,
'N': 45,
'B': 37,
'K': 49,
'Q': 53,
'p': 15,
'r': 11,
'n': 47,
'b': 39,
'q': 55,
'k': 51,
}

sf = chess.engine.SimpleEngine.popen_uci('/home/harpo/Downloads/stockfish_20090216_x64_avx2')
    # parameters={'Threads':24}

class Chess:
    def __init__(self, args=None):
        self.args = args
        self.board = Board(chess.STARTING_FEN)
        self.live = True
        self.selected = False
        self.moved = False
        self.toggleLive()
        self.grid()
        self.fen(self.board.fen())
    def toggleLive(self):
        # switch to / from programming / Live mode
        launchOut.send_message([240, 0, 32, 41, 2, 12, 14, 1 if self.live else 0, 247])
        self.live = not self.live
    def exit(self):
        self.toggleLive()
    def grid(self):
        for y in range(8):
            for x in range(8):
                launchOut.send_message([NOTE_ON, 11+x+y*10, 0 if (x+y) % 2 == 0 else 1])
    def fen(self, fen):
        self.board = Board(fen)
        for i in range(64):
            if self.board.piece_at(i):
                piece = self.board.piece_at(i).symbol()
            else:
                piece = None
            l = 11 + (i//8)*10 + i%8
            # print(i, piece, l)
            launchOut.send_message([NOTE_ON, l, colors[piece] if piece else 0 if (i + i//8) % 2 == 0 else 1])
        
    def __call__(self, event, data=None):
        message, deltatime = event
        if message[0] == NOTE_ON and message[2]:
            n = message[1] - 11
            rank = n//10
            file = n % 10
            square = ascii_lowercase[file] + str(rank+1)
            s = rank*8 + file
            print('touched', n, rank, file, square, s)
            if self.selected:
                # move selected to square
                print('moving', self.selected, 'to', s)
                legal_moves = [i.uci() for i in self.board.legal_moves]
                move = chess.Move.from_uci(self.selected + square)
                # print('checking if ', move.uci(), ' is legal')
                if move.uci() in legal_moves:
                    self.board.push(move)
                    self.fen(self.board.fen())
                    self.board = Board(self.board.fen())
                    self.selected = False
                    self.moved = True
                else:
                    print('illegal move', move.uci())
                    self.selected = False
                    self.fen(self.board.fen())
            else:
                if self.board.piece_at(s):
                    # select square
                    self.selected = square
                    launchOut.send_message([NOTE_ON, message[1], 21])
            
if __name__ == '__main__':
    launchOut, p = open_midioutput('Launchpad X:Launchpad X MIDI 2', client_name='launchOut')
    launchIn, p = open_midiinput('Launchpad X:Launchpad X MIDI 2', client_name='launchIn')
    c = Chess()
    launchIn.set_callback(c, 0)
    moved = False
    try:
        while not c.board.is_game_over():
            if c.moved:
                move = sf.play(c.board, chess.engine.Limit(time=1)).move
                # move = sf.get_best_move_time(1000)
                print('stockfish moved', move)
                c.board.push(move)
                c.fen(c.board.fen())
                c.moved = False
            else:
                sleep(1)
    except KeyboardInterrupt:
        print('')
    finally:
        c.exit()
        print("chess out!")