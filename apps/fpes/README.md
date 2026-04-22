# Faculty Performance Evaluation System (FPES)

A full-stack web application for managing and evaluating faculty performance at RIT. Faculty submit annual highlights forms; admins and supervisors review them, generate AI-powered summaries, and compute weighted performance scores.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Environment Variables](#environment-variables)
7. [Backend Architecture](#backend-architecture)
8. [API Reference](#api-reference)
9. [Frontend Architecture](#frontend-architecture)
10. [Scoring System](#scoring-system)
11. [AI Summary & Persistence](#ai-summary--persistence)
12. [Adding a New Entity](#adding-a-new-entity)
13. [Common Commands](#common-commands)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js v18+
- MariaDB v10.5+
- Git
- A Google Gemini API key (for AI features)

```bash
node --version   # v18.x.x or higher
npm --version    # 9.x.x or higher
mysql --version  # MariaDB 10.x.x
```

---

## Getting Started

```bash
git clone <repo-url> --branch fpes-server
cd RIT-SE-CODE-BANK
```

---

## Database Setup

```bash
# Start MariaDB, then:
mysql -u root -p
```

```sql
CREATE DATABASE fpes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fpes_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON fpes_db.* TO 'fpes_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Backend Setup

```bash
cd apps/fpes/server
npm install
cp example.env .env   # then fill in your values
node index.js
```

In a second terminal, initialize all tables:

```bash
curl -X POST http://localhost:3000/db/init
# Response: "Tables successfully rebuilt!"
```

To also create the summaries persistence table (run once):

```bash
mysql -u fpes_user -p fpes_db < sql/form_summaries.sql
```

---

## Frontend Setup

```bash
cd apps/fpes/ui/fpes-frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

Create `apps/fpes/server/.env` (use `example.env` as a template):

| Variable | Description |
|---|---|
| `HOST` | Database host (e.g. `localhost`) |
| `DB_USERNAME` | MariaDB username |
| `DB_PASSWORD` | MariaDB password |
| `DATABASE` | Database name (e.g. `fpes_db`) |
| `PORT` | Server port (default `3000`) |
| `GEMINI_KEY` | Google Gemini API key — required for AI summaries and PDF parsing |

Get a Gemini key at https://aistudio.google.com/app/apikey. Without it, PDF parsing and AI summaries will fail.

`.env` is gitignored and never committed.

---

## Backend Architecture

```
server/
├── index.js                         # Express app entry point, route registration
├── db.js                            # MariaDB connection pool (connectionLimit: 150)
├── reset_forms.js                   # Clears forms/highlights/grants without full rebuild
│
├── api/                             # Business logic layer
│   ├── highlights_api.js            # CRUD for highlights + full form submission
│   ├── parsed_highlights_api.js     # Save/update highlights parsed from uploaded PDFs
│   ├── teaching_eval_api.js         # Teaching eval CRUD, percentile ranking, AI summary
│   ├── weighted_score_api.js        # Weighted score calculation, scholarship score, weights
│   ├── file_parser_api.js           # PDF/CSV parsing with pdf-parse + Gemini AI
│   ├── forms_api.js                 # Form record CRUD
│   ├── forms_to_dynamics_tables_api.js  # Links form IDs to grants/publications/services/course sections
│   ├── faculty_api.js               # Faculty CRUD
│   ├── grants_api.js                # Grants CRUD
│   ├── publications_api.js          # Publications CRUD
│   ├── service_api.js               # Services CRUD
│   ├── course_section_api.js        # Course sections CRUD
│   ├── courses_api.js               # Courses CRUD
│   ├── departments_api.js           # Departments CRUD
│   ├── student_support_api.js       # Student support CRUD
│   └── rebuild_tables.js            # Drops and recreates all tables in FK-safe order
│
├── routes/                          # Express route handlers (HTTP layer)
│   ├── highlights_routes.js         # /highlights — highlights + AI summaries + annual eval
│   ├── teaching_eval_routes.js      # /teaching_evals — eval data, percentiles, AI summary
│   ├── weighted_score_routes.js     # /weighted_score — scoring, weights, per-class breakdown
│   ├── file_upload_routes.js        # /file — Multer upload + PDF/CSV parsing
│   ├── forms_routes.js              # /forms
│   ├── faculty_routes.js            # /faculty
│   ├── grants_routes.js             # /grants
│   ├── publications_routes.js       # /publications
│   ├── service_routes.js            # /services
│   ├── course_section_routes.js     # /course_sections
│   ├── courses_routes.js            # /courses
│   ├── departments_routes.js        # /departments
│   └── student_support_routes.js    # /student_support
│
├── sql/                             # Table schemas (one file per entity)
│   ├── drop_tables.sql              # Drops all tables in FK-safe order
│   ├── form_summaries.sql           # Persistent AI summary storage
│   ├── category_weights.sql         # Scoring weights (default: teaching=4, scholarship=3, service=2, admin=1)
│   ├── form_to_field_tables/        # Junction table schemas (forms_grants, forms_publications, etc.)
│   └── [one .sql per entity]
│
├── uploads/                         # Multer temp storage (hash-named, auto-deleted after parse)
└── test/api/                        # Jest tests
```

### Key Design Patterns

- Every API function acquires a connection from the pool, runs its query, and releases in a `finally` block.
- Routes are thin — they call API functions and handle HTTP concerns (status codes, error responses).
- `withConn(fn)` helper in `highlights_routes.js` and `weighted_score_api.js` reduces connection boilerplate.

---

## API Reference

### `GET /`
Health check. Returns `"Server is running..."`.

### `POST /db/init`
Drops and recreates all tables. Use for initial setup or full reset.

---

### Highlights — `/highlights`

| Method | Path | Description |
|---|---|---|
| GET | `/highlights` | All highlights rows |
| GET | `/highlights/all` | All highlights joined with faculty name and form metadata (admin view) |
| GET | `/highlights/:id` | Single highlight by highlights row ID |
| GET | `/highlights/submitted_by/:facultyID` | All form IDs submitted by a faculty member |
| POST | `/highlights/submit` | Full form submission (highlights + course sections + services + grants + publications) |
| POST | `/highlights/draft` | Save a draft form (same as submit but status=DRAFT) |
| POST | `/highlights/parsed` | Save highlights parsed from an uploaded PDF |
| PUT | `/highlights/parsed/:formId` | Update highlights parsed from an uploaded PDF |
| DELETE | `/highlights/:id` | Delete a highlights row |
| GET | `/highlights/annual-eval/:facultyId` | Retrieve a stored annual evaluation (no AI call) |
| POST | `/highlights/annual-eval/:facultyId` | Generate and persist an annual evaluation via Gemini AI |
| POST | `/highlights/:formId/summarize` | Generate and persist a per-form AI summary. Add `?refresh=true` to force regeneration |

#### AI Summary Caching & Persistence

Summaries are stored in two layers:

1. **In-memory cache** (`summaryCache` Map, 1-hour TTL) — fastest, lost on restart.
2. **Database** (`form_summaries` table) — permanent, survives restarts.

On `POST /:formId/summarize`:
- Checks in-memory cache first.
- If miss, checks `form_summaries` DB table.
- If still miss (or `?refresh=true`), calls Gemini, then saves to both cache and DB.

On `POST /annual-eval/:facultyId`:
- Always regenerates (call `GET /annual-eval/:facultyId` to retrieve without regenerating).
- Saves result to `form_summaries` with `summary_type='annual'`.

---

### Teaching Evaluations — `/teaching_evals`

| Method | Path | Description |
|---|---|---|
| GET | `/teaching_evals/all` | All teaching evals with faculty name and form metadata |
| GET | `/teaching_evals/submitted_by/:facultyId` | All evals for a specific faculty member |
| GET | `/teaching_evals/:formId/view` | Full eval detail: questions + text responses (PII filtered) |
| GET | `/teaching_evals/percentiles` | Percentile rankings for all faculty |
| GET | `/teaching_evals/percentile/faculty/:facultyId` | Percentile for a specific faculty member |
| GET | `/teaching_evals/score/:facultyId?teaching_text=` | Teaching score (2–4) with bump logic |
| POST | `/teaching_evals/parsed` | Save a teaching eval parsed from an uploaded PDF |
| POST | `/teaching_evals/:formId/summarize` | Generate an AI text summary of a teaching eval |

---

### Weighted Score — `/weighted_score`

| Method | Path | Description |
|---|---|---|
| GET | `/weighted_score/weights` | Current category weights |
| PUT | `/weighted_score/weights` | Update weights (must sum to 10) |
| POST | `/weighted_score/calculate` | Calculate weighted final score from ratings body |
| GET | `/weighted_score/scholarship-score/:facultyId?form_id=` | Scholarship score (1–4) with grant bump |
| GET | `/weighted_score/per-class/:facultyId` | Per-course teaching breakdown vs department avg |

---

### File Upload — `/file`

| Method | Path | Description |
|---|---|---|
| POST | `/file/upload` | Upload a PDF or CSV. Body: `file` (multipart), `faculty_id`, `file_type` (`highlights` or `teaching_eval`). Returns parsed JSON data. |
| GET | `/file/pdf/:formId` | Stream the stored PDF for a form |

Uploaded files are stored temporarily in `uploads/`, parsed, then deleted. The raw PDF binary is stored in the `forms.pdf_data` column.

---

### Other Routes

| Prefix | Description |
|---|---|
| `/faculty` | Faculty CRUD |
| `/forms` | Form record CRUD |
| `/grants` | Grants CRUD |
| `/publications` | Publications CRUD |
| `/services` | Services CRUD |
| `/course_sections` | Course sections CRUD |
| `/courses` | Courses CRUD |
| `/departments` | Departments CRUD |
| `/student_support` | Student support CRUD |

---

## Frontend Architecture

```
fpes-frontend/src/
├── App.jsx                    # Root: router, auth state, role gating
├── main.jsx                   # React entry point
├── ProtectedRoute.jsx         # Redirects unauthenticated users to /login
│
├── api/                       # Axios API clients
│   ├── course_api_imports.js
│   ├── faculty_api_imports.js
│   ├── grants_api_imports.js
│   └── services_api_imports.js
│
├── pages/
│   ├── home/                  # HomePage — dashboard landing
│   ├── login/                 # LoginPage — credential entry
│   ├── profile/               # ProfilePage — view/edit own profile
│   ├── users/                 # UsersPage — admin user management
│   ├── getting_started/       # GettingStartedPage — onboarding guide
│   │
│   ├── supervisor/
│   │   ├── SupervisingPage.jsx           # Supervisor dashboard
│   │   ├── SupervisedFacultyTable.jsx    # Table of supervised faculty
│   │   ├── SupervisedFormsTable.jsx      # Table of supervised faculty forms
│   │   └── AssignRemoveSupervisorsForm.jsx
│   │
│   ├── highlights_form/
│   │   ├── HighlightsFormPage.jsx        # Multi-step form for faculty submission
│   │   └── HighlightsFormPreview.jsx     # Read-only preview before submit
│   │
│   ├── highlights_page/
│   │   ├── HighlightsPage.jsx            # Faculty view of own submissions
│   │   ├── AdminHighlightsPage.jsx       # Admin table of all submissions + summarize action
│   │   ├── AnnualEvalPage.jsx            # Annual evaluation view/generate page
│   │   ├── HighlightsView.jsx            # Detailed highlights display
│   │   ├── HighlightsViewModal.jsx       # Modal wrapper for HighlightsView
│   │   ├── TeachingEvalPage.jsx          # Teaching eval list and detail view
│   │   ├── WeightedScorePanel.jsx        # Score breakdown panel (teaching, scholarship, service, admin, final tier)
│   │   ├── AddFilePage.jsx               # PDF/CSV upload UI
│   │   ├── DataPreviewPage.jsx           # Preview and edit parsed PDF data before saving
│   │   ├── FundingTable.jsx              # Grants table component
│   │   └── PublicationTable.jsx          # Publications table component
│   │
│   ├── courses/               # CoursePage
│   ├── course_sections/       # CourseSectionsPage + form steps
│   ├── departments/           # DepartmentsPage + form
│   ├── grants/                # GrantsPage + form steps
│   ├── publications/          # PublicationForm + form step
│   ├── services/              # ServicesPage + form steps
│   └── student_support/       # StudentSupportPage + form steps
│
├── theme/
│   └── MuiTheme.js            # RIT orange Material-UI theme
└── Header.jsx                 # Top navigation bar
```

### Routes (App.jsx)

| Path | Component | Roles |
|---|---|---|
| `/` | Redirect | → `/home` or `/login` |
| `/login` | LoginPage | Public |
| `/home` | HomePage | All authenticated |
| `/profile` | ProfilePage | All authenticated |
| `/getting_started` | GettingStartedPage | All authenticated |
| `/highlights` | HighlightsPage | Faculty, Supervisor |
| `/highlights_form` | HighlightsFormPage | Faculty |
| `/supervising` | SupervisingPage | Supervisor, Admin |
| `/admin-highlights` | AdminHighlightsPage | Admin |
| `/teaching-evals` | TeachingEvalPage | Admin, Supervisor |
| `/annual-eval` | AnnualEvalPage | Admin, Supervisor |
| `/course_sections` | CourseSectionsPage | All authenticated |
| `/student_support` | StudentSupportPage | All authenticated |
| `/departments` | DepartmentsPage | Admin |
| `/courses` | CoursePage | Admin |
| `/users` | UsersPage | Admin |

### Role-Based Access

Three roles defined in `App.jsx`:

- **Admin** — full access to all pages including user management, departments, courses, all highlights, teaching evals, and annual evaluations.
- **Supervisor** — can view supervised faculty submissions, teaching evals, and annual evaluations.
- **Faculty** — can view and submit their own highlights forms.

> Note: Authentication is currently client-side only. Production deployment should integrate RIT Shibboleth SSO.

---

## Scoring System

Faculty are scored across four categories, combined into a weighted final score, then ranked into a performance tier.

### Teaching Score (2–4)

**Source:** `teaching_eval_api.js → calculateTeachingScore()`  
**Route:** `GET /teaching_evals/score/:facultyId?teaching_text=`

1. Compute the faculty member's percentile rank vs all faculty using `PERCENT_RANK()` over average eval question scores.
2. Map to base score:

| Percentile | Score | Label |
|---|---|---|
| ≥ 70th | 4 | Above Average |
| 30–70th | 3 | Average |
| < 30th | 2 | Below Average |
| No data | null | No eval data |

3. Bump rule: if base = 3 and **2+ improvement keywords** found in the highlights teaching text → bumped to 4.

Improvement keywords: `new assignment`, `redesigned`, `restructured`, `revised`, `updated syllabus`, `new syllabus`, `added`, `introduced`, `overhauled`, `improved`, `modified course`, `changed`, `developed new`, `created new`, `new project`, `new lab`, `new module`, `new curriculum`

---

### Scholarship Score (1–4)

**Source:** `weighted_score_api.js → calculateScholarshipScore()`  
**Route:** `GET /weighted_score/scholarship-score/:facultyId?form_id=`

1. Count publications per faculty member across all their forms.
2. Compute percentile rank vs all faculty.
3. Map to base score:

| Percentile | Score | Label |
|---|---|---|
| ≥ 70th | 4 | Top 30% |
| ≥ 50th | 3 | Top 50% |
| ≥ 30th | 2 | Average |
| < 30th | 1 | Below Average |

4. Bump rule: +1 (capped at 4) if a grant with status `Funded` or `In Submission` exists on the form.

---

### Service & Administrative Scores (1–5)

These come directly from the AI-generated summary ratings returned by `POST /highlights/:formId/summarize`. The AI evaluates the highlights text and returns a 1–5 rating for each section.

---

### Weighted Final Score

**Source:** `weighted_score_api.js → calculateWeightedScore()`  
**Route:** `POST /weighted_score/calculate`

```
finalScore = (teaching × w_t) + (scholarship × w_s) + (service × w_sv) + (administrative × w_a)
```

Default weights (admin-configurable, must always sum to 10):

| Category | Default Weight | Max Contribution |
|---|---|---|
| Teaching | 4 | 20 |
| Scholarship | 3 | 15 |
| Service | 2 | 10 |
| Administrative | 1 | 5 |
| **Total** | **10** | **50** |

Weights are stored in the `category_weights` table. Admins can update them via the WeightedScorePanel UI.

---

### Final Performance Tier (1–5)

**Source:** `weighted_score_api.js → calculateFinalTier()`  
**Route:** `POST /weighted_score/tier`

The `finalScore` is ranked against all other faculty using percentile rank:

| Percentile | Tier | Label |
|---|---|---|
| ≥ 70th | 5 | Top 30% |
| ≥ 60th | 4 | Top 40% |
| ≥ 40th | 3 | Top 60% |
| ≥ 20th | 2 | Top 80% |
| < 20th | 1 | Bottom 20% |

---

### Per-Class Teaching Breakdown

**Source:** `weighted_score_api.js → getPerClassTeachingBreakdown()`  
**Route:** `GET /weighted_score/per-class/:facultyId`

Returns each course the faculty has taught with:
- `class_avg` — average eval score across all questions for that course
- `dept_avg` — department average for the same questions
- `diff` — `class_avg - dept_avg`
- `alignment` — `Above Average` (diff ≥ 0.2), `Average` (−0.2 to 0.2), `Below Average` (diff ≤ −0.2)

---

## AI Summary & Persistence

### Per-Form Summary (`POST /highlights/:formId/summarize`)

Generates a structured JSON evaluation with sections: `teaching`, `scholarship`, `service`, `administrative`, `overall`. Each section has a `rating` (1–5) and `comments`.

- Teaching rating is always overridden with the calculated teaching score (not AI-generated).
- Teaching comments = AI-generated teaching eval paragraph (paragraph 1) + AI course improvement paragraph (paragraph 2).
- Overall rating is clamped to a minimum of 3.
- All faculty names are scrubbed from AI input and output before storage.

### Annual Evaluation (`POST /highlights/annual-eval/:facultyId`)

Aggregates all submissions by a faculty member and generates a single annual evaluation JSON. Same structure as per-form summary. Saved to `form_summaries` with `summary_type='annual'`.

Retrieve without regenerating: `GET /highlights/annual-eval/:facultyId`

### `form_summaries` Table

| Column | Type | Description |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `form_id` | INT | Set for per-form summaries, NULL for annual |
| `faculty_id` | VARCHAR(64) | Set for annual summaries, NULL for per-form |
| `summary_type` | ENUM('form','annual') | Distinguishes the two summary types |
| `summary_json` | LONGTEXT | Full JSON summary object |
| `created_at` | TIMESTAMP | When first generated |
| `updated_at` | TIMESTAMP | When last regenerated |

`ON DUPLICATE KEY UPDATE` ensures regeneration overwrites the stored version rather than creating duplicates.

---

## Adding a New Entity

Example: adding "Awards".

**1. SQL schema** — `server/sql/awards.sql`
```sql
CREATE TABLE IF NOT EXISTS awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT NOT NULL,
  award_name VARCHAR(200) NOT NULL,
  award_date DATE,
  FOREIGN KEY (faculty_id) REFERENCES faculty_information(faculty_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**2. API layer** — `server/api/awards_api.js`
```js
const pool = require('../db');

async function getAllAwards() {
  const conn = await pool.getConnection();
  try { return await conn.query('SELECT * FROM awards'); }
  finally { conn.release(); }
}

async function createAward(body) {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      'INSERT INTO awards (faculty_id, award_name, award_date) VALUES (?,?,?)',
      [body.faculty_id, body.award_name, body.award_date]
    );
  } finally { conn.release(); }
}

async function resetAwardsTable() {
  const conn = await pool.getConnection();
  try { await conn.query(require('fs').readFileSync('sql/awards.sql', 'utf-8')); }
  finally { conn.release(); }
}

module.exports = { getAllAwards, createAward, resetAwardsTable };
```

**3. Routes** — `server/routes/awards_routes.js`
```js
const express = require('express');
const router = express.Router();
const { getAllAwards, createAward } = require('../api/awards_api');

router.get('/', async (_req, res) => {
  try { res.json(await getAllAwards()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try { res.json(await createAward(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
```

**4. Register in `index.js`**
```js
app.use('/awards', require('./routes/awards_routes.js'));
```

**5. Wire into `rebuild_tables.js`**

Add `resetAwardsTable()` call inside `rebuildTables()` so `POST /db/init` creates your table.

**6. Frontend API client** — `src/api/awards_api_imports.js`
```js
import axios from 'axios';
const API_URL = 'http://localhost:3000/awards';
export const getAwards = () => axios.get(API_URL);
export const createAward = (data) => axios.post(API_URL, data);
```

**7. Frontend page** — `src/pages/awards/AwardsPage.jsx`
```jsx
import { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { getAwards } from '../../api/awards_api_imports';

export default function AwardsPage() {
  const [rows, setRows] = useState([]);
  useEffect(() => { getAwards().then(r => setRows(r.data)).catch(console.error); }, []);
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'award_name', headerName: 'Award', flex: 1 },
    { field: 'award_date', headerName: 'Date', width: 120 },
  ];
  return <DataGrid rows={rows} columns={columns} />;
}
```

**8. Add route in `App.jsx`**
```jsx
import AwardsPage from './pages/awards/AwardsPage.jsx';
// inside <Routes>:
<Route path="/awards" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AwardsPage /></ProtectedRoute>} />
```

---

## Common Commands

```bash
# Backend
cd apps/fpes/server
npm install          # install dependencies
node index.js        # start server (port 3000)
npm test             # run Jest tests
node reset_forms.js  # clear forms/highlights/grants without full table rebuild

# Frontend
cd apps/fpes/ui/fpes-frontend
npm install
npm run dev          # start dev server with hot reload (port 5173)

# Database
mysql -u fpes_user -p fpes_db
SHOW TABLES;
DESCRIBE highlights;
SELECT * FROM form_summaries;
```

---

## Troubleshooting

**Cannot connect to database**
- Verify MariaDB is running: `sudo systemctl status mariadb` (Linux) / `brew services list` (macOS)
- Check credentials in `.env`
- Test: `mysql -u fpes_user -p fpes_db`

**Port 3000 already in use**
- Find: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
- Kill: `kill -9 <PID>` or change `PORT` in `.env`

**Module not found**
- Delete `node_modules` and `package-lock.json`, then `npm install`

**Frontend won't start**
- Requires Node 18+: `node --version`
- Clear Vite cache: `rm -rf node_modules/.vite`

**PDF parsing returns empty results**
- Verify `GEMINI_KEY` is set in `.env`
- Check server console for Gemini API errors (quota, invalid key)
- Confirm the PDF follows the expected RIT Highlights form structure

**AI summary returns 429**
- Gemini free-tier quota exceeded. Wait and retry, or upgrade your API plan.

**Summaries not persisting across restarts**
- Ensure `form_summaries` table exists: `mysql -u fpes_user -p fpes_db < sql/form_summaries.sql`
- Check server logs for DB errors on summary save
