from collections.abc import Generator
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.services.petcare import PetCareService

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise UnauthorizedError()
    try:
        user_id: UUID = decode_token(credentials.credentials, "access")
    except ValueError as exc:
        raise UnauthorizedError() from exc
    user = UserRepository(db).get_by_id(user_id)
    if user is None:
        raise UnauthorizedError()
    return user


def get_care_service(db: Session = Depends(get_db)) -> Generator[PetCareService, None, None]:
    yield PetCareService(db)
