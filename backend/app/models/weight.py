from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


class WeightRecord(Base):
    __tablename__ = "weight_records"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    pet_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    weight: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    pet = relationship("Pet", back_populates="weights")
