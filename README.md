# 🏥 Apex Hospital Management System

A full-stack Hospital Management System built with **Spring Boot 3.3 + JWT** (backend) and **React 19 + Vite** (frontend).

[![Backend: Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.3-6DB33F?logo=spring)](https://spring.io/projects/spring-boot)
[![Frontend: React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react)](https://react.dev)
[![Database: MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql)](https://www.mysql.com)
[![Deploy: Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com)

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
├── Dockerfile                    # Multi-stage Docker build (for Render)
├── .dockerignore
├── render.yaml                   # Render Blueprint (deploy both services)
├── src/                          # Spring Boot backend
│   └── main/
│       ├── java/com/hospital/hms/
│       │   ├── config/           # SecurityConfig (CORS), SwaggerConfig
│       │   ├── controller/       # 8 REST controllers
│       │   ├── dto/              # Request/Response DTOs
│       │   ├── entity/           # JPA entities
│       │   ├── security/         # JWT filter, JwtUtil
│       │   └── service/          # Business logic + implementations
│       └── resources/
│           ├── application.properties       # Env-var based config
│           └── application-prod.properties  # Production overrides
├── hms-frontend/                 # React 19 + Vite frontend
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── components/           # Layout, Modal, ProtectedRoute
│   │   ├── pages/                # 9 full-featured pages
│   │   └── services/             # Axios API service layer
│   └── vercel.json               # SPA routing (also works on Render)
├── .gitignore
├── .env.example
├── mvnw / mvnw.cmd               # Maven wrapper
└── pom.xml
```

---

## 🚀 Deployment Guide (Render)

### Architecture
```
Browser → React 19 (Render Static Site)
              ↓ HTTPS + JWT
       Spring Boot 3.3 (Render Docker Web Service)
              ↓ JDBC/MySQL
       MySQL (Aiven Free Tier / External)
```

### Prerequisites
- GitHub account (repo: https://github.com/Anshjain1489/FullStackProjects)
- [Render](https://render.com) account (free)
- Free MySQL database — choose one:
  - **[Aiven](https://aiven.io)** — 5GB free MySQL (recommended)
  - **[Clever Cloud](https://clever-cloud.com)** — 75MB free MySQL
  - **[Railway](https://railway.app)** — free MySQL (just for DB)

---

### Step 1 — Get a Free MySQL Database (Aiven)

1. Go to **https://aiven.io** → Sign up (free)
2. Create a **MySQL** service → select **Free** plan
3. Once running, click the service → copy:
   - **Service URI** (looks like: `mysql://user:password@host:port/defaultdb`)
   - Or individually: Host, Port, User, Password, Database name
4. Build your JDBC URL:
   ```
   jdbc:mysql://HOST:PORT/DATABASE?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true
   ```

---

### Step 2 — Deploy to Render via Blueprint

1. Go to **https://render.com** → Sign in → **New** → **Blueprint**
2. Connect GitHub → select **`Anshjain1489/FullStackProjects`**
3. Render detects `render.yaml` automatically ✅
4. It shows **2 services**: `apex-hms-backend` and `apex-hms-frontend`
5. Click **Apply** — Render prompts for environment variables

### Fill in these values:

**Backend (`apex-hms-backend`) env vars:**
| Variable | Value |
|----------|-------|
| `DB_URL` | `jdbc:mysql://YOUR-HOST:PORT/DATABASE?useSSL=true&serverTimezone=UTC&allowPublicKeyRetrieval=true` |
| `DB_USERNAME` | Your MySQL username |
| `DB_PASSWORD` | Your MySQL password |
| `JWT_SECRET` | `t77KvEPUxBrhiZg4RhfQJPICU79tl8uoHR/pROm56m4=` |
| `FRONTEND_URL` | `https://apex-hms-frontend.onrender.com` *(fill after deploy)* |

**Frontend (`apex-hms-frontend`) env vars:**
| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://apex-hms-backend.onrender.com` *(fill after deploy)* |

6. Click **Apply** → Both services start deploying

---

### Step 3 — Update CORS after Deploy

Once both URLs are known:
1. Render dashboard → `apex-hms-backend` → **Environment**
2. Update `FRONTEND_URL` = `https://apex-hms-frontend.onrender.com`
3. Click **Save** → Render triggers a redeploy

---

### Step 4 — Manual Deploy (Alternative to Blueprint)

**Backend:**
1. Render → New → **Web Service**
2. Connect GitHub repo → Root: `/`
3. Environment: **Docker**
4. Add all backend env vars above

**Frontend:**
1. Render → New → **Static Site**
2. Connect GitHub repo → Root: `hms-frontend`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add `VITE_API_BASE_URL` env var

---

## 🛠️ Local Development

### Backend
```bash
cp .env.example .env
# Edit .env with your local MySQL credentials
./mvnw spring-boot:run
# Backend: http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Frontend
```bash
cd hms-frontend
echo "VITE_API_BASE_URL=http://localhost:8080" > .env
npm install && npm run dev
# Frontend: http://localhost:5173
```

### Run with Docker locally
```bash
docker build -t apex-hms-backend .
docker run -p 8080:8080 \
  -e DB_URL="jdbc:mysql://host.docker.internal:3306/hospital_db?..." \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=yourpassword \
  -e JWT_SECRET="t77KvEPUxBrhiZg4RhfQJPICU79tl8uoHR/pROm56m4=" \
  -e FRONTEND_URL="http://localhost:5173" \
  apex-hms-backend
```

---

## 🔑 Environment Variables Reference

### Backend
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | ✅ | JDBC MySQL connection string |
| `DB_USERNAME` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `JWT_SECRET` | ✅ | Base64 secret (min 256-bit) |
| `FRONTEND_URL` | ✅ | Render frontend URL (for CORS) |
| `SPRING_PROFILES_ACTIVE` | ✅ | `prod` |
| `PORT` | Auto | Render injects this automatically |

### Frontend
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Render backend URL |

---

## 🔐 API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/register` | Public |
| `GET` | `/api/departments/**` | Public |
| `*` | `/api/patients/**` | JWT Required |
| `*` | `/api/doctors/**` | JWT Required |
| `*` | `/api/appointments/**` | JWT Required |
| `*` | `/api/medical-records/**` | JWT Required |
| `*` | `/api/rooms/**` | JWT Required |
| `*` | `/api/billing/**` | JWT Required |

**Swagger UI:** `{BACKEND_URL}/swagger-ui.html`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 17, Spring Boot 3.3, Spring Security |
| Authentication | JWT (jjwt 0.12.3) |
| Database | MySQL 8.0, Spring Data JPA, Hibernate |
| API Docs | SpringDoc OpenAPI 2.3 (Swagger UI) |
| Containerization | Docker (multi-stage, Alpine JRE) |
| Frontend | React 19, Vite 8 |
| Routing | React Router DOM v6 |
| HTTP Client | Axios |
| UI | Vanilla CSS dark theme design system |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend Host | Render (Docker Web Service) |
| Frontend Host | Render (Static Site) |
| Database Host | Aiven / External MySQL |

---

## ⚠️ Render Free Tier Notes

- Free web services **spin down after 15 min of inactivity**
- First request after sleep takes ~30-60 seconds (cold start)
- To avoid this: upgrade to Render's Starter plan ($7/mo)
- Free static sites have **no sleep** — always fast ✅

---

## 📄 License

MIT License
