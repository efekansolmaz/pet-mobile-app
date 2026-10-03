from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas import ChatRequest, ChatResponse, ReminderOut
from app.ai.service import AssistantService
from app.services.petcare import PetCareService

router = APIRouter(tags=["assistant"])


@router.post("/ai/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatResponse:
    return await AssistantService(db).chat(user, payload.messages, payload.pet_id)


@router.get("/reminders", response_model=list[ReminderOut])
def list_all_reminders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ReminderOut]:
    return [ReminderOut.model_validate(item) for item in PetCareService(db).list_all_reminders(user)]
