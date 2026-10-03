from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_care_service, get_current_user
from app.models.user import User
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
from app.services.petcare import PetCareService
from app.services.storage import StorageService

router = APIRouter(prefix="/pets/{pet_id}", tags=["health"])


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(
    pet_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> DashboardOut:
    return service.dashboard(user, pet_id)


@router.get("/passport", response_model=HealthPassportOut)
def passport(
    pet_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> HealthPassportOut:
    return service.health_passport(user, pet_id)


@router.get("/vaccinations", response_model=list[VaccinationOut])
def list_vaccinations(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> list[VaccinationOut]:
    return [VaccinationOut.model_validate(item) for item in service.list_vaccinations(user, pet_id)]


@router.post("/vaccinations", response_model=VaccinationOut)
def create_vaccination(
    pet_id: UUID,
    payload: VaccinationCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> VaccinationOut:
    return VaccinationOut.model_validate(service.create_vaccination(user, pet_id, payload))


@router.put("/vaccinations/{item_id}", response_model=VaccinationOut)
def update_vaccination(
    pet_id: UUID,
    item_id: UUID,
    payload: VaccinationUpdate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> VaccinationOut:
    return VaccinationOut.model_validate(service.update_vaccination(user, pet_id, item_id, payload))


@router.delete("/vaccinations/{item_id}")
def delete_vaccination(
    pet_id: UUID,
    item_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_vaccination(user, pet_id, item_id)
    return {"status": "deleted"}


@router.post("/vaccinations/{item_id}/document", response_model=VaccinationOut)
async def upload_vaccination_document(
    pet_id: UUID,
    item_id: UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> VaccinationOut:
    url = await StorageService().save(file, "vaccinations")
    return VaccinationOut.model_validate(
        service.update_vaccination(user, pet_id, item_id, VaccinationUpdate(document_url=url))
    )


@router.get("/medications", response_model=list[MedicationOut])
def list_medications(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> list[MedicationOut]:
    return [MedicationOut.model_validate(item) for item in service.list_medications(user, pet_id)]


@router.post("/medications", response_model=MedicationOut)
def create_medication(
    pet_id: UUID,
    payload: MedicationCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> MedicationOut:
    return MedicationOut.model_validate(service.create_medication(user, pet_id, payload))


@router.put("/medications/{item_id}", response_model=MedicationOut)
def update_medication(
    pet_id: UUID,
    item_id: UUID,
    payload: MedicationUpdate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> MedicationOut:
    return MedicationOut.model_validate(service.update_medication(user, pet_id, item_id, payload))


@router.delete("/medications/{item_id}")
def delete_medication(
    pet_id: UUID,
    item_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_medication(user, pet_id, item_id)
    return {"status": "deleted"}


@router.get("/visits", response_model=list[VisitOut])
def list_visits(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> list[VisitOut]:
    return [VisitOut.model_validate(item) for item in service.list_visits(user, pet_id)]


@router.post("/visits", response_model=VisitOut)
def create_visit(
    pet_id: UUID,
    payload: VisitCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> VisitOut:
    return VisitOut.model_validate(service.create_visit(user, pet_id, payload))


@router.put("/visits/{item_id}", response_model=VisitOut)
def update_visit(
    pet_id: UUID,
    item_id: UUID,
    payload: VisitUpdate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> VisitOut:
    return VisitOut.model_validate(service.update_visit(user, pet_id, item_id, payload))


@router.delete("/visits/{item_id}")
def delete_visit(
    pet_id: UUID,
    item_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_visit(user, pet_id, item_id)
    return {"status": "deleted"}


@router.get("/weights", response_model=WeightStats)
def list_weights(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> WeightStats:
    return service.list_weights(user, pet_id)


@router.post("/weights", response_model=WeightOut)
def create_weight(
    pet_id: UUID,
    payload: WeightCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> WeightOut:
    return WeightOut.model_validate(service.create_weight(user, pet_id, payload))


@router.delete("/weights/{item_id}")
def delete_weight(
    pet_id: UUID,
    item_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_weight(user, pet_id, item_id)
    return {"status": "deleted"}


@router.get("/reminders", response_model=list[ReminderOut])
def list_reminders(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> list[ReminderOut]:
    return [ReminderOut.model_validate(item) for item in service.list_reminders(user, pet_id)]


@router.post("/reminders", response_model=ReminderOut)
def create_reminder(
    pet_id: UUID,
    payload: ReminderCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> ReminderOut:
    return ReminderOut.model_validate(service.create_reminder(user, pet_id, payload))


@router.put("/reminders/{item_id}", response_model=ReminderOut)
def update_reminder(
    pet_id: UUID,
    item_id: UUID,
    payload: ReminderUpdate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> ReminderOut:
    return ReminderOut.model_validate(service.update_reminder(user, pet_id, item_id, payload))


@router.delete("/reminders/{item_id}")
def delete_reminder(
    pet_id: UUID,
    item_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_reminder(user, pet_id, item_id)
    return {"status": "deleted"}


@router.get("/nutrition", response_model=list[NutritionPlanOut])
def list_nutrition(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> list[NutritionPlanOut]:
    return [NutritionPlanOut.model_validate(item) for item in service.list_nutrition_plans(user, pet_id)]


@router.post("/nutrition", response_model=NutritionPlanOut)
def create_nutrition(
    pet_id: UUID,
    payload: NutritionPlanCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> NutritionPlanOut:
    return NutritionPlanOut.model_validate(service.create_nutrition_plan(user, pet_id, payload))


@router.put("/nutrition/{item_id}", response_model=NutritionPlanOut)
def update_nutrition(
    pet_id: UUID,
    item_id: UUID,
    payload: NutritionPlanUpdate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> NutritionPlanOut:
    return NutritionPlanOut.model_validate(service.update_nutrition_plan(user, pet_id, item_id, payload))


@router.delete("/nutrition/{item_id}")
def delete_nutrition(
    pet_id: UUID,
    item_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_nutrition_plan(user, pet_id, item_id)
    return {"status": "deleted"}


@router.get("/feedings", response_model=list[FeedingLogOut])
def list_feedings(
    pet_id: UUID, user: User = Depends(get_current_user), service: PetCareService = Depends(get_care_service)
) -> list[FeedingLogOut]:
    return [FeedingLogOut.model_validate(item) for item in service.list_feedings(user, pet_id)]


@router.post("/feedings", response_model=FeedingLogOut)
def create_feeding(
    pet_id: UUID,
    payload: FeedingLogCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> FeedingLogOut:
    return FeedingLogOut.model_validate(service.create_feeding(user, pet_id, payload))
