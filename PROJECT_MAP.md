# 📍 ESTUDIUS - PROJECT MAP

**Last Updated:** May 12, 2026
**Purpose:** Complete reference guide for finding and modifying code in the Estudius project

---

## TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Schema](#database-schema)
7. [Feature Implementation Guide](#feature-implementation-guide)
8. [Authentication & Authorization](#authentication--authorization)
9. [Page Rendering System](#page-rendering-system)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Common Tasks](#common-tasks)

---

## PROJECT OVERVIEW

**Application Name:** Estudius
**Slogan:** "Si querés estudiar, Estudius es el lugar"
**Purpose:** Web platform connecting students with private tutors

### Key Features
- Browse and search teachers by subject, modality (virtual/presencial)
- Teacher profile management
- Booking/scheduling system
- User authentication with roles (user/admin)
- Admin panel for account management
- Feature management system (admin)

### Architecture
- **Frontend:** Single Page Application (SPA) using HTML5, CSS3, JavaScript Vanilla
- **Backend:** Node.js + Express.js REST API
- **Database:** SQLite3 (local file-based)
- **Runtime:** Node.js >= 24.14.1

### Deployment
- **Frontend:** Served statically from backend via Express.js
- **Database:** File located at `database/estudius.db`
- **Port:** 3000 (default)

---

## TECHNOLOGY STACK

### Frontend
| Technology | Purpose | Location |
|-----------|---------|----------|
| HTML5 | Structure | `frontend/index.html` |
| CSS3 | Styling | `frontend/css/styles.css` |
| JavaScript Vanilla (ES6+) | Logic & interactivity | `frontend/js/` |
| Fetch API | HTTP communication | `frontend/js/api.js` |

### Backend
| Technology | Purpose | Package |
|-----------|---------|---------|
| Express.js | HTTP server framework | v4.18.2 |
| SQLite3 | Database | v5.1.6 |
| bcryptjs | Password hashing | v2.4.3 |
| jsonwebtoken | JWT authentication | v9.0.0 |
| CORS | Cross-origin requests | v2.8.5 |

---

## DIRECTORY STRUCTURE

```
estudius/
│
├── 📄 INDEX.md                    [Start here - main documentation]
├── 📄 README.md                   [Project overview]
├── 📄 STACK_Y_ESTRUCTURA.md       [Tech stack & architecture]
├── 📄 QUICKSTART.md               [Quick setup guide]
├── 📄 00_COMIENZA_AQUI.md         [Getting started]
├── 📄 FAQ.md                      [Frequently asked questions]
├── 📄 VERIFICACION.md             [Verification checklist]
├── 📄 ENTREGA.txt                 [Delivery notes]
├── 📄 GITHUB_SETUP.md             [Git configuration]
│
├── 🗂️ frontend/                    [Client-side application]
│   ├── 📄 index.html              [Main HTML file - Base structure only]
│   ├── 🗂️ css/
│   │   └── 📄 styles.css          [All styling - CSS variables + components]
│   ├── 🗂️ js/
│   │   ├── 📄 app.js              [**MAIN APP LOGIC - Page rendering & state]
│   │   ├── 📄 api.js              [API client classes (TeacherAPI, AuthAPI, etc.)]
│   │   ├── 📄 config.js           [Configuration (logo path, etc.)]
│   │   └── 📄 utils.js            [Helper functions (HTTP, validation, alerts)]
│   ├── 🗂️ data/
│   │   └── 📄 teachers.json       [Fallback teacher data for offline]
│   └── 🗂️ assets/
│       └── 🗂️ uploads/            [Teacher photos - organized by gender]
│           ├── 🗂️ hombres/       [Male teacher photos]
│           ├── 🗂️ mujeres/       [Female teacher photos]
│           ├── 🗂️ others/        [Other photos]
│           ├── 📄 logo.svg        [Site logo]
│           └── 📄 default-avatar.svg [Default avatar]
│
├── 🗂️ backend/                     [Server-side application]
│   ├── 📄 server.js               [Express app setup & routing]
│   ├── 📄 package.json            [Dependencies]
│   ├── 📄 start.js                [Start script]
│   │
│   ├── 🗂️ routes/                 [API endpoint definitions]
│   │   ├── 📄 teacherRoutes.js    [/api/teachers endpoints]
│   │   ├── 📄 authRoutes.js       [/api/auth endpoints]
│   │   ├── 📄 bookingRoutes.js    [/api/bookings endpoints]
│   │   ├── 📄 adminRoutes.js      [/api/admin endpoints]
│   │   └── 📄 featuresRoutes.js   [/api/admin/features endpoints]
│   │
│   ├── 🗂️ controllers/             [Request handlers]
│   │   ├── 📄 teacherController.js [Handle teacher requests]
│   │   ├── 📄 authController.js    [Handle auth requests]
│   │   ├── 📄 bookingController.js [Handle booking requests]
│   │   ├── 📄 adminController.js   [Handle admin requests]
│   │   └── 📄 featuresController.js [Handle feature requests]
│   │
│   ├── 🗂️ services/                [Business logic]
│   │   ├── 📄 teacherService.js    [Teacher business rules]
│   │   └── [Others as needed]
│   │
│   ├── 🗂️ lib/                     [Shared helpers]
│   │   └── 📄 scheduleUtils.js     [Horarios JSON: parse, validar, migrar texto legacy, filtro por franja]
│   │
│   ├── 🗂️ data/                    [Database access layer]
│   │   ├── 📄 teacherRepository.js [Teacher CRUD + queries]
│   │   ├── 📄 userRepository.js    [User CRUD + queries]
│   │   └── 📄 bookingRepository.js [Booking CRUD]
│   │
│   ├── 🗂️ models/                  [Data schemas & validation]
│   │   └── 📄 teacherModel.js      [Teacher data structure & validation]
│   │
│   ├── 🗂️ middleware/              [Express middleware]
│   │   └── 📄 authMiddleware.js    [JWT verification & role checking]
│   │
│   ├── 🗂️ database/                [Database setup]
│   │   ├── 📄 db.js               [SQLite connection & initialization]
│   │   └── 📄 schema.sql          [Database schema definitions]
│   │
│   ├── 🗂️ scripts/                 [Utility scripts]
│   │   ├── 📄 seed-teachers.js     [Generate test teacher data]
│   │   ├── 📄 assign-photos.js     [Assign photos to teachers]
│   │   ├── 📄 remove-subjects.js   [Remove subjects from teachers]
│   │   ├── 📄 create_profiles_from_uploads.js [Create profiles from uploaded images]
│   │   ├── 📄 create_profiles_from_uploads.py [Python version of above]
│   │   ├── 📄 check_colors.js      [Check user avatar colors]
│   │   ├── 📄 clean-*.js           [Database cleanup scripts]
│   │   └── 📄 list_features.js     [List system features]
│   │
│   └── 🗂️ node_modules/            [Dependencies - not tracked in version control]
│
├── 🗂️ database/                     [Database files]
│   ├── 📄 schema.sql               [Initial schema - executed on app startup]
│   └── 📄 estudius.db              [SQLite database file - created on first run]
│
└── 📄 EJEMPLOS_DATOS.js            [Example data structures]
```

---

## FRONTEND ARCHITECTURE

### SPA (Single Page Application) System

**Important:** NOT all HTML is in `index.html`. The application uses a dynamic rendering system.

#### How It Works:

1. **index.html** contains:
   - Static header with navigation and logo
   - Static footer with social links
   - Empty `<main></main>` element
   - Script includes for JS files

2. **app.js** contains:
   - `EstudiusApp` class that manages entire application state
   - `showPage(pageName)` method - changes which page is displayed
   - `renderPage()` method - generates HTML for current page and inserts into `<main>`
   - Different page templates are generated as strings inside `renderPage()` method

3. **Page Generation:**
   - Pages are rendered dynamically by `renderPage()` in app.js
   - Each page (home, list-teachers, add-teacher, etc.) has its HTML template as a JavaScript string
   - When page changes, old HTML is replaced with new template

#### Page Types & Locations:

| Page | Display Name | Rendered By | Location in Code |
|------|--------------|------------|-----------------|
| `home` | Homepage | app.js renderPage() | frontend/js/app.js (search for "case 'home'") |
| `list-teachers` | Teacher list | app.js renderPage() | frontend/js/app.js (search for "case 'list-teachers'") |
| `add-teacher` | Add teacher form (admin) | app.js renderPage() | frontend/js/app.js (search for "case 'add-teacher'") |
| `teacher/{id}` | Teacher details | app.js showTeacherDetail() | frontend/js/app.js (search for "showTeacherDetail") |
| `admin` | User management (super-admin) | app.js renderPage() | frontend/js/app.js (search for "case 'admin'") |
| `admin-features` | Feature management | app.js renderPage() | frontend/js/app.js (search for "case 'admin-features'") |

### Key Files:

**frontend/js/app.js** (~2500+ lines)
- `EstudiusApp` class - core application
- `constructor()` - initialization
- `init()` - async startup
- `renderPage()` - generates page HTML from templates
- `showPage(pageName)` - navigation
- `setupEventListeners()` - attach event handlers
- `loadTeachers()` - fetch teacher data
- `showAuthModal()` - login/register modal
- `showTeacherDetail()` - teacher profile page
- Handlers for forms, bookings, admin operations

**frontend/js/scheduleUtils.js**
- Misma semántica que el backend para horarios JSON: `parseSchedulesFromApi`, `teacherMatchesAvailability`, `formatScheduleDetailHtml`, etc.

**frontend/js/api.js** (~400 lines)
- `TeacherAPI` class - all teacher operations
  - `getAllTeachers()`
  - `getTeacherById(id)`
  - `getRecommendedTeachers(limit)`
  - `searchTeachers(filters)`
  - `createTeacher(data)` - admin only
  - `updateTeacher(id, data)` - admin only
  - `deleteTeacher(id)` - admin only
- `AuthAPI` class - authentication
  - `register(data)`
  - `login(data)`
  - `me(token)` - get current user
  - `changePassword(token, data)`
- `BookingAPI` class - booking operations
  - `createBooking(token, data)`
  - `getMyBookings(token)`
- `AdminAPI` class - admin operations
- `httpRequest()` - HTTP utility function
- Local storage of JWT token in `localStorage.authToken`

**frontend/js/utils.js** (~300 lines)
- `httpRequest()` - makes HTTP requests with auth header
- `validateEmail()`
- `checkPasswordStrength()`
- `sanitizeDescription()`
- `showAlert()` - displays notifications
- Form validation helpers

**frontend/js/config.js** (~10 lines)
- `SITE_LOGO_PATH` - path to logo image
- Loads logo into header and footer on page load

**frontend/css/styles.css** (~1000+ lines)
- CSS variables defining design system
  - Colors (primary, secondary, error, success, etc.)
  - Typography (font sizes, families)
  - Spacing scale
  - Border radius, shadows
- Component styles:
  - Header & footer
  - Buttons
  - Forms
  - Cards
  - Modals
  - Responsive grid layout

### State Management (in app.js):

The `EstudiusApp` instance maintains all application state:
- `currentPage` - which page is displayed
- `currentUser` - logged in user object
- `authToken` - JWT token
- `allTeachers` - cached teacher list
- `currentTeacher` - selected teacher
- `filters` - current search/filter criteria
- `adminPage`, `adminPageSize` - pagination state
- `subjectGroups` - available subjects

---

## BACKEND ARCHITECTURE

### Layered Architecture (3-tier):

```
Request → Routes → Controllers → Services → Repositories → Database
                        ↓
                  (Validation & Auth)
```

### File Organization:

#### 1. **Routes Layer** (`backend/routes/`)
Defines API endpoints and HTTP methods

**teacherRoutes.js:**
- `GET /api/teachers` - get all teachers
- `POST /api/teachers` - create teacher (requires admin)
- `GET /api/teachers/recommendations` - get recommended teachers
- `GET /api/teachers/random` - get random teachers
- `GET /api/teachers/search` - search teachers with filters
- `GET /api/teachers/:id` - get teacher by ID
- `PUT /api/teachers/:id` - update teacher (requires admin)
- `DELETE /api/teachers/:id` - delete teacher (requires admin)
- `GET /api/subjects` - get all available subjects
- `GET /api/subjects/grouped` - get subjects by category
- `POST /api/upload` - upload photo
- `GET /api/health` - health check

**authRoutes.js:**
- `POST /api/auth/register` - register new user
- `POST /api/auth/login` - login user
- `GET /api/auth/me` - get current user (requires auth)
- `POST /api/auth/change-password` - change password (requires auth)

**bookingRoutes.js:**
- `POST /api/bookings` - create booking (requires user role)
- `GET /api/bookings/my` - get user's bookings (requires auth)

**adminRoutes.js:**
- Admin-specific endpoints (user management, etc.)

**featuresRoutes.js:**
- `GET /api/admin/features` - list features
- `POST /api/admin/features` - create feature (admin)
- `PUT /api/admin/features/:id` - update feature (admin)
- `DELETE /api/admin/features/:id` - delete feature (admin)

#### 2. **Controller Layer** (`backend/controllers/`)
Handles HTTP requests and responses

**teacherController.js:**
- `getAllTeachers(req, res)` - fetch from service, return JSON
- `createTeacher(req, res)` - validate input, handle photo upload, call service
- `getTeacherById(req, res)` - increment view count, return teacher
- `getRecommendedTeachers(req, res)` - get recommended by algorithm
- `getRandomTeachers(req, res)` - get random selection
- `searchTeachers(req, res)` - filter by subject/modality/search term
- `updateTeacher(req, res)` - update teacher data
- `deleteTeacher(req, res)` - delete teacher
- `getAvailableSubjects()` - return subject list
- `getSubjectCategories()` - return grouped subjects
- `uploadPhoto(req, res)` - save photo to disk

**authController.js:**
- `register(req, res)` - validate, hash password, create user, return JWT
- `login(req, res)` - verify credentials, return JWT
- `me(req, res)` - return current user data
- `changePassword(req, res)` - verify current password, update hash

**bookingController.js:**
- `createBooking(req, res)` - create booking entry
- `getMyBookings(req, res)` - get bookings for logged-in user

**adminController.js:**
- Admin endpoints for user management, etc.

**featuresController.js:**
- Feature management endpoints

#### 3. **Service Layer** (`backend/services/`)
Contains business logic and validation

**teacherService.js:**
- `validateTeacherData()` - comprehensive field validation
- `createTeacher()` - business rules for creation
- `getAllTeachers()` - fetch from repository
- `getTeacherById()` - fetch from repository with view increment
- `getRecommendedTeachers()` - sorting and balancing algorithm
- `getRandomTeachers()` - random selection
- `balanceRecommendations()` - algorithm to balance by modality/subject

#### 4. **Repository Layer** (`backend/data/`)
Database access - implements CRUD operations

**teacherRepository.js:**
- `create()` - INSERT new teacher
- `getAll()` - SELECT all teachers
- `getById(id)` - SELECT by ID (includes photo finding logic)
- `getByEmail()` - SELECT by email
- `getByFullName()` - SELECT by name
- `getRecommended()` - SELECT with ranking by views
- `getRandom()` - SELECT random teachers
- `search()` - SELECT with filters
- `update()` - UPDATE teacher
- `delete()` - DELETE teacher
- `incrementViews()` - UPDATE views counter

**userRepository.js:**
- `create()` - INSERT new user
- `getByEmail()` - SELECT by email
- `getById()` - SELECT by ID (safe - no password hash)
- `getByIdWithHash()` - SELECT by ID (with password hash)
- `updatePassword()` - UPDATE password hash
- `updateRole()` - UPDATE user role
- `getAllUsers()` - SELECT all users
- `findUsers()` - SELECT with search/pagination
- `deleteUser()` - DELETE user
- `getColorsByInitial()` - SELECT colors for avatar

**bookingRepository.js:**
- `create()` - INSERT new booking
- `getByUserId()` - SELECT bookings for user

#### 5. **Model Layer** (`backend/models/`)
Data structures and validation rules

**teacherModel.js:**
- `TeacherModel` object - defines all fields
- `SUBJECTS` object - categorized subject list
- `ALL_SUBJECTS` array - flat list of all subjects
- `ValidateTeacher` object - validation functions for each field
  - firstName, lastName, age, email, etc.

#### 6. **Middleware Layer** (`backend/middleware/`)
Request interceptors and authentication

**authMiddleware.js:**
- `authenticate(req, res, next)` - verify JWT token
- `requireAdmin(req, res, next)` - check for admin role
- `requireSuperAdmin(req, res, next)` - check for super-admin (admin@gmail.com)
- `requireUserRole(req, res, next)` - check for regular user role

#### 7. **Database Layer** (`backend/database/`)

**db.js:** (~200 lines)
- Establishes SQLite connection
- Initializes database schema
- Wrapper functions:
  - `dbAll(sql, params)` - execute query, return array
  - `dbGet(sql, params)` - execute query, return single row
  - `dbRun(sql, params)` - execute insert/update/delete
- Auto-seeds admin@gmail.com on startup (if not exists)
- Helper functions for subject icons

**schema.sql:** (~80 lines)
- Initial database schema
- Creates tables: teachers, users, bookings, features, etc.
- Creates indices for optimization

### Main Backend File:

**server.js:** (~80 lines)
- Express app setup
- Middleware: body parser, CORS, logging
- Route mounting
- Static file serving (frontend)
- SPA fallback (serve index.html for non-API routes)
- Error handling
- Server startup on port 3000

---

## DATABASE SCHEMA

### Tables:

#### `teachers` Table
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
firstName       TEXT NOT NULL
lastName        TEXT NOT NULL
age             INTEGER NOT NULL (0 < age < 150)
email           TEXT NOT NULL UNIQUE
phone           TEXT
description     TEXT NOT NULL (sanitized in repository)
curriculum      TEXT NOT NULL
photo           TEXT (path like '/assets/uploads/hombres/id.jpg')
classSize       INTEGER NOT NULL (0 < classSize <= 40)
subjects        TEXT NOT NULL (JSON array)
modality        TEXT (deprecated, kept for backwards compat)
modalities      TEXT (JSON array: ["virtual", "presencial"])
schedules       TEXT NOT NULL (JSON estructurado: ver `backend/lib/scheduleUtils.js`)
location        TEXT (NULL if virtual)
createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP
views           INTEGER DEFAULT 0 (for recommendation algorithm)
```

#### `users` Table
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
firstName       TEXT NOT NULL
lastName        TEXT NOT NULL
email           TEXT NOT NULL UNIQUE
passwordHash    TEXT NOT NULL
role            TEXT DEFAULT 'user' ('user' or 'admin')
color           TEXT (hex color for avatar bubble)
createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `bookings` Table
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
userId          INTEGER NOT NULL (FOREIGN KEY -> users.id)
teacherId       INTEGER NOT NULL (FOREIGN KEY -> teachers.id)
datetime        DATETIME NOT NULL (when class is scheduled)
message         TEXT (optional notes)
createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `features` Table
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
name            TEXT NOT NULL UNIQUE
description     TEXT
enabled         BOOLEAN DEFAULT 1
createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP
```

#### `teacher_logs` Table (audit trail)
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
teacherId       INTEGER NOT NULL (FOREIGN KEY -> teachers.id)
action          TEXT NOT NULL (what was done)
timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Database Location:
- **File:** `database/estudius.db`
- **Created:** Automatically on first app startup
- **Schema:** Executed from `database/schema.sql`

---

## AUTHENTICATION & AUTHORIZATION

### User Roles:
- **user** - Regular user, can browse and book classes
- **admin** - Can create/edit/delete teachers
- **super-admin** - Special admin (admin@gmail.com) with additional powers

### Authentication Flow:

1. **Registration** (`frontend/js/app.js` → POST `/api/auth/register`)
   - User enters email, password, name
   - Frontend validates password strength
   - Backend creates user with hashed password
   - Returns JWT token
   - Token stored in `localStorage.authToken`

2. **Login** (`frontend/js/app.js` → POST `/api/auth/login`)
   - User enters email/password
   - Backend verifies credentials with bcryptjs
   - Returns JWT token
   - Token stored in `localStorage.authToken`

3. **Authenticated Requests**
   - All API requests include header: `Authorization: Bearer {token}`
   - `authMiddleware.js` verifies token signature and expiration
   - `req.user` is populated with decoded token data
   - Role checks applied per endpoint

4. **Logout**
   - Frontend removes token from `localStorage`
   - Backend doesn't need to do anything (stateless)

### Password Security:
- Hashed with bcryptjs (10 salt rounds)
- Strength requirements:
  - Minimum 8 characters
  - Must include letter and number
  - Validated on both frontend and backend

### JWT Details:
- Expiration: 7 days
- Secret: `process.env.JWT_SECRET` (fallback: 'estudius_dev_secret_please_change')
- Payload contains: id, email, role, firstName, lastName

---

## PAGE RENDERING SYSTEM

### How to Understand Page Templates:

**ALL page HTML is generated in `frontend/js/app.js` in the `renderPage()` method.**

To find a specific page:

1. Open `frontend/js/app.js`
2. Search for `renderPage()` method (line ~656)
3. Look for the switch statement: `switch(this.currentPage)`
4. Find `case 'page-name':`
5. The HTML template is defined as a template literal string below

### Example: Homepage Template Location

Search for `case 'home':` in app.js → you'll find something like:
```javascript
case 'home':
  html = `
    <section class="hero">
      <!-- Full HTML for home page here -->
    </section>
  `;
  break;
```

### Dynamic Content Insertion:

Templates use JavaScript template literals to insert data:
```javascript
html = `
  <div>${this.currentUser.firstName}</div>  <!-- Insert user name -->
  <button onclick="window.app.loadTeachers()">Refresh</button>
```

### Event Handler Attachment:

After rendering, event listeners are attached:
```javascript
setTimeout(() => {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => this.handleAdd());
  });
}, 0);
```

### All Pages in renderPage():

**Search for these in app.js renderPage() method:**

| Page Name | Find | Purpose |
|-----------|------|---------|
| `home` | `case 'home':` | Homepage with recommendations |
| `list-teachers` | `case 'list-teachers':` | Teacher search/list |
| `add-teacher` | `case 'add-teacher':` | Admin form to add teacher |
| `admin` | `case 'admin':` | Super-admin user management |
| `admin-features` | `case 'admin-features':` | Feature toggles |

### Dynamic Teacher Detail Page:

**NOT in renderPage() - special handling:**
- Search for `showTeacherDetail()` method in app.js
- Called when viewing individual teacher profile
- URL format: `#teacher/{id}`

