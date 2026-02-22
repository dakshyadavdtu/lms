# Security Vulnerabilities & Render Deployment Readiness

## 1. NPM vulnerabilities

### Backend (`backend/`) — 8 vulnerabilities (1 moderate, 7 high)

| Package   | Severity | Issue |
|----------|----------|--------|
| **axios** 1.0.0–1.13.4 | High | DoS via `__proto__` key in mergeConfig — [GHSA-43fc-jf86-j433](https://github.com/advisories/GHSA-43fc-jf86-j433) |
| **lodash** 4.0.0–4.17.21 | Moderate | Prototype pollution in `_.unset` / `_.omit` — [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) |
| **minimatch** &lt;10.2.1 | High | ReDoS via repeated wildcards — [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) (via glob → rimraf → gaxios, and nodemon) |
| **qs** ≤6.14.1 | High | DoS via arrayLimit bypass (bracket notation & comma parsing) — [GHSA-6rw7-vpxm-498p](https://github.com/advisories/GHSA-6rw7-vpxm-498p), [GHSA-w7fw-mjwx-w883](https://github.com/advisories/GHSA-w7fw-mjwx-w883) |

**Fix:** Run `npm audit fix` in `backend/` (done). Remaining 4 high: `minimatch` → `glob` → `rimraf` → `gaxios` (and nodemon); these are deep transitive deps—updating parent packages when newer versions are available may clear them.

---

### Frontend (`frontend/`) — 8 vulnerabilities (2 moderate, 6 high)

| Package   | Severity | Issue |
|----------|----------|--------|
| **ajv** &lt;6.14.0 | Moderate | ReDoS when using `$data` option — [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) |
| **axios** 1.0.0–1.13.4 | High | Same DoS as backend — [GHSA-43fc-jf86-j433](https://github.com/advisories/GHSA-43fc-jf86-j433) |
| **minimatch** &lt;10.2.1 | High | ReDoS (via @eslint/config-array, eslint) — [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26) |
| **react-router** 7.0.0–7.12.0-pre.0 | High | CSRF in Action/Server Action, XSS via Open Redirects, SSR XSS in ScrollRestoration — [GHSA-h5cw-625j-3rxh](https://github.com/advisories/GHSA-h5cw-625j-3rxh), [GHSA-2w69-qvjg-hvjx](https://github.com/advisories/GHSA-2w69-qvjg-hvjx), [GHSA-8v8x-cx79-35w7](https://github.com/advisories/GHSA-8v8x-cx79-35w7) |

**Fix:** Run `npm audit fix` in `frontend/` (done). Remaining 4 high: `minimatch` inside ESLint tooling; fixing fully would require `npm audit fix --force` (ESLint 10), which is a breaking change—test lint and build before using.

---

## 2. Application / config security notes

- **Secrets:** `.env` is gitignored. Ensure production env vars are set only in Render (and never committed).
- **JWT:** Backend uses `process.env.JWT_SECRET`; use a long, random secret in production.
- **CORS:** Backend CORS must allow the production frontend origin only (see deployment section).
- **Debug logging:** `App.jsx` contains a `DEBUG_LOG_ENDPOINT` fetch; remove or disable in production builds.

---

## 3. Render deployment readiness

### Backend (Web Service)

| Check | Status | Notes |
|-------|--------|--------|
| **Start script** | ✅ Fixed | `package.json` has `"start": "node index.js"` for production. |
| **PORT** | ✅ OK | Uses `process.env.PORT`. |
| **CORS** | ✅ Fixed | Origin from `process.env.FRONTEND_URL` (or `CORS_ORIGIN`), with fallback for dev. |
| **MongoDB** | ⚠️ You provide | Set `MONGODB_URL` in Render (e.g. MongoDB Atlas connection string). |
| **Env vars** | ⚠️ You provide | See “Required environment variables” below. |

### Frontend (Static Site or separate Web Service)

| Check | Status | Notes |
|-------|--------|--------|
| **API URL** | ✅ Fixed | Uses `import.meta.env.VITE_API_URL` with fallback to `http://localhost:8000` for dev. |
| **Build** | ✅ OK | `npm run build` produces static assets. |
| **Env vars** | ⚠️ You provide | Set `VITE_API_URL` (and other `VITE_*`) in Render dashboard for build. |

### Required environment variables

**Backend (Render Web Service)**

- `PORT` — Set by Render; your app already uses it.
- `MONGODB_URL` — MongoDB connection string (e.g. Atlas).
- `JWT_SECRET` — Strong random secret for signing tokens.
- `FRONTEND_URL` or `CORS_ORIGIN` — Full frontend URL (e.g. `https://your-frontend.onrender.com`) for CORS.
- `RAZORPAY_KEY_ID`, `RAZORPAY_SECRET` — For payments.
- `EMAIL`, `EMAIL_PASS` — For nodemailer (e.g. Gmail app password).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — If using Cloudinary.

**Frontend (Render Static Site or separate service)**

- `VITE_API_URL` — Backend API URL (e.g. `https://your-backend.onrender.com`).
- `VITE_FIREBASE_APIKEY`, `VITE_FIREBASE_AUTHDOMAIN`, `VITE_FIREBASE_PROJECTID`, `VITE_FIREBASE_STORAGEBUCKET`, `VITE_FIREBASE_APPID` — Firebase config.
- `VITE_RAZORPAY_KEY_ID` — Razorpay key for frontend (e.g. checkout).

---

## 4. Render setup summary

1. **Backend:** Create a **Web Service**. Connect repo, root directory `backend` (or repo root and set root to `backend`). Build: `npm install`. Start: `npm start`. Add all backend env vars above.
2. **Frontend:** Create a **Static Site** (or Web Service if you serve the built app with a server). Root directory `frontend`. Build: `npm install && npm run build`. Publish directory: `dist`. Add all `VITE_*` env vars so they are available at build time.
3. Set **backend** `FRONTEND_URL` to the deployed frontend URL and **frontend** `VITE_API_URL` to the deployed backend URL.
4. A **health check** route is available: `GET /health` returns `{ "status": "ok" }`. In Render, set the backend service health check path to `/health`.

After applying the fixes in this repo (start script, CORS, and `VITE_API_URL`), the project is in good shape for Render deployment once env vars and MongoDB are configured.
