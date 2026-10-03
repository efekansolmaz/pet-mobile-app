from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_care_service, get_current_user
from app.models.user import User
from app.schemas import PetCreate, PetOut, PetUpdate
from app.services.petcare import PetCareService
from app.services.storage import StorageService

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("", response_model=list[PetOut])
def list_pets(
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> list[PetOut]:
    return [PetOut.model_validate(pet) for pet in service.list_pets(user)]


@router.post("", response_model=PetOut)
def create_pet(
    payload: PetCreate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> PetOut:
    return PetOut.model_validate(service.create_pet(user, payload))


@router.get("/{pet_id}", response_model=PetOut)
def get_pet(
    pet_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> PetOut:
    return PetOut.model_validate(service.get_pet(user, pet_id))


@router.put("/{pet_id}", response_model=PetOut)
def update_pet(
    pet_id: UUID,
    payload: PetUpdate,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> PetOut:
    return PetOut.model_validate(service.update_pet(user, pet_id, payload))


@router.delete("/{pet_id}")
def delete_pet(
    pet_id: UUID,
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> dict[str, str]:
    service.delete_pet(user, pet_id)
    return {"status": "deleted"}


@router.post("/{pet_id}/photo", response_model=PetOut)
async def upload_photo(
    pet_id: UUID,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    service: PetCareService = Depends(get_care_service),
) -> PetOut:
    url = await StorageService().save(file, "pets")
    return PetOut.model_validate(service.update_pet(user, pet_id, PetUpdate(photo_url=url)))
