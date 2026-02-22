# LMS (Learning Management System)

A full-stack Learning Management System with a React + Vite frontend and Node.js/Express backend.

## Project structure

- **`frontend/`** – React app (Vite, Tailwind, Redux, React Router)
- **`backend/`** – Express API (MongoDB, JWT, Razorpay, Nodemailer, Cloudinary)

## Prerequisites

- Node.js (v18+)
- MongoDB
- npm or yarn

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # if you have one; otherwise create .env with required vars
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env   # if you have one; otherwise create .env with VITE_API_URL etc.
npm install
npm run dev
```

Configure `.env` in both folders (database URL, API URL, secrets). Do not commit `.env` files.

## Scripts

| Location   | Command       | Description        |
|-----------|---------------|--------------------|
| backend   | `npm run dev` | Start API (nodemon)|
| frontend  | `npm run dev` | Start dev server   |
| frontend  | `npm run build` | Production build  |

## License

ISC
