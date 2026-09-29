# Society Management

A society / apartment-management platform for Indian housing societies. Four role-specific
portals (Admin, Resident, Security, Committee) served by a single REST API, packaged as an
Android app via Capacitor.

- **Frontend** — Ionic 9 + Angular 22 + Capacitor 8 (SCSS, NgModules)
- **Backend** — Express 4 + MongoDB (Mongoose 8), TypeScript ESM
- **Auth** — JWT access token (in memory) + refresh token (httpOnly cookie)

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20 or newer |
| npm | 10 or newer |
| MongoDB | 6 or newer (local or Atlas) |
| Android Studio | only needed to build the Android app |

---

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values (see below)
npm run seed              # populates MongoDB with the demo dataset
npm run dev               # http://localhost:5000
```

`npm run seed` is idempotent — it replaces every collection, so it is safe to re-run after a
schema change or to reset a demo. Run it once before the first `npm run dev`; without it the
API falls back to in-memory demo data for any empty collection and writes will not persist.

### 2. Frontend

```bash
cd frontend
npm install
npm start                 # http://localhost:8100
```

### 3. Android (optional)

See [Android](#android) below.

---

## Environment variables

`backend/.env` — see `backend/.env.example` for the key list.

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `development` or `production` |
| `PORT` | no | defaults to `5000` |
| `MONGODB_URI` | yes | e.g. `mongodb://localhost:27017/society_management` |
| `CLIENT_URL` | yes | comma-separated CORS allow-list, e.g. `http://localhost:8100` |
| `JWT_ACCESS_SECRET` | production | boot fails without it when `NODE_ENV=production` |
| `JWT_REFRESH_SECRET` | production | as above |
| `ACCESS_TOKEN_EXPIRES` | no | defaults to `15m` |
| `REFRESH_TOKEN_EXPIRES` | no | defaults to `7d` |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The server deliberately **refuses to start in production without MongoDB** — serving a
production API from the in-memory store would silently discard every write.

---

## Demo accounts

All four accounts share the password **`Society@123`**.

| Role | Email |
|---|---|
| Admin | `rajesh.mehta@harmonysociety.in` |
| Resident | `priya.sharma@gmail.com` |
| Security | `suresh.guard@harmonysociety.in` |
| Committee | `anita.joshi@harmonysociety.in` |

Change these before any real deployment.

---

## API

All responses use a consistent envelope.

```json
{ "success": true,  "message": "...", "data": {} }
{ "success": false, "message": "...", "errors": [] }
```

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | — | Email + password → access token, sets refresh cookie |
| POST | `/refresh` | refresh cookie | Rotates the access token |
| POST | `/logout` | Bearer | Revokes the refresh token and clears the cookie |
| GET | `/me` | Bearer | Current profile |
| GET | `/roles` | — | Role metadata for the role-select screen |

`/login` is rate-limited (10 attempts / 15 min, successful requests excluded).

### Portals

Every route below requires a Bearer token **and** the matching role; a wrong role gets `403`.

| Role | Endpoints |
|---|---|
| Admin | `GET /api/admin/dashboard`, `/modules`, `/reports` |
| Resident | `GET /api/resident/dashboard`, `/bills`; `POST /pay-bill`, `/pre-approve-visitor` |
| Security | `GET /api/security/dashboard`; `POST /check-in`, `/check-out/:visitorId` |
| Committee | `GET /api/committee/dashboard`; `POST /noc/:id/status` |

`GET /api/health` is open and reports API and database status.

---

## Auth flow

1. The client posts credentials to `/api/auth/login`.
2. The server returns a short-lived **access token** in the JSON body and sets a long-lived
   **refresh token** as an `httpOnly` cookie (scoped to `/api/auth`).
3. The client keeps the access token in memory only — never `localStorage`, where any
   injected script could read it — and sends it as `Authorization: Bearer <token>`.
4. On a `401`, an interceptor calls `/refresh` once and replays the original request. A
   second failure clears the session and returns the user to `/role-select`.
5. `POST /logout` increments a `refreshTokenVersion` counter on the user, which invalidates
   every previously issued refresh token for that account.

A reload costs one silent refresh; the cookie covers it, so the user stays signed in.

