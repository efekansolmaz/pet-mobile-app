from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import create_token, hash_password, verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas import LoginRequest, RegisterRequest, UserUpdate


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def register(self, payload: RegisterRequest) -> tuple[User, str, str]:
        if self.users.get_by_email(payload.email):
            raise ConflictError("An account with this email already exists")
        user = User(
            name=payload.name.strip(),
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
        )
        user = self.users.add(user)
        return user, create_token(user.id, "access"), create_token(user.id, "refresh")

    def login(self, payload: LoginRequest) -> tuple[User, str, str]:
        user = self.users.get_by_email(payload.email)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")
        return user, create_token(user.id, "access"), create_token(user.id, "refresh")

    def update_profile(self, user: User, payload: UserUpdate) -> User:
        if payload.name:
            user.name = payload.name.strip()
        return self.users.save(user)

    def get(self, user_id: UUID) -> User | None:
        return self.users.get_by_id(user_id)
