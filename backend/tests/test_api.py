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


def test_unauthenticated_pets_are_protected(client):
    response = client.get("/api/v1/pets")
    assert response.status_code == 401
