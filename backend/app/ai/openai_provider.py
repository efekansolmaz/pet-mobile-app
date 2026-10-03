import json
from collections.abc import Callable
from typing import Any

import httpx

from app.ai.provider import AIProvider, ChatTurn
from app.core.exceptions import AppError


class OpenAICompatibleProvider(AIProvider):
    def __init__(self, api_key: str, model: str, base_url: str, name: str) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.name = name

    async def complete(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]],
        tool_executor: Callable[[str, dict[str, Any]], Any],
    ) -> ChatTurn:
        used_tools: list[str] = []
        conversation: list[dict[str, Any]] = list(messages)
        async with httpx.AsyncClient(timeout=45) as client:
            for _ in range(4):
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        "messages": conversation,
                        "tools": tools,
                        "temperature": 0.2,
                    },
                )
                if response.status_code >= 400:
                    raise AppError(502, "The AI provider is currently unavailable")
                payload = response.json()
                message = payload["choices"][0]["message"]
                tool_calls = message.get("tool_calls") or []
                if not tool_calls:
                    return ChatTurn(message.get("content") or "", used_tools, self.name)
                conversation.append(message)
                for call in tool_calls:
                    function = call["function"]
                    name = function["name"]
                    arguments = json.loads(function.get("arguments") or "{}")
                    used_tools.append(name)
                    result = tool_executor(name, arguments)
                    conversation.append(
                        {
                            "role": "tool",
                            "tool_call_id": call.get("id", name),
                            "name": name,
                            "content": json.dumps(result, default=str),
                        }
                    )
        return ChatTurn("I could not finish that request with the available pet records.", used_tools, self.name)
