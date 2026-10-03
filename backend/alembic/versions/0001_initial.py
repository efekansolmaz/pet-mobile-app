from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "pets",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("owner_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("species", sa.String(length=50), nullable=False),
        sa.Column("breed", sa.String(length=120)),
        sa.Column("gender", sa.String(length=20)),
        sa.Column("birth_date", sa.Date()),
        sa.Column("weight", sa.Numeric(6, 2)),
        sa.Column("color", sa.String(length=80)),
        sa.Column("photo_url", sa.String(length=500)),
        sa.Column("notes", sa.Text()),
        sa.Column("microchip_id", sa.String(length=80)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_pets_owner_id", "pets", ["owner_id"])

    def child(name: str, extra: list[sa.Column]) -> None:
        columns = [
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("pet_id", sa.String(length=36), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
            *extra,
        ]
        op.create_table(name, *columns)
        op.create_index(f"ix_{name}_pet_id", name, ["pet_id"])

    child(
        "vaccinations",
        [
            sa.Column("vaccine_name", sa.String(length=160), nullable=False),
            sa.Column("date_administered", sa.Date(), nullable=False),
            sa.Column("next_due_date", sa.Date()),
            sa.Column("veterinarian", sa.String(length=160)),
            sa.Column("notes", sa.Text()),
            sa.Column("document_url", sa.String(length=500)),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        ],
    )
    child(
        "medications",
        [
            sa.Column("medication_name", sa.String(length=160), nullable=False),
            sa.Column("dosage", sa.String(length=120), nullable=False),
            sa.Column("frequency", sa.String(length=120), nullable=False),
            sa.Column("start_date", sa.Date(), nullable=False),
            sa.Column("end_date", sa.Date()),
            sa.Column("notes", sa.Text()),
            sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        ],
    )
    child(
        "veterinary_visits",
        [
            sa.Column("veterinarian_name", sa.String(length=160), nullable=False),
            sa.Column("clinic_name", sa.String(length=160)),
            sa.Column("visit_date", sa.Date(), nullable=False),
            sa.Column("reason", sa.String(length=255)),
            sa.Column("diagnosis", sa.Text()),
            sa.Column("treatment", sa.Text()),
            sa.Column("notes", sa.Text()),
            sa.Column("next_visit_date", sa.Date()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        ],
    )
    child(
        "weight_records",
        [
            sa.Column("weight", sa.Numeric(6, 2), nullable=False),
            sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("notes", sa.Text()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        ],
    )
    child(
        "reminders",
        [
            sa.Column("type", sa.String(length=50), nullable=False),
            sa.Column("title", sa.String(length=160), nullable=False),
            sa.Column("description", sa.Text()),
            sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("repeat_rule", sa.String(length=40), nullable=False, server_default="none"),
            sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("completed_at", sa.DateTime(timezone=True)),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        ],
    )
    child(
        "nutrition_plans",
        [
            sa.Column("food_name", sa.String(length=160), nullable=False),
            sa.Column("brand", sa.String(length=160)),
            sa.Column("feeding_amount", sa.String(length=80), nullable=False),
            sa.Column("feeding_frequency", sa.String(length=120), nullable=False),
            sa.Column("notes", sa.Text()),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        ],
    )
    op.create_table(
        "feeding_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("pet_id", sa.String(length=36), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nutrition_plan_id", sa.String(length=36), sa.ForeignKey("nutrition_plans.id", ondelete="SET NULL")),
        sa.Column("food_name", sa.String(length=160), nullable=False),
        sa.Column("amount", sa.String(length=80), nullable=False),
        sa.Column("fed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_feeding_logs_pet_id", "feeding_logs", ["pet_id"])


def downgrade() -> None:
    for table in [
        "feeding_logs",
        "nutrition_plans",
        "reminders",
        "weight_records",
        "veterinary_visits",
        "medications",
        "vaccinations",
        "pets",
        "users",
    ]:
        op.drop_table(table)
