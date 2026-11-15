# Gӓdӓt

Gӓdӓt is a calm habit tracker. You unlock it with your fingerprint (a passkey, no password and no email), tick today's habits, and watch a monthly calendar where every day is a ring that fills as habits get done.

- A habit has a name, an optional note and the weekdays it repeats on.
- Streaks, month rates and calendar rings are **computed on the client** from habits and check-ins. They are never stored.
- No social features, no push notifications, no translations (English only).

> The name is written with U+04D3 (Cyrillic small a with diaeresis), not the Latin ä (U+00E4). It is used only in visible text (logo, page title, passkey prompt). Folders, packages, the database, Docker and URLs use the ASCII slug `gadat`.

```
gadat/
├── client/            Angular 22 app, port 4200
├── server/            Nest.js 12 API (Prisma, PostgreSQL), port 3000
├── docker-compose.yml PostgreSQL 16 only
└── README.md
```

### Client architecture

The client is split into modules by feature. A module is a folder that owns everything for one feature and exposes a small public API through its `index.ts`. Components are standalone Angular components; there are no NgModules.

```
client/src/app/
├── infrastructure/
│   ├── models/              api-models.ts: Habit, CheckIn, NewHabit (the API contract)
│   └── theme/               tokens.css (colours, radii, fonts), base.css, animations.css, overlay.css
│
├── modules/
│   ├── auth/                unlock, set up, recovery
│   │   ├── components/      auth-shell, fingerprint-circle, recovery-code-box, unlock-page, setup-page
│   │   ├── services/        passkey-service.ts
│   │   ├── constants/       auth-constants.ts
│   │   ├── data/            auth-data.ts
│   │   ├── models/          auth-models.ts
│   │   └── index.ts         AUTH_ROUTES
│   ├── dashboard/           the signed-in home screen
│   │   ├── components/      dashboard-header, dashboard-main, dashboard-page
│   │   ├── hooks/           use-today-clock.ts
│   │   ├── constants/       dashboard-constants.ts
│   │   └── index.ts         DASHBOARD_ROUTES
│   ├── habits/              Today list, stats, Add habit dialog, habit state
│   │   ├── components/      habit-row, today-card, stats-tiles, add-habit-dialog, days-picker
│   │   ├── stores/          habit-store.ts (signals)
│   │   ├── services/        habit-repository.ts (abstract), http-habit-repository.ts
│   │   ├── utils/           habit-stats.ts (streaks, rings, rates: pure functions)
│   │   ├── constants/  data/  models/
│   │   └── index.ts
│   └── calendar/            month grid, chips, selected-day summary
│       ├── components/      calendar-card, calendar-grid
│       ├── hooks/           use-calendar.ts
│       ├── utils/           calendar-days.ts
│       ├── constants/  models/
│       └── index.ts
│
└── shared/
    ├── components/          button, chip, icon, logo, progress-bar, toast-host
    ├── stores/              app-store.ts (is the user signed in)
    ├── services/            api-service.ts, http-interceptors.ts, session-service.ts, toast-service.ts
    ├── utils/               dates.ts, route-guards.ts
    ├── constants/  models/
```

Rules: each component lives in its own folder as `index.ts` (plus `index.html` when it has a template); modules import each other only through the other module's `index.ts` (`@modules/habits`); `shared/` and `infrastructure/` never import from `modules/`. Path aliases `@infrastructure/*`, `@modules/*` and `@shared/*` are set in `client/tsconfig.json`. "Hooks" are functions that use `inject()` and return signals, such as `useCalendar()`.

There is no root `package.json`. `client/` and `server/` are installed and run on their own, and share no code. The API contract below is mirrored by hand in `client/src/app/infrastructure/models/api-models.ts`.

## Run it locally

Needs Node 24 (see `.nvmrc`), npm and Docker.

```bash
docker compose up -d

cd server
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev            # http://localhost:3000/api

cd ../client
npm install
npm start                    # http://localhost:4200, proxies /api to port 3000
```

