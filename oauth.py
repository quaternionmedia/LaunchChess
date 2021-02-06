import config
from fastapi import FastAPI
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from db import users
from requests import get
from tinydb import Query

app = FastAPI(root_path='/oauth', root_path_in_servers=False)
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

@app.route('/')
async def login(request: Request):
    redirect_uri = request.url_for('authorize')
    return await oauth.lichess.authorize_redirect(request, redirect_uri)

@app.route('/authorize')
async def authorize(request: Request):
    token = await oauth.lichess.authorize_access_token(request)
    print(token)
    r = get(config.LICHESS_API_URL + '/account', headers={
        'Authorization': token['token_type'] + ' ' + token['access_token']
    }).json()
    print(r)
    username = r['username']
    users.upsert({'token': token, 'profile': r}, Query().username == username)
    return RedirectResponse(request.url_for('success'))


@app.get('/success')
def success():
    return 'success!'
    

if __name__ == '__main__':
    from uvicorn import run
    run(app, port=9999)