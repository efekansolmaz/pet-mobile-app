from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    owner_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    species: Mapped[str] = mapped_column(String(50), nullable=False)
    breed: Mapped[str | None] = mapped_column(String(120))
    gender: Mapped[str | None] = mapped_column(String(20))
    birth_date: Mapped[date | None] = mapped_column(Date)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    color: Mapped[str | None] = mapped_column(String(80))
    photo_url: Mapped[str | None] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text)
    microchip_id: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner = relationship("User", back_populates="pets")
    vaccinations = relationship("Vaccination", back_populates="pet", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="pet", cascade="all, delete-orphan")
    visits = relationship("VeterinaryVisit", back_populates="pet", cascade="all, delete-orphan")
    weights = relationship("WeightRecord", back_populates="pet", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="pet", cascade="all, delete-orphan")
    nutrition_plans = relationship("NutritionPlan", back_populates="pet", cascade="all, delete-orphan")
    feeding_logs = relationship("FeedingLog", back_populates="pet", cascade="all, delete-orphan")
