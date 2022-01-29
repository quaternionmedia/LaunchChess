from fastapi import FastAPI
from starlette.staticfiles import StaticFiles
from oauth import app as oauth_app

app = FastAPI()

app.mount('/oauth', oauth_app)
app.mount('/static', StaticFiles(directory='web/static', html=True), name='static')
app.mount('/', StaticFiles(directory='web/dist', html=True), name='dist')


if __name__ == '__main__':
    from uvicorn import run
    run(app, host='0.0.0.0', port=5000)
