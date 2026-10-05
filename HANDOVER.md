# Society Management — Client Handover & Operations Guide

## 1. Executive Summary

The **Society Management Platform** is a full-stack, enterprise-grade apartment and housing society management solution built for Indian cooperative housing societies. It provides 4 dedicated, role-specific portals (Admin, Resident, Security, and Committee) powered by a single high-performance Express & MongoDB backend, packaged for both modern web browsers and Android mobile devices (via Capacitor).

---

## 2. Technology Stack

- **Frontend**: Ionic Framework 9, Angular 22, Capacitor 8, SCSS, NgModules, Ionicons
- **Backend**: Express.js 4, Node.js (TypeScript ESM), Mongoose 8 (MongoDB)
- **Security**: bcrypt password hashing, JWT stateless access tokens (in-memory) + httpOnly refresh tokens, Helmet security headers, CORS origin allow-list, rate limiting, and Zod schema validations.
- **Mobile**: Capacitor Android native bridge with cleartext HTTP debug overlay for local development and HTTPS release builds.

---

## 3. Quick Start (Running E2E Locally)

### Prerequisites
- Node.js 20+ (Verified with v24.19.0)
- npm 10+ (Verified with 12.0.2)
- MongoDB 6+ running locally on port 27017 (or MongoDB Atlas connection string)

### Step 1: Start the Backend API
```bash
cd backend
npm install
npm run seed       # Idempotent: seeds the database with demo users, flats, bills, and NOCs
npm run dev        # Starts server on http://localhost:5000
```
> Verify API health: `GET http://localhost:5000/api/health`

### Step 2: Start the Web App
```bash
cd frontend
npm install
npm start          # Starts Ionic/Angular dev server on http://localhost:8100
```
Open **`http://localhost:8100`** in your browser.

---

## 4. Demo Accounts & Credentials

All accounts share the same master password: **`Society@123`**

| Role | Email Address | Access Level & Key Capabilities |
|---|---|---|
| **Admin** | `rajesh.mehta@harmonysociety.in` | Full management dashboard, financial analytics, 19 modules, reporting suite |
| **Resident** | `priya.sharma@gmail.com` | Maintenance dues, instant UPI/card payment, pre-approve guest fast entry |
| **Security** | `suresh.guard@harmonysociety.in` | Gate guard dashboard, visitor check-in, real-time checkout, gate log & alerts |
| **Committee** | `anita.joshi@harmonysociety.in` | NOC approvals & rejections, committee meeting agendas, reserve funds & vendor payments |

---

## 5. Verified End-to-End Capabilities

1. **Authentication & Session Security**:
   - Role picker screen with direct preset credentials
   - Secure sign-in with access token rotation and httpOnly cookies
   - Role-based route guards (`authGuard`) preventing privilege escalation
   - Graceful single-click sign-out across all portals

