import config
from fastapi import FastAPI
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from db import users
from requests import get
from tinydb import Query
from pydantic import BaseModel

class Token(BaseModel):
    token_type: str
    access_token: str


def getLiProfile(token: Token):
    return get(config.LICHESS_API_URL + '/account', headers={
        'Authorization': token['token_type'] + ' ' + token['access_token']
    }).json()


app = FastAPI(root_path='/oauth', root_path_in_servers=False)
app.add_middleware(SessionMiddleware, secret_key=config.SESSION_SECRET, https_only=True)

oauth = OAuth()
oauth.register('lichess',
    authorize_url=config.LICHESS_AUTHORIZE_URL,
    access_token_url=config.LICHESS_ACCESS_TOKEN_URL,
    client_kwargs={
        'code_challenge_method': 'S256'
    }
)

@app.route('/')
async def login(request: Request):
    redirect_uri = request.url_for('authorize')
    return await oauth.lichess.authorize_redirect(request, redirect_uri, scope='board:play')

@app.route('/authorize')
async def authorize(request: Request):
    token = await oauth.lichess.authorize_access_token(request)
    print(token)
    r = getLiProfile(token)
    username = r['username']
    request.session['user'] = username
    users.upsert({'token': token , 'profile': r, 'username': username}, Query().username == username)
    return RedirectResponse('/')

@app.get('/logout', response_class = RedirectResponse)
async def logout(request: Request):
    username = request.session['user']
    if username:
        users.remove(Query().username == username)
        request.session['user'] = None
    return '/'

@app.get('/token', response_model = Token)
async def getToken(request: Request):
    username = request.session.get('user')
    if username:
        user = users.get(Query().username == username)
        if user:
            return user['token']

@app.get('/profile')
def getProfile(request: Request):
    user = request.session.get('user')
    if user:
        q = Query().username == user
        u = users.get(q)
        print('got user', u)
        r = getLiProfile(u['token'])
        users.update({'profile': r}, q)
        return r

if __name__ == '__main__':
    from uvicorn import run
    run(app, port=9999)