### Modals (Overlays):

Not part of renderPage() - created dynamically:
- `showAuthModal()` - login/register
- `showScheduleModal()` - booking form
- `showChangePasswordModal()` - password change
- `showAdminModal()` - admin dialogs

---

## API ENDPOINTS REFERENCE

### Public Endpoints (No Authentication Required)

#### Teacher Operations
```
GET  /api/teachers
     Returns: { success: true, data: [...] }

GET  /api/teachers/:id
     Returns: { success: true, data: {...} }
     Side effect: Increments teacher view count

GET  /api/teachers/recommendations?limit=10
     Returns: { success: true, data: [...] }

GET  /api/teachers/random?limit=10
     Returns: { success: true, data: [...] }

GET  /api/teachers/search?subject=...&modality=...&search=...&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&timeStart=HH:MM&timeEnd=HH:MM
     Query params: subject, modality (virtual/presencial), search; opcional: `dateFrom`, `dateTo`, `timeStart`, `timeEnd` (días calendario en el rango + solapamiento); opcional: `dow` (0–6) con `timeStart`/`timeEnd` para un día de semana concreto.
     Returns: { success: true, data: [...] }

GET  /api/subjects
     Returns: { success: true, data: [...] }

GET  /api/subjects/grouped
     Returns: { success: true, data: [{ name: "...", items: [...] }] }

GET  /api/health
     Returns: { status: 'OK', timestamp: ... }
```

