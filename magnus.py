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
sf.configure({'Threads':1, 'UCI_LimitStrength':True, 'UCI_Elo':1350})

class Chess:
    def __init__(self, invert=False):
        self.invert = invert
        self.selected = False
        self.moved = False
        self.live = True
        self.toggleLive()
        self.grid()
        self.board = Board(chess.STARTING_FEN)
        self.lightBoard()
    def toggleLive(self):
        # switch to / from programming / Live mode
        launchOut.send_message([240, 0, 32, 41, 2, 12, 14, 1 if self.live else 0, 247])
        self.live = not self.live
    def nToLaunch(self, n):
        # 0-63 mapped to launchpad notes
        if self.invert: 
            return 11 + ((63-n)//8)*10 + (63-n)%8
        else:
            return 11 + (n//8)*10 + n%8
    def launchToN(self, n):
        # launchpad note mapped to 0-63
        s = (n-11)//10*8 + (n-11) % 10        
        return 63 - s if self.invert else s
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
            l = self.nToLaunch(i)
            # print(i, piece, l)
            launchOut.send_message([NOTE_ON, l, colors[piece] if piece else 0 if (i + i//8) % 2 == 0 else 1])
        if len(self.board.move_stack):
            self.highlightMove(-1)
            if len(self.board.move_stack) > 1:
                self.highlightMove(-2)
    def highlightMove(self, move):
        lastMove = self.board.move_stack[move]
        launchOut.send_message([NOTE_ON | 2, self.nToLaunch(lastMove.from_square), 70])
        if self.board.piece_at(lastMove.to_square):
            launchOut.send_message([NOTE_ON | 2, self.nToLaunch(lastMove.to_square), colors[self.board.piece_at(lastMove.to_square).symbol()]])
    def engineMove(self):
        move = sf.play(c.board, chess.engine.Limit(time=0)).move
        print('stockfish moved', move)
        c.board.push(move)
        c.lightBoard()
    def __call__(self, event, data=None):
        message, deltatime = event
        if message[0] == NOTE_ON and message[2]:
            s = self.launchToN(message[1])
            # print('touched', s)
            legal_moves = [i.uci() for i in self.board.legal_moves]
            # print('legal moves', legal_moves)
            if self.selected:
                # move selected to square
                print('moving', self.selected, 'to', s)
                if self.board.piece_at(self.selected).piece_type == chess.PAWN:
                    p = self.board.piece_at(self.selected)
                    if (p.color and s//8 == 7) or (s//8 == 0 != p.color ):
                        print('promotion! Auto promote to Queen')
                        move = chess.Move(self.selected , s, promotion=chess.QUEEN)
                    else:
                        move = chess.Move(self.selected , s)
                else:
                    move = chess.Move(self.selected , s)
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
                if self.board.piece_at(s):
                    # select square
                    self.selected = s
                    square = ascii_lowercase[s%8] + str(1+s//8)
                    print('selected square', square)
                    launchOut.send_message([NOTE_ON, message[1], 21])
                    pieceMoves = [i[2:] for i in legal_moves if i[:2] == square]
                    print('possible moves:', pieceMoves)
                    for m in pieceMoves:
                        sq = 8*(int(m[1])-1) + ord(m[0])-97
                        launchOut.send_message([NOTE_ON | 2, self.nToLaunch(sq), 21])
                    
            
if __name__ == '__main__':
    launchOut, p = open_midioutput('Launchpad X:Launchpad X MIDI 2', client_name='launchOut')
    launchIn, p = open_midiinput('Launchpad X:Launchpad X MIDI 2', client_name='launchIn')
    from random import choice
    c = Chess(invert=choice([True, False]))
    launchIn.set_callback(c, 0)
    if c.invert:
        # if playing as black, engine move first
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