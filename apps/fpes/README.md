# Faculty Performance Evaluation System - Developer Onboarding Guide

Welcome to the FPES development team! This guide will get you from zero to running the full application.

## Prerequisites

Before you begin, install these tools:
- Node.js (v18 or higher)
- MariaDB (v10.5 or higher)
- Git
- An IDE

> Multer, pdf-parse, and csv-parser do **not** need to be installed separately — they are already listed in `package.json` and will be installed automatically when you run `npm install`.

### Verify Installations
```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
mysql --version  # Should show MariaDB 10.x.x
```

---

## Getting Started

### Step 1: Clone the Repository
```bash
git clone <repo-url> --branch fpes-server
cd RIT-SE-CODE-BANK
```

The repository structure:
```
fpes/
├── server/    # Backend (Express + MariaDB)
├── ui/        # Frontend (React + Vite)
└── README.md
```

---

## Database Setup (MariaDB)

### Step 1: Start MariaDB

### Step 2: Secure Your Installation (First Time Only)

**Mac/Linux**
```bash
sudo mysql_secure_installation
```

**Windows**

Open Command Prompt as Administrator, then run:
```bash
mysql_secure_installation
```

Then follow the prompts:
- Set root password → Yes
- Remove anonymous users → Yes
- Disallow root login remotely → Yes
- Remove test database → Yes
- Reload privilege tables → Yes

### Step 3: Create the Database
```bash
mysql -u root -p
```

Enter your root password, then run:
```sql
CREATE DATABASE fpes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'fpes_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON fpes_db.* TO 'fpes_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

> Important: Remember `fpes_user` and the password you set!

### Step 4: Initialize Database Schema

The backend has SQL files that create tables. We'll run these after setting up the backend.

---

## Backend Setup

### Step 1: Navigate to Server Directory
```bash
cd apps/fpes/server
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- `express` - Web framework
- `mariadb` - Database driver
- `dotenv` - Environment variable management
- `cors` - Cross-origin resource sharing
- `multer` - File upload handling
- `pdf-parse` - PDF text extraction
- `csv-parser` - CSV file parsing
- `@google/generative-ai` - Google Gemini AI (used to parse grants, publications, and service hours from uploaded PDFs — requires a `GEMINI_KEY` in your `.env`)
- `jest` & `supertest` - Testing (devDependencies)

### Step 3: Create Environment File

Create a file named `.env` in the `server/` directory. Use `example.env` as a template:

```
# Database Configuration
HOST=localhost
DB_USERNAME=fpes_user
DB_PASSWORD=your_secure_password
DATABASE=fpes_db
PORT=3000

# Required for AI-powered PDF parsing (file upload feature)
GEMINI_KEY=your_google_gemini_api_key
```

> `.env` doesn't get pushed to GitHub (it is in `.gitignore`)  
> Get a Gemini API key at https://aistudio.google.com/app/apikey — without it, PDF parsing will fail silently.

### Step 4: Initialize Database Tables

The backend has a special endpoint to rebuild all tables. First, start the server:
```bash
# Make sure you are in server/
node index.js
```

You should see:
```
Server running at http://localhost:3000
```

Open a new terminal and run:
```bash
curl -X POST http://localhost:3000/db/init
```

You should see: `"Tables successfully rebuilt!"`

### Step 5: Verify Database
```bash
mysql -u fpes_user -p fpes_db
SHOW TABLES;
```

You should see tables like:
```
courses
course_sections
departments
faculty
forms
grants
highlights
publications
services
student_support
teaching_evals
etc.
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd apps/fpes/ui/fpes-frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- `react` & `react-dom` - UI framework
- `@mui/material`, `@mui/icons-material`, `@mui/lab` - Material-UI components
- `@mui/x-data-grid` - Data tables (used heavily throughout the app)
- `@mui/x-date-pickers` - Date picker components
- `axios` - HTTP client
- `react-router-dom` - Routing
- `react-hook-form` - Form state management
- `dayjs` - Date handling
- `tailwindcss` - Utility CSS (used alongside MUI)
- `vite` - Build tool

### Step 3: Start Development Server
```bash
npm run dev
```

You should see:
```
VITE vx.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## First Run

