# Lovely Restaurants

A full-stack restaurant menu website built with **React + Vite + Tailwind CSS**, **Node.js + Express**, and **PostgreSQL**. JavaScript only (no TypeScript).

## Features
- Responsive restaurant landing page and menu cards
- Search and menu category filters
- Menu items loaded from the Express API (PostgreSQL)
- Signup, login, logout, and server-side sessions stored in PostgreSQL
- Demo favourites/cart interaction in the browser
- `.env` excluded from Git

## Requirements
- Node.js 18+
- PostgreSQL database (local PostgreSQL or a hosted database such as Neon)

## Run locally

1. Create a PostgreSQL database, for example `lovely_restaurants`.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and `SESSION_SECRET`.
3. From this project root run:
   ```bash
   npm install
   npm run install:all
   npm run db:setup --prefix server
   npm run db:seed --prefix server
   npm run dev
   ```
   The `db:setup` and `db:seed` commands run in the server directory. If the prefixed commands do not work in your shell, run `cd server`, then `npm run db:setup` and `npm run db:seed`.
4. Open the Vite URL shown in your terminal (usually `http://localhost:5173`). API runs on `http://localhost:4000`.

## Database
- `users`: account email and bcrypt password hash
- `menu_items`: name, description, category, price, image URL, and featured flag
- `sessions`: Express session data, managed by `connect-pg-simple`

## API routes
- `GET /api/health` — health check
- `GET /api/menu` — list menu items; optional `?category=...&search=...`
- `POST /api/auth/signup` — create account
- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — end session
- `GET /api/auth/me` — current signed-in user

## Environment variables
See `server/.env.example`. Never commit `server/.env` or put secrets in the React client. The client only uses `VITE_API_URL`, which is a public API URL, not a secret.

## Deployment outline
1. Create a hosted PostgreSQL database and run `npm run db:setup` and `npm run db:seed` from `server` with its `DATABASE_URL` set.
2. Deploy `server` to Railway/Render with `DATABASE_URL`, `SESSION_SECRET`, `CLIENT_ORIGIN`, and `NODE_ENV=production` environment variables. Set `CLIENT_ORIGIN` to the deployed frontend URL.
3. Deploy `client` to Vercel/Netlify. Set `VITE_API_URL` to the deployed API URL (no trailing slash), then rebuild/redeploy.
4. For production cookies, use HTTPS. This app uses secure cookies when `NODE_ENV=production`.

This is a learning starter. Before using it for real customers, add email verification, password reset, rate limiting, stricter validation, monitoring, and a production review of cookie/CORS settings.
