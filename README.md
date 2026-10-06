# MealMate — Meal Reminder, Food Tracking & Dose Management Backend

MealMate is a high-performance, resilient REST API backend built with **Node.js, Express.js, MongoDB, and Mongoose**. It powers personalized meal scheduling, timely reminders, spreadsheet-style food consumption tracking, user-defined medication and supplement routine tracking, and routine analytics.

---

## 1. Core Architecture & Modules

The backend is built following a clean layered architecture with clear separation of concerns:
- **Controllers** handle HTTP requests, input unpacking, and status responses.
- **Services** encapsulate core domain business logic, scheduling calculations, and recurrence rules.
- **Models** define Mongoose schemas, compound unique indexes, and data validation.
- **Middlewares** handle cross-cutting authentication, Zod validation, global rate limiting, and centralized error handling.
- **Schedulers & Workers** run background jobs for rolling occurrence generation, missed meal/dose detection, and reminder dispatches.

```
src/
├── app.js                      # Express application setup, middlewares, rate limits, CORS
├── server.js                   # Server bootstrap, DB connection, scheduler startup, graceful shutdown
├── config/
│   ├── env.js                  # Zod-validated environment configuration
│   ├── database.js             # Resilient MongoDB connection manager & graceful shutdown
│   └── swagger.js              # OpenAPI 3.0 specification
├── constants/
│   ├── enums.js                # System status enums & state transition definitions
│   └── messages.js             # Standardized API response messages
├── middlewares/
│   ├── auth.middleware.js      # JWT authentication and user context attachment
│   ├── error.middleware.js     # Centralized error handler and 404 handler
│   ├── rateLimit.middleware.js  # Global and auth-specific rate limiting
│   └── validate.middleware.js  # Zod schema request validation (body, params, query)
├── modules/
│   ├── auth/                   # Registration, login, logout, me
│   ├── user/                   # Profile, preferences, account deletion with cascade
│   ├── meal/                   # Meal schedules and occurrence transitions (complete/skip/postpone/snooze)
│   ├── food/                   # Food item columns, reordering, and monthly spreadsheet tracking grid
│   ├── dose/                   # Dose routines, multiple daily times, adherence outcomes
│   ├── notification/           # In-app notifications & Web Push VAPID subscriptions
│   ├── analytics/              # Dashboard metrics, routine calendar, meal/dose completion rates
│   └── export/                 # CSV data exports for tracking, meals, and doses
├── services/
│   ├── scheduler.service.js    # Cron job for rolling generation, missed detection & reminders
│   └── push.service.js         # Web Push delivery service with stale subscription cleanup
├── utils/
│   ├── AppError.js             # Operational error class
│   ├── catchAsync.js           # Async route wrapper
│   ├── sendResponse.js         # Uniform JSON response utility
│   ├── logger.js               # Pino logger with pino-pretty in dev
│   ├── dateUtils.js            # Timezone-aware Luxon date utilities
│   └── csv.js                  # RFC-compliant CSV generator and escaper
└── scripts/
    └── seed.js                 # Development database seeder with demo data
```

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `5000` | HTTP server listening port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mealmate` | MongoDB connection string |
| `JWT_SECRET` | - | Secret key used for signing JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Expiration time for issued JWT tokens |
| `CLIENT_URL` | `http://localhost:5173` | Frontend client origin allowed by CORS |
| `VAPID_PUBLIC_KEY` | - | VAPID public key for Web Push notifications |
| `VAPID_PRIVATE_KEY` | - | VAPID private key for Web Push notifications |
| `VAPID_SUBJECT` | `mailto:admin@mealmate.app` | VAPID subject contact URI |
| `LOG_LEVEL` | `info` | Pino log level |

---

## 3. Quick Start & Running the Server

### Installation
Dependencies are already configured:
```bash
npm install
```

### Running Locally
```bash
# Production start
npm start

# Development mode with native Node watch mode
npm run dev
```

### Running Automated Tests
The backend uses Node's native test runner (`node:test`, `node:assert`):
```bash
npm test
```

### Database Seeding
Populate the database with a sample demo user, meal schedules, food tracking spreadsheet records, and dose routines:
```bash
npm run seed
```

**Demo Account Credentials:**
- Email: `demo@mealmate.app`
- Password: `password123`

---

## 4. API Documentation (Swagger / OpenAPI)

