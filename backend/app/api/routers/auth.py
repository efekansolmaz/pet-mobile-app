from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import UnauthorizedError
from app.core.security import create_token, decode_token
from app.models.user import User
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenPair, UserOut, UserUpdate
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenPair:
    user, access, refresh = AuthService(db).register(payload)
    _ = user
    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    _, access, refresh = AuthService(db).login(payload)
    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenPair)
def refresh_tokens(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    try:
        user_id = decode_token(payload.refresh_token, "refresh")
    except ValueError as exc:
        raise UnauthorizedError("Invalid refresh token") from exc
    user = AuthService(db).get(user_id)
    if user is None:
        raise UnauthorizedError("Invalid refresh token")
    return TokenPair(access_token=create_token(user.id, "access"), refresh_token=create_token(user.id, "refresh"))


@router.post("/logout")
def logout(_user: User = Depends(get_current_user)) -> dict[str, str]:
    return {"status": "ok"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    return AuthService(db).update_profile(user, payload)
