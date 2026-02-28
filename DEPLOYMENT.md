# CricLive — Deployment Guide

## Prerequisites

1. **GitHub account** — push this repo to GitHub
2. **Supabase account** — free at [supabase.com](https://supabase.com)
3. **Render account** — free at [render.com](https://render.com)

---

## Step 1: Supabase Setup

1. Create a new Supabase project
2. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Authentication → Settings** and:
   - Enable **Email** sign-in
   - Disable email confirmation (for dev) or keep it enabled (for prod)

---

## Step 2: Deploy Backend to Render

### Option A: Blueprint (Recommended)

1. Push code to GitHub
2. Go to [render.com/blueprints](https://render.com/blueprints)
3. Connect your GitHub repo
4. Render will detect `render.yaml` and create:
   - PostgreSQL database (`criclive-db`)
   - Web service (`criclive-api`)
5. Set the environment variables in the Render dashboard:
   - `SUPABASE_URL` — from Step 1
   - `SUPABASE_SERVICE_ROLE_KEY` — from Step 1
   - `FRONTEND_URL` — your frontend URL (e.g., `https://your-app.vercel.app` or `https://your-app.onrender.com`)

### Option B: Manual

1. Create a PostgreSQL database on Render (free tier)
2. Create a Web Service:
   - Root directory: `server`
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npx prisma migrate deploy && npm start`
3. Add environment variables:
   - `DATABASE_URL` — from Render PostgreSQL
   - `SUPABASE_URL` — from Step 1
   - `SUPABASE_SERVICE_ROLE_KEY` — from Step 1
   - `FRONTEND_URL` — your frontend URL

Note your backend URL (e.g., `https://criclive-api.onrender.com`).

---

## Step 3: Deploy Frontend

### Option A: Vercel (Recommended for React/Vite)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables:
   - `VITE_API_URL` = `https://criclive-api.onrender.com` (your backend URL from Step 2)
   - `VITE_SUPABASE_URL` = from Step 1
   - `VITE_SUPABASE_ANON_KEY` = from Step 1

### Option B: Render Static Site

1. Create a Static Site on Render
2. Root directory: `.` (project root)
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add the same environment variables as Option A

### Option C: GitHub Pages

1. Install gh-pages: `npm install -D gh-pages`
2. Add to package.json scripts: `"deploy": "npm run build && gh-pages -d dist"`
3. Run: `npm run deploy`
4. Note: GitHub Pages only serves static files — environment variables must be baked in at build time

---

## Step 4: Create Prisma Migration

Before first deployment, create the initial migration:

```bash
cd server
npx prisma migrate dev --name init
```

This creates `server/prisma/migrations/` — commit and push these files.

---

## Step 5: Local Development

1. Copy `.env.example` to `.env` in both root and `server/` directories
2. Fill in the values from your Supabase project

### Run backend:
```bash
cd server
npm run dev
```

### Run frontend:
```bash
npm run dev
```

---

## Environment Variables Summary

### Frontend (`.env`)
```
VITE_API_URL=http://localhost:3001        # or your deployed backend URL
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend (`server/.env`)
```
DATABASE_URL=postgresql://user:password@host:5432/criclive
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=3001
FRONTEND_URL=http://localhost:8080        # or your deployed frontend URL
```