### Access the Application
- Open your browser to http://localhost:5173
- You should see the Login Page
- Backend should be running at http://localhost:3000

### Test the API

Open a new terminal and test the backend:
```bash
# Get all courses
curl http://localhost:3000/courses

# Get all departments
curl http://localhost:3000/departments

# Health check
curl http://localhost:3000/
```

Routes are defined in the backend in `server/routes/`  
Routes are defined in the frontend in `ui/fpes-frontend/src/App.jsx`

*Feel free to explore the different pages, as well as signing in as a faculty vs admin*

---

## Understanding the Codebase

### Backend Architecture
```
server/
├── index.js                          # Express app setup
├── db.js                             # MariaDB connection pool
├── reset_forms.js                    # Clears forms/highlights/grants without full rebuild
│
├── api/                              # Business logic (CRUD)
│   ├── course_section_api.js
│   ├── courses_api.js
│   ├── departments_api.js
│   ├── faculty_api.js
│   ├── grants_api.js
│   ├── publications_api.js
│   ├── service_api.js
│   ├── student_support_api.js
│   ├── highlights_api.js
│   ├── parsed_highlights_api.js
│   ├── teaching_eval_api.js
│   ├── forms_api.js
│   ├── file_parser_api.js            # PDF/CSV parsing with Gemini AI
│   ├── forms_to_dynamics_tables_api.js  # Links form IDs to dynamic field tables
│   └── rebuild_tables.js            # Drops, resets, and rebuilds all database tables
│
├── routes/                           # Express routes (HTTP endpoints)
│   ├── course_section_routes.js      # Maps URLs to API functions
│   ├── courses_routes.js
│   ├── departments_routes.js
│   ├── faculty_routes.js
│   ├── grants_routes.js
│   ├── publications_routes.js
│   ├── service_routes.js
│   ├── student_support_routes.js
│   ├── highlights_routes.js
│   ├── teaching_eval_routes.js
│   ├── forms_routes.js
│   └── file_upload_routes.js         # Handles Multer file uploads + AI parsing
│
├── test/api/                         # Jest tests
│   ├── course_section_api.test.js
│   └── student_support_api.test.js
│
├── express_testing/                  # Manual integration test scripts (not Jest)
│   ├── faculty_information_test.js
│   ├── grants_test.js
│   └── services_test.js
│
├── uploads/                          # Multer stores uploaded files here (hash-named)
│                                     # Do not delete unless resetting file upload state
│
└── sql/                              # Database schemas
    ├── form_to_field_tables/         # Schemas for the dynamic form field system
    ├── drop_tables.sql               # Drops all tables in FK-safe order
    └── [one .sql file per entity]
```

### Frontend Architecture
```
fpes-frontend/src/
├── App.jsx                    # Main router, auth state, role management
├── main.jsx                   # React entry point
├── ProtectedRoute.jsx         # Auth wrapper for routes
│
├── api/                       # Axios API clients
│   ├── course_api_imports.js  # API calls for courses
│   └── [other API imports]
│
├── pages/                     # Top-level route components
│   ├── home/                  # Landing and dashboard views
│   ├── login/                 # Authentication pages
│   ├── profile/               # User profile management
│   ├── users/                 # User administration
│   ├── supervisor/            # Supervisor-facing pages
│
│   ├── courses/
│   ├── course_sections/
│   ├── departments/
│   ├── services/
│   ├── grants/
│   ├── publications/
│   ├── student_support/
│
│   ├── highlights_form/       # Highlights form workflow
│   └── highlights_page/       # Highlights display, Admin view, Teaching Evals,
│                              # file upload (AddFilePage, DataPreviewPage)
│
├── theme/                     # Material-UI customization
│   └── MuiTheme.js            # RIT orange branding
└── ProtectedRoute.jsx         # Auth wrapper for routes
```