Open <http://localhost:4200>. Passkeys work on `localhost` over plain HTTP; everywhere else they need HTTPS.

Optional demo data (refuses to run when `NODE_ENV=production`):

```bash
cd server && npm run prisma:seed
```

It creates a demo user with five habits and about a year of check-ins, and prints a recovery code. Use "Use recovery code" on the unlock screen to sign in as that user.

### Scripts

| Where | Script | What it does |
| --- | --- | --- |
| server | `start:dev` | Nest in watch mode |
| server | `build` | Compile to `dist/` (runs `prisma generate` first) |
| server | `lint` | ESLint + Prettier rules |
| server | `test` | Jest unit tests (services, with `@simplewebauthn/server` mocked) |
| server | `test:e2e` | Jest + Supertest against the real database |
| server | `prisma:seed` | Demo user, 5 habits, ~1 year of check-ins |
| client | `start` | `ng serve` with the `/api` proxy |
| client | `build` | Production build |
| client | `lint` | angular-eslint |
| client | `test` | `ng test` (Vitest, the Angular CLI default) |

`npm run test:e2e` writes to the database in `DATABASE_URL` but only creates its own users (random ids) and deletes exactly those afterwards, so it is safe to run next to your own data.

## Environment variables (`server/.env`)

| Variable | Example | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://gadat:gadat@localhost:5432/gadat` | PostgreSQL connection string |
| `JWT_SECRET` | long random string | Signs the session cookie. In production it must be 32+ characters and not start with `change-me` |
| `COOKIE_SECRET` | another long random string | Signs the `chal` (challenge) cookie. Same production rule |
| `RP_ID` | `localhost` | WebAuthn relying-party id: the bare domain, no scheme, port or path |
| `RP_NAME` | `Gӓdӓt` | Name shown in the fingerprint prompt |
| `ORIGIN` | `http://localhost:4200` | Full front-end URL. Used for CORS and for WebAuthn origin checks |
| `PORT` | `3000` | API port |
| `NODE_ENV` | `development` | `production` turns on `Secure` cookies and refuses to seed |
| `TRUST_PROXY` | `1` (optional) | Number of reverse-proxy hops to trust, so rate limits see the real client IP. Default 0 |

Secrets only ever come from the environment. `.env` is git-ignored; `.env.example` is committed.

## API

All routes are JSON, live under `/api`, and answer errors in one shape: `{ "statusCode": 400, "message": "...", "errors": ["..."] }` (`errors` only for validation). Stack traces are never returned. "Session" means a valid `session` cookie.

| Method | Path | Needs | What it does |
| --- | --- | --- | --- |
| GET | `/api/health` | none | `{ "ok": true }` |
| POST | `/api/auth/register/options` | none | Creates a user and returns passkey creation options |
| POST | `/api/auth/register/verify` | challenge cookie | Body `{ response }` (the `startRegistration` result). Stores the passkey, starts a session, returns `{ recoveryCode }` once |
| POST | `/api/auth/login/options` | none | Passkey login options (discoverable credential, no username) |
| POST | `/api/auth/login/verify` | challenge cookie | Body `{ response }` (the `startAuthentication` result). Verifies the signature, updates the counter, starts a session, returns `{ id }` |
| POST | `/api/auth/recovery` | none | Body `{ code }`. Starts a session, invalidates that code, returns `{ recoveryCode }` (the new one) |
| POST | `/api/auth/credentials/options` | session | Options to add a passkey on a new device |
| POST | `/api/auth/credentials/verify` | session + challenge cookie | Body `{ response }`. Stores the extra passkey |
| GET | `/api/auth/me` | session | `{ id }`; used by the client guard |
| POST | `/api/auth/logout` | session | Clears the cookie, returns 204 |
| GET | `/api/habits` | session | Active and archived habits of this user |
| POST | `/api/habits` | session | Body `{ name, note?, days?, startDate }`; `days` defaults to all seven. Returns 201 |
| PATCH | `/api/habits/:id` | session | Body with any of `name`, `note` (`""` or `null` clears it), `days` |
| DELETE | `/api/habits/:id?date=YYYY-MM-DD` | session | Archives the habit: `endDate` becomes the day before `date`. 204, repeating is safe |
| GET | `/api/check-ins?from=&to=` | session | `[{ habitId, date }]`; at most 400 days (inclusive) |
| PUT | `/api/habits/:id/check-ins/:date` | session | Ticks that day. Repeating is safe. 204 |
| DELETE | `/api/habits/:id/check-ins/:date` | session | Unticks it. Repeating is safe. 204 |
| GET | `/api/export` | session | Downloads all habits and check-ins as one JSON file (also a backup, since browsers can lose cookies) |