### Authentication Endpoints
```
POST /api/auth/register
     Body: { firstName, lastName, email, password }
     Returns: { success: true, token: "...", user: {...} }

POST /api/auth/login
     Body: { email, password }
     Returns: { success: true, token: "...", user: {...} }

GET  /api/auth/me
     Headers: Authorization: Bearer {token}
     Returns: { success: true, user: {...} }

POST /api/auth/change-password
     Headers: Authorization: Bearer {token}
     Body: { currentPassword, newPassword }
     Returns: { success: true, message: "..." }
```

### Protected Endpoints (Requires Authentication)

#### Teacher Management (Requires admin role)
```
POST /api/teachers
     Body: { firstName, lastName, age, email, phone, description, curriculum,
             photo, classSize, subjects[], modality, modalities[], schedules, location }
     Returns: { success: true, teacherId: ... }

PUT  /api/teachers/:id
     Headers: Authorization: Bearer {token}
     Body: { ... same fields ... }
     Returns: { success: true, message: "..." }

DELETE /api/teachers/:id
     Headers: Authorization: Bearer {token}
     Returns: { success: true, message: "..." }

POST /api/upload
     Body: FormData with file
     Returns: { success: true, filePath: "..." }
```

#### Booking Management (Requires user role)
```
POST /api/bookings
     Headers: Authorization: Bearer {token}
     Body: { teacherId, datetime, message }
     Returns: { success: true, bookingId: ... }

GET  /api/bookings/my
     Headers: Authorization: Bearer {token}
     Returns: { success: true, data: [...] }
```

