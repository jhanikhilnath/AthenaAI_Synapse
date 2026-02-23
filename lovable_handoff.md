# Lovable Handoff Document: AthenaAI - Cycle-Synced Workout Planner

## Project Overview

AthenaAI is a custom workout planner designed specifically for women. The core idea is that an athlete's menstrual cycle significantly impacts their physiology, energy levels, and biomechanics. AthenaAI leverages this biological data to generate tailored, 6-day workout plans that adapt to the user's specific menstrual phase (e.g., Follicular, Luteal), sport, experience level, and daily biometrics (sleep, stress, weight, mood, etc.).

When a user logs their bleeding days and daily biometrics, the backend uses a machine learning service to predict their current menstrual phase and physiological context. This data, alongside the user's sport and experience level, is passed to an elite AI Agent (Gemini) which acts as an Olympic sports scientist, dynamically adjusting exercises, volume (sets/reps), and intensity to optimize performance and recovery based on where the woman is in her cycle.

## API Connection Details

- **Base URL:** `http://localhost:3000` (The backend runs on port 3000)
- **Content-Type:** `application/json` for all requests with a body.

### Authentication Flow (JWT & Cookies)

The backend uses JWT (JSON Web Tokens) for authentication. 
When a user registers or logs in, the API returns a JWT in the JSON response (`{ token: "..." }`) AND sets an `HttpOnly` cookie named `authToken`. 

For the Lovable frontend, you must ensure that subsequent requests to protected routes pass this authentication token. You can either:
1.  **Recommended for standard web fetch:** Rely on the `HttpOnly` cookie. Ensure your fetch/axios requests include `credentials: 'include'` so the browser automatically sends the cookie.
2.  **Alternative:** Explicitly send the token in the `Authorization` header as `Bearer <token>`.

All routes below (except `/api/auth/register` and `/api/auth/login`) are **Protected Routes** and require this authentication.

---

## Detailed API Endpoints

### 1. Authentication

#### Register a New Athlete
- **Endpoint:** `POST /api/auth/register`
- **Description:** Creates a new user profile.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "sport": "Soccer", // String
    "experienceLevel": "Beginner" // String (e.g., Beginner, Intermediate, Advanced)
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR..." // JWT Token
  }
  ```

#### Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticates an existing user.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
  ```

---

### 2. Athlete Profile

#### Get Current User Profile
- **Endpoint:** `GET /api/athlete/me`
- **Description:** Retrieves the logged-in user's profile, including history of cycle lengths, workouts, and basic bio.
- **Response (200 OK):**
  ```json
  {
    "athlete": {
      "_id": "651a2b...",
      "email": "user@example.com",
      "history": [...],
      "workouts": [...]
    },
    "predictedNextPeriodStart": "2026-03-20T00:00:00.000Z", // Can be null
    "currentCycleDay": 14 // Can be null
  }
  ```

---

### 3. Biometrics

#### Log Daily Biometrics
- **Endpoint:** `POST /api/biometrics`
- **Description:** Used to log daily health data. **CRITICAL:** Users MUST log biometrics before they can generate a workout, as the ML model needs this data.
- **Request Body (all fields refer to numbers/strings):**
  ```json
  {
    "age": 25,
    "weight": 65,
    "height": 170,
    "mood": "Happy",
    "symptoms": "Cramps",
    "sleep_hours": 8,
    "stress_level": 3
  }
  ```
- **Response (200 OK):** Returns the updated athlete object.

---

### 4. Menstrual Cycle Tracking

#### Log Bleeding Days
- **Endpoint:** `POST /api/periods/bleeding`
- **Description:** Records which days the user was bleeding. This is highly important for the ML model to learn the user's cycle length and period length.
- **Request Body:**
  ```json
  {
    "dates": ["2026-02-20", "2026-02-21"] // Array of YYYY-MM-DD date strings
  }
  ```
- **Response (200 OK):** Returns the updated cycle object.

#### Get Cycle Info
- **Endpoint:** `GET /api/periods`
- **Description:** Returns cycle history and current phase predictions based on logged bleeding days.
- **Response (200 OK):**
  ```json
  {
    "cycleHistory": [...],
    "averageCycleLength": 28,
    "predictedNextPeriodStart": "2026-03-15T00:00:00.000Z",
    "currentPhase": "Luteal Phase", // From local biology fallback
    "physiologicalContext": "Progesterone peaks, energy may dip...",
    "currentCycleDay": 21,
    "localBiology": {
      "phase": "...",
      "description": "...",
      "hormones": "..."
    }
  }
  ```

