<div align="center">

# 🌿 Gӓdӓt

**A calm habit tracker, unlocked with your fingerprint.**

No password. No email. Tick today's habits and watch every day on the calendar fill like a ring.

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![WebAuthn](https://img.shields.io/badge/Passkeys-WebAuthn-5C6BC0)
![Node](https://img.shields.io/badge/Node-24-339933?logo=nodedotjs&logoColor=white)

</div>

---

## ✨ Features

- 🔐 **Fingerprint login.** Passkeys (WebAuthn), with a single-use recovery code as backup.
- ✅ **Simple habits.** A name, an optional note, and the weekdays it repeats on.
- 📅 **Monthly calendar.** Each day is a ring that fills as habits get done.
- 🔥 **Streaks and rates.** Worked out in the browser from your check-ins, never stored.
- 🧩 **Chrome extension.** The same app from your toolbar.

## 🧰 Technologies

| Layer | Stack |
| --- | --- |
| 🖥️ **Client** | Angular 22 (standalone components, signals), Tailwind CSS 4, Vitest |
| ⚙️ **Server** | Nest.js 12, TypeScript, class-validator, Jest and Supertest |
| 🗄️ **Database** | PostgreSQL 16 with Prisma 7 |
| 🔐 **Auth** | WebAuthn passkeys (`@simplewebauthn`), cookie sessions |
| 🛡️ **Hardening** | helmet, CORS, `@nestjs/throttler` rate limits |
| 📈 **Observability** | pino logs, Prometheus-format metrics (`prom-client`), health checks |
| 🧹 **Tooling** | ESLint (Airbnb rules), Prettier, Docker Compose |

## 🏗️ Architecture

Two independent apps that talk over a JSON API. They share no code, and the API contract is mirrored by hand in `client/src/app/shared/models/api-models.ts`.

```
 Browser or Chrome extension          Nest.js API                      PostgreSQL
┌───────────────────────────┐  /api  ┌───────────────────────────┐    ┌──────────────┐
│ Angular app               │ ─────▶ │ auth, habits, check-ins   │ ─▶ │ User         │
│ signal stores             │ ◀───── │ validation, rate limits   │    │ Credential   │
│ streaks and rings are     │ cookie │ logging, metrics          │    │ Session      │
│ computed here, not stored │        └───────────────────────────┘    │ RecoveryCode │
└───────────────────────────┘                                         │ Habit        │
                                                                      │ CheckIn      │
                                                                      └──────────────┘
```

```
gadat/
├── client/             Angular app          http://localhost:4200
├── server/             Nest.js API + Prisma http://localhost:3000/api
└── docker-compose.yml  PostgreSQL 16
```

### Client

Feature modules, each a folder that owns one feature and exposes a small public API through its `index.ts`.

```
client/src/app/
├── modules/
│   ├── auth/        unlock, set up, recovery, passkey service
│   ├── dashboard/   the signed-in home screen (composes habits and calendar)
│   ├── habits/      today list, stats, add-habit dialog, habit store, stats maths
│   └── calendar/    month grid, day chips, selected-day summary
└── shared/          buttons, icons, toasts, API service, HTTP interceptors, theme
```

Rules: modules import each other only through `index.ts` (`@modules/habits`), and `shared/` never imports from `modules/`. State lives in signal stores, and streak and ring maths are pure functions in `habits/utils/habit-stats.ts`.

### Server

```
server/src/
├── auth/        passkey register and login, sessions, recovery code
├── habits/      create, list, update, archive
├── check-ins/   tick and untick a habit for a day, list a date range
├── common/      env config, validation helpers, exception filter
├── logging/     pino request logs
├── metrics/     Prometheus metrics
└── prisma/      database access
```

### Data model

`User` has many `Credential`s (passkeys), `Session`s and `Habit`s, and one `RecoveryCode`. A short-lived `Challenge` row holds each pending passkey challenge until it is used once or expires. A `Habit` has many `CheckIn`s, with one row per habit per day enforced by the primary key. Deleting a user cascades to everything it owns.

## 🧠 How it works

**Fingerprint login.** The device checks your fingerprint and signs a server challenge with a private key that never leaves it. The server verifies the signature with the stored public key.

1. **First visit.** The server creates a user and sends passkey options. The browser asks for your fingerprint, and the server saves the public key, starts a session and shows a recovery code once.
2. **Next visits.** The browser offers the saved passkey, the server verifies the signature, and a session starts.
3. **Lost device.** Enter the recovery code. It works once, then the server replaces it with a new one.

**Challenges.** The passkey challenge is stored on the server, and the signed cookie only carries its id. The row is deleted the first time it is read, so a captured cookie cannot be replayed.

**Sessions.** A random 256-bit token in an `HttpOnly`, `SameSite=Lax` cookie for 30 days. Only its SHA-256 hash is stored, so a leaked database cannot be used to sign in. Logging out deletes the row.

**Habits and check-ins.**
- Name 1 to 40 characters, note up to 60, weekdays 1 to 7 (Monday is 1), at most 20 active habits per user.
- Dates are plain `YYYY-MM-DD` strings in your local calendar. Dates too far in the future are rejected.
- Ticking is safe to repeat (it is idempotent), and archiving a habit keeps its history.
- Every query filters by the signed-in user, so someone else's habit id returns 404.

**Streaks, rings and rates** are computed in the browser from habits and check-ins. Only the facts are stored.

**Protection.** helmet, strict CORS, JSON-only writes, whitelist validation, and rate limits of 10 requests a minute on `/auth/*` and 120 elsewhere. API responses are `no-store`, and logs never contain cookies, bodies or query strings.

## 🔌 API

Everything is JSON under `/api`. "Session" means a valid `session` cookie.

| | Route | Needs |
| --- | --- | --- |
| 🔐 | `POST /auth/register/options` and `/verify` | none |
| 🔐 | `POST /auth/login/options` and `/verify` | none |
| 🔐 | `POST /auth/recovery` | none |
| 🔐 | `POST /auth/credentials/options` and `/verify`, `GET /auth/me`, `POST /auth/logout` | session |
| ✅ | `GET`, `POST /habits` and `PATCH`, `DELETE /habits/:id` | session |
| 📅 | `GET /check-ins?from=&to=` | session |
| 📅 | `PUT`, `DELETE /habits/:id/check-ins/:date` | session |
| 🩺 | `GET /health`, `GET /health/ready`, `GET /metrics` | none, none, token |

## 🚀 Run it

You need Node 24 (see `.nvmrc`), npm and Docker.

```bash
docker compose up -d            # PostgreSQL

cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev               # API on :3000

cd ../client
npm install
npm start                       # app on :4200, proxies /api to :3000
```

Open <http://localhost:4200>. Passkeys work on `localhost` over plain HTTP, and everywhere else they need HTTPS.

Want demo data? Run `npm run prisma:seed` in `server/`. It prints a recovery code you can use to sign in.

### ⚙️ Configuration

Set these in `server/.env` (`.env.example` has working defaults).

| Variable | Example | What it is |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://gadat:gadat@localhost:5432/gadat` | PostgreSQL connection |
| `COOKIE_SECRET` | long random string | Signs the challenge cookie |
| `RP_ID` | `localhost` | Bare domain for passkeys |
| `ORIGIN` | `http://localhost:4200` | Front-end URL (CORS and passkey check) |
| `NODE_ENV` | `development` | Anything else counts as production |

Optional: `PORT`, `RP_NAME`, `TRUST_PROXY`, `DB_POOL_MAX`, `LOG_LEVEL`, `METRICS_TOKEN`. The server refuses to start on a bad `PORT` or `TRUST_PROXY`, and in production on a weak `COOKIE_SECRET` or `METRICS_TOKEN` (under 32 characters, or a `dev-` placeholder).

### 🧪 Scripts

| Where | Command | Does |
| --- | --- | --- |
| server | `npm run start:dev` | API in watch mode |
| server | `npm test` | Unit tests |
| server | `npm run test:e2e` | End-to-end tests against a separate `<database>_test` database, created and migrated automatically (override with `TEST_DATABASE_URL`) |
| server | `npm run lint` | ESLint and Prettier |
| client | `npm start` | Dev server with the `/api` proxy |
| client | `npm test` | Unit tests |
| client | `npm run build` | Production build |

### 🧩 Chrome extension

```bash
cd client && npm run build:extension
```

Open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked** and pick `client/dist/extension`. Then set this in `server/.env`:

```
RP_ID=dddeldmgddfmcoobmdgaboaeobapcebo
ORIGIN=chrome-extension://dddeldmgddfmcoobmdgaboaeobapcebo
```

## 📦 Deploying

1. Use **HTTPS**. Set `RP_ID` to your domain and `ORIGIN` to the full front-end URL.
2. Set `NODE_ENV=production` and a real `COOKIE_SECRET` (`openssl rand -base64 48`).
3. Serve the app and the API from the **same site**, for example one domain with `/api` proxied to the API.
4. Behind a proxy, set `TRUST_PROXY=1` and point health checks at `/api/health/ready`.
5. Run `npx prisma migrate deploy`, then `npm run build && npm run start:prod`.
6. Serve `client/dist/client/browser` as static files, falling back to `index.html`. Cache hashed files for a year and send `no-cache` for `index.html`.

The rate limiter counts in memory, so with more than one API instance the limits multiply. Move it to a shared store such as Redis before scaling out.

## ✅ CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request. The server job lints, builds, runs the unit and e2e tests against a PostgreSQL service and audits production dependencies. The client job lints, tests, builds the app and the extension, and audits production dependencies.

## 📈 Operations

- 🩺 `/api/health` is liveness. `/api/health/ready` also checks the database and returns 503 if it is down.
- 📝 Logs are JSON on stdout (pino), one line per request, each with an `X-Request-Id`.
- 📊 `/api/metrics` serves Prometheus metrics and needs `Authorization: Bearer <METRICS_TOKEN>`. It is off when the token is unset, so keep it off the public internet.
