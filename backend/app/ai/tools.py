from datetime import date
from typing import Any
from uuid import UUID

from app.models.user import User
from app.services.petcare import PetCareService


class PetDataTools:
    def __init__(self, service: PetCareService, user: User, default_pet_id: UUID | None = None) -> None:
        self.service = service
        self.user = user
        self.default_pet_id = default_pet_id

    def _resolve_pet_id(self, pet_id: str | None, pet_name: str | None) -> UUID:
        pets = self.service.list_pets(self.user)
        if pet_id:
            return UUID(pet_id)
        if pet_name:
            match = next((pet for pet in pets if pet.name.lower() == pet_name.lower()), None)
            if match:
                return match.id
        if self.default_pet_id:
            return self.default_pet_id
        if len(pets) == 1:
            return pets[0].id
        if not pets:
            raise ValueError("No pets found for this account")
        return pets[0].id

    def get_pet_profile(self, pet_id: str | None = None, pet_name: str | None = None) -> dict[str, Any]:
        pet = self.service.get_pet(self.user, self._resolve_pet_id(pet_id, pet_name))
        age_years = None
        if pet.birth_date:
            today = date.today()
            age_years = today.year - pet.birth_date.year - (
                (today.month, today.day) < (pet.birth_date.month, pet.birth_date.day)
            )
        return {
            "id": str(pet.id),
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "gender": pet.gender,
            "birth_date": str(pet.birth_date) if pet.birth_date else None,
            "age_years": age_years,
            "weight": float(pet.weight) if pet.weight is not None else None,
            "color": pet.color,
            "notes": pet.notes,
        }

    def get_upcoming_reminders(self, pet_id: str | None = None, pet_name: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_pet_id(pet_id, pet_name)
        reminders = self.service.list_reminders(self.user, resolved)
        return [
            {
                "title": item.title,
                "type": item.type,
                "due_at": item.due_at.isoformat(),
                "completed": item.completed,
                "repeat_rule": item.repeat_rule,
            }
            for item in reminders
            if not item.completed
        ]

    def get_vaccination_history(self, pet_id: str | None = None, pet_name: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_pet_id(pet_id, pet_name)
        return [
            {
                "vaccine_name": item.vaccine_name,
                "date_administered": str(item.date_administered),
                "next_due_date": str(item.next_due_date) if item.next_due_date else None,
                "veterinarian": item.veterinarian,
                "notes": item.notes,
            }
            for item in self.service.list_vaccinations(self.user, resolved)
        ]

    def get_medication_schedule(self, pet_id: str | None = None, pet_name: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_pet_id(pet_id, pet_name)
        return [
            {
                "medication_name": item.medication_name,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "start_date": str(item.start_date),
                "end_date": str(item.end_date) if item.end_date else None,
                "is_completed": item.is_completed,
                "notes": item.notes,
            }
            for item in self.service.list_medications(self.user, resolved)
        ]

    def get_weight_history(
        self, pet_id: str | None = None, pet_name: str | None = None, limit: int = 10
    ) -> dict[str, Any]:
        resolved = self._resolve_pet_id(pet_id, pet_name)
        stats = self.service.list_weights(self.user, resolved)
        records = [
            {"weight": float(item.weight), "recorded_at": item.recorded_at.isoformat(), "notes": item.notes}
            for item in stats.records[-limit:]
        ]
        return {
            "current": float(stats.current) if stats.current is not None else None,
            "minimum": float(stats.minimum) if stats.minimum is not None else None,
            "maximum": float(stats.maximum) if stats.maximum is not None else None,
            "records": records,
        }

    def get_veterinary_visits(self, pet_id: str | None = None, pet_name: str | None = None) -> list[dict[str, Any]]:
        resolved = self._resolve_pet_id(pet_id, pet_name)
        return [
            {
                "veterinarian_name": item.veterinarian_name,
                "clinic_name": item.clinic_name,
                "visit_date": str(item.visit_date),
                "reason": item.reason,
                "diagnosis": item.diagnosis,
                "treatment": item.treatment,
                "next_visit_date": str(item.next_visit_date) if item.next_visit_date else None,
                "notes": item.notes,
            }
            for item in self.service.list_visits(self.user, resolved)
        ]

    def get_nutrition_information(self, pet_id: str | None = None, pet_name: str | None = None) -> dict[str, Any]:
        resolved = self._resolve_pet_id(pet_id, pet_name)
        plans = self.service.list_nutrition_plans(self.user, resolved)
        feedings = self.service.list_feedings(self.user, resolved)[:10]
        return {
            "plans": [
                {
                    "food_name": item.food_name,
                    "brand": item.brand,
                    "feeding_amount": item.feeding_amount,
                    "feeding_frequency": item.feeding_frequency,
                    "is_active": item.is_active,
                    "notes": item.notes,
                }
                for item in plans
            ],
            "recent_feedings": [
                {
                    "food_name": item.food_name,
                    "amount": item.amount,
                    "fed_at": item.fed_at.isoformat(),
                }
                for item in feedings
            ],
        }


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_pet_profile",
            "description": "Get identity and profile details for a pet belonging to the current user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_reminders",
            "description": "Get incomplete reminders for a pet.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_vaccination_history",
            "description": "Get vaccination records and next due dates.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_medication_schedule",
            "description": "Get medication dosage and schedule information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weight_history",
            "description": "Get recent weight measurements. Do not diagnose health from this data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                    "limit": {"type": "integer"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_veterinary_visits",
            "description": "Get veterinary visit history including reason, diagnosis, and treatment as recorded by the owner.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_nutrition_information",
            "description": "Get feeding plans and recent feeding logs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pet_id": {"type": "string"},
                    "pet_name": {"type": "string"},
                },
            },
        },
    },
]
