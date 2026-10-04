# PetCare — Mobile Pet Health & Care Management Platform

A modern, production-grade mobile application and API for pet owners to manage health records, vaccination schedules, ongoing medications, weight tracking, veterinary visits, care reminders, daily nutrition, and digital health passports, complemented by an intelligent AI Pet Assistant.

---

## 1. Product Vision & Architecture

**PetCare** brings every critical aspect of a pet's life into one unified, clean, and intuitive mobile application:

* **Pet Identity & Profiles**: Multi-pet management with breeds, species, gender, age, microchip ID, and photos.
* **Information-Dense Dashboard**: Real-time summary of upcoming booster shots, active medications, vet checkups, and today's care checklist.
* **Health Records**: Full historical tracking of vaccinations, medications, and clinical veterinary visits.
* **Dedicated Weight Tracking**: Visual SVG trend graphs, min/max/current weight metrics, and change deltas.
* **Care Reminders**: Recurring schedules (daily, weekly, monthly) for medications, vaccines, parasite treatments, and grooming with local notification triggers.
* **Nutrition & Feeding**: Active diet plans and daily meal logging.
* **Digital Health Passport**: Official certificate layout summarizing medical records, identity, and shareable/exportable summaries.
* **AI Pet Assistant**: Provider-independent assistant with controlled tool calling (`get_pet_profile`, `get_vaccination_history`, `get_medication_schedule`, `get_weight_history`, `get_veterinary_visits`, `get_nutrition_information`, `get_upcoming_reminders`) with strict medical disclaimers.

> **Scope Note**: GPS tracking, live collar hardware, and maps are intentionally excluded from this version.

---

## 2. Technology Stack

