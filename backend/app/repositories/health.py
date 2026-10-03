from collections.abc import Sequence
from datetime import date, datetime, time, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.medication import Medication
from app.models.nutrition import FeedingLog, NutritionPlan
from app.models.reminder import Reminder
from app.models.vaccination import Vaccination
from app.models.visit import VeterinaryVisit
from app.models.weight import WeightRecord
from app.repositories.base import BaseRepository


class VaccinationRepository(BaseRepository[Vaccination]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Vaccination)

    def list_for_pet(self, pet_id: UUID) -> Sequence[Vaccination]:
        stmt = (
            select(Vaccination)
            .where(Vaccination.pet_id == pet_id)
            .order_by(Vaccination.date_administered.desc())
        )
        return self.db.scalars(stmt).all()

    def upcoming_for_pet(self, pet_id: UUID) -> Vaccination | None:
        today = date.today()
        stmt = (
            select(Vaccination)
            .where(Vaccination.pet_id == pet_id, Vaccination.next_due_date.is_not(None), Vaccination.next_due_date >= today)
            .order_by(Vaccination.next_due_date.asc())
        )
        return self.db.scalars(stmt).first()


class MedicationRepository(BaseRepository[Medication]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Medication)

    def list_for_pet(self, pet_id: UUID) -> Sequence[Medication]:
        stmt = select(Medication).where(Medication.pet_id == pet_id).order_by(Medication.start_date.desc())
        return self.db.scalars(stmt).all()

    def active_for_pet(self, pet_id: UUID) -> Sequence[Medication]:
        today = date.today()
        stmt = select(Medication).where(
            Medication.pet_id == pet_id,
            Medication.is_completed.is_(False),
            Medication.start_date <= today,
            or_(Medication.end_date.is_(None), Medication.end_date >= today),
        )
        return self.db.scalars(stmt).all()


class VisitRepository(BaseRepository[VeterinaryVisit]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, VeterinaryVisit)

    def list_for_pet(self, pet_id: UUID) -> Sequence[VeterinaryVisit]:
        stmt = (
            select(VeterinaryVisit)
            .where(VeterinaryVisit.pet_id == pet_id)
            .order_by(VeterinaryVisit.visit_date.desc())
        )
        return self.db.scalars(stmt).all()

    def upcoming_for_pet(self, pet_id: UUID) -> VeterinaryVisit | None:
        today = date.today()
        stmt = (
            select(VeterinaryVisit)
            .where(
                VeterinaryVisit.pet_id == pet_id,
                VeterinaryVisit.next_visit_date.is_not(None),
                VeterinaryVisit.next_visit_date >= today,
            )
            .order_by(VeterinaryVisit.next_visit_date.asc())
        )
        return self.db.scalars(stmt).first()


class WeightRepository(BaseRepository[WeightRecord]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, WeightRecord)

    def list_for_pet(self, pet_id: UUID) -> Sequence[WeightRecord]:
        stmt = (
            select(WeightRecord)
            .where(WeightRecord.pet_id == pet_id)
            .order_by(WeightRecord.recorded_at.asc())
        )
        return self.db.scalars(stmt).all()


class ReminderRepository(BaseRepository[Reminder]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Reminder)

    def list_for_pet(self, pet_id: UUID) -> Sequence[Reminder]:
        stmt = select(Reminder).where(Reminder.pet_id == pet_id).order_by(Reminder.due_at.asc())
        return self.db.scalars(stmt).all()

    def list_for_owner_pets(self, pet_ids: list[UUID]) -> Sequence[Reminder]:
        if not pet_ids:
            return []
        stmt = select(Reminder).where(Reminder.pet_id.in_(pet_ids)).order_by(Reminder.due_at.asc())
        return self.db.scalars(stmt).all()

    def today_for_pet(self, pet_id: UUID) -> Sequence[Reminder]:
        start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
        end = datetime.combine(date.today(), time.max, tzinfo=timezone.utc)
        stmt = (
            select(Reminder)
            .where(Reminder.pet_id == pet_id, Reminder.due_at >= start, Reminder.due_at <= end)
            .order_by(Reminder.due_at.asc())
        )
        return self.db.scalars(stmt).all()


class NutritionRepository(BaseRepository[NutritionPlan]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, NutritionPlan)

    def list_for_pet(self, pet_id: UUID) -> Sequence[NutritionPlan]:
        stmt = select(NutritionPlan).where(NutritionPlan.pet_id == pet_id).order_by(NutritionPlan.created_at.desc())
        return self.db.scalars(stmt).all()


class FeedingLogRepository(BaseRepository[FeedingLog]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, FeedingLog)

    def list_for_pet(self, pet_id: UUID) -> Sequence[FeedingLog]:
        stmt = select(FeedingLog).where(FeedingLog.pet_id == pet_id).order_by(FeedingLog.fed_at.desc())
        return self.db.scalars(stmt).all()

    def today_for_pet(self, pet_id: UUID) -> Sequence[FeedingLog]:
        start = datetime.combine(date.today(), time.min, tzinfo=timezone.utc)
        end = datetime.combine(date.today(), time.max, tzinfo=timezone.utc)
        stmt = (
            select(FeedingLog)
            .where(FeedingLog.pet_id == pet_id, FeedingLog.fed_at >= start, FeedingLog.fed_at <= end)
            .order_by(FeedingLog.fed_at.desc())
        )
        return self.db.scalars(stmt).all()
