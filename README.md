# 🏥 Apex Hospital Management System

A full-stack Hospital Management System built with **Spring Boot 3.3 + JWT** (backend) and **React 19 + Vite** (frontend).

[![Backend: Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.3-6DB33F?logo=spring)](https://spring.io/projects/spring-boot)
[![Frontend: React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react)](https://react.dev)
[![Database: MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql)](https://www.mysql.com)

---

## ✨ Features

| Module | Capabilities |
|--------|-------------|
| 🔐 Authentication | JWT login, registration, role-based access |
| 👥 Patients | Full CRUD — search, add, edit, delete |
| 👨‍⚕️ Doctors | Management with department assignment |
| 🏢 Departments | Create and manage hospital departments |
| 📅 Appointments | Schedule with patient/doctor selection, status tracking |
| 📋 Medical Records | Diagnosis, prescription, clinical notes |
| 🛏️ Rooms | Room management with type, status, pricing |
| 🧾 Billing | Invoicing, payment status, revenue tracking |
| 📊 Dashboard | Live stats across all modules |

---

## 🏗️ Project Structure

```
SpringBootAIProject/
├── src/                          # Spring Boot backend
│   └── main/
│       ├── java/com/hospital/hms/
│       │   ├── config/           # SecurityConfig, SwaggerConfig
│       │   ├── controller/       # REST controllers (8 modules)
│       │   ├── dto/              # Request/Response DTOs
│       │   ├── entity/           # JPA entities
│       │   ├── security/         # JWT filter, JwtUtil
│       │   └── service/          # Business logic
│       └── resources/
│           ├── application.properties
│           └── application-prod.properties
├── hms-frontend/                 # React 19 + Vite frontend
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── components/           # Layout, Modal, ProtectedRoute
│   │   ├── pages/                # 9 full-featured pages
│   │   └── services/             # Axios API service layer
│   ├── vercel.json               # SPA routing
│   └── .env.example
├── .gitignore
├── .env.example
├── Procfile                      # Railway startup
├── railway.json                  # Railway build config
├── mvnw / mvnw.cmd               # Maven wrapper
└── pom.xml
```

---

## 🚀 Deployment Guide

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- GitHub account
- [Railway](https://railway.app) account
- [Vercel](https://vercel.com) account

---

### 1. 🗄️ Deploy Database on Railway

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Add a service** → **Database** → **MySQL**
3. Railway auto-creates the MySQL instance
4. Note the following from the **Variables** tab:
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`

---

### 2. ⚙️ Deploy Backend on Railway

1. Push this repo to GitHub
2. In Railway project → **Add Service** → **GitHub Repo**
3. Select your repository (root directory = `/`)
4. Add these **Environment Variables** in Railway:

| Variable | Value |
|----------|-------|
| `DB_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `JWT_SECRET` | *(run: `openssl rand -base64 32`)* |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `SPRING_PROFILES_ACTIVE` | `prod` |

> **Note:** Railway uses `${{ServiceName.VARIABLE}}` syntax to reference other service variables.

5. Railway will auto-detect `railway.json` and build with `./mvnw clean package -DskipTests`
6. Your backend URL will be: `https://your-service.railway.app`

---

### 3. 🌐 Deploy Frontend on Vercel

#### Option A — Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Set **Root Directory** to: `hms-frontend`
4. Framework: **Vite** (auto-detected)
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add **Environment Variable**:
   - `VITE_API_BASE_URL` = `https://your-backend.railway.app`
8. Deploy!

#### Option B — Vercel CLI
```bash
cd hms-frontend
npx vercel --prod
```

---

### 4. 🔗 Connect Frontend to Backend

After Railway gives you the backend URL:
1. In Vercel project settings → **Environment Variables**
2. Update `VITE_API_BASE_URL` to `https://your-actual-backend.railway.app`
3. Trigger a redeploy

Then update Railway:
- Set `FRONTEND_URL` = `https://your-actual-vercel-app.vercel.app`
- Railway will auto-redeploy

---

## 🛠️ Local Development

### Backend
```bash
# Set environment variables (copy .env.example to .env)
cp .env.example .env
# Edit .env with your local MySQL credentials

# Run Spring Boot
./mvnw spring-boot:run
# Backend: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Frontend
```bash
cd hms-frontend
cp .env.example .env
# Edit .env: VITE_API_BASE_URL=http://localhost:8080

npm install
npm run dev
# Frontend: http://localhost:5173
```

---

## 🔑 Environment Variables Reference

### Backend (Railway)
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | ✅ | JDBC MySQL connection string |
| `DB_USERNAME` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `JWT_SECRET` | ✅ | Base64 secret (min 256-bit) |
| `FRONTEND_URL` | ✅ | Vercel app URL (for CORS) |
| `PORT` | Auto | Railway sets this automatically |
| `SPRING_PROFILES_ACTIVE` | ✅ | Set to `prod` |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Railway backend URL |

---

## 🔐 API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/register` | Public |
| `GET/POST/PUT/DELETE` | `/api/patients/**` | JWT Required |
| `GET/POST/PUT/DELETE` | `/api/doctors/**` | JWT Required |
| `GET` | `/api/departments/**` | Public |
| `POST/PUT/DELETE` | `/api/departments/**` | JWT Required |
| `GET/POST/PUT/DELETE` | `/api/appointments/**` | JWT Required |
| `GET/POST/PUT/DELETE` | `/api/medical-records/**` | JWT Required |
| `GET/POST/PUT/DELETE` | `/api/rooms/**` | JWT Required |
| `GET/POST/PUT/DELETE` | `/api/billing/**` | JWT Required |

**Swagger UI:** `{BACKEND_URL}/swagger-ui.html`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 17, Spring Boot 3.3, Spring Security |
| Authentication | JWT (jjwt 0.12.3) |
| Database | MySQL 8.0, Spring Data JPA, Hibernate |
| API Docs | SpringDoc OpenAPI 2.3 (Swagger UI) |
| Frontend | React 19, Vite 8 |
| Routing | React Router DOM v6 |
| HTTP | Axios |
| UI | Vanilla CSS (dark theme design system) |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend Host | Railway |
| Frontend Host | Vercel |

---

## 📄 License

MIT License — free to use for educational and commercial purposes.
