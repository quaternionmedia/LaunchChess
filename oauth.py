import config
import os
from fastapi import FastAPI
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse

import requests

from authlib.integrations.starlette_client import OAuth
app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="secret-string")

oauth = OAuth()
oauth.register('lichess',
    client_id=config.LICHESS_CLIENT_ID,
    client_secret=config.LICHESS_CLIENT_SECRET,
    authorize_url=config.LICHESS_AUTHORIZE_URL,
    access_token_url=config.LICHESS_TOKEN_URL,
    api_base_url=config.LICHESS_API_URL,
    client_kwargs={
        'scope': 'board:play'
    }
)

session = {}

@app.route('/')
async def login(request: Request):
    redirect_uri = request.url_for('authorize')
    return await oauth.lichess.authorize_redirect(request, redirect_uri)

@app.route('/authorize')
async def authorize(request: Request):

    token = await oauth.lichess.authorize_access_token(request)
    print(token)
    return RedirectResponse('/success')


@app.get('/success')
def success():
    return 'success!'
    

if __name__ == '__main__':
    from uvicorn import run
    run(app, port=9999)