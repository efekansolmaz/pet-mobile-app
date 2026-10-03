from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


class NutritionPlan(Base):
    __tablename__ = "nutrition_plans"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    pet_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    food_name: Mapped[str] = mapped_column(String(160), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(160))
    feeding_amount: Mapped[str] = mapped_column(String(80), nullable=False)
    feeding_frequency: Mapped[str] = mapped_column(String(120), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    pet = relationship("Pet", back_populates="nutrition_plans")


class FeedingLog(Base):
    __tablename__ = "feeding_logs"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    pet_id: Mapped[UUID] = mapped_column(GUID(), ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    nutrition_plan_id: Mapped[UUID | None] = mapped_column(GUID(), ForeignKey("nutrition_plans.id", ondelete="SET NULL"))
    food_name: Mapped[str] = mapped_column(String(160), nullable=False)
    amount: Mapped[str] = mapped_column(String(80), nullable=False)
    fed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    pet = relationship("Pet", back_populates="feeding_logs")
