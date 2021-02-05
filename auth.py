from datetime import datetime, timedelta
import jwt
from fastapi import Depends, FastAPI, APIRouter, Response, Cookie, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import PyJWTError
from passlib.context import CryptContext
from secrets import token_urlsafe
from pydantic import BaseModel
from typing import List
from db import users, mcguffins
from tinydb import Query
from tinydb.operations import delete
from config import PRODUCTION
# openssl rand -hex 32
SECRET_KEY = 'dd0bf79b6d601b81739c88e9a5c66537924cd5271b71151f9057329d835711c6'

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 90

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str = None


class User(BaseModel):
    username: str
    email: str = None
    # full_name: str = None
    disabled: bool = None


class UserInDB(User):
    hashed_password: str

class Edl(BaseModel):
    edl: List = None


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

# app = FastAPI()
auth = APIRouter()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_user(username: str):
    q = Query()
    c = users.get(Query().username == username)
    if c:
        return UserInDB(**c)


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except PyJWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@auth.post("/token", response_model=Token)
async def login_for_access_token(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise credentials_exception
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    mcguffin = token_urlsafe(32)
    mcguffins.insert({'name': mcguffin, 'username': user.username})
    response.set_cookie(key='mcguffin', value=mcguffin, httponly=True, secure=PRODUCTION)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@auth.post('/refresh', response_model=Token)
async def refresh_access_token(response: Response, mcguffin: str = Cookie(None)):
    try:
        token = mcguffins.get({'name': mcguffin})
        # print('refresh. checking mcguffin', mcguffin, token)
        if token:
            username: str = token['username']
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            # TODO update token status to 'used' instead of deleting
            mcguffins.remove(Query().name == mcguffin)
            mcguffin = token_urlsafe(32)
            mcguffins.insert({'name': mcguffin, 'username': username})
            response.set_cookie(key='mcguffin', value=mcguffin, httponly=True, secure=PRODUCTION)
            # print('making new token', username, access_token_expires, mcguffin)
            access_token = create_access_token(
                data={"sub": username}, expires_delta=access_token_expires
            )
            return {"access_token": access_token, "token_type": "bearer"}
        else:
            raise credentials_exception
    except Exception as e:
        print('error refreshing', e)
        raise credentials_exception


@auth.post('/logout')
async def logout(response: Response, mcguffin: str = Cookie(None)):
    try:
        response.delete_cookie(key='mcguffin')
        token = mcguffins.get(Query().name == mcguffin)
        print('refresh. checking mcguffin', mcguffin, token)
        if token:
            mcguffins.remove(Query().name == mcguffin)
    except Exception as e:
        print('error logging out', e)
        raise credentials_exception