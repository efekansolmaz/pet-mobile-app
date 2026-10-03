from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserOut(ORMModel):
    id: UUID
    name: str
    email: EmailStr
    created_at: datetime


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)


class PetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    species: str = Field(min_length=1, max_length=50)
    breed: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    weight: Decimal | None = Field(default=None, gt=0)
    color: str | None = None
    notes: str | None = None
    microchip_id: str | None = None


class PetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    species: str | None = None
    breed: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    weight: Decimal | None = Field(default=None, gt=0)
    color: str | None = None
    notes: str | None = None
    photo_url: str | None = None
    microchip_id: str | None = None


class PetOut(ORMModel):
    id: UUID
    owner_id: UUID
    name: str
    species: str
    breed: str | None
    gender: str | None
    birth_date: date | None
    weight: Decimal | None
    color: str | None
    photo_url: str | None
    notes: str | None
    microchip_id: str | None
    created_at: datetime
    updated_at: datetime


class VaccinationCreate(BaseModel):
    vaccine_name: str = Field(min_length=1, max_length=160)
    date_administered: date
    next_due_date: date | None = None
    veterinarian: str | None = None
    notes: str | None = None
    document_url: str | None = None


class VaccinationUpdate(VaccinationCreate):
    vaccine_name: str | None = None
    date_administered: date | None = None


class VaccinationOut(ORMModel):
    id: UUID
    pet_id: UUID
    vaccine_name: str
    date_administered: date
    next_due_date: date | None
    veterinarian: str | None
    notes: str | None
    document_url: str | None
    created_at: datetime


class MedicationCreate(BaseModel):
    medication_name: str = Field(min_length=1, max_length=160)
    dosage: str = Field(min_length=1, max_length=120)
    frequency: str = Field(min_length=1, max_length=120)
    start_date: date
    end_date: date | None = None
    notes: str | None = None


class MedicationUpdate(BaseModel):
    medication_name: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = None
    is_completed: bool | None = None


class MedicationOut(ORMModel):
    id: UUID
    pet_id: UUID
    medication_name: str
    dosage: str
    frequency: str
    start_date: date
    end_date: date | None
    notes: str | None
    is_completed: bool
    created_at: datetime


class VisitCreate(BaseModel):
    veterinarian_name: str = Field(min_length=1, max_length=160)
    clinic_name: str | None = None
    visit_date: date
    reason: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    notes: str | None = None
    next_visit_date: date | None = None


class VisitUpdate(BaseModel):
    veterinarian_name: str | None = None
    clinic_name: str | None = None
    visit_date: date | None = None
    reason: str | None = None
    diagnosis: str | None = None
    treatment: str | None = None
    notes: str | None = None
    next_visit_date: date | None = None


class VisitOut(ORMModel):
    id: UUID
    pet_id: UUID
    veterinarian_name: str
    clinic_name: str | None
    visit_date: date
    reason: str | None
    diagnosis: str | None
    treatment: str | None
    notes: str | None
    next_visit_date: date | None
    created_at: datetime


class WeightCreate(BaseModel):
    weight: Decimal = Field(gt=0)
    recorded_at: datetime | None = None
    notes: str | None = None


class WeightOut(ORMModel):
    id: UUID
    pet_id: UUID
    weight: Decimal
    recorded_at: datetime
    notes: str | None


class WeightStats(BaseModel):
    current: Decimal | None
    minimum: Decimal | None
    maximum: Decimal | None
    change_from_previous: Decimal | None
    records: list[WeightOut]


class ReminderCreate(BaseModel):
    type: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=160)
    description: str | None = None
    due_at: datetime
    repeat_rule: str = "none"


class ReminderUpdate(BaseModel):
    type: str | None = None
    title: str | None = None
    description: str | None = None
    due_at: datetime | None = None
    repeat_rule: str | None = None
    completed: bool | None = None


class ReminderOut(ORMModel):
    id: UUID
    pet_id: UUID
    type: str
    title: str
    description: str | None
    due_at: datetime
    repeat_rule: str
    completed: bool
    completed_at: datetime | None
    created_at: datetime


class NutritionPlanCreate(BaseModel):
    food_name: str = Field(min_length=1, max_length=160)
    brand: str | None = None
    feeding_amount: str = Field(min_length=1, max_length=80)
    feeding_frequency: str = Field(min_length=1, max_length=120)
    notes: str | None = None
    is_active: bool = True


class NutritionPlanUpdate(BaseModel):
    food_name: str | None = None
    brand: str | None = None
    feeding_amount: str | None = None
    feeding_frequency: str | None = None
    notes: str | None = None
    is_active: bool | None = None


class NutritionPlanOut(ORMModel):
    id: UUID
    pet_id: UUID
    food_name: str
    brand: str | None
    feeding_amount: str
    feeding_frequency: str
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class FeedingLogCreate(BaseModel):
    nutrition_plan_id: UUID | None = None
    food_name: str = Field(min_length=1, max_length=160)
    amount: str = Field(min_length=1, max_length=80)
    fed_at: datetime | None = None
    notes: str | None = None


class FeedingLogOut(ORMModel):
    id: UUID
    pet_id: UUID
    nutrition_plan_id: UUID | None
    food_name: str
    amount: str
    fed_at: datetime
    notes: str | None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    pet_id: UUID | None = None


class ChatResponse(BaseModel):
    reply: str
    provider: str
    used_tools: list[str] = []


class DashboardOut(BaseModel):
    pet: PetOut
    upcoming_vaccination: VaccinationOut | None = None
    active_medications: list[MedicationOut] = []
    upcoming_visit: VisitOut | None = None
    todays_reminders: list[ReminderOut] = []
    recent_weights: list[WeightOut] = []
    todays_feedings: list[FeedingLogOut] = []
    recent_visits: list[VisitOut] = []


class HealthPassportOut(BaseModel):
    pet: PetOut
    vaccinations: list[VaccinationOut]
    medications: list[MedicationOut]
    visits: list[VisitOut]
    weights: list[WeightOut]
    nutrition_plans: list[NutritionPlanOut]
    important_notes: str | None