A habit is `{ id, name, note, days, startDate, endDate, createdAt }`. Rules enforced by the server:

- Name is trimmed, 1 to 40 characters. Note is at most 60. `days` are ISO weekdays 1 to 7 (Monday = 1), unique, at least one. At most 20 **active** habits per user (400).
- Dates are plain `YYYY-MM-DD` strings in the user's local calendar, checked as real calendar dates. A check-in or habit start date later than the server's UTC date plus one day is rejected with 400.
- Every query filters by the signed-in user. Someone else's habit id returns **404**, not 403, so ids cannot be probed.
- Whitelist validation is on: unknown fields are rejected with 400.
- Rate limits: **10 requests per minute per IP across `/api/auth/*`** (one shared budget), 120 per minute elsewhere. Over the limit returns 429.
- Mutating requests (POST, PUT, PATCH, DELETE) must send `Content-Type: application/json`, otherwise 415. The client interceptor adds it, even for requests without a body.

## How fingerprint login works

Login uses WebAuthn passkeys. The device checks your fingerprint and signs a server challenge with a private key that never leaves it. The server verifies the signature with the stored public key. No password and no email exist anywhere.

1. **First visit.** The client calls `register/options`. The server creates a user and returns options with `authenticatorAttachment: 'platform'`, `residentKey: 'required'`, `userVerification: 'required'`, `attestation: 'none'` and the app name. The browser shows the fingerprint prompt (`startRegistration`) and the result is posted to `register/verify`. The server checks it against the stored challenge, `ORIGIN` and `RP_ID`, saves the public key, generates a recovery code, starts a session and shows the code once.
2. **Next visits.** `login/options` has no allow-list, so the browser offers the saved passkey. After `startAuthentication`, `login/verify` finds the credential by id, verifies the signature and stores the new counter.
3. **Lost device.** Enter the recovery code on the unlock screen. It is **single use**: the server replaces it and returns a new one, and the client then offers to add a fingerprint on this device.

Cookies:

- `session`: a signed JWT holding only the user id, 30 days, `HttpOnly`, `SameSite=Lax`, `Secure` whenever `NODE_ENV=production`. No tokens are kept in `localStorage`.
- `chal`: the pending challenge, signed, `HttpOnly`, 5 minutes, deleted after one use.

Recovery code: 16 characters from `crypto.randomBytes` (alphabet without 0, 1, I, O), shown as `XXXX-XXXX-XXXX-XXXX`. Only its SHA-256 hash is stored, and the hashes are compared in constant time. Swapping in the new code is one conditional update, so two simultaneous uses of the same code cannot both succeed.

Other protection: `helmet`, CORS limited to `ORIGIN` with credentials, `SameSite=Lax` cookies, no state change on GET, JSON-only mutations, rate limits, a validation pipe with whitelisting, and every query scoped to the user.

## Deployment notes

