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

## 💡 Troubleshooting

### WebSockets on Render
- Render's free tier supports WebSockets, but the service might "sleep" after 15 minutes of inactivity. The first connection from the frontend might take a few seconds to wake it up.

### CORS Errors
- If the frontend cannot fetch data, double-check that `ALLOWED_ORIGINS` in Render exactly matches your Vercel domain (including `https://` and no trailing slash).

### Database Migrations
- If you see database errors, ensure you have run migrations:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```
