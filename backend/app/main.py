from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routers.assistant import router as assistant_router
from app.api.routers.auth import router as auth_router
from app.api.routers.health import router as health_router
from app.api.routers.pets import router as pets_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.models import FeedingLog, Medication, NutritionPlan, Pet, Reminder, User, Vaccination, VeterinaryVisit, WeightRecord  # noqa: F401

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment != "test":
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)
origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

prefix = settings.api_v1_prefix
app.include_router(auth_router, prefix=prefix)
app.include_router(pets_router, prefix=prefix)
app.include_router(health_router, prefix=prefix)
app.include_router(assistant_router, prefix=prefix)

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
