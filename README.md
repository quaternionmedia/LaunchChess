# magnus

chess scripts

## install
Clone this repository

[download a stockfish engine](https://stockfishchess.org/download/)

`pip install -r requirements.txt`

configure a new lichess oauth app, with a callback url to `https://[your.domain]/oauth/authorize`

Add the client id and secret to `config.py`

Generate a `SECRET_KEY` and `AUTH_SECRET_KEY` and  paste it into config.py

`openssl rand -hex 32`


## run

#### standalone
connect a launchpad, and run:

`python3 magnus.py`

#### web
install npm dependencies

`./magnus install`

build web files

`./magnus build`

run dev server

`./magnus run`