#### Admin Operations (Requires admin role)
```
GET  /api/admin/users
     Headers: Authorization: Bearer {token}
     Returns: { success: true, data: [...] }

GET  /api/admin/features
     Headers: Authorization: Bearer {token}
     Returns: { success: true, data: [...] }

POST /api/admin/features
     Headers: Authorization: Bearer {token}
     Body: { name, description, enabled }
     Returns: { success: true, featureId: ... }

PUT  /api/admin/features/:id
     Headers: Authorization: Bearer {token}
     Body: { ... }
     Returns: { success: true, ... }

DELETE /api/admin/features/:id
     Headers: Authorization: Bearer {token}
     Returns: { success: true, ... }
```

---

## FEATURE IMPLEMENTATION GUIDE

### How to Add a New Page

1. **Add route in frontend/js/app.js - renderPage() method:**
   ```javascript
   case 'new-page':
     html = `
       <div class="new-page">
         <h1>My New Page</h1>
         <!-- Add HTML template here -->
       </div>
     `;
     break;
   ```

2. **Add navigation link in header (index.html or updateHeaderAuthUI):**
   ```javascript
   // In updateHeaderAuthUI() or initial HTML
   <li><a href="#new-page" data-page="new-page">New Page</a></li>
   ```

3. **Add event listeners after rendering (in renderPage()):**
   ```javascript
   setTimeout(() => {
     const btn = document.getElementById('myBtn');
     if (btn) btn.addEventListener('click', () => { /* handler */ });
   }, 0);
   ```

