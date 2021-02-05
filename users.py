from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.param_functions import Form
from starlette.responses import RedirectResponse
from auth import User, get_current_active_user, pwd_context
from db import users as db_users
from tinydb import Query

class RegisterForm(OAuth2PasswordRequestForm):
    def __init__(
        self,
        username: str = Form(...),
        password: str = Form(...),
        email: str = Form(...)
    ):
        self.email = email
        self.username = username
        self.password = password

users = APIRouter()

@users.post('/register')
async def registerUser(form_data: RegisterForm = Depends()):
    c = db_users.get(Query().username == form_data.username)
    if c:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User already exists",
            headers={"WWW-Authenticate": "Bearer"},
        )
    else:
        db_users.insert({
        'username': form_data.username,
        'hashed_password': pwd_context.hash(form_data.password),
        'email': form_data.email,
        })


@users.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# @users.get("/users/me/items/")
# async def read_own_items(current_user: User = Depends(get_current_active_user)):
#     return [{"item_id": "Foo", "owner": current_user.username}]