All routes registered in `App.jsx`:

| Path | Component | Access |
|------|-----------|--------|
| `/` | Redirect | → `/home` or `/login` |
| `/login` | LoginPage | Public |
| `/home` | HomePage | All roles |
| `/profile` | ProfilePage | All roles |
| `/highlights` | HighlightsPage | Faculty, Supervisor |
| `/highlights_form` | HighlightsFormPage | Faculty |
| `/supervising` | SupervisingPage | Supervisor, Admin |
| `/admin-highlights` | AdminHighlightsPage | Admin |
| `/teaching-evals` | TeachingEvalPage | Admin, Supervisor |
| `/course_sections` | CourseSectionsPage | All authenticated |
| `/student_support` | StudentSupportPage | All authenticated |
| `/departments` | DepartmentsPage | Admin only |
| `/courses` | CoursesPage | Admin only |
| `/users` | UsersPage | Admin only |

---

## Important Concepts

### Role-Based Access Control

The app has 3 roles defined in `App.jsx`:
- **Admin** - Full access (departments, users, courses, all highlights, teaching evals)
- **Faculty** - View/edit their own data
- **Supervisor** - View supervised faculty data

Routes check roles before rendering:
```jsx
{roles.intersection(new Set(["Admin"])).size > 0 ? adminRoutes : null}
```

### Authentication Flow (Current Implementation)

> Note: This is currently client-side only and not secure for production

1. User enters credentials in LoginPage
2. Login validates against database
3. Sets `isAuthenticated` and `roles` in React state
4. `ProtectedRoute` checks auth before showing pages
5. TODO: Implement RIT Shibboleth authentication

---

## Common Development Tasks

### Adding a New Table/Entity

Let's say you want to add "Awards":

**1. Create SQL Schema** (`server/sql/awards.sql`)
```sql
CREATE TABLE IF NOT EXISTS awards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT NOT NULL,
  award_name VARCHAR(200) NOT NULL,
  award_date DATE,
  FOREIGN KEY (faculty_id) REFERENCES faculty(id)
);
```

**2. Create API Layer** (`server/api/awards_api.js`)
```js
const pool = require('../db');

async function getAllAwards() {
  let connection;
  try {
    connection = await pool.getConnection();
    const results = await connection.query('SELECT * FROM awards');
    return results;
  } finally {
    if (connection) connection.release();
  }
}

async function createAward(body) {
  let connection;
  try {
    connection = await pool.getConnection();
    const {faculty_id, award_name, award_date} = body;
    const results = await connection.query(
      'INSERT INTO awards (faculty_id, award_name, award_date) VALUES (?,?,?)',
      [faculty_id, award_name, award_date]
    );
    return results;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {getAllAwards, createAward};
```

**3. Create Routes** (`server/routes/awards_routes.js`)
```js
const express = require('express');
const router = express.Router();
const api = require('../api/awards_api');

router.get('/', async (req, res) => {
  try {
    const results = await api.getAllAwards();
    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const results = await api.createAward(req.body);
    res.json(results);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
```

**4. Register Routes** (`server/index.js`)
```js
const awardsRoutes = require('./routes/awards_routes.js');
app.use('/awards', awardsRoutes);
```

**5. Wire into `rebuild_tables.js`**

Add a `resetAwardsTable` function in `awards_api.js` and call it inside `rebuildTables()` in `rebuild_tables.js` — otherwise `/db/init` won't create your table.

**6. Create Frontend API Client** (`fpes-frontend/src/api/awards_api_imports.js`)
```js
import axios from "axios";

const API_URL = "http://localhost:3000/awards";

export const getAwards = () => axios.get(API_URL);
export const createAward = (award) => axios.post(API_URL, award);
```