### How to Add a New Subject

1. **Update backend/models/teacherModel.js:**
   ```javascript
   const SUBJECTS = {
     // ... existing groups ...
     newCategory: [
       'Subject 1',
       'Subject 2',
     ]
   };
   ```

2. **Update frontend/js/app.js (if SUBJECTS is hardcoded there):**
   - Search for `const SUBJECTS` in app.js
   - Add to the appropriate category

3. **Restart backend** to reload data

### How to Add Admin Feature

1. **Add to database schema (backend/database/schema.sql):**
   ```sql
   INSERT INTO features (name, description, enabled) VALUES ('feature_name', 'Description', 1);
   ```

2. **Create endpoint in backend/routes/adminRoutes.js:**
   ```javascript
   router.post('/admin/feature-endpoint', authenticate, requireAdmin, AdminController.handleFeature);
   ```

3. **Implement in backend/controllers/adminController.js:**
   ```javascript
   static async handleFeature(req, res) { /* ... */ }
   ```

4. **Add UI in app.js admin page template:**
   ```javascript
   case 'admin':
     html = `
       <button onclick="window.app.handleFeature()">Feature</button>
     `;
   ```

### How to Modify Teacher Creation Form

**Frontend form:** `frontend/js/app.js` - search for `case 'add-teacher':`
- Modify the form HTML template
- Add/remove input fields
- Update event listeners in the `setTimeout` block