Interactive Swagger UI is available at:
```http
http://localhost:5000/api/docs
```
Raw OpenAPI 3.0 JSON specification is served at:
```http
http://localhost:5000/api/docs.json
```

---

## 5. API Endpoints Overview

### Health
- `GET /api/health` — Application health check and database status

### Authentication
- `POST /api/auth/register` — Register a new user account
- `POST /api/auth/login` — Log in with email & password, receives JWT
- `POST /api/auth/logout` — Log out
- `GET /api/auth/me` — Get authenticated user details

### User Profile & Preferences
- `GET /api/users/profile` — Get profile info
- `PATCH /api/users/profile` — Update name or timezone
- `PATCH /api/users/preferences` — Update reminder preferences, lead time, grace period, snooze duration
- `DELETE /api/users/account` — Delete account and cascade delete all user records

### Meal Schedules & Occurrences
- `POST /api/meals` — Create recurring meal schedule (with weekdays `[0..6]`)
- `GET /api/meals` — List all user meal schedules
- `GET /api/meals/:id` — Get single meal schedule
- `PATCH /api/meals/:id` — Update meal schedule
- `DELETE /api/meals/:id` — Delete meal schedule (preserves completed historical records)
- `PATCH /api/meals/:id/pause` — Toggle pause / resume schedule
- `GET /api/meal-occurrences` — Query occurrences (supports `?date=YYYY-MM-DD`, `?status=...`)
- `GET /api/meal-occurrences/:id` — Get occurrence details
- `PATCH /api/meal-occurrences/:id/complete` — Mark meal as completed
- `PATCH /api/meal-occurrences/:id/skip` — Mark meal as skipped
- `PATCH /api/meal-occurrences/:id/postpone` — Postpone meal (`minutes` or `postponedUntil`)
- `PATCH /api/meal-occurrences/:id/snooze` — Snooze reminder (5, 10, or 15 minutes)

### Foods & Daily Tracking Grid
- `POST /api/foods` — Create food item with custom column order
- `GET /api/foods` — List active food items (or `?includeArchived=true`)
- `GET /api/foods/:id` — Get food item
- `PATCH /api/foods/:id` — Update food item
- `DELETE /api/foods/:id` — Soft-archives food if tracking data exists; deletes otherwise
- `PATCH /api/foods/reorder` — Update column ordering in batch
- `GET /api/food-tracking` — Monthly spreadsheet matrix (`?month=YYYY-MM`)
- `GET /api/food-tracking/:date` — Single day tracking items
- `PUT /api/food-tracking/:date/:foodId` — Atomic upsert (`consumed` / `not_consumed`)
- `DELETE /api/food-tracking/:date/:foodId` — Clear cell (reverts to unrecorded/null)
- `GET /api/food-tracking/analytics` — Food tracking completion analytics

### Dose Schedules & Occurrences
- `POST /api/doses` — Create medication/supplement schedule with multiple daily times
- `GET /api/doses` — List all dose schedules
- `GET /api/doses/:id` — Get single dose schedule
- `PATCH /api/doses/:id` — Update dose schedule
- `DELETE /api/doses/:id` — Delete dose schedule
- `PATCH /api/doses/:id/pause` — Toggle pause / resume
- `GET /api/dose-occurrences` — Query dose occurrences (`?date=...`, `?status=...`)
- `GET /api/dose-occurrences/:id` — Get dose occurrence
- `PATCH /api/dose-occurrences/:id/taken` — Record dose as taken with timestamp
- `PATCH /api/dose-occurrences/:id/skip` — Record dose as skipped
- `PATCH /api/dose-occurrences/:id/postpone` — Postpone dose
- `GET /api/dose-occurrences/history` — Historical dose adherence records

### Notifications & Web Push
- `GET /api/notifications` — List in-app notifications
- `PATCH /api/notifications/:id/read` — Mark notification as read
- `POST /api/notifications/subscribe` — Register Web Push subscription
- `DELETE /api/notifications/subscribe` — Unsubscribe Web Push endpoint
- `GET /api/notifications/preferences` — Get notification channels & lead times
- `PATCH /api/notifications/preferences` — Update notification preferences

