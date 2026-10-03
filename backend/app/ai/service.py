import inspect
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.ai.provider import build_provider
from app.ai.tools import TOOL_DEFINITIONS, PetDataTools
from app.core.config import get_settings
from app.models.user import User
from app.schemas import ChatMessage, ChatResponse
from app.services.petcare import PetCareService

SYSTEM_PROMPT = """You are PetCare Assistant, a helpful pet-care companion inside a pet health app.
You only answer using the provided tools and the user's saved records.
You are not a veterinarian. Never diagnose, never prescribe, and never invent medical facts.
If the user asks a medical question, give general information only, state the limitation clearly, and recommend a veterinarian.
If a record is missing, say so instead of guessing.
Respond in the same language the user used.
"""


class AssistantService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.care = PetCareService(db)

    async def chat(self, user: User, messages: list[ChatMessage], pet_id: UUID | None) -> ChatResponse:
        tools = PetDataTools(self.care, user, pet_id)
        provider = build_provider(get_settings())

        def execute(name: str, arguments: dict[str, Any]) -> Any:
            method = getattr(tools, name, None)
            if method is None:
                return {"error": "Unknown tool"}
            kwargs = {key: value for key, value in arguments.items() if key in inspect.signature(method).parameters}
            try:
                return method(**kwargs)
            except Exception as exc:  # noqa: BLE001
                return {"error": str(exc)}

        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
        conversation.extend({"role": item.role, "content": item.content} for item in messages[-12:])
        turn = await provider.complete(conversation, TOOL_DEFINITIONS, execute)
        return ChatResponse(reply=turn.content, provider=turn.provider, used_tools=turn.used_tools)
