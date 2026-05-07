# 🚀 Smart Menu Deployment Guide

This document explains how to deploy the Smart Menu application: **Backend on Render** and **Frontend on Vercel**.

---

## 1. Backend Deployment (Render)

### Prerequisites
- A GitHub account with the code pushed to a repository.
- A hosted PostgreSQL database (Render provides a free tier PostgreSQL).

### Steps
1.  **Create a New Web Service** on Render.
2.  Connect your repository.
3.  Set the following:
    - **Name**: `smart-menu-api`
    - **Runtime**: `Node`
    - **Root Directory**: `backend`
    - **Build Command**: `npm install && npm run build && npx prisma generate`
    - **Start Command**: `npm run start`
4.  **Add Environment Variables**:
    - `DATABASE_URL`: Your PostgreSQL string.
    - `JWT_SECRET`: A random string (e.g., `openssl rand -base64 32`).
    - `ALLOWED_ORIGINS`: `https://your-app.vercel.app` (Update after frontend deployment).
    - `FRONTEND_URL`: `https://your-app.vercel.app`.
5.  **Note on Prisma**: The build command includes `npx prisma generate`. You should also run `npx prisma migrate deploy` in the Render "Shell" or as part of the build command if you want automatic migrations.

---

## 2. Frontend Deployment (Vercel)

### Steps
1.  **Import Project** on Vercel.
2.  Set the **Root Directory** to `frontend`.
3.  Vercel will automatically detect **Next.js**.
4.  **Add Environment Variables**:
    - `NEXT_PUBLIC_API_URL`: `https://your-api.onrender.com/api`
    - `NEXT_PUBLIC_WS_URL`: `https://your-api.onrender.com`
5.  Click **Deploy**.

---

## 3. Post-Deployment Sync

1.  Copy your Vercel URL (e.g., `https://smart-menu-frontend.vercel.app`).
2.  Go to your Render Dashboard -> **Environment**.
3.  Update `ALLOWED_ORIGINS` and `FRONTEND_URL` with your Vercel URL.
4.  Restart the Render service to apply changes.

---

## 🏁 Production Checklist

### Vercel (Frontend)
- [ ] **Root Directory**: Set to `frontend` (Found in Settings -> General).
- [ ] **NEXT_PUBLIC_API_URL**: Set to `https://your-api.onrender.com/api`.
- [ ] **NEXT_PUBLIC_WS_URL**: Set to `https://your-api.onrender.com`.

### Render (Backend)
- [ ] **FRONTEND_URL**: Set to `https://your-app.vercel.app`.
- [ ] **ALLOWED_ORIGINS**: Set to `https://your-app.vercel.app` (No trailing slash).
- [ ] **DATABASE_URL**: Set to your production Postgres string.

---

## 💡 Troubleshooting

### 404 Not Found (Vercel)
- If you see a Vercel 404 page, it means Vercel is looking for your app in the wrong folder. Go to **Settings > General** and ensure **Root Directory** is set to `frontend`. Trigger a new deployment after changing this.

### 404 /api Not Found
- Ensure your `NEXT_PUBLIC_API_URL` includes the `/api` suffix.
- Check the Render logs to ensure the service is active and not "sleeping" (Free tier).

### TypeError: Cannot read properties of undefined
- This usually means the frontend failed to fetch data from the backend. Check your browser's **Network tab** to see if the API requests are failing with CORS or 404 errors.