2. **Admin Portal (`/admin`)**:
   - Real-time financial KPIs (Today's Collection, Pending Bills, Defaulters, Monthly Revenue)
   - Monthly Collection 6-month trends and categorical Expense Breakdown
   - Active alerts and defaulter tracking
   - 19 Management Modules (Society, Flats, Billing, Payments, NOC, Complaints, Staff, etc.)
   - Comprehensive Reports & Analytics (Collection, Expense, Defaulter, Visitor, NOC, Statutory Audit)

3. **Resident Portal (`/resident`)**:
   - Live maintenance dues with itemized breakdown (Maintenance, Water, Parking, Club)
   - One-click "Pay Now" / "Pay All" modal with instant zero-balance settlement
   - Payment history with automated receipt download buttons
   - Pre-approve visitor gate pass generation with 4-digit fast-entry code
   - Real-time notification board, family directory, and registered vehicles

4. **Security Gate Portal (`/security`)**:
   - Shift statistics (Visitors today, deliveries today, expected arrivals)
   - Fast visitor entry registration (Guest, Delivery, Staff, Cab, Vendor)
   - Live In/Out toggle with instant check-out recording
   - Searchable chronological gate log history
   - Real-time security incident alerts

5. **Committee Portal (`/committee`)**:
   - Executive dashboard with monthly surplus and collection efficiency
   - One-click NOC approvals / rejections with live status updates
   - Managing Committee and AGM meeting schedule and agendas
   - Reserve fund balances (Maintenance, Sinking, Repair, Corpus Funds)
   - Vendor invoice tracking & status

---

## 6. Android Mobile Build Guide

The project is pre-configured with Capacitor for Android:

```bash
cd frontend
# 1. Build the production web bundle
npm run build

# 2. Sync web assets and plugins to Android native project
npx cap sync android

# 3. Open in Android Studio
npx cap open android
```

### Direct Debug APK Build
```bash
cd frontend/android
./gradlew assembleDebug
# Generated APK: frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

*Note: Debug builds automatically include `android:usesCleartextTraffic="true"` via the included `AndroidManifest.xml` debug overlay to allow connection to local dev backends.*

---

## 7. Quality & Verification Standards

All items below were **re-verified by running them** on the delivery machine.

- **Backend Type-Safety**: `npx tsc --noEmit` compiles clean (0 errors).
- **Frontend Code Quality**: `npm run lint` passes with 0 errors and 0 warnings.
- **Frontend Template Type-Checking**: the Angular compiler runs with
  `strictTemplates`, so every binding in every template is type-checked at build.
- **Production Build**: `npm run build` succeeds; output to `frontend/www`.
- **Backend Automated Tests**: `npm test` runs `node --test` over an in-process
  instance of the real Express app — 30 tests, 0 failures, **no MongoDB and no
  running server required**. Covers auth (all four roles, refresh rotation, logout
  revocation, cookie flags, account-enumeration resistance), role isolation across
  all four portals, resident flat scoping, the complaint lifecycle, visitor
  check-in/check-out with gate-log writes, and validation rejection.
- **API Regression Suite**: a 73-assertion end-to-end sweep against a running server
  (`npm run e2e`) passes with 0 failures — auth, refresh rotation, logout revocation,
  role isolation, validation rejection, real write paths, complaints, and flat
  scoping. See §8.
- **Frontend Unit Tests**: `npm test` (Vitest) passes — 2 files, 2 tests. Still only
  a smoke check on the Angular side; the real coverage is the backend suite above.
- **Database Seeding**: Clean idempotent seed runner (`npm run seed`), now including
  the `complaints` collection.
- **Browser Verified**: All four portals (Admin, Resident, Security, Committee) were
  driven end-to-end in Chrome — sign-in, dashboard load, NOC approval, and visitor
  gate log — with no console errors and no failed API calls.

### Known limitations to disclose at handover

1. **Dashboard analytics are demo data, not computed from MongoDB.** Financial KPIs,
   charts, alerts, modules and reports come from the static constants in
   `backend/src/seed/seedData.ts`. Only bills, visitors, NOCs, complaints, notices,
   meetings and users are real database reads/writes. Treat the figures as sample
   data. The dates shown on the Admin and Security dashboards *are* live (derived
   from the current date), as is the financial quarter label.
2. **`GET /api/auth/roles` is unauthenticated** — it backs the pre-login role-picker
   screen, so it cannot require a session. It now returns role metadata only
   (id, label, badge line); the user records it previously exposed, including phone
   numbers and Aadhaar last-four digits, were removed. Any future field added here is
   public by definition. If the role-picker is ever replaced by a static list, delete
   this route rather than adding auth to it.
3. **No CI pipeline is wired up.** Both suites run in one command from a clean
   checkout (`npm test` in `backend/`); hooking them to a runner is the obvious next
   step.
4. **`/admin/modules` and `/admin/reports` are a catalogue, not a feature set.** All
   19 modules open a placeholder sheet. Complaints is the exception — it is wired
   end-to-end (resident raises, admin triages, status transitions).
5. **Family members and vehicles are seeded constants**, keyed on flat so they cannot
   leak between households, but there is no UI to edit them.
6. **Without MongoDB, sign-in verifies against a demo bcrypt hash** computed at
   runtime from the seeded demo password. That fallback exists so the app and its
   tests boot without a database; it is not a substitute for real accounts, and the
   server still refuses to start in production without MongoDB.

---

## 8. Verification Commands (reproduce everything in §7)

```bash
# Backend
cd backend
npm install && npm run seed
npx tsc --noEmit            # 0 errors
npm test                    # 30 passed (in-process, no server/MongoDB needed)
npx tsx src/server.ts       # http://localhost:5000
npm run e2e                 # 73 assertions against :5000, must print 0 failed
# PORT=8080 npm run e2e     # retarget a server on another port

# Frontend (second terminal)
cd frontend
npm install
npm run lint                # 0 errors, 0 warnings
npm test                    # 2 passed
npm run build               # -> frontend/www
npm start                   # http://localhost:8100
```

The login endpoint is rate-limited to 10 failed attempts per 15 minutes. If you run
the E2E sweep repeatedly in one session, restart the API to reset the counter, and
re-run `npm run seed` first for a clean data state. `npm test` is unaffected — it
mounts the app on an ephemeral port inside the test process.
