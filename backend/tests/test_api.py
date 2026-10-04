from tests.conftest import auth_headers


def test_register_login_and_me(client):
    register = client.post(
        "/api/v1/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "Password123"},
    )
    assert register.status_code == 200
    login = client.post("/api/v1/auth/login", json={"email": "ada@example.com", "password": "Password123"})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == "ada@example.com"


def test_login_rejects_bad_password(client):
    client.post("/api/v1/auth/register", json={"name": "Ada", "email": "ada@example.com", "password": "Password123"})
    response = client.post("/api/v1/auth/login", json={"email": "ada@example.com", "password": "wrong-pass"})
    assert response.status_code == 401


def test_pet_crud(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/pets",
        headers=headers,
        json={"name": "Max", "species": "dog", "breed": "Retriever", "weight": 12.4},
    )
    assert created.status_code == 200
    pet_id = created.json()["id"]
    listed = client.get("/api/v1/pets", headers=headers)
    assert len(listed.json()) == 1
    updated = client.put(f"/api/v1/pets/{pet_id}", headers=headers, json={"color": "golden"})
    assert updated.json()["color"] == "golden"
    deleted = client.delete(f"/api/v1/pets/{pet_id}", headers=headers)
    assert deleted.status_code == 200


def test_user_cannot_access_another_users_pet(client):
    owner = auth_headers(client, "one@example.com")
    created = client.post("/api/v1/pets", headers=owner, json={"name": "Max", "species": "dog"})
    pet_id = created.json()["id"]
    other = auth_headers(client, "two@example.com")
    response = client.get(f"/api/v1/pets/{pet_id}", headers=other)
    assert response.status_code == 404


def test_vaccination_and_medication_and_reminders(client):
    headers = auth_headers(client)
    pet = client.post("/api/v1/pets", headers=headers, json={"name": "Luna", "species": "cat"}).json()
    pet_id = pet["id"]

    vaccine = client.post(
        f"/api/v1/pets/{pet_id}/vaccinations",
        headers=headers,
        json={"vaccine_name": "Rabies", "date_administered": "2026-01-01", "next_due_date": "2027-01-01"},
    )
    assert vaccine.status_code == 200

    med = client.post(
        f"/api/v1/pets/{pet_id}/medications",
        headers=headers,
        json={
            "medication_name": "Antibiotic",
            "dosage": "1 tablet",
            "frequency": "twice daily",
            "start_date": "2026-09-01",
        },
    )
    assert med.status_code == 200

    reminder = client.post(
        f"/api/v1/pets/{pet_id}/reminders",
        headers=headers,
        json={
            "type": "medication",
            "title": "Give antibiotic",
            "due_at": "2026-10-03T20:00:00Z",
            "repeat_rule": "daily",
        },
    )
    assert reminder.status_code == 200
    listed = client.get(f"/api/v1/pets/{pet_id}/reminders", headers=headers)
    assert listed.json()[0]["title"] == "Give antibiotic"


def test_veterinary_visits(client):
    headers = auth_headers(client)
    pet = client.post("/api/v1/pets", headers=headers, json={"name": "Buddy", "species": "dog"}).json()
    pet_id = pet["id"]

    visit = client.post(
        f"/api/v1/pets/{pet_id}/visits",
        headers=headers,
        json={
            "veterinarian_name": "Dr. Smith",
            "clinic_name": "Downtown Vet",
            "visit_date": "2026-05-10",
            "reason": "Annual Checkup",
            "diagnosis": "Healthy heart and lungs",
            "treatment": "Routine check completed",
            "next_visit_date": "2027-05-10",
        },
    )
    assert visit.status_code == 200
    assert visit.json()["veterinarian_name"] == "Dr. Smith"

    listed = client.get(f"/api/v1/pets/{pet_id}/visits", headers=headers)
    assert len(listed.json()) == 1


