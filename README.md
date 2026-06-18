# 🚀 CRM - Professional Lead Management System

![React](https://img.shields.io/badge/React-18-blue)
![Node.js](https://img.shields.io/badge/Node.js-18-green)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)
![Tailwind](https://img.shields.io/badge/Tailwind-3.3-cyan)
![License](https://img.shields.io/badge/License-MIT-yellow)

















🚀 CRM Suite — Professional Lead Management Platform

Overview
---------
CRM Suite is a full-stack Customer Relationship Management example app focused on lead capture, follow-up tracking, tagging, and lightweight analytics. It provides a web UI, a REST API, real-time notifications (WebSockets), and tools for exporting lead data.

Key features
------------
- Lead management: create, view, update, delete leads
- Lead status flow: New → Contacted → Qualified → Converted → Lost
- Tags: attach tags to leads for categorization and filtering
- CSV export: export lead lists to CSV for reporting
- Analytics: conversion rate and trend charts
- User management: admin & role-based access controls
- Authentication: JWT-based login and protected routes
- Real-time notifications via Socket.IO
- Dockerized Postgres for easy local development

Tech stack
----------
- Backend: Node.js, Express, Prisma ORM
- Database: PostgreSQL (development via Docker Compose)
- Frontend: React, simple Tailwind-like CSS utilities, Chart.js
- Real-time: Socket.IO
- Dev tooling: npm scripts, Docker Compose

Project structure
-----------------
FUTURE_FS_03/
- backend/ — Express API, Prisma schema and seed scripts
- frontend/ — React single-page app (SPA)
- database/ — SQL schema and seed resources
- docker/ — Dockerfiles and docker-compose.yml for local DB
- scripts/ — helper scripts (seed, smoke tests, utilities)

Quick start (development)
-------------------------
1. Start the local Postgres instance (docker required):

```bash
cd FUTURE_FS_02
docker-compose up -d
```

2. Backend

```bash
cd backend
npm install
# Set DATABASE_URL in environment (see .env.example)
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js   # optional: seed sample data
npm run dev
```

3. Frontend

```bash
cd frontend
npm install
npm start
```

Environment variables
---------------------
- The backend reads `DATABASE_URL` from the environment (PostgreSQL connection string).
- Examples and templates are provided in `.env.example` files; do not commit real secrets.

API snapshot
------------
- POST /api/auth/login — authenticate and receive JWT
- GET /api/leads — list leads (auth required)
- POST /api/leads — create lead (public for form intake)
- PUT /api/leads/:id/status — update status (auth required)
- GET /api/leads/analytics — lightweight analytics (auth required)
- GET /api/leads/export — export leads as CSV (auth required)
- GET /api/users — list users (admin)
- POST /api/users — create user (admin)

Database
--------
This project uses PostgreSQL. The `docker-compose.yml` in the repository will launch a Postgres container for local development. Prisma is used as the ORM and includes schema and seed files in `backend/prisma`.

Testing & smoke checks
----------------------
- A simple smoke script `scripts/e2e-smoke.js` exercises key endpoints. Run it with Node after the backend is up.

Notes & conventions
-------------------
- Secrets should be placed in local `.env` files and never committed.
- The repo contains `scripts/strip-comments.js` used to remove comments; keep this for CI hygiene only if desired.

Deployment
----------
- Build frontend and serve as static assets behind your preferred web server.
- Deploy the backend to any Node hosting (Heroku, Render, Azure Web Apps) and point to a managed Postgres instance.

Contributing
------------
- Fork and open pull requests. Keep changes focused and include tests where appropriate.

License
-------
MIT

Contact
-------
- Author / Maintainer: project contributors

Detailed documentation and operational runbooks can be added to `docs/` if you want a more formal handbook.

