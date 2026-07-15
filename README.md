# Automated Library Management System

## What's in this build
- `frontend/` — plain HTML/CSS/JS dashboard (no build step, no framework)
  - `index.html` + `css/style.css` — the dashboard shown in the screenshot
  - `login.html` — login screen that gets a JWT from the backend
  - `js/api.js` — talks to your Spring Boot REST API, falls back to mock data if the API isn't reachable yet (so the UI always renders)
  - `js/app.js` — renders stat cards, charts (Chart.js via CDN), tables
- `backend-sql/schema.sql` — MySQL schema: users, roles, members, books, categories, issued_books, book_requests, fines, activity_log

## Backend: Node.js + Express + MySQL
Plain and traceable on purpose — no framework magic, no annotations. Every request follows the same path:

```
server.js → routes/*.js → middleware/auth.js (checks the JWT) → controllers/*.js (plain SQL via mysql2) → MySQL
```

`backend/` structure:
- `server.js` — starts the app, wires up all routes, one place to see the whole API
- `config/db.js` — the MySQL connection pool everything shares
- `middleware/auth.js` — one function, `requireAuth`, that checks the `Authorization: Bearer <token>` header
- `controllers/` — one file per feature (auth, dashboard, books, members, issued-books, fines), each just a handful of `async function`s that run a SQL query and return JSON
- `routes/` — maps URLs to controller functions, nothing else
- `seed-admin.js` — run once to create your first login

### Endpoints
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/dashboard/stats` / `books-overview` / `activity` / `top-books`
- `GET/POST/PUT/DELETE /api/books`, `/api/members`
- `GET /api/issued-books`, `/api/issued-books/recent`, `POST /api/issued-books` (issue), `PUT /api/issued-books/:id/return`
- `GET /api/fines`, `PUT /api/fines/:id/pay`

### Running it locally
```bash
cd backend
npm install
cp .env.example .env      # then fill in your MySQL credentials + a JWT_SECRET
mysql -u root -p < ../backend-sql/schema.sql
node seed-admin.js        # creates admin@library.edu / ChangeMe123!
npm run dev                # starts on http://localhost:8080
```
Then open `frontend/login.html` (with `API_BASE_URL` set to `http://localhost:8080/api`) and log in with the seeded admin.

## Database
Run `backend-sql/schema.sql` against MySQL 8+. It matches the tables your Spring Boot entities should map to. Point your `application.properties`/`application.yml` at your hosted MySQL instance.

## Hosting online (recommended, all free-tier friendly)
| Piece | Where | Why |
|---|---|---|
| Frontend (`frontend/`) | **Netlify** or **Vercel** (drag-and-drop or GitHub deploy) | Static HTML/CSS/JS, deploys in seconds, free HTTPS |
| Backend (Node/Express) | **Render** or **Railway** (deploy straight from a GitHub repo, no Dockerfile needed) | Auto-detects `npm start`, free tier, gives you a public HTTPS URL |
| Database (MySQL) | **Railway MySQL**, **Aiven**, or **PlanetScale** (MySQL-compatible) | Managed, reachable from your Render/Railway backend |

Steps:
1. Push `backend-sql/schema.sql` to your hosted MySQL instance (most providers let you run it from their console or via `mysql < schema.sql`).
2. Push the `backend/` folder to a GitHub repo, connect it to Render/Railway, and set the environment variables from `.env.example` (DB credentials, `JWT_SECRET`, `CORS_ORIGIN`) in their dashboard.
3. Run `node seed-admin.js` once (Render/Railway both let you run one-off commands) to create your first login.
4. Copy the backend's public URL (e.g. `https://lms-api.onrender.com/api`) into `API_BASE_URL` in `frontend/js/api.js` and `frontend/login.html`.
5. Deploy the `frontend/` folder to Netlify/Vercel as a static site.
6. Set `CORS_ORIGIN` on the backend to your deployed frontend's URL.

## Next steps for the dashboard itself
- Wire the "Add Book" / "Add Member" / "Issue Book" / "Return Book" quick action buttons in `app.js` to real forms or pages once the corresponding controllers exist.
- Build out the other sidebar sections (Books, Users, Students, Teachers, Fine Management, Reports) the same way: one HTML page + fetch calls to their own endpoints.