def test_weight_tracking_and_stats(client):
    headers = auth_headers(client)
    pet = client.post("/api/v1/pets", headers=headers, json={"name": "Milo", "species": "cat"}).json()
    pet_id = pet["id"]

    w1 = client.post(
        f"/api/v1/pets/{pet_id}/weights",
        headers=headers,
        json={"weight": 4.1, "recorded_at": "2026-01-01T10:00:00Z"},
    )
    assert w1.status_code == 200

    w2 = client.post(
        f"/api/v1/pets/{pet_id}/weights",
        headers=headers,
        json={"weight": 4.3, "recorded_at": "2026-02-01T10:00:00Z"},
    )
    assert w2.status_code == 200

    stats = client.get(f"/api/v1/pets/{pet_id}/weights", headers=headers)
    assert stats.status_code == 200
    data = stats.json()
    assert float(data["current"]) == 4.3
    assert float(data["minimum"]) == 4.1
    assert float(data["maximum"]) == 4.3
    assert len(data["records"]) == 2


def test_nutrition_and_feeding(client):
    headers = auth_headers(client)
    pet = client.post("/api/v1/pets", headers=headers, json={"name": "Bella", "species": "dog"}).json()
    pet_id = pet["id"]

    plan = client.post(
        f"/api/v1/pets/{pet_id}/nutrition",
        headers=headers,
        json={
            "food_name": "Premium Salmon",
            "brand": "Acana",
            "feeding_amount": "250g / day",
            "feeding_frequency": "Twice daily",
        },
    )
    assert plan.status_code == 200
    assert plan.json()["food_name"] == "Premium Salmon"

    feed = client.post(
        f"/api/v1/pets/{pet_id}/feedings",
        headers=headers,
        json={
            "food_name": "Premium Salmon",
            "amount": "125g",
            "fed_at": "2026-10-04T08:00:00Z",
        },
    )
    assert feed.status_code == 200


def test_dashboard_and_passport(client):
    headers = auth_headers(client)
    pet = client.post(
        "/api/v1/pets",
        headers=headers,
        json={"name": "Oscar", "species": "dog", "breed": "Beagle", "weight": 11.5},
    ).json()
    pet_id = pet["id"]

    # Add a vaccine
    client.post(
        f"/api/v1/pets/{pet_id}/vaccinations",
        headers=headers,
        json={"vaccine_name": "Rabies", "date_administered": "2026-03-01", "next_due_date": "2027-03-01"},
    )

    # Get dashboard
    dash = client.get(f"/api/v1/pets/{pet_id}/dashboard", headers=headers)
    assert dash.status_code == 200
    dash_data = dash.json()
    assert dash_data["pet"]["name"] == "Oscar"
    assert dash_data["upcoming_vaccination"]["vaccine_name"] == "Rabies"

    # Get passport
    passport = client.get(f"/api/v1/pets/{pet_id}/passport", headers=headers)
    assert passport.status_code == 200
    pass_data = passport.json()
    assert pass_data["pet"]["name"] == "Oscar"
    assert len(pass_data["vaccinations"]) == 1


def test_ai_assistant_chat(client):
    headers = auth_headers(client)
    pet = client.post(
        "/api/v1/pets",
        headers=headers,
        json={"name": "Max", "species": "dog", "weight": 28.4},
    ).json()
    pet_id = pet["id"]

    # Ask about weight
    chat_resp = client.post(
        "/api/v1/ai/chat",
        headers=headers,
        json={
            "pet_id": pet_id,
            "messages": [{"role": "user", "content": "Son kilosu kaç?"}],
        },
    )
    assert chat_resp.status_code == 200
    body = chat_resp.json()
    assert "28.4" in body["message"] or "kilo" in body["message"].lower() or "weight" in body["message"].lower()

    # Ask medical question - verify disclaimer
    med_resp = client.post(
        "/api/v1/ai/chat",
        headers=headers,
        json={
            "pet_id": pet_id,
            "messages": [{"role": "user", "content": "Kusuyor ve ateşi var, ne ilaç vereyim?"}],
        },
    )
    assert med_resp.status_code == 200
    assert "veteriner" in med_resp.json()["message"].lower()


def test_unauthenticated_pets_are_protected(client):
    response = client.get("/api/v1/pets")
    assert response.status_code == 401
