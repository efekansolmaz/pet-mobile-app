from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.medication import Medication
from app.models.nutrition import FeedingLog, NutritionPlan
from app.models.pet import Pet
from app.models.reminder import Reminder
from app.models.user import User
from app.models.vaccination import Vaccination
from app.models.visit import VeterinaryVisit
from app.models.weight import WeightRecord
from app.repositories.health import (
    FeedingLogRepository,
    MedicationRepository,
    NutritionRepository,
    ReminderRepository,
    VaccinationRepository,
    VisitRepository,
    WeightRepository,
)
from app.repositories.pet import PetRepository
from app.schemas import (
    DashboardOut,
    FeedingLogCreate,
    FeedingLogOut,
    HealthPassportOut,
    MedicationCreate,
    MedicationOut,
    MedicationUpdate,
    NutritionPlanCreate,
    NutritionPlanOut,
    NutritionPlanUpdate,
    PetCreate,
    PetOut,
    PetUpdate,
    ReminderCreate,
    ReminderOut,
    ReminderUpdate,
    VaccinationCreate,
    VaccinationOut,
    VaccinationUpdate,
    VisitCreate,
    VisitOut,
    VisitUpdate,
    WeightCreate,
    WeightOut,
    WeightStats,
)

ALLOWED_REMINDER_TYPES = {
    "vaccination",
    "medication",
    "veterinary_visit",
    "parasite_treatment",
    "grooming",
    "feeding",
    "custom",
}
ALLOWED_REPEAT_RULES = {"none", "daily", "weekly", "monthly", "custom"}


def _apply(entity: Any, data: dict[str, Any]) -> None:
    for key, value in data.items():
        setattr(entity, key, value)


