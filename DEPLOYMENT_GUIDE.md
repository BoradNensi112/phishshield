# PhishShield - Website Deployment Guide (Free & Production Ready)

This guide shows you how to deploy the **PhishShield** Machine Learning Web Application to the cloud for free with a permanent live HTTPS link (e.g., `https://phishshield.onrender.com`).

---

## What We Have Already Prepared For You:
1. **Unified Full-Stack Architecture:** The backend FastAPI server is now configured to serve the compiled React frontend directly, meaning you only need **ONE single free web service** instead of two!
2. **Production Dependencies:** `backend/requirements.txt` is created and configured.
3. **Cloud Blueprint:** `render.yaml`, `backend/Procfile`, and `frontend/vercel.json` are created.
4. **Local Git Initialized & Committed:** All code, ML models (`phishing_model.pkl`), dataset, and production builds (`backend/dist`) are already committed into your local git repository.

---

## Step 1: Push Code to GitHub (2 Minutes)

1. Open your browser and log into [GitHub.com](https://github.com/new).
2. Create a new repository:
   - **Repository Name:** `phishshield` (or any name you like)
   - **Visibility:** Public (recommended for free cloud hosting)
   - Do NOT check "Initialize with README", .gitignore, or license (we already have them).
   - Click **Create repository**.
3. In your terminal (CMD or PowerShell in `E:\detection`), run these commands:
   ```cmd
   cd E:\detection
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/phishshield.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Deploy to Render.com for Free (3 Minutes)

1. Go to [Render.com](https://render.com) and click **Sign Up** (Sign in with your GitHub account).
2. On your Render Dashboard, click the **"New +"** button (top right) and select **"Web Service"**.
3. Select **"Build and deploy from a Git repository"** and connect your `phishshield` repository.
4. Fill in these simple fields:
   - **Name:** `phishshield` (or your preferred name)
   - **Region:** Singapore / Oregon / Frankfurt (any)
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Build Command:** `cd backend && pip install -r requirements.txt`
   - **Start Command:** `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free` ($0/month)
5. Click **"Deploy Web Service"** at the bottom.

---

## Step 3: Your Live Website is Ready! 🚀
Render will automatically:
- Install python dependencies and load your 33-feature Random Forest model.
- Host your React web app and API on the same domain.
- Provide a permanent live HTTPS link like:
  👉 **`https://phishshield.onrender.com`**

You can share this link with your college professors, external examiners, or add it to your project report!