- **HTTPS is required for passkeys** everywhere except `localhost`.
- Set `RP_ID` to the bare domain (for example `example.com`) and `ORIGIN` to the full front-end URL (`https://app.example.com`). They must match what the browser sees, or registration and login fail.
- Set `NODE_ENV=production`. Cookies become `Secure`. Use real random values for `JWT_SECRET` and `COOKIE_SECRET` (`openssl rand -base64 48`); the server refuses to start with short or placeholder secrets.
- Cookies are `SameSite=Lax`, so the app and the API must be the **same site**: either one origin with a reverse proxy sending `/api` to the API (simplest; keep `apiBase: '/api'`), or sibling subdomains such as `app.example.com` and `api.example.com` (then set `apiBase` in `client/src/environments/environment.prod.ts` to the full API URL).
- Behind a reverse proxy set `TRUST_PROXY=1` so rate limits count real client IPs.
- Apply migrations with `npx prisma migrate deploy`, run the API with `npm run build && npm run start:prod`, and serve `client/dist/client/browser` as static files with a fallback to `index.html`.

### Content Security Policy for the static host

The production build has no inline scripts (critical-CSS inlining is turned off for this reason), so `script-src 'self'` works. Verified by loading the production build under this exact policy with no violations:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data:;
  connect-src 'self';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  object-src 'none'