---

### 5. Workout Generation & Management

*Note: Generating a workout requires the user to have submitted cycle information (via `/api/periods/bleeding`) AND at least one biometrics entry (via `/api/biometrics`).*

#### Generate New Workout Plan
- **Endpoint:** `POST /api/workout/generate`
- **Description:** Calls the ML service to determine the exact biological phase, then uses Gemini AI to generate a sport-specific, cycle-synced 6-day workout plan.
- **Request Body:** `{}` (Empty JSON object)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "biology": { /* ML Model Phase Data */ },
    "localBiology": { /* Fallback biological summary */ },
    "currentPhaseName": "Late Luteal",
    "plan": {
      "athlete_summary": "Because you are in the Late Luteal phase, volume has been reduced by 15%...",
      "schedule": [
        {
          "day": 1,
          "focus": "Lower Body Power",
          "exercises": [
            { "name": "Barbell Squat", "sets": 3, "reps": 5, "rest_seconds": 180 }
          ]
        }
      ]
    },
    "predictedNextPeriodStart": "2026-03-15T00:00:00.000Z"
  }
  ```
  *Frontend Usage:* Display the `athlete_summary` prominently to explain *why* the workout looks the way it does. Map over the `schedule` array to render the daily workouts.

#### Tweak Existing Workout Plan
- **Endpoint:** `POST /api/workout/tweak`
- **Description:** If the athlete found the previous week's workout too easy or too hard, they can rate it and provide comments. The AI will keep the EXACT SAME EXERCISES, but adjust sets and reps based on their biological phase and the feedback rating.
- **Request Body:**
  ```json
  {
    "workoutRating": 8, // 1 to 10 scale (1 = Too easy, 10 = Exhausted)
    "comments": "My knees hurt during squats."
  }
  ```
- **Response (200 OK):** Returns the same structure as `/api/workout/generate`, containing the updated "plan".

#### Upload Custom TEXT Workout Plan
- **Endpoint:** `POST /api/workout/upload`
- **Description:** The user can write or paste a generic, unstructured text-based workout plan they found online or their coach gave them. The AI parses the text, maps it to the JSON schema, and suggests biological improvements (adjusting sets, reps, or intensity) based on their current menstrual phase and sport.
- **Request Body:**
  ```json
  {
    "textPlan": "Day 1: Heavy Squats 4x5, Leg Press 3x10. Day 2: Rest. Day 3: Bench Press 4x6, Incline DB Press 3x10."
  }
  ```
- **Response (200 OK):** Returns the structured, AI-improved plan in the same format as `/api/workout/generate`.

---

## Frontend UI/UX Architecture & Page Breakdown

**Design Philosophy:** AthenaAI must look premium, modern, and deeply personalized. The aesthetic should be vibrant yet calming—think "premium fitness app meets modern wellness journal". It **must** be 100% screen responsive (mobile-first, gracefully scaling to tablet and desktop). Use glassmorphism, smooth micro-animations, rich gradients, and soft shadows to establish a high-end feel.

### 1. Landing / Onboarding (Public & Auth)

**Vibe:** Inspirational, clean, establishing trust. High-quality imagery of athletes in motion, dark or sleek modern background with vibrant accent colors.

*   **Landing Page (`/`)**
    *   **Hero Section:** Stunning background image/video. Bold headline: "Training Synced with Your Biology". Clear CTA: "Start Your Journey".
    *   **Value Prop:** 3-column feature grid explaining Cycle-Syncing, AI Coaching, and Daily Adaptation.
*   **Auth Pages (`/login`, `/register`)**
    *   Glassmorphic card centered on the screen.
    *   Registration requires: Email, Password, Sport (Dropdown/Search), and Experience Level (Radio buttons: Beginner, Intermediate, Advanced).
    *   *Mobile:* Fills screen. *Desktop:* Centered floating card over a subtle background animation.

### 2. The Setup / Onboarding Wizard (Post-Login)

**Vibe:** Guided, effortless, conversational.

*   **Step 1: Cycle History (`/setup/cycle`)**
    *   Calendar UI to select recent `bleedingDates`.
    *   Clear instructional copy explaining *why* this data matters for ML prediction.
*   **Step 2: Today's Biometrics (`/setup/biometrics`)**
    *   Interactive sliders or clean toggle buttons for Mood, Symptoms, Sleep, and Stress Level.
    *   Number inputs for weight and height.

### 3. The Dashboard (The Core Experience)

**Vibe:** Data-rich but uncluttered. Motivational. This is the user's daily home base.

*   **Top Bar:** User's name, current date, and a quick "Log Biometrics" button.
*   **The "Cycle Ring" Hero Element (Crucial UI):**
    *   A visually striking, interactive circular graphic representing the user's menstrual cycle.
    *   Shows the current day (e.g., "Day 14 - Ovulatory Phase").
    *   Color-coded segments for Menstruation, Follicular, Ovulatory, and Luteal phases.
    *   Below the ring: The `predictedNextPeriodStart` date and a brief `physiologicalContext` summary.
*   **Today's Action:**
    *   If a workout exists for today: Render a beautiful "Start Workout" card showing today's focus (e.g., "Lower Body Power").
    *   If no workout exists: Large CTA "Generate Your Weekly Plan".
    *   The `athlete_summary` from the API response must be displayed prominently in a stylized "Coach's Note" callout box so the user understands *why* their plan is structured the way it is today.
*   **Responsive Layout:**
    *   *Mobile:* Stacked vertically (Header -> Cycle Ring -> Action Card).
    *   *Desktop:* Two-column grid (Cycle Ring on the left, Actions/Context on the right).

### 4. Workout Plan View & Execution

**Vibe:** Focused, energetic, strictly utility-driven.

*   **Weekly Overview (`/plan`)**
    *   A horizontal scrollable timeline (or swipeable cards on mobile) showing the 6-day split.
    *   Each day card shows the `focus` and the number of exercises.
*   **Daily Workout Detail (`/workout/today`)**
    *   List of exercises.
    *   Each row shows: Exercise Name, Sets X Reps, and Rest Timer.
    *   Interactive checkboxes to mark sets as completed.
    *   A prominent "Finish Workout" button.

### 5. Plan Import / Customization Tool

**Vibe:** High-tech, analytical, "magic".

*   **Import Page (`/import`)**
    *   A large, clean text area: "Paste your coach's plan or a generic workout here."
    *   A prominent "Athena Sync It" button (calls `POST /api/workout/upload`).
    *   **Loading State:** Show a cool scanning animation or "AI analyzing biological context..." text.
    *   **Result State:** Side-by-side comparison (or toggle on mobile) showing the "Original Plan" vs. the "Athena Optimized" plan, highlighting the changes made for their current cycle phase.

### 6. Weekly Check-in & Tweaking

**Vibe:** Reflective, simple.

*   **Feedback Modal/Page (`/check-in`)**
    *   Triggered at the end of a training week.
    *   A large, smooth 1-10 slider asking: "How did this week's plan feel?" (1 = Too Easy, 10 = Exhausted).
    *   A text area for "Coach's Notes" (e.g., "Knees hurt on squats").
    *   Submit button calls `POST /api/workout/tweak`.

### 7. Profile & Settings

*   **Profile Page (`/profile`)**
    *   View logged history.
    *   Update Sport / Experience level.
    *   Settings to manage account.

---

## Technical Frontend Directives for Lovable
*   **Framework:** React (Vite/Next.js).
*   **Styling:** Tailwind CSS is highly recommended for rapid, responsive design. Use arbitrary values in Tailwind for highly specific branding colors.
*   **Animations:** Use Framer Motion (or simple CSS transitions) for micro-interactions (hover states, modal pop-ins, the Cycle Ring rendering, loading states). 
*   **State Management:** React Context or Zustand to hold the auth state and current `athlete` profile globally to prevent prop drilling.
*   **Routing:** React Router. Ensure protected routes redirect to `/login` if no valid token exists.
*   **Mobile-First Setup:** Always design the mobile view first in Tailwind (default classes), then use `md:` and `lg:` prefixes to scale up to tablet/desktop.
