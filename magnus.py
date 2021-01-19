import chess
from chess import Board
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

sf = chess.engine.SimpleEngine.popen_uci('./stockfish_20090216_x64_avx2')
sf.configure({'Threads':24, 'UCI_LimitStrength':100})

class Chess:
    def __init__(self, args=None):
        self.args = args
        self.selected = False
        self.moved = False
        self.invert = False
        self.live = True
        self.toggleLive()
        self.grid()
        self.board = Board(chess.STARTING_FEN)
        self.lightBoard()
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
    def lightBoard(self):
        for i in range(64):
            if self.board.piece_at(i):
                piece = self.board.piece_at(i).symbol()
            else:
                piece = None
            if self.invert: 
                l = 11 + ((63-i)//8)*10 + (63-i)%8
            else:
                l = 11 + (i//8)*10 + i%8
            # print(i, piece, l)
            launchOut.send_message([NOTE_ON, l, colors[piece] if piece else 0 if (i + i//8) % 2 == 0 else 1])
        
    def engineMove(self):
        move = sf.play(c.board, chess.engine.Limit(time=1)).move
        print('stockfish moved', move)
        c.board.push(move)
        c.lightBoard()
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
                move = chess.Move(self.selected , 63 - s if self.invert else s)
                # print('checking if ', move.uci(), ' is legal')
                if move.uci() in legal_moves:
                    self.board.push(move)
                    self.lightBoard()
                    self.selected = False
                    self.moved = True
                else:
                    print('illegal move', move.uci())
                    self.selected = False
                    self.lightBoard()
            else:
                if self.board.piece_at(63 - s if self.invert else s):
                    # select square
                    self.selected = 63 - s if self.invert else s
                    launchOut.send_message([NOTE_ON, message[1], 21])
            
if __name__ == '__main__':
    launchOut, p = open_midioutput('Launchpad X:Launchpad X MIDI 2', client_name='launchOut')
    launchIn, p = open_midiinput('Launchpad X:Launchpad X MIDI 2', client_name='launchIn')
    c = Chess()
    launchIn.set_callback(c, 0)
    moved = False
    from random import random
    if random() > .5:
        # switch sides
        c.invert = True
        c.engineMove()
    try:
        while not c.board.is_game_over():
            if c.moved:
                c.engineMove()
                c.moved = False
            else:
                sleep(.1)
    except KeyboardInterrupt:
        print('')
    finally:
        c.exit()
        print("chess out!")