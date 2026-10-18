# Smart College Campus Management System

A beginner-friendly full-stack starter project built with React (Vite), Node.js, Express, and PostgreSQL.

## Features
- Dashboard with campus summary cards
- Students, faculty, attendance, complaints, and notices pages
- Responsive sidebar navigation
- REST API for dashboard data and CRUD-ready campus modules
- PostgreSQL schema and sample data
- Simple API health endpoint

## Requirements
- Node.js 18+
- PostgreSQL 14+
- npm

## Setup

### 1. Database
Create a PostgreSQL database named `smart_campus_db`, then run `database/schema.sql` in pgAdmin Query Tool.

### 2. Backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
Update `.env` with your PostgreSQL username/password before starting the backend.

### 3. Frontend
Open a second PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

## API endpoints
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/students`
- `POST /api/students`
- `GET /api/faculty`
- `GET /api/attendance`
- `GET /api/complaints`
- `GET /api/notices`

## Note
This is a starter project for learning and demonstrations. Before real college deployment, add authentication/authorization, input validation, audit logs, secure file uploads, and production configuration.
