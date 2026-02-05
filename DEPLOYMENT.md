# Deployment Guide

PlanAI is a static site (SPA) that can be hosted on any modern CDN.

## Target 1: Vercel (Recommended)
1. Import the repository.
2. Set Environment Variable: `API_KEY`.
3. Framework Preset: `Other`.
4. Output Directory: `.`.

## Target 2: Netlify
1. Create a new site from Git.
2. Build Command: (leave empty).
3. Publish Directory: `.`.
4. Set `API_KEY` in Environment Variables.

## Target 3: GitHub Pages
1. Ensure `index.html` is in the root.
2. Use GitHub Actions for deployment.
3. Note: HashRouter is used specifically to support GitHub Pages' lack of fallback routing.