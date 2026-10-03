from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    pet_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    medication_name: Mapped[str] = mapped_column(String(160), nullable=False)
    dosage: Mapped[str] = mapped_column(String(120), nullable=False)
    frequency: Mapped[str] = mapped_column(String(120), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    pet = relationship("Pet", back_populates="medications")
