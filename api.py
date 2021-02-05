from fastapi import FastAPI
from starlette.staticfiles import StaticFiles
from oauth import oauth
from auth import auth
from users import users

app = FastAPI()

app.include_router(auth)
app.mount('/login', oauth)
app.include_router(users)
app.mount('/', StaticFiles(directory='web/dist', html=True), name='dist')

if __name__ == '__main__':
    from uvicorn import run
    run(app, host='0.0.0.0', port=5000)