**7. Create Frontend Page** (`fpes-frontend/src/pages/awards/AwardsPage.jsx`)
```jsx
import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { getAwards } from "../../api/awards_api_imports";

export default function AwardsPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getAwards()
      .then(res => setRows(res.data))
      .catch(console.error);
  }, []);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'award_name', headerName: 'Award Name', flex: 1 },
    { field: 'award_date', headerName: 'Date', width: 120 },
  ];

  return <DataGrid rows={rows} columns={columns} />;
}
```

**8. Add Route to App** (`fpes-frontend/src/App.jsx`)
```jsx
import AwardsPage from './pages/awards/AwardsPage.jsx';

// In <Routes>:
<Route path="/awards" element={<ProtectedRoute isAuthenticated={isAuthenticated}>
  <AwardsPage />
</ProtectedRoute>} />
```

---

## Testing Your Changes

### Backend Testing
```bash
cd server

# Test a specific endpoint
curl http://localhost:3000/courses

# Test POST request
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{"course_code":"CS101","course_name":"Intro to CS","credits":3}'
```

### Frontend Testing
1. Make your changes
2. Save the file (Vite auto-reloads)
3. Check browser console for errors (F12)
4. Use React DevTools extension

---

## Useful Commands

### Backend
```bash
cd server
npm install          # Install dependencies
node index.js        # Start server
npm test             # Run Jest tests
node reset_forms.js  # Clear forms, highlights, and grants without full table rebuild
```

### Frontend
```bash
cd fpes-frontend
npm install    # Install dependencies
npm run dev    # Start dev server (hot reload)
```

### Database
```bash
mysql -u fpes_user -p fpes_db    # Connect to database
SHOW TABLES;                      # List all tables
DESCRIBE course_sections;         # Show table structure
SELECT * FROM courses LIMIT 10;  # View data
```

---

## Troubleshooting

**"Cannot connect to database"**
- Check MariaDB is running: `sudo systemctl status mariadb` (Linux) or `brew services list` (macOS)
- Verify credentials in `.env` file
- Test connection: `mysql -u fpes_user -p fpes_db`

**"Port 3000 already in use"**
- Find process: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
- Kill it: `kill -9 <PID>`
- Or change `PORT` in `.env`

**"Module not found"**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**Frontend won't start**
- Check Node version: `node --version` (needs 18+)
- Clear Vite cache: `rm -rf node_modules/.vite`
- Restart: `npm run dev`

**PDF parsing returns empty results**
- Check `GEMINI_KEY` is set correctly in `.env`
- Verify the PDF follows the expected Highlights form structure
- Check server console for Gemini API errors

**Changes not reflecting in browser**
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
- Clear browser cache
- Check browser console for errors

---

## Weighted Final Score System

The weighted final score system evaluates faculty performance across 4 categories, combines them into a single score, and maps that score to a performance tier (1–5).

### Overview

```
Category Score (1–4)  ×  Weight  =  Contribution
─────────────────────────────────────────────────
Teaching              ×  4       =  up to 16
Scholarship           ×  3       =  up to 12
Service               ×  2       =  up to 8
Administrative        ×  1       =  up to 4
─────────────────────────────────────────────────
                         Total   =  Final Score (max 40)
```

Weights are stored in the `category_weights` table and must always sum to 10. Admins can update them via the UI.

---

### Category Score: Teaching (2–4)

**Source:** `server/api/teaching_eval_api.js` → `calculateTeachingScore()`
**Route:** `GET /teaching_evals/score/:facultyId?teaching_text=...`

1. Fetch the faculty member's percentile rank vs all other faculty based on average teaching eval scores.
2. Map percentile to base score:

| Percentile | Base Score | Label |
|---|---|---|
| ≥ 70th | 4 | Above Average |
| 30th – 70th | 3 | Average |
| < 30th | 2 | Below Average |
| No eval data | null | No eval data |

3. **Bump rule:** If base score = 3 and **2 or more** course improvement keywords are found in the teaching highlights text → bumps to 4.