**Backend validation:** `backend/models/teacherModel.js`
- Add validation rule to `ValidateTeacher` object
- Update `TeacherModel` schema

**Backend storage:** `backend/data/teacherRepository.js`
- Update SQL INSERT statement if adding new fields
- Add/remove parameters

**Database:** `backend/database/schema.sql`
- Add new column to `teachers` table if needed

### How to Change Styling

**All CSS is in:** `frontend/css/styles.css`

- **Colors:** Modify CSS variables in `:root` section
- **Component styles:** Find component name and modify its rules
- **Responsive:** Look for `@media` queries
- **Spacing:** Modify `--spacing-*` variables or specific properties

### How to Add Authentication Check

**Backend:**
```javascript
router.post('/endpoint', authenticate, requireAdmin, Controller.method);
```

**Frontend - in showPage():**
```javascript
if (pageName === 'admin' && (!this.currentUser || this.currentUser.role !== 'admin')) {
  showAlert('Debes ser administrador', 'error');
  return;
}
```

---

## COMMON TASKS

### Task: Fix a page layout issue

1. **Identify the page** - find which page has the issue
2. **Find the template in app.js** - search for `case 'page-name':`
3. **Modify the HTML template** - fix the structure
4. **Check the CSS** - open `frontend/css/styles.css` and adjust styling
5. **Refresh browser** - changes take effect immediately
6. **No rebuild needed** - frontend is dynamically rendered

