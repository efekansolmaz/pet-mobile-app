from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.medication import Medication
from app.models.nutrition import FeedingLog, NutritionPlan
from app.models.pet import Pet
from app.models.reminder import Reminder
from app.models.user import User
from app.models.vaccination import Vaccination
from app.models.visit import VeterinaryVisit
from app.models.weight import WeightRecord


def seed(db: Session) -> None:
    existing = db.query(User).filter(User.email == "demo@petcare.app").first()
    if existing:
        print("Seed data already exists")
        return

    user = User(name="Demo User", email="demo@petcare.app", password_hash=hash_password("Demo1234!"))
    db.add(user)
    db.flush()

    max_pet = Pet(
        owner_id=user.id,
        name="Max",
        species="dog",
        breed="Golden Retriever",
        gender="male",
        birth_date=date(2021, 4, 12),
        weight=Decimal("28.40"),
        color="Golden",
        notes="Friendly, loves swimming, mild seasonal allergies.",
        microchip_id="981000123456789",
    )
    luna = Pet(
        owner_id=user.id,
        name="Luna",
        species="cat",
        breed="British Shorthair",
        gender="female",
        birth_date=date(2022, 9, 3),
        weight=Decimal("4.20"),
        color="Blue-gray",
        notes="Indoor cat. Prefers wet food in the evening.",
        microchip_id="981000987654321",
    )
    db.add_all([max_pet, luna])
    db.flush()

    today = date.today()
    now = datetime.now(timezone.utc)

    db.add_all(
        [
            Vaccination(
                pet_id=max_pet.id,
                vaccine_name="Rabies",
                date_administered=today - timedelta(days=340),
                next_due_date=today + timedelta(days=25),
                veterinarian="Dr. Ayşe Kaya",
                notes="Annual booster",
            ),
            Vaccination(
                pet_id=max_pet.id,
                vaccine_name="DHPP",
                date_administered=today - timedelta(days=180),
                next_due_date=today + timedelta(days=185),
                veterinarian="Dr. Ayşe Kaya",
            ),
            Vaccination(
                pet_id=luna.id,
                vaccine_name="FVRCP",
                date_administered=today - timedelta(days=90),
                next_due_date=today + timedelta(days=275),
                veterinarian="Dr. Emre Demir",
            ),
            Medication(
                pet_id=max_pet.id,
                medication_name="Apoquel",
                dosage="16 mg",
                frequency="Once daily at 20:00",
                start_date=today - timedelta(days=10),
                end_date=today + timedelta(days=20),
                notes="For seasonal itching",
            ),
            Medication(
                pet_id=luna.id,
                medication_name="Revolution Plus",
                dosage="1 pipette",
                frequency="Once monthly",
                start_date=today - timedelta(days=5),
                end_date=today + timedelta(days=360),
            ),
            VeterinaryVisit(
                pet_id=max_pet.id,
                veterinarian_name="Dr. Ayşe Kaya",
                clinic_name="Paws & Care Clinic",
                visit_date=today - timedelta(days=32),
                reason="Annual checkup and allergy follow-up",
                diagnosis="Mild atopic dermatitis",
                treatment="Antihistamine course and diet review",
                next_visit_date=today + timedelta(days=14),
            ),
            VeterinaryVisit(
                pet_id=luna.id,
                veterinarian_name="Dr. Emre Demir",
                clinic_name="City Cat Hospital",
                visit_date=today - timedelta(days=60),
                reason="Dental cleaning",
                diagnosis="Mild tartar",
                treatment="Professional cleaning",
                next_visit_date=today + timedelta(days=305),
            ),
            NutritionPlan(
                pet_id=max_pet.id,
                food_name="Adult Sensitive Salmon",
                brand="Acana",
                feeding_amount="280 g / day",
                feeding_frequency="2 meals: 08:00 and 19:00",
            ),
            NutritionPlan(
                pet_id=luna.id,
                food_name="Indoor Adult",
                brand="Royal Canin",
                feeding_amount="55 g dry + 1 pouch wet",
                feeding_frequency="Morning dry, evening wet",
            ),
        ]
    )

    for offset, weight in [(90, "29.10"), (60, "28.80"), (30, "28.50"), (0, "28.40")]:
        db.add(
            WeightRecord(
                pet_id=max_pet.id,
                weight=Decimal(weight),
                recorded_at=now - timedelta(days=offset),
            )
        )
    for offset, weight in [(75, "4.05"), (40, "4.15"), (0, "4.20")]:
        db.add(
            WeightRecord(
                pet_id=luna.id,
                weight=Decimal(weight),
                recorded_at=now - timedelta(days=offset),
            )
        )

    db.add_all(
        [
            Reminder(
                pet_id=max_pet.id,
                type="medication",
                title="Give Apoquel",
                description="16 mg with dinner",
                due_at=now.replace(hour=17, minute=0, second=0, microsecond=0),
                repeat_rule="daily",
            ),
            Reminder(
                pet_id=max_pet.id,
                type="vaccination",
                title="Rabies booster",
                due_at=now + timedelta(days=25),
                repeat_rule="none",
            ),
            Reminder(
                pet_id=luna.id,
                type="grooming",
                title="Nail trim",
                due_at=now + timedelta(days=3),
                repeat_rule="monthly",
            ),
            Reminder(
                pet_id=luna.id,
                type="feeding",
                title="Evening wet food",
                due_at=now.replace(hour=16, minute=0, second=0, microsecond=0),
                repeat_rule="daily",
            ),
            FeedingLog(
                pet_id=max_pet.id,
                food_name="Adult Sensitive Salmon",
                amount="140 g",
                fed_at=now.replace(hour=5, minute=10, second=0, microsecond=0),
            ),
        ]
    )
    db.commit()
    print("Seeded demo@petcare.app / Demo1234!")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed(session)
