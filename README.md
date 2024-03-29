# LaunchChess

Play chess with your Novation Launchpad, or other compatible device!

[launchchess.com](https://launchchess.com)

**Note** This repository holds the code for the online version of LaunchChess. For the standalone python library, see [launchchess-python](https://github.com/quaternionmedia/launchchess-python).

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

`./launchchess cert`

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

## production
Assuming a running [traefik](https://traefik.io/traefik/) docker instance as a reverse proxy:

### certs
Playing with the [Lichess Board API](https://lichess.org/api#tag/Board) requires a valid https certificate. In addition, this must be served by the server itself (not the reverse proxy) in order to successfully generate an oauth token. 

This is performed with the following label to the `docker-compose` file:
``` yml
...
    - labels:
      - traefik.tcp.routers.launchchess.tls.passthrough=true
```

Copying the traefik certificate is performed with:
`./renew-cert.sh`

### run
`./launchchess p`
