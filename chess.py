from stockfish import Stockfish
from rtmidi.midiutil import open_midioutput, open_midiinput
from time import sleep
from rtmidi.midiconstants import NOTE_ON, NOTE_OFF, CONTROL_CHANGE

sf = Stockfish(
    '/home/harpo/Downloads/stockfish_20090216_x64_avx2',
    parameters={'Threads':24}
)

class Chess:
    def __init__(self, args=None):
        self.args = args
        self.live = True
        self.toggleLive()
        self.grid()
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
        pass
        
    def __call__(self, event, data=None):
        message, deltatime = event
        
if __name__ == '__main__':
    launchOut, p = open_midioutput('Launchpad X:Launchpad X MIDI 2', client_name='launchOut')
    launchIn, p = open_midiinput('Launchpad X:Launchpad X MIDI 2', client_name='launchIn')
    c = Chess()
    launchIn.set_callback(c, 0)
    try:
        while True:
            sleep(1)
    except KeyboardInterrupt:
        print('')
    finally:
        c.exit()
        print("hub out!")