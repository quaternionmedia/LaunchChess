# launchchess

Play chess with your Novation Launchpad, or other compatible device!

[launchchess.com](launchchess.com)

## development
Clone this repository

[download a stockfish engine](https://stockfishchess.org/download/)

### init

`pip install -r requirements.txt`

configure a new lichess oauth app, with a callback url to `https://[your.domain]/oauth/authorize`

Add the client id and secret to `config.py`

Generate a `SECRET_KEY` and `AUTH_SECRET_KEY` and  paste it into config.py

`openssl rand -hex 32`


### run

#### standalone
connect a launchpad, and run:

`python3 launchchess.py`

#### web
install npm dependencies

`./launchchess install`

build web files

`./launchchess build`

run dev server

`./launchchess run`