### Mobile Application
* **Framework**: React Native with [Expo](https://expo.dev) (SDK 57)
* **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation with tabs and nested stacks)
* **Language**: TypeScript (Strict Mode)
* **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Persistent auth & selected pet store)
* **Server State & Caching**: [TanStack Query](https://tanstack.com/query/latest) (React Query v5)
* **Forms & Validation**: React Hook Form with [Zod](https://zod.dev) schema validation
* **Local Notifications**: `expo-notifications`
* **Secure Storage**: `expo-secure-store`
* **Vector Graphics**: `react-native-svg`

### Backend API
* **Language**: Python 3.12+
* **Framework**: [FastAPI](https://fastapi.tiangolo.com)
* **Database**: PostgreSQL 16 (production/docker) & SQLite (testing)
* **ORM & Migrations**: SQLAlchemy 2.0 & Alembic
* **Authentication**: JWT (JSON Web Tokens) with passlib & bcrypt password hashing
* **AI Engine**: Provider-agnostic engine supporting OpenAI, Google Gemini, Anthropic, Ollama, and local Heuristic fallback

---

## 3. Project Structure

```text
pet-mobile-app/
├── backend/
│   ├── alembic/              # Database migration versions & environment
│   ├── app/
│   │   ├── ai/               # AI provider abstraction & tool calling
│   │   │   ├── heuristic_provider.py
│   │   │   ├── openai_provider.py
│   │   │   ├── provider.py   # Factory supporting OpenAI, Gemini, Claude, Ollama
│   │   │   ├── service.py    # Assistant coordination service
│   │   │   └── tools.py      # Safe backend tool implementations
│   │   ├── api/
│   │   │   ├── deps.py       # FastAPI dependency injection (auth, db, services)
│   │   │   └── routers/      # auth, pets, health, assistant
│   │   ├── core/             # Configuration, settings, security & JWT
│   │   ├── db/               # Database session, base model & engine
│   │   ├── models/           # SQLAlchemy ORM models (User, Pet, Health, etc.)
│   │   ├── repositories/     # Data access patterns
│   │   ├── schemas/          # Pydantic validation schemas
│   │   └── services/         # Business logic (PetCareService, StorageService)
│   ├── tests/                # Pytest integration & functional test suite
│   ├── Dockerfile            # Container build for FastAPI backend
│   ├── requirements.txt      # Python dependencies
│   └── seed.py               # Development seed script (Demo User, Max & Luna)
│
├── mobile/
│   ├── app/                  # Expo Router file-based screens
│   │   ├── (auth)/           # welcome, login, register screens
│   │   ├── (app)/            # Authenticated application
│   │   │   ├── (tabs)/       # index (Dashboard), pets, health, reminders, assistant
│   │   │   ├── pets/         # new, [id], edit, passport, weight, nutrition, record
│   │   │   └── profile.tsx   # User settings & backend status
│   │   ├── _layout.tsx       # Root layout with QueryClient & Auth hydration
│   │   └── index.tsx         # Gateway redirect based on session
│   ├── components/           # Reusable UI components (PetCard, FormField, WeightChart, etc.)
│   ├── constants/            # Theme tokens, palette, and API hosts
│   ├── hooks/                # React Query hooks (usePets, useSelectedPet)
│   ├── services/             # HTTP API client with automatic token refresh
│   ├── stores/               # Zustand stores (useAuthStore, usePetStore)
│   ├── types/                # TypeScript interface declarations
│   ├── utils/                # Validation schemas, date helpers, notifications
│   └── tests/                # Unit tests for schemas and date formatting
│
├── docker-compose.yml        # PostgreSQL & Backend multi-container setup
└── README.md
```

---

## 4. Quick Start & Installation

### Prerequisites
* **Node.js**: v18.0.0 or later (v22 recommended)
* **Python**: 3.11 or later
* **Docker & Docker Compose** (Optional, for running PostgreSQL in Docker)

---

### Step 1: Backend Setup

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Run database migrations or seed the development data:
   ```bash
   python seed.py
   ```
   *This seeds a ready-to-test user account:*
   * **Email**: `demo@petcare.app`
   * **Password**: `Demo1234!`
   * **Pets**: Max (Golden Retriever) and Luna (British Shorthair), with complete historical vaccinations, weight records, medications, and care reminders.

5. Start the backend development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   * Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   * Health status endpoint: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 2: Docker Setup (Alternative)

To spin up PostgreSQL and the backend API together using Docker Compose:

```bash
docker compose up --build
```

To seed the containerized database:
```bash
docker compose exec backend python seed.py
```

---

### Step 3: Mobile Setup

1. Open another terminal and navigate to `mobile/`:
   ```bash
   cd mobile
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start Expo:
   ```bash
   npm start
   ```

4. Run the application:
   * Press `w` to open in the **web browser**.
   * Press `a` to run on an **Android emulator / device**.
   * Press `i` to run on an **iOS simulator / device**.
   * Scan the QR code with the **Expo Go** app on your phone.

> **Network Tip**: When testing on physical devices or Android emulators, ensure `EXPO_PUBLIC_API_URL` points to your machine's local IP address (e.g. `http://192.168.1.50:8000`).

---

## 5. Environment Variables

### Backend (`backend/.env`):
```ini
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg2://petcare:petcare@localhost:5432/petcare
SECRET_KEY=super-secret-key-change-in-production
API_V1_PREFIX=/api/v1
CORS_ORIGINS=*

# AI Configuration (Optional: defaults to built-in 'heuristic' mode)
AI_PROVIDER=heuristic       # Options: heuristic, gemini, openai, anthropic, ollama
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
```

### Mobile (`mobile/.env`):
```ini
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## 6. Testing

### Run Backend Tests:
The backend includes 11 comprehensive tests validating auth, JWT security, pet CRUD, health passport compiling, weight stats, nutrition logs, and AI assistant tool calls:

```bash
cd backend
.venv\Scripts\pytest
```

### Run Mobile Unit Tests & Type Check:
The mobile codebase includes schema validation unit tests, date helper tests, and strict TypeScript compilation:

```bash
cd mobile
npm test            # Runs unit tests via Node test runner
npm run type-check  # Validates strict TypeScript compilation (tsc --noEmit)
```

---

## 7. Security & Engineering Best Practices

* **Ownership Isolation**: Every API endpoint verifies that the resource belongs to the authenticated user's pet. Accessing another user's pet ID returns HTTP 404.
* **Controlled AI Function Execution**: The AI assistant never queries arbitrary raw SQL. It interacts strictly through typed tools (`get_pet_profile`, `get_vaccination_history`, etc.).
* **Medical Safety**: Built-in guardrails detect symptoms and medical advice requests, immediately returning a prominent disclaimer and recommending veterinary clinic consultation.
* **Token Rotation**: The mobile client securely stores tokens in `expo-secure-store` and automatically refreshes expired access tokens.

---

## 8. Future Roadmap

1. **PDF Export**: Generate downloadable and printable PDF booklets for the Health Passport.
2. **Cloud Push Notifications**: Integrate FCM / APNs for remote reminders.
3. **Veterinary Clinic Booking**: Direct online appointment scheduling with partner clinics.
4. **Vaccination Document OCR**: Automatic date & vaccine name extraction from vaccine card photos.
5. **Multi-Language Support**: Complete localization for English, Turkish, Spanish, and German.