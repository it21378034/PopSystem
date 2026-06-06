# Vasantha Iron Works POS & Business Management System

A modern, responsive web‑based POS system for **Vasantha Iron Works**.

## Features
- Dashboard with revenue, stock alerts, charts
- Customer, quotation, invoice, inventory, labour, payments management
- Role‑based authentication (admin / staff)
- PDF generation for quotations & invoices
- Dark‑mode UI built with React + Tailwind CSS
- Backend API with Node.js, Express, MySQL (Sequelize ORM)
- Dockerised deployment (docker‑compose) and optional cloud hosting options

## Quick Start (Docker)
```bash
docker compose up -d   # builds & runs backend, frontend and MySQL
```

The app will be available at `http://localhost` (frontend) and `http://localhost:3000/api` (backend).

## Project Structure
```
Pos system/
├─ backend/
│   ├─ src/
│   │   ├─ controllers/
│   │   ├─ models/
│   │   └─ routes/
│   └─ package.json
├─ frontend/
│   ├─ src/
│   │   ├─ components/
│   │   ├─ pages/
│   │   └─ App.jsx
│   └─ package.json
├─ docker-compose.yml
└─ .env.example
```
