# LaunchChess

Play chess with your Novation Launchpad, or other compatible device!

[launchchess.com](https://launchchess.com)

## development
Clone this repository
`git clone https://github.com/quaternionmedia/launchchess.git`

The simplest way to start developing is with **docker**. Basic commands are included with the `launchchess` executable, and can be run with `./launchchess [command]`

### website frontend
**Note:** Does not work for online play with Lichess accounts. See [backend](#backend) for instructions.

#### init
If this is the first time, install npm dependencies:
`./launchchess init`

#### run locally
Run the development server:
`./launchchess dev`

Visit: http://localhost:5555

This starts a development server at port `5555`. When files have changed, it will automatically rebuild the site and reload any open tabs.

If tabs aren't reloading correctly after a rebuild:
- open the developer tools (right click: inspect)
- go to the `Network` tab
- check the `Disable cache` checkbox
- refresh the page (F5)


### backend
In order to play online, the server needs to be configured for https, meaning you need an ssl certificate. Such a thing is beyond the scope of this documentation, but these steps should generate a valid (though not trusted) certfile, which is enough to work locally.

#### 1. generate a new certfile

`openssl req -x509 -newkey rsa:4096 -keyout testcert-key.pem -out testcert.pem -days 365 -nodes`

Answer interactive prompt for location / contact info (for development purposes, empty answers are fine)

#### 2. configure Lichess OAuth
- Add a [new lichess oauth app](https://lichess.org/account/oauth/app), with a callback url to `https://[your.domain:port]/oauth/authorize`


(where `[your.domain:port]` is `localhost:9999` or whatever local domain or ip address and port your browser will be accessing )

- Add the `client id` and `secret` from above to `config.py`.


#### 3. secrets 
Generate an `AUTH_SECRET_KEY` and a different `SESSION_SECRET` and  paste them into `config.py`

`openssl rand -hex 32`


#### 4. run server
Install uvicorn if not already installed

`pip3 install uvicorn`

Run server

`./launchchess run`

Visit https://localhost:9999 and authorize your Lichess account with this server!

#### 5. (optional) build js
If you are running the uvicorn server and want to rebuild the js files (and auto rebuild future changes):
`./launchchess build`

## python (offline only)
LaunchChess can also be run as a standalone, headless python script (no website interface). 

You need to have a [UCI](https://en.wikipedia.org/wiki/Universal_Chess_Interface) compatible chess engine, such as the [free stockfish engine](https://stockfishchess.org/download/).

Save the engine file and add the location in `config.py`. Then, run:
`pip install -r requirements.txt`

`python3 launchchess.py`
