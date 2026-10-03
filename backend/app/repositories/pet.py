from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.pet import Pet
from app.repositories.base import BaseRepository


class PetRepository(BaseRepository[Pet]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Pet)

    def list_for_owner(self, owner_id: UUID) -> Sequence[Pet]:
        stmt = select(Pet).where(Pet.owner_id == owner_id).order_by(Pet.created_at.desc())
        return self.db.scalars(stmt).all()

    def get_for_owner(self, pet_id: UUID, owner_id: UUID) -> Pet | None:
        stmt = select(Pet).where(Pet.id == pet_id, Pet.owner_id == owner_id)
        return self.db.scalar(stmt)