Improvement keywords checked:
> `new assignment`, `new assignments`, `redesigned`, `restructured`, `revised`, `updated syllabus`, `new syllabus`, `added`, `introduced`, `overhauled`, `improved`, `modified course`, `changed`, `developed new`, `created new`, `new project`, `new lab`, `new module`, `new curriculum`

---

### Category Score: Scholarship (1–4)

**Source:** `server/api/weighted_score_api.js` → `calculateScholarshipScore()`
**Route:** `GET /weighted_score/scholarship-score/:facultyId?formId=...`

1. Count publications linked to each faculty member's forms.
2. Compute percentile rank vs all faculty.
3. Map percentile to base score:

| Percentile | Base Score | Label |
|---|---|---|
| ≥ 70th | 4 | Top 30% |
| ≥ 50th | 3 | Top 50% |
| ≥ 30th | 2 | Average |
| < 30th | 1 | Below Average |

4. **Bump rule:** If a grant with status `Funded` or `In Submission` exists on the form → +1 (capped at 4).

---

### Category Scores: Service & Administrative (1–5)

These come directly from the AI summary ratings generated by the `POST /highlights/:formId/summarize` endpoint. The AI evaluates the highlights form text and returns a 1–5 rating for each section.

---

### Weighted Sum Formula

```
finalScore = (teaching × w_teaching)
           + (scholarship × w_scholarship)
           + (service × w_service)
           + (administrative × w_administrative)
```

**Source:** `server/api/weighted_score_api.js` → `calculateWeightedScore()`
**Route:** `POST /weighted_score/calculate`

Default weights (admin-configurable):

| Category | Default Weight |
|---|---|
| Teaching | 4 |
| Scholarship | 3 |
| Service | 2 |
| Administrative | 1 |
| **Total** | **10** |

Example with all scores = 3:
```
(3×4) + (3×3) + (3×2) + (3×1) = 12 + 9 + 6 + 3 = 30
```

---

### Final Tier (1–5)

**Source:** `server/api/weighted_score_api.js` → `calculateFinalTier()`
**Route:** `POST /weighted_score/tier`

The `finalScore` is ranked against all other faculty final scores using percentile rank:

| Percentile | Tier | Label |
|---|---|---|
| ≥ 70th | 5 | Top 30% |
| ≥ 60th | 4 | Top 40% |
| ≥ 40th | 3 | Top 60% |
| ≥ 20th | 2 | Top 80% |
| < 20th | 1 | Bottom 20% |

---

### Per-Class Teaching Breakdown

**Source:** `server/api/weighted_score_api.js` → `getPerClassTeachingBreakdown()`
**Route:** `GET /weighted_score/per-class/:facultyId`

Returns each course the faculty has taught with:
- `class_avg` — average score across all eval questions for that course
- `dept_avg` — department average for the same questions
- `diff` — `class_avg - dept_avg`
- `alignment` — `Above Average` (diff ≥ 0.2), `Average` (−0.2 to 0.2), `Below Average` (diff ≤ −0.2)

---

### Admin Weight Configuration

**Route:** `GET /weighted_score/weights` — fetch current weights
**Route:** `PUT /weighted_score/weights` — update weights (must sum to 10)

Weights are stored in the `category_weights` table. See `server/sql/category_weights.sql` for the schema and default values.

---

### UI: WeightedScorePanel

**Source:** `ui/fpes-frontend/src/pages/highlights_page/WeightedScorePanel.jsx`

Rendered in `AdminHighlightsPage` after clicking "Summarize" on a highlights form row. Displays:
- Teaching score with percentile and bump status
- Per-class teaching breakdown table
- Scholarship score with publication count and grant bump status
- Weighted final score with per-category contribution breakdown
- Final performance tier
- Qualitative feedback paragraph auto-generated from the scores
- Weight editor (admin only) — allows adjusting weights in real time