```

`style-src` needs `'unsafe-inline'` because Angular injects component styles at run time and the Google Fonts stylesheet is inlined at build time. Scripts stay strict. If the API is on another origin, add it to `connect-src`.

## Testing

- **Client** (`npm test`): unit tests for `modules/habits/utils/habit-stats.ts` (scheduling by weekday, ring fraction, current streak when today is not ticked yet, streaks that skip unscheduled days, best streak, month rate for the current and a past month), `shared/utils/dates.ts`, the `HabitStore` (optimistic tick, rollback with toast, rapid double taps, month bounds, midnight rollover), and one component test that checks the calendar's day classes.
- **Server** (`npm test`): unit tests for `AuthService` with the `@simplewebauthn/server` functions mocked, the recovery code and the date helpers. (`npm run test:e2e`): Supertest tests for habits, check-ins and auth covering ownership, validation, idempotency, date limits, the 20-habit limit, export, error shape, the recovery code being single use and the rate limit.

## Libraries added beyond the required stack, and why

| Package | Where | Why |
| --- | --- | --- |
| `@prisma/adapter-pg` | server | Prisma 7 (latest stable) has no built-in database engine and needs a driver adapter for PostgreSQL |
| `tsx` | server (dev) | Runs `prisma/seed.ts`. The generated Prisma client uses TypeScript namespaces, which Node's built-in type stripping cannot run |
| `ts-jest`, `@types/jest`, `@types/cookie-parser`, `@types/pg`, `@types/supertest` | server (dev) | Jest in TypeScript, and type definitions |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `globals` | server (dev) | ESLint is required; the Nest 12 scaffold ships oxlint and Vitest, which were replaced by ESLint and Jest as specified |
| `angular-eslint` | client (dev) | ESLint for Angular (added with `ng add`) |
| `postcss`, `@tailwindcss/postcss` | client (dev) | Angular's build loads Tailwind CSS v4 through PostCSS |

`pg` comes in through the adapter. Nothing else is outside the stack in the spec.

## Assumptions

1. **Folder name.** The repository root is this folder (`Gadat`); in the layout it is called `gadat/`.
2. **Node.** `.nvmrc` pins Node 24, the current LTS line at the time of writing (also copied into `client/` and `server/`).
3. **Versions.** Everything is the latest stable release: Angular 22, Nest 12, Prisma 7.10, `@simplewebauthn` 14, Tailwind 4. Prisma's npm `latest` tag points at a release candidate (8.0.0-rc), so `prisma` and `@prisma/client` are pinned to 7.10.1, the latest stable.
4. **ESM.** Nest 12 is ESM-only, so the server is ESM (relative imports end in `.js`) and Jest runs in native ESM mode (`NODE_OPTIONS=--experimental-vm-modules`, set in the npm scripts). `@nestjs/throttler` is CommonJS, so the e2e setup loads `@nestjs/common` first to let Jest load it.
5. **Prisma client** is generated into `server/src/generated/prisma` (git-ignored). `npm install` and the `build` / `start:dev` scripts run `prisma generate`; `prisma migrate dev` in Prisma 7 does not generate it by itself.
6. **Passkey registration payload.** `register/verify`, `login/verify` and `credentials/verify` take `{ "response": <browser result> }`, a thin wrapper so the validation pipe's whitelist can stay on. The server library validates the inner object.
7. **Abandoned sign-ups.** `register/options` creates the user straight away, as specified. A user that never finishes (no passkey saved) is deleted by the next `register/options` call once it is over an hour old.
8. **Status codes.** The 20-active-habit limit returns 400. A non-JSON mutation returns 415. Logout returns 204. `credentials/verify` returns `{ ok: true }`.
9. **Content-Type rule.** Applied to every POST, PUT, PATCH and DELETE, including ones with no body, as the checklist says. The client interceptor sets it, so a plain `curl -X PUT` needs `-H 'Content-Type: application/json'`.
10. **Rate limit scope.** "10 per minute per IP on `/api/auth/*`" is one shared budget for all auth routes, including `/auth/me`, which the client guard calls once per page load. Repeated reloads count toward it.
11. **Check-in range.** "At most 400 days" is counted inclusively (`to - from + 1 <= 400`). The client asks for the whole history in several 400-day windows, from the earliest habit start to today, so "best streak" covers all history.
12. **Date limit.** Applies to check-in dates, to the `date` of an archive request and to a habit's `startDate`. Past dates are accepted (so a missed day can be backfilled through the API); the UI only ticks today.
13. **Recovery lookup.** The hash is found with a query and then re-compared in constant time. The table is tiny and the code has 80 bits of entropy, so the lookup timing reveals nothing useful.
14. **No UI for editing or archiving.** The screens in the spec only create and tick habits. `PATCH` and `DELETE` exist on the API, but there is no button for them, so the 20-habit limit can only be freed through the API.
15. **Calendar details.** A day is disabled when it is not scheduled, in the future, or before the first habit (so today is disabled too if nothing is scheduled today). The chip list includes archived habits so history can still be filtered. Changing the days of a habit changes how its past rings look, because schedules are derived, not stored.
16. **Today** follows the device's local clock, checked every minute and when the tab becomes visible again, so the app moves to the next day at midnight without a reload.
17. **Backup link.** The home footer has a "Download a backup of your habits" link to `GET /api/export` (a small addition; the spec only lists the endpoint).
18. **Fonts.** Space Grotesk has no Cyrillic glyphs, so it cannot draw the ӓ. The logo is set in Inter, which has U+04D3, and the heading font stack falls back to Inter per glyph. Fonts load from Google Fonts as specified; self-hosting them would let `style-src` and `font-src` drop the Google hosts.
19. **Module layout.** The client follows a folder-per-module layout (infrastructure, modules, shared) rather than Angular NgModules. Auth sits in its own module; the home screen is the `dashboard` module, which composes `habits` and `calendar`. Hooks are `inject()`-based functions returning signals.
20. **Dev proxy and cookies.** Cookies are scoped to `Path=/api`, which is where all API calls go, including through the dev proxy.

## What was and was not verified

Checked by running them: client and server build, lint, unit tests and e2e tests; the full acceptance checklist in a real Chrome against a fresh database with a **virtual** WebAuthn authenticator (registration, login, add-passkey after recovery, all the checks from the brief); an axe-core accessibility scan of the unlock, recovery, home and dialog screens; and the production build under the CSP above.

Not verified: a **physical** fingerprint sensor or phone (only Chrome's virtual authenticator was used), `docker compose up -d` itself (Docker was not installed on the build machine, so a local PostgreSQL 18 instance stood in for PostgreSQL 16, and the compose file was written but not started), and other browsers (Safari, Firefox).