### Task: Add a new teacher subject

1. **Open backend/models/teacherModel.js**
2. **Find the SUBJECTS object**
3. **Add subject to appropriate category** (or create new category)
4. **Restart backend** - `npm start` from backend folder

### Task: Change default admin credentials

1. **Find in backend/database/db.js** - search for admin@gmail.com setup
2. **Find the password seeding section**
3. **Modify email/password** - currently hardcoded as admin@gmail.com
4. **Restart backend** to apply changes
5. **Database must be fresh** or edit manually

### Task: Modify teacher photo upload location

1. **Backend location:** `backend/controllers/teacherController.js`
   - Search for "uploadsDir"
   - Modify path in `createTeacher()` method

2. **Photo finding:** `backend/data/teacherRepository.js`
   - Function `findPhotoForId()` searches for photos
   - Function `normalizeTeacherRow()` handles photo URLs

3. **Frontend display:** `frontend/css/styles.css`
   - Look for `.teacher-photo` styling

### Task: Add a new API endpoint

1. **Create route:** `backend/routes/newRoutes.js` or add to existing
   ```javascript
   router.get('/endpoint', Controller.method);
   ```

2. **Create controller method:** `backend/controllers/NewController.js`
   ```javascript
   static async method(req, res) { /* ... */ }
   ```

3. **Add to server.js:** Mount the route
   ```javascript
   app.use('/api', newRoutes);
   ```

4. **Create API client method:** `frontend/js/api.js`
   ```javascript
   static async method() {
     return await httpRequest('GET', `${API_BASE_URL}/endpoint`);
   }
   ```

5. **Use in app.js:** Call the API method and handle response

### Task: Debug API call from frontend

1. **Open browser DevTools** - F12
2. **Go to Network tab**
3. **Trigger action in app**
4. **Click on request** - see full details
5. **Check Request Headers** - verify Authorization header present
6. **Check Response** - see error message if any
7. **Check Console tab** - see JavaScript errors

### Task: Test something quickly

1. **Frontend test:** DevTools Console - call `window.app.loadTeachers()`
2. **API test:** Use curl or Postman
   ```bash
   curl http://localhost:3000/api/teachers
   ```
3. **Database test:** Use SQLite CLI or tool
   ```bash
   sqlite3 database/estudius.db "SELECT * FROM teachers LIMIT 5;"
   ```

### Task: Reset database

1. **Stop backend server**
2. **Delete database file:**
   ```bash
   rm database/estudius.db
   ```
3. **Restart backend** - will recreate schema and seed admin account
4. **Run seed script for test data:**
   ```bash
   cd backend
   node seed-teachers.js
   ```

### Task: Generate test teachers

```bash
cd backend
node seed-teachers.js
```

This generates 40 default teachers with test data.

### Task: Assign photos to teachers

```bash
cd backend
node assign-photos.js
```

Assigns photos from `frontend/assets/uploads/` to teachers by ID.

---

## IMPORTANT NOTES

### Photo Management
- Photos stored in: `frontend/assets/uploads/{hombres,mujeres,others}/`
- Database stores only the path: `/assets/uploads/hombres/{id}.jpg`
- Repository logic looks for photos by ID first
- Falls back to `default-avatar.svg` if not found

### Subject Categories
- Defined in `backend/models/teacherModel.js`
- Also mirrored in `frontend/js/app.js` 
- API endpoint provides both flat and grouped versions

### Search & Filtering
- Subject filter uses exact match
- Modality filter: "virtual" or "presencial"
- Search term: fuzzy match on name/description
- **Horarios:** datos en JSON (`schedules`); búsqueda por período + franja en `teacherService.searchTeachers()` y en el listado (`frontend/js/app.js` + `frontend/js/scheduleUtils.js`). Migración automática al iniciar el backend (`backend/database/db.js`).

### State & Persistence
- Frontend state is in `window.app` (EstudiusApp instance)
- JWT token in `localStorage.authToken`
- NO persistent backend cache - every request hits database
- Page navigation is client-side (no reload)

### Performance
- Teacher list paginated (10 per page)
- Recommendation algorithm uses view count + creation date
- Photo searching optimized with file system checks
- No N+1 queries - each endpoint fetches needed data efficiently

---

## QUICK REFERENCE