### Analytics & Reports
- `GET /api/analytics/dashboard` — Today's summary (meals, doses, food tracking, completion rate)
- `GET /api/analytics/meals` — Meal adherence breakdown & trends
- `GET /api/analytics/foods` — Food consumption frequencies
- `GET /api/analytics/doses` — Dose adherence statistics
- `GET /api/analytics/calendar` — Monthly day-by-day calendar routine breakdown

### Data Exports (CSV)
- `GET /api/export/food-tracking` — Download food tracking history CSV
- `GET /api/export/meal-history` — Download meal occurrence history CSV
- `GET /api/export/dose-history` — Download dose adherence history CSV

---

## 6. Frontend Integration Guide (React & Axios)

Configure your Axios instance:
```javascript
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject JWT token into requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mealmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 1. User Login
```javascript
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { token, user } = response.data.data;
  localStorage.setItem('mealmate_token', token);
  return user;
};
```

### 2. Loading Today's Dashboard
```javascript
export const getTodayDashboard = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data.data;
};
```

### 3. Creating a Meal Schedule
```javascript
export const createMealSchedule = async (name, time, weekdays = [0, 1, 2, 3, 4, 5, 6]) => {
  const response = await api.post('/meals', {
    name,
    time, // e.g. "08:30" (24-hour format)
    weekdays,
    reminderEnabled: true
  });
  return response.data.data.meal;
};
```

### 4. Loading the Monthly Food Tracking Sheet (Spreadsheet Grid)
```javascript
export const getMonthlyFoodSheet = async (month = '2026-10') => {
  const response = await api.get(`/food-tracking?month=${month}`);
  return response.data.data;
  // Returns:
  // {
  //   month: "2026-10",
  //   foods: [{ id, name, category, columnOrder }],
  //   days: [
  //     { date: "2026-10-01", weekday: "Thursday", dayNumber: 1, entries: { [foodId]: "consumed" | "not_consumed" | null } }
  //   ]
  // }
};
```

### 5. Updating a Food Cell (Spreadsheet Interaction)
```javascript
// Mark as Consumed (✓)
export const markFoodConsumed = async (date, foodId, notes = '') => {
  const response = await api.put(`/food-tracking/${date}/${foodId}`, {
    status: 'consumed',
    notes
  });
  return response.data.data;
};

// Mark as Not Consumed (✗)
export const markFoodNotConsumed = async (date, foodId, notes = '') => {
  const response = await api.put(`/food-tracking/${date}/${foodId}`, {
    status: 'not_consumed',
    notes
  });
  return response.data.data;
};

// Clear Cell (Empty)
export const clearFoodCell = async (date, foodId) => {
  const response = await api.delete(`/food-tracking/${date}/${foodId}`);
  return response.data.data;
};
```

### 6. Creating a Dose Schedule
```javascript
export const createDoseSchedule = async ({ itemName, dosageDescription, times, startDate, endDate }) => {
  const response = await api.post('/doses', {
    itemName,
    dosageDescription,
    times, // e.g. ["09:00", "21:00"]
    startDate, // e.g. "2026-10-01"
    endDate // optional
  });
  return response.data.data.dose;
};
```

### 7. Downloading CSV Exports
```javascript
export const downloadCsvExport = async (type) => {
  // type: 'food-tracking' | 'meal-history' | 'dose-history'
  const response = await api.get(`/export/${type}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

---

## 7. Security & Reliability Highlights

1. **Strict Ownership Enforcement:** Every query filters by authenticated `userId` derived directly from verified JWT tokens. Request body injection of `userId` is strictly disallowed.
2. **Safe Serialization:** Password hashes are never selected by default and are scrubbed during Mongoose JSON transformations.
3. **Idempotent Occurrence Generation:** Compound unique indexes (`{ userId, mealId, scheduledDateKey }` and `{ userId, doseScheduleId, scheduledDateKey, scheduledTime }`) prevent duplicate occurrences during concurrent or repeated cron runs.
4. **Resilient Food Spreadsheet Logic:**
   - Empty cell = absence of tracking record (`null`).
   - Saving a cell is an atomic upsert.
   - Clearing a cell deletes the record.
   - Deleting a food item that has historical entries soft-archives it (`active: false`) so historical logs remain intact.
5. **Accurate Analytics Denominators:** Future pending occurrences are never counted as failed or missed meals.
6. **Graceful Missed Detection:** Postponed meals and doses are never marked missed until their postponed time + grace period has expired.
