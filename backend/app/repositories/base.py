from collections.abc import Sequence
from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: type[ModelT]) -> None:
        self.db = db
        self.model = model

    def get(self, entity_id: UUID) -> ModelT | None:
        return self.db.get(self.model, entity_id)

    def list(self, *whereclauses: Any) -> Sequence[ModelT]:
        stmt: Select[tuple[ModelT]] = select(self.model)
        for clause in whereclauses:
            stmt = stmt.where(clause)
        return self.db.scalars(stmt).all()

    def add(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity: ModelT) -> None:
        self.db.delete(entity)
        self.db.commit()

    def save(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