### Start Application
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2 (optional): View at http://localhost:3000
```

### File Locations by Feature

| Feature | Files |
|---------|-------|
| **Add Teacher** | frontend/js/app.js (renderPage), backend/routes/teacherRoutes.js, backend/controllers/teacherController.js, backend/services/teacherService.js |
| **Search Teachers** | frontend/js/app.js (loadTeachers, search logic), backend/routes/teacherRoutes.js, backend/data/teacherRepository.js |
| **Authentication** | frontend/js/app.js (auth modals), frontend/js/api.js (AuthAPI), backend/routes/authRoutes.js, backend/controllers/authController.js |
| **Styling** | frontend/css/styles.css |
| **Database** | backend/database/schema.sql, backend/database/db.js |
| **Subjects** | backend/models/teacherModel.js, frontend/js/app.js |
| **Bookings** | frontend/js/app.js (showScheduleModal), frontend/js/api.js (BookingAPI), backend/routes/bookingRoutes.js |
| **Admin Panel** | frontend/js/app.js (renderPage admin), backend/routes/adminRoutes.js, backend/controllers/adminController.js |

---

## DEBUGGING TIPS

**If teacher photos not showing:**
- Check `frontend/assets/uploads/` directory structure
- Run `node assign-photos.js` from backend folder
- Check browser console for 404 errors

**If authentication not working:**
- Verify token in DevTools > Application > localStorage
- Check Network tab for Authorization header
- Verify JWT_SECRET matches between frontend and backend

**If API returns 404:**
- Check backend console for routing errors
- Verify route exists in routes/*.js files
- Check middleware is properly chained

**If database errors occur:**
- Stop backend, delete database file
- Restart backend to recreate schema
- Check backend console for SQL errors

**If page doesn't render:**
- Check browser console for JavaScript errors
- Verify renderPage() has case for that page
- Check event listeners attached after renderPage()

---

**End of Project Map**
**For additional questions, consult README.md, STACK_Y_ESTRUCTURA.md, or FAQ.md**

---

## Recent Changes

- **2026-05-12 (actualización):** Sin horarios “flexibles”: todo profesor tiene al menos una franja; los registros viejos sin franjas se normalizan a Lun–Vie 17:00–20:00 al iniciar el backend. Filtro en barra de búsqueda por **día de semana + hora** (home y listado). Formularios alta/edición: modalidad en bloque dedicado (`modality-picker`). API `GET /api/teachers/search` admite además `dow` (0–6) con `timeStart`/`timeEnd`.

- **2026-05-12:** Horarios estructurados (JSON) + búsqueda por período y franja horaria + UI de franjas en alta/edición de profesor.
   - **Modelo de datos:** la columna `teachers.schedules` guarda JSON `{ version: 1, slots: [{ dow, start, end }], flexible?, notes? }` (`dow` 0=Domingo … 6=Sábado). Lógica en [backend/lib/scheduleUtils.js](backend/lib/scheduleUtils.js).
   - **Migración:** al iniciar el backend se convierten filas aún en texto libre (heurística en `migrateLegacyScheduleText`). Ver [backend/database/db.js](backend/database/db.js).
   - **API:** `GET /api/teachers/search` acepta opcionalmente `dateFrom`, `dateTo`, `timeStart`, `timeEnd` (filtrado en [backend/services/teacherService.js](backend/services/teacherService.js)). Alta/edición serializa horarios en [backend/services/teacherService.js](backend/services/teacherService.js); validación en [backend/models/teacherModel.js](backend/models/teacherModel.js).
   - **Frontend:** [frontend/js/scheduleUtils.js](frontend/js/scheduleUtils.js), listado con panel “dos fechas + franja” en [frontend/js/app.js](frontend/js/app.js), constructor de horarios en alta/edición, detalle con lista legible. Estilos en [frontend/css/styles.css](frontend/css/styles.css). Script incluido en [frontend/index.html](frontend/index.html).
   - **Seed:** [backend/seed-teachers.js](backend/seed-teachers.js) inserta horarios ya en JSON.
   - **Mapa del proyecto:** esta sección y estructura de carpetas actualizadas.

- **2026-05-12:** Added frontend search pill UI and client-side autocomplete for the teachers listing.
   - Files modified:
      - [frontend/js/app.js](frontend/js/app.js#L2220-L2510) — Added search input, suggestions container, and methods: `setupListSearch()`, `getSearchSuggestions()`, `showSearchSuggestions()`, `performListSearch()`.
      - [frontend/css/styles.css](frontend/css/styles.css#L684-L769) — Added styles for `.search-pill` and `.search-suggestions`.
   - Behavior: typing in the search field shows autocomplete suggestions (matches by teacher name or subjects); pressing Enter or clicking the search button filters the main list.
   - Notes: Autocomplete is client-side and uses the cached teacher list (`this.allTeachers`). If needed later, we can switch to a server-side suggestion endpoint for large datasets.

- **2026-05-12:** Switched autocomplete suggestions to a Google-style list for home and list search.
   - Files modified:
      - [frontend/js/app.js](frontend/js/app.js#L2271-L2505) — Suggestions now render as text rows with type labels and click-to-search behavior.
      - [frontend/css/styles.css](frontend/css/styles.css#L719-L769) — New list styling for `.search-suggestions` and `.search-suggestion` rows.
   - Behavior: suggestions appear as a vertical list with highlighted matches and a type hint (Profesor/Materia/Busqueda), matching typical browser autocomplete patterns.

- **2026-05-12:** Fixed suggestion row styling inside the search pill so list items render full-width instead of circular buttons.
   - Files modified:
      - [frontend/css/styles.css](frontend/css/styles.css#L719-L769) — Increased selector specificity for `.search-suggestions .search-suggestion` to override pill button styles.
   - Behavior: suggestion rows now display full-width text with proper spacing and hover states.
