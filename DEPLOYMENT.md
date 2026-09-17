# RentHub - Production Deployment Guide

This guide walks you through deploying the complete RentHub full-stack application (React / TanStack Start frontend + Express.js backend + MySQL Prisma database + Gemini AI) to the cloud.

---

## Architecture Overview

| Component | Technology | Recommended Host |
| :--- | :--- | :--- |
| **Database** | MySQL 8.0+ / Prisma ORM | [Railway](https://railway.app), [Aiven](https://aiven.io) (Free), or [TiDB Cloud](https://tidbcloud.com) |
| **Backend API** | Node.js / Express / Prisma | [Render](https://render.com) (Free) or [Railway](https://railway.app) |
| **Frontend UI** | TanStack Start / Vite / React | [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com) |

---

## Option 1: Railway (Easiest — Everything in One Dashboard)

Railway lets you provision a cloud MySQL database, deploy the backend, and deploy the frontend all inside a single project.

### Step 1: Push Code to GitHub
1. Commit all project files and push to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete RentHub platform with reviews, wallet, and payment module"
   git push origin main
   ```

### Step 2: Create a Railway Project & Add MySQL
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** > **Provision MySQL**.
3. Once created, click on the **MySQL** service > **Variables** tab.
4. Copy the `DATABASE_URL` (format: `mysql://root:...@...:3306/railway`).

### Step 3: Deploy the Backend (`server`)
1. In the same Railway project, click **+ New** > **GitHub Repo** > Select your `renthub` repository.
2. Click on the newly added service > **Settings**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma db push && node seed-inventory.js`
   - **Start Command**: `npm start`
3. Go to the **Variables** tab and add:
   - `DATABASE_URL` = (paste the MySQL connection string from Step 2)
   - `JWT_SECRET` = `a_strong_random_jwt_secret_key_32_chars`
   - `PORT` = `5000`
   - `GEMINI_API_KEY` = (your Google Gemini API key)
   - `GEMINI_VISION_MODEL` = `gemini-1.5-flash` (or `gemini-2.5-flash`)
4. Go to **Settings** > **Networking** > Click **Generate Domain**.
   - Note down this URL (e.g., `https://server-production-xxxx.up.railway.app`).
   - Visit `https://server-production-xxxx.up.railway.app/health` to verify the API returns `{"status":"healthy"}`.

### Step 4: Deploy the Frontend (`client`)
1. In Railway, click **+ New** > **GitHub Repo** > Select the same repository.
2. Click the service > **Settings**:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Start Command**: `npx vite preview --host 0.0.0.0 --port $PORT`
3. Go to **Variables** tab:
   - `VITE_API_URL` = (your backend URL from Step 3, e.g. `https://server-production-xxxx.up.railway.app`)
4. Go to **Networking** > **Generate Domain**. Open this link in your browser!

---

## Option 2: Free Tier Stack (Render + Aiven/TiDB + Vercel)

If you want a 100% free hosting setup:

### Step 1: Cloud MySQL Database (Aiven or TiDB Cloud)
1. Sign up for free at [Aiven.io](https://aiven.io) or [TiDB Cloud](https://tidb.cloud).
2. Create a free **MySQL** database service.
3. Copy the public connection URI (`mysql://user:password@host:port/dbname?ssl-mode=REQUIRED`).

### Step 2: Deploy Backend to Render (Free Web Service)
1. Go to [render.com](https://render.com) and create a **New Web Service**.
2. Connect your GitHub repository.
3. Set the configuration:
   - **Name**: `renthub-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma db push && node seed-inventory.js`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add:
   - `DATABASE_URL`: Your cloud MySQL connection string
   - `JWT_SECRET`: Random 32+ character string
   - `PORT`: `5000`
   - `GEMINI_API_KEY`: Your Gemini API key
   - `GEMINI_VISION_MODEL`: `gemini-1.5-flash`
5. Click **Create Web Service**.
6. Wait for the build to finish. Your backend will have a public URL like:
   `https://renthub-api.onrender.com`.

### Step 3: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New** > **Project**.
2. Select your `renthub` GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output/public` (or `dist`)
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://renthub-api.onrender.com`
5. Click **Deploy**!

---

## Summary of Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Cloud MySQL connection string | `mysql://user:pass@host:3306/renthub` |
| `JWT_SECRET` | Secret key for signing user tokens | `super-secret-key-xyz-987` |
| `PORT` | Server listening port | `5000` |
| `GEMINI_API_KEY` | Google AI Gemini API Key | `AIzaSy...` |
| `GEMINI_VISION_MODEL` | Gemini Model Name | `gemini-1.5-flash` |

### Frontend (`client/.env` or Host Settings)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Public URL of your deployed backend | `https://renthub-api.onrender.com` |

---

## Production Verification Checklist

Once deployed, verify the live app:
- [ ] Open `https://<your-backend-domain>/health` -> Returns `{ "status": "healthy" }`.
- [ ] Open `https://<your-frontend-domain>` -> Homepage renders catalog with authentic photos.
- [ ] Sign Up / Sign In -> Test creating an account and logging in.
- [ ] Top Header Wallet -> Open the RentHub Wallet modal, add ₹500 test balance.
- [ ] Product Checkout -> Go to a product, choose duration, select payment method (UPI, Card, Wallet, or COD), and confirm booking.
- [ ] Leave Review -> Complete a rental in the dashboard and submit a 5-star rating with review text.
- [ ] AI Trip Planner -> Enter a destination (e.g. "Manali 4 days") and verify AI generates packing recommendations with rental equipment matches.
