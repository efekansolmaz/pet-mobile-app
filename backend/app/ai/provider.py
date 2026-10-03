from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

from app.core.config import Settings


class ChatTurn:
    def __init__(self, content: str, used_tools: list[str], provider: str) -> None:
        self.content = content
        self.used_tools = used_tools
        self.provider = provider


class AIProvider(ABC):
    name: str

    @abstractmethod
    async def complete(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]],
        tool_executor: Callable[[str, dict[str, Any]], Any],
    ) -> ChatTurn:
        raise NotImplementedError


def build_provider(settings: Settings) -> AIProvider:
    provider = settings.ai_provider
    if provider == "openai" and settings.openai_api_key:
        from app.ai.openai_provider import OpenAICompatibleProvider

        return OpenAICompatibleProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            base_url="https://api.openai.com/v1",
            name="openai",
        )
    if provider == "anthropic" and settings.anthropic_api_key:
        from app.ai.openai_provider import OpenAICompatibleProvider

        return OpenAICompatibleProvider(
            api_key=settings.anthropic_api_key,
            model="claude-3-5-haiku-latest",
            base_url="https://api.anthropic.com/v1",
            name="anthropic",
        )
    if provider == "ollama":
        from app.ai.openai_provider import OpenAICompatibleProvider

        return OpenAICompatibleProvider(
            api_key="ollama",
            model=settings.ollama_model,
            base_url=f"{settings.ollama_base_url}/v1",
            name="ollama",
        )
    from app.ai.heuristic_provider import HeuristicProvider

    return HeuristicProvider()
