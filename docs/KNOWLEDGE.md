# Cmapp backend knowledge base

Strapi 4 headless CMS for **Cmapp** (Kivio construction project management). Frontend: `/Users/prithvirajpillai/Documents/work/Cmapp`.

| | |
|---|---|
| Framework | Strapi **4.25.9** |
| Node | `>=18.0.0 <=20.x.x` |
| DB (local) | SQLite `.tmp/data.db` |
| Port | **1339** (`HOST`/`PORT` in `.env`) |
| Branch | `latestwithcustom` |
| Remote | https://github.com/kiviotech/cmapp-backend2 |
| Production API | `https://cmappapi.kivio.in` |

Vanilla `README.md` is the Strapi starter only. This file plus `.cursor/rules/` is the project-specific knowledge base.

---

## Run

```bash
cd /Users/prithvirajpillai/Documents/work/cmapp-backend2
npm install          # Node 18–20
npm run develop      # http://0.0.0.0:1339
```

- Admin: `http://localhost:1339/admin`
- REST: `http://localhost:1339/api`
- OpenAPI: `http://localhost:1339/documentation`

Required env names (do not commit `.env`): `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `HOST`, `PORT`, plus optional `DATABASE_*`, `SMTP_*`, `GOOGLE_API_KEY`. Google Drive also uses `config/google-credentials.json` (secret).

---

## Content types (`src/api/`)

| API | Role |
|---|---|
| `project` | Jobs/sites; create also **spawns tasks from all standard-tasks** |
| `task` | Work items; custom assignment routes |
| `standard-task` | Templates (QA/QC, drawing codes, sub-contractor) |
| `contractor` / `sub-contractor` | Vendors; contractor ↔ user |
| `registration` | Contractor onboarding (pending/approved/rejected) |
| `submission` | Proof-of-work media + approval |
| `project-team` | Approvers on a project |
| `user-group` + `designation` + `access-control` | App RBAC flags |
| `stage` → `category` → `subcategory` | Work breakdown |
| `standard-inspection-form` → sections → checklist items | Inspection templates |
| `project-inspection` + `inspection-response` | Per-project inspections |
| `directory` / `record` | Document cabinet |
| `consultant` | Linked from standard-tasks |
| `sign-up` | Legacy Strapi v3-style; **do not use** — frontend uses `/registrations` |

User model is extended in `src/extensions/users-permissions/content-types/user/schema.json` (`user_group`, tasks, submissions, HomeBuyer `project`).

---

## Custom behavior

**Tasks** (`src/api/task/`)

- `GET /tasks/sub-contractor/:subContractorId`
- `POST /tasks/assign-contractor/:contractorId` (body: `taskIds`)
- `GET /tasks/check-contractor-assignment/:projectId/:subContractorId`
- `GET /tasks/user/:userId` and `POST /tasks/assign-tasks/:contractorId/:subContractorId/:projectId` (`custom-routes.js`)
- `src/api/task/bootstrap.js` seeds users-permissions on startup (idempotent). Wired from `src/index.js`.

**Projects** (`src/api/project/`)

- `create` generates tasks in batches of 50, then sets `project_status` to `ongoing`
- `POST /projects/:id/documents` — upload + OCR drawing codes, link to tasks
- `POST /projects/:id/process-drive-folder` — Google Drive import
- `assignProjectTeam` in the project service
- `middlewares/owner.js` exists but is **not wired** to routes

**Utils:** `src/utils/ocr.js` (Tesseract / pdf-parse, codes like `A-106`), `src/utils/googleDrive.js`.

---

## Auth and CORS

- Plugin: users-permissions. JWT expiry **7 days** (`config/plugins.js`).
- Many task and project custom routes set `auth: false` (open at the Strapi layer). Tighten this before production hardening.
- CORS (`config/middlewares.js`) includes production Kivio hosts plus `localhost:5173`, `8081`, `8085`, `19006`, `19000`.
- REST `maxLimit: 5` in `config/api.js` — list endpoints return at most 5 rows unless clients paginate.

---

## Schema / code gaps

- Task controller may write `assigned_date` (not in task schema).
- User schema has no `contractor` relation; task controller may assume it.
- Project document component field is `document_code` (singular); some code uses `document_codes`.
- `config/plugins.js` extra `module.exports.bootstrap` for request timeout likely **never runs**.
- `bull` and Razorpay env vars are unused. `sign-up` API is legacy.

---

## Local vs frontend

The Expo app on `asha` defaults to **local** Strapi (`http://localhost:1339`). Override with `EXPO_PUBLIC_API_URL` in the frontend `.env`. Production `cmappapi.kivio.in` was unreachable when the project was restarted (Aug 2026).
