from fastapi import FastAPI
from starlette.staticfiles import StaticFiles

app = FastAPI()

app.mount('/static', StaticFiles(directory='static', html=True), name='static')
app.mount('/', StaticFiles(directory='dist', html=True), name='dist')


if __name__ == '__main__':
    from uvicorn import run

    run(app, host='0.0.0.0', port=5000)