class PetCareService:
    def __init__(self, db: Session) -> None:
        self.pets = PetRepository(db)
        self.vaccinations = VaccinationRepository(db)
        self.medications = MedicationRepository(db)
        self.visits = VisitRepository(db)
        self.weights = WeightRepository(db)
        self.reminders = ReminderRepository(db)
        self.nutrition = NutritionRepository(db)
        self.feedings = FeedingLogRepository(db)

    def _owned_pet(self, pet_id: UUID, user: User) -> Pet:
        pet = self.pets.get_for_owner(pet_id, user.id)
        if pet is None:
            raise NotFoundError("Pet not found")
        return pet

    def list_pets(self, user: User) -> list[Pet]:
        return list(self.pets.list_for_owner(user.id))

    def create_pet(self, user: User, payload: PetCreate) -> Pet:
        pet = Pet(owner_id=user.id, **payload.model_dump())
        pet = self.pets.add(pet)
        if payload.weight is not None:
            self.weights.add(
                WeightRecord(
                    pet_id=pet.id,
                    weight=payload.weight,
                    recorded_at=datetime.now(timezone.utc),
                    notes="Initial weight",
                )
            )
        return pet

    def get_pet(self, user: User, pet_id: UUID) -> Pet:
        return self._owned_pet(pet_id, user)

    def update_pet(self, user: User, pet_id: UUID, payload: PetUpdate) -> Pet:
        pet = self._owned_pet(pet_id, user)
        data = payload.model_dump(exclude_unset=True)
        _apply(pet, data)
        pet = self.pets.save(pet)
        if "weight" in data and data["weight"] is not None:
            self.weights.add(
                WeightRecord(
                    pet_id=pet.id,
                    weight=data["weight"],
                    recorded_at=datetime.now(timezone.utc),
                    notes="Updated from profile",
                )
            )
        return pet

    def delete_pet(self, user: User, pet_id: UUID) -> None:
        pet = self._owned_pet(pet_id, user)
        self.pets.delete(pet)

    def create_vaccination(self, user: User, pet_id: UUID, payload: VaccinationCreate) -> Vaccination:
        self._owned_pet(pet_id, user)
        return self.vaccinations.add(Vaccination(pet_id=pet_id, **payload.model_dump()))

    def list_vaccinations(self, user: User, pet_id: UUID) -> list[Vaccination]:
        self._owned_pet(pet_id, user)
        return list(self.vaccinations.list_for_pet(pet_id))

    def update_vaccination(
        self, user: User, pet_id: UUID, item_id: UUID, payload: VaccinationUpdate
    ) -> Vaccination:
        self._owned_pet(pet_id, user)
        item = self.vaccinations.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Vaccination not found")
        _apply(item, payload.model_dump(exclude_unset=True))
        return self.vaccinations.save(item)

    def delete_vaccination(self, user: User, pet_id: UUID, item_id: UUID) -> None:
        self._owned_pet(pet_id, user)
        item = self.vaccinations.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Vaccination not found")
        self.vaccinations.delete(item)

    def create_medication(self, user: User, pet_id: UUID, payload: MedicationCreate) -> Medication:
        self._owned_pet(pet_id, user)
        return self.medications.add(Medication(pet_id=pet_id, **payload.model_dump()))

    def list_medications(self, user: User, pet_id: UUID) -> list[Medication]:
        self._owned_pet(pet_id, user)
        return list(self.medications.list_for_pet(pet_id))

    def update_medication(
        self, user: User, pet_id: UUID, item_id: UUID, payload: MedicationUpdate
    ) -> Medication:
        self._owned_pet(pet_id, user)
        item = self.medications.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Medication not found")
        _apply(item, payload.model_dump(exclude_unset=True))
        return self.medications.save(item)

    def delete_medication(self, user: User, pet_id: UUID, item_id: UUID) -> None:
        self._owned_pet(pet_id, user)
        item = self.medications.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Medication not found")
        self.medications.delete(item)

    def create_visit(self, user: User, pet_id: UUID, payload: VisitCreate) -> VeterinaryVisit:
        self._owned_pet(pet_id, user)
        return self.visits.add(VeterinaryVisit(pet_id=pet_id, **payload.model_dump()))

    def list_visits(self, user: User, pet_id: UUID) -> list[VeterinaryVisit]:
        self._owned_pet(pet_id, user)
        return list(self.visits.list_for_pet(pet_id))

    def update_visit(self, user: User, pet_id: UUID, item_id: UUID, payload: VisitUpdate) -> VeterinaryVisit:
        self._owned_pet(pet_id, user)
        item = self.visits.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Visit not found")
        _apply(item, payload.model_dump(exclude_unset=True))
        return self.visits.save(item)

    def delete_visit(self, user: User, pet_id: UUID, item_id: UUID) -> None:
        self._owned_pet(pet_id, user)
        item = self.visits.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Visit not found")
        self.visits.delete(item)

    def create_weight(self, user: User, pet_id: UUID, payload: WeightCreate) -> WeightRecord:
        pet = self._owned_pet(pet_id, user)
        record = WeightRecord(
            pet_id=pet_id,
            weight=payload.weight,
            recorded_at=payload.recorded_at or datetime.now(timezone.utc),
            notes=payload.notes,
        )
        record = self.weights.add(record)
        pet.weight = payload.weight
        self.pets.save(pet)
        return record

    def list_weights(self, user: User, pet_id: UUID) -> WeightStats:
        self._owned_pet(pet_id, user)
        records = list(self.weights.list_for_pet(pet_id))
        values = [Decimal(record.weight) for record in records]
        change = None
        if len(values) >= 2:
            change = values[-1] - values[-2]
        return WeightStats(
            current=values[-1] if values else None,
            minimum=min(values) if values else None,
            maximum=max(values) if values else None,
            change_from_previous=change,
            records=[WeightOut.model_validate(record) for record in records],
        )

    def delete_weight(self, user: User, pet_id: UUID, item_id: UUID) -> None:
        self._owned_pet(pet_id, user)
        item = self.weights.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Weight record not found")
        self.weights.delete(item)

    def create_reminder(self, user: User, pet_id: UUID, payload: ReminderCreate) -> Reminder:
        self._owned_pet(pet_id, user)
        reminder_type = payload.type if payload.type in ALLOWED_REMINDER_TYPES else "custom"
        repeat_rule = payload.repeat_rule if payload.repeat_rule in ALLOWED_REPEAT_RULES else "none"
        return self.reminders.add(
            Reminder(
                pet_id=pet_id,
                type=reminder_type,
                title=payload.title,
                description=payload.description,
                due_at=payload.due_at,
                repeat_rule=repeat_rule,
            )
        )

    def list_reminders(self, user: User, pet_id: UUID) -> list[Reminder]:
        self._owned_pet(pet_id, user)
        return list(self.reminders.list_for_pet(pet_id))

    def list_all_reminders(self, user: User) -> list[Reminder]:
        pets = self.list_pets(user)
        return list(self.reminders.list_for_owner_pets([pet.id for pet in pets]))

    def update_reminder(
        self, user: User, pet_id: UUID, item_id: UUID, payload: ReminderUpdate
    ) -> Reminder:
        self._owned_pet(pet_id, user)
        item = self.reminders.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Reminder not found")
        data = payload.model_dump(exclude_unset=True)
        if data.get("completed") is True and not item.completed:
            data["completed_at"] = datetime.now(timezone.utc)
        if data.get("completed") is False:
            data["completed_at"] = None
        _apply(item, data)
        return self.reminders.save(item)

    def delete_reminder(self, user: User, pet_id: UUID, item_id: UUID) -> None:
        self._owned_pet(pet_id, user)
        item = self.reminders.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Reminder not found")
        self.reminders.delete(item)

    def create_nutrition_plan(self, user: User, pet_id: UUID, payload: NutritionPlanCreate) -> NutritionPlan:
        self._owned_pet(pet_id, user)
        return self.nutrition.add(NutritionPlan(pet_id=pet_id, **payload.model_dump()))

    def list_nutrition_plans(self, user: User, pet_id: UUID) -> list[NutritionPlan]:
        self._owned_pet(pet_id, user)
        return list(self.nutrition.list_for_pet(pet_id))

    def update_nutrition_plan(
        self, user: User, pet_id: UUID, item_id: UUID, payload: NutritionPlanUpdate
    ) -> NutritionPlan:
        self._owned_pet(pet_id, user)
        item = self.nutrition.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Nutrition plan not found")
        _apply(item, payload.model_dump(exclude_unset=True))
        return self.nutrition.save(item)

    def delete_nutrition_plan(self, user: User, pet_id: UUID, item_id: UUID) -> None:
        self._owned_pet(pet_id, user)
        item = self.nutrition.get(item_id)
        if item is None or item.pet_id != pet_id:
            raise NotFoundError("Nutrition plan not found")
        self.nutrition.delete(item)

    def create_feeding(self, user: User, pet_id: UUID, payload: FeedingLogCreate) -> FeedingLog:
        self._owned_pet(pet_id, user)
        return self.feedings.add(
            FeedingLog(
                pet_id=pet_id,
                nutrition_plan_id=payload.nutrition_plan_id,
                food_name=payload.food_name,
                amount=payload.amount,
                fed_at=payload.fed_at or datetime.now(timezone.utc),
                notes=payload.notes,
            )
        )

    def list_feedings(self, user: User, pet_id: UUID) -> list[FeedingLog]:
        self._owned_pet(pet_id, user)
        return list(self.feedings.list_for_pet(pet_id))

    def dashboard(self, user: User, pet_id: UUID) -> DashboardOut:
        pet = self._owned_pet(pet_id, user)
        weights = list(self.weights.list_for_pet(pet_id))
        visits = list(self.visits.list_for_pet(pet_id))
        return DashboardOut(
            pet=PetOut.model_validate(pet),
            upcoming_vaccination=VaccinationOut.model_validate(item)
            if (item := self.vaccinations.upcoming_for_pet(pet_id))
            else None,
            active_medications=[MedicationOut.model_validate(m) for m in self.medications.active_for_pet(pet_id)],
            upcoming_visit=VisitOut.model_validate(item)
            if (item := self.visits.upcoming_for_pet(pet_id))
            else None,
            todays_reminders=[ReminderOut.model_validate(r) for r in self.reminders.today_for_pet(pet_id)],
            recent_weights=[WeightOut.model_validate(w) for w in weights[-5:]],
            todays_feedings=[FeedingLogOut.model_validate(f) for f in self.feedings.today_for_pet(pet_id)],
            recent_visits=[VisitOut.model_validate(v) for v in visits[:3]],
        )

    def health_passport(self, user: User, pet_id: UUID) -> HealthPassportOut:
        pet = self._owned_pet(pet_id, user)
        return HealthPassportOut(
            pet=PetOut.model_validate(pet),
            vaccinations=[VaccinationOut.model_validate(item) for item in self.vaccinations.list_for_pet(pet_id)],
            medications=[MedicationOut.model_validate(item) for item in self.medications.list_for_pet(pet_id)],
            visits=[VisitOut.model_validate(item) for item in self.visits.list_for_pet(pet_id)],
            weights=[WeightOut.model_validate(item) for item in self.weights.list_for_pet(pet_id)],
            nutrition_plans=[NutritionPlanOut.model_validate(item) for item in self.nutrition.list_for_pet(pet_id)],
            important_notes=pet.notes,
        )
