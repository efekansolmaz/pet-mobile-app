import json
from collections.abc import Callable
from typing import Any

from app.ai.provider import AIProvider, ChatTurn


class HeuristicProvider(AIProvider):
    name = "heuristic"

    async def complete(
        self,
        messages: list[dict[str, str]],
        tools: list[dict[str, Any]],
        tool_executor: Callable[[str, dict[str, Any]], Any],
    ) -> ChatTurn:
        last_user = next((item["content"] for item in reversed(messages) if item["role"] == "user"), "")
        query = last_user.lower()
        used: list[str] = []

        def call(name: str, **kwargs: Any) -> Any:
            used.append(name)
            return tool_executor(name, kwargs)

        pet_name = None
        for candidate in ("max", "luna"):
            if candidate in query:
                pet_name = candidate.title()

        medical_terms = (
            "teşhis",
            "diagnose",
            "prescription",
            "reçete",
            "recete",
            "hastalık",
            "hastalik",
            "disease",
            "kus",
            "ateş",
            "ates",
            "ishal",
            "ne ilaç",
            "ne ilac",
            "ilaç ver",
            "ilac ver",
            "hasta",
            "ağrı",
            "agri",
            "sick",
            "vomit",
            "fever",
        )
        if any(term in query for term in medical_terms):
            return ChatTurn(
                "Ben bir veteriner hekim değilim (I am not a veterinarian) ve teşhis koyamam veya ilaç reçete edemem. "
                "Lütfen evcil hayvanınızın sağlık durumu için bir veteriner kliniğine danışınız. "
                "PetCare üzerinden sadece daha önce kaydedilmiş aşı, kilo, randevu ve bakım verilerinizi sorgulayabilirsiniz.",
                used,
                self.name,
            )

        if any(term in query for term in ("kilo", "weight", "kg")):
            data = call("get_weight_history", pet_name=pet_name, limit=3)
            records = data.get("records") or []
            if not records:
                return ChatTurn("I could not find weight records for that pet.", used, self.name)
            latest = records[-1]
            history = ", ".join(f"{item['weight']} kg on {item['recorded_at'][:10]}" for item in records)
            return ChatTurn(
                f"Latest recorded weight is {latest['weight']} kg. Recent measurements: {history}. "
                "This is record data only, not a medical assessment.",
                used,
                self.name,
            )

        if any(term in query for term in ("aşı", "asi", "vaccin")):
            data = call("get_vaccination_history", pet_name=pet_name)
            if not data:
                return ChatTurn("There are no vaccination records yet.", used, self.name)
            upcoming = next((item for item in data if item.get("next_due_date")), data[0])
            return ChatTurn(
                f"{upcoming['vaccine_name']} was last given on {upcoming['date_administered']}. "
                f"Next due date: {upcoming.get('next_due_date') or 'not set'}.",
                used,
                self.name,
            )

        if any(term in query for term in ("ilaç", "ilac", "medication", "medicine", "drug")):
            data = call("get_medication_schedule", pet_name=pet_name)
            active = [item for item in data if not item.get("is_completed")]
            if not active:
                return ChatTurn("There are no active medications recorded for today.", used, self.name)
            lines = [
                f"{item['medication_name']} — {item['dosage']}, {item['frequency']}"
                for item in active
            ]
            return ChatTurn("Recorded medication schedule:\n" + "\n".join(lines), used, self.name)

        if any(term in query for term in ("veteriner", "vet", "visit", "klinik")):
            data = call("get_veterinary_visits", pet_name=pet_name)
            if not data:
                return ChatTurn("No veterinary visits are recorded yet.", used, self.name)
            latest = data[0]
            return ChatTurn(
                f"The most recent visit was on {latest['visit_date']} at {latest.get('clinic_name') or 'an unspecified clinic'} "
                f"with {latest['veterinarian_name']}. Reason: {latest.get('reason') or 'not specified'}.",
                used,
                self.name,
            )

        if any(term in query for term in ("besle", "food", "nutrition", "yemek", "mama")):
            data = call("get_nutrition_information", pet_name=pet_name)
            plans = data.get("plans") or []
            if not plans:
                return ChatTurn("No nutrition plan is saved yet.", used, self.name)
            plan = plans[0]
            return ChatTurn(
                f"{plan['food_name']} ({plan.get('brand') or 'no brand'}) — {plan['feeding_amount']}, {plan['feeding_frequency']}.",
                used,
                self.name,
            )

        if any(term in query for term in ("hatırlat", "reminder", "bugün")):
            data = call("get_upcoming_reminders", pet_name=pet_name)
            if not data:
                return ChatTurn("There are no upcoming reminders.", used, self.name)
            lines = [f"{item['title']} at {item['due_at']}" for item in data[:5]]
            return ChatTurn("Upcoming reminders:\n" + "\n".join(lines), used, self.name)

        profile = call("get_pet_profile", pet_name=pet_name)
        return ChatTurn(
            f"I can help with {profile.get('name')}'s saved records: vaccinations, medications, visits, weight, nutrition, and reminders. "
            "Ask something specific, such as the latest weight or the next vaccination date. "
            "I am not a veterinarian and I do not diagnose pets.",
            used,
            self.name,
        )