### Known dev limitation

In production the refresh cookie is `Secure; SameSite=None`, which browsers only send over
HTTPS. Over plain-HTTP LAN development the Android WebView will not send it, so a dev
session re-logins after the app restarts. **Production needs HTTPS for refresh to work.**

---

## Android

`frontend/capacitor.config.ts` sets `appId: com.society.management` and `webDir: www`.
The Android application ID and label are `com.society.management` / "Society Management".

```bash
cd frontend
npm run build             # writes to frontend/www
npx cap sync android
npx cap open android      # then Run in Android Studio
```

Or build a debug APK directly:

```bash
cd frontend/android
./gradlew assembleDebug   # output: app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected device or running emulator with:

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Gradle needs a JDK and the Android SDK. If `java` or `ANDROID_HOME` are not on your PATH:

```bash
export JAVA_HOME="/c/Program Files/Java/jdk-21"        # JDK 17 or newer
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"        # needs platform + build-tools 36
```

### Pointing the app at your API

The API base URL lives in `frontend/src/environments/environment.ts`. **It is baked into the
bundle at build time, so you must edit it and rebuild before making the APK.**

| Target | `apiBaseUrl` |
|---|---|
| Browser / iOS simulator | `http://localhost:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |
| Physical device on LAN | `http://<your-machine-LAN-IP>:5000/api` |

`10.0.2.2` is the Android emulator's alias for the host machine's `localhost`. For a physical
device, find your LAN IP (`ipconfig` on Windows, `ifconfig` on macOS/Linux) and make sure the
backend is listening on `0.0.0.0`, not just `127.0.0.1`.

> **`npm run build` uses `environment.prod.ts`**, whose `apiBaseUrl` is the placeholder
> `https://api.your-domain.com/api`. To ship a working local APK, build with
> `npx ng build --configuration=development` (which uses `environment.ts`) after setting your
> own URL there — or set the real domain in `environment.prod.ts` and use `npm run build`.

Android blocks cleartext HTTP by default. A **debug-only** manifest overlay at
`android/app/src/debug/AndroidManifest.xml` sets `android:usesCleartextTraffic="true"`, so
debug builds can reach a plain-HTTP dev backend. Release builds never merge it and stay
HTTPS-only, so **serve the production API over HTTPS** — which the `Secure` refresh cookie
already requires (see [Auth flow](#auth-flow)).

---

## Project structure

```text
backend/
├── src/
│   ├── config/          MongoDB connection
│   ├── controllers/     HTTP handlers (one per role + auth)
│   ├── middleware/      auth, validation, error handling
│   ├── models/          Mongoose schemas
│   ├── routes/          thin route definitions
│   ├── seed/            demo dataset + seed script
│   ├── services/        data access (Mongo, with dev fallback)
│   ├── utils/           password hashing, JWT helpers
│   └── validations/     zod schemas
frontend/
└── src/app/
    ├── core/            api service, auth service, guards, interceptors, models
    ├── pages/           one folder per portal (admin, resident, security, committee, login)
    ├── components/      shared UI
    └── environments/    API base URL per build target
```

---

## Security notes

- Passwords are hashed with bcrypt; `passwordHash` is `select: false` so it never appears in
  a query result or an API response.
- Authorization is enforced **server-side** on every route. Client-side role checks are UX
  only and are never trusted.
- Login returns the same error for an unknown email and a wrong password, to avoid leaking
  which accounts exist.
- Helmet, a fail-closed CORS allow-list, and request rate limiting are enabled.
- All request input (`body`, `params`, `query`) is validated with zod before it reaches a
  controller.
- Never commit `.env`. Never expose `JWT_*_SECRET` to the client.

---

## Scripts

| Location | Command | Description |
|---|---|---|
| backend | `npm run dev` | Dev server with reload (tsx) |
| backend | `npm run build` | Compile TypeScript to `dist/` |
| backend | `npm start` | Run the compiled build |
| backend | `npm run seed` | Reset MongoDB to the demo dataset |
| frontend | `npm start` | Ionic dev server on :8100 |
| frontend | `npm run build` | Production build to `www/` |
| frontend | `npm run lint` | ESLint |
