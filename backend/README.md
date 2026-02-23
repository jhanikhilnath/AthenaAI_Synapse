# backend

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Authentication & Athlete Storage

The backend now supports user registration, login, and persistent athlete data in MongoDB. Environment variables must include:

```env
MONGODB_URI=mongodb://<host>:<port>/athena
JWT_SECRET=<your_jwt_secret>
```

Endpoints:

- `POST /api/auth/register` – create a new athlete (email/password).
- `POST /api/auth/login` – obtain a JWT token (returned in response body).
- `GET /api/athlete/me` – retrieve profile & history (requires `Authorization: Bearer <token>` header or a cookie named `authToken`).
- `POST /api/workout/generate` – protected; automatically retrieves the user’s latest biometrics (and sport/experience) from the database, sanitizes the object to match the ML model schema, queries the TensorFlow microservice for menstrual phase, and returns a fresh 6-day plan. If a previous workout exists its plan is also supplied to the Gemini prompt so the model can maintain continuity between weeks (only adjusting sets/reps rather than swapping exercises wholesale). If the latest biometrics record lacks cycle_length, period_length, or current_cycle_day these are automatically inferred from the athlete’s stored cycle history. If the athlete has never logged a period start/end yet, the server will return a 400 error asking them to record cycle data before a workout can be generated. The prediction for the next period (based on cycle history) is also fed to the Gemini LLM so the workout can anticipate upcoming hormonal changes. In addition the backend now computes a local “cycle biology” object (menstruation/follicular/ovulatory/luteal details) and the current phase name; both are sent to Gemini and also returned to the client (`localBiology` and `currentPhaseName` fields) for transparency. If required biometric fields are missing or no biometrics exist, a 400 error prompts the client to update their data.
- `POST /api/workout/tweak` – protected; takes `workoutRating` (required) and optional `comments` in the body. Uses the most recent workout plan and latest biometrics (including predicted next period) along with the local cycle biology and current phase name to adjust sets/reps via Gemini. Responses also return `localBiology` and `currentPhaseName`.
- `POST /api/biometrics` – add a new biometrics/mood entry (age, weight, mood, symptoms, etc.) to the authenticated athlete's history. Fields: `age`, `weight` (kg), `height` (cm), `sleep_hours`, `stress_level`, `cycle_length` (total menstrual cycle in days, typically 21–35), `period_length` (actual bleeding days, typically 3–7; must be ≤ `cycle_length`), `current_cycle_day`, `exercise_frequency`, `diet`, `symptoms`, `mood`. If `bmi` is omitted but weight and height are provided, BMI is auto-calculated. The endpoint validates that `period_length` ≤ `cycle_length` and logs warnings for unusual values.
- **Period tracking** – core functionality for cycle‑aware planning
  - `POST /api/periods/bleeding` – **only** endpoint required for logging menstrual flow. Provide either a `date` string or `dates` array; the server will decide whether the new entry extends the existing cycle (if the date is consecutive/close to the last bleed) or starts a fresh one. The previous cycle is only _closed_ (end date/length set) when a new cycle begins; while bleeding is ongoing the current entry remains open, which is why some entries lack `end` or `length`. All cycle information is derived from these raw bleeding days.
  - `GET /api/periods` – retrieve cycle history (including `bleedingDates`), average cycle length (based on interval between starts; returns `null` until two or more cycles are logged), last start date, predicted next period (only calculated when average cycle length exists). The next‐period prediction will now use the ML model’s own cycle‑length estimate (if available from the most recent workout’s `phaseData`); otherwise it defaults to the average. The response also includes ovulation/​fertile window, current cycle day, **and the menstrual phase data**. Phase and context are calculated by querying the ML service when a recent biometric record exists and sufficient cycle data (cycle and period length) can be derived. Before each request we also coerce numeric values to integers (rounding the cycle/period length, current day, age, sleep hours and stress level) so that the FastAPI schema, which expects `int` types, does not reject the payload. If the model call fails, or if some required cycle values are missing (e.g. the first period of a user), the server will **skip the ML request** and infer the phase locally from your cycle day and a simple ruleset. When cycle length information is available a local biology object (`localBiology`) is also included for convenience.

These endpoints all require authentication (same token/cookie rules as above).

> **Note:** The server now installs `cookie-parser` and will accept JWTs from either the standard `Authorization` header or from a cookie (`authToken` or `token`).

## Project Structure

The backend follows a **model-router-controller** pattern:

- `models/` – Mongoose schemas (Athlete.js).
- `controllers/` – Business logic separated from routing (auth, workout, athlete controllers).
- `routes/` – Express routers that wire endpoints to controller methods.
- `server.js` – App entrypoint that mounts routers and middleware.

This makes the codebase easier to maintain and extend as the API grows.

> Install additional dependencies (mongoose, bcrypt, jsonwebtoken) via package manager of choice (npm/yarn/bun).
