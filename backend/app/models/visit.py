from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


class VeterinaryVisit(Base):
    __tablename__ = "veterinary_visits"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    pet_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    veterinarian_name: Mapped[str] = mapped_column(String(160), nullable=False)
    clinic_name: Mapped[str | None] = mapped_column(String(160))
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255))
    diagnosis: Mapped[str | None] = mapped_column(Text)
    treatment: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    next_visit_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    pet = relationship("Pet", back_populates="visits")
