<div align="center">

# 🧩 HRMS — Human Resource Management System
### Recruitment & Job Placement Platform built on Spring Boot

A layered, REST‑API‑driven backend for managing job advertisements, employers, job seekers, and applications — paired with a modern, responsive enterprise dashboard front‑end.

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Data JPA](https://img.shields.io/badge/Spring%20Data%20JPA-Hibernate-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-data-jpa)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Maven](https://img.shields.io/badge/Maven-Build-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)](https://maven.apache.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![BCrypt](https://img.shields.io/badge/Password%20Hashing-BCrypt-2563EB?style=for-the-badge&logo=letsencrypt&logoColor=white)](https://en.wikipedia.org/wiki/Bcrypt)

</div>

---

## ⚠️ Scope note (read this first)

This README describes the project **as it is actually implemented** in the source, not a generic HRMS feature list. The backend's real domain is **recruitment / job placement** — employers post job advertisements, job seekers apply, and HR staff manage reference data. It does **not** currently include Employee/Department/Attendance/Leave records, authentication, or role‑based access control at the API level.

The front‑end dashboard does include polished, fully‑built **UI previews** for Employee Management, Department Management, Leave Types, Apply Leave, and Change Password — but these run on in‑browser mock data only, clearly labeled "Preview," since there's no corresponding backend yet. They're included to show the intended direction and are ready to be wired up once those modules are built. See [Future Enhancements](#-future-enhancements).

---

## 📖 Overview

HRMS is a Spring Boot REST API that models the core workflow of a recruitment platform:

- **Employers** register and post **Job Advertisements** for open **Job Positions** in specific **Cities**.
- **Job Seekers** register and **apply** to job advertisements.
- **System (HR) Employees** manage the reference data (positions, cities) that keeps the catalog clean.
- Every write operation is validated with Jakarta Bean Validation and routed through a centralized `Result` / `DataResult` response wrapper, so every API response has a consistent `success`, `message`, and (optionally) `data` shape.

The project follows a classic **N‑Tier / Layered Architecture** (Controller → Service → Repository → Entity) with DTOs to keep persistence entities out of the API contract, and ships with a from‑scratch, dependency‑free HTML/CSS/JS dashboard that consumes the API directly via `fetch`.

---

## ✨ Features

### 📢 Job Advertisement Management
- Create job advertisements tied to a position, city, and employer
- List all advertisements, active‑only advertisements, and advertisements by employer
- Sort advertisements by application deadline (ascending) or filter by a specific deadline date
- Salary range (`minSalary` / `maxSalary`), open position count, description, and auto‑set release date

### 🏢 Employer Management
- Employer self‑registration (company name, website, email, phone, password)
- Duplicate‑email guard and password confirmation check at registration
- List all registered employers (passwords never leave the server — `@JsonIgnore`‑protected)

### 🙋 Job Seeker Management
- Candidate self‑registration (name, national ID, birth date, email, password)
- Unique constraints on email and national ID
- List all registered job seekers

### 📥 Job Application Workflow
- Job seekers apply to a specific advertisement (one application per seeker/advertisement pair, enforced by a DB unique constraint)
- Applications default to `PENDING` and can be transitioned to `ACCEPTED` / `REJECTED`
- Look up applications by advertisement ID or by job seeker ID

### 🧭 Job Position & City Catalog
- Add and list job position titles (e.g. "Backend Developer") — unique per title
- Add and list cities — unique per city name
- Used as reference/lookup data when posting a new advertisement

### 👤 System (HR) Employee Records
- Add and list internal HR staff records (name, last name)

### 🔒 Input Validation & Centralized Error Handling
- Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Size`, `@Future`, `@Past`, `@Positive`, etc.) on every request DTO
- A `GlobalExceptionHandler` (`@ControllerAdvice`) converts validation failures into a clean `field → message` JSON map instead of a stack trace

### 🔐 Password Security
- Employer and job seeker passwords are hashed with **BCrypt** (`spring-security-crypto`) before being persisted — never stored or returned in plain text

### 📊 Enterprise Dashboard UI (Front‑End)
- Custom-built responsive dashboard (HTML/CSS/Bootstrap/vanilla JS) — sidebar navigation, gradient stat cards, sticky/zebra‑striped tables, modals for every "create" action, and a built‑in **API Explorer** for firing raw requests at any endpoint from the browser
- Live counts for job ads, seekers, employers, and cities, auto‑refreshing every 5 seconds
- Search/filter on Job Advertisements, Employers, and Job Seekers tables

### 🧪 Scaffolding for Future Workflows
- `MailVerificationService` and `HrConfirmaitonService` interfaces + stub implementations exist in `core/`, ready to be extended into real email verification and HR approval workflows

---

## 🛠️ Technology Stack

**Front‑End**
- HTML5
- CSS3 (custom design system, no framework lock‑in)
- Bootstrap 5 (grid, modals, components)
- Vanilla JavaScript (Fetch API, no build step)

**Back‑End**
- Java 17
- Spring Boot 3.2.2
- Spring Web (REST controllers)
- Spring Data JPA / Hibernate
- Jakarta Bean Validation (`spring-boot-starter-validation`)
- Spring Security Crypto (`BCryptPasswordEncoder` for password hashing only — no filter chain / auth layer configured yet)
- Lombok

**Database**
- MySQL 8

**Build Tool**
- Maven

**Testing**
- JUnit 5 + Spring Boot Test
- H2 in‑memory database for repository/controller test isolation

---

## 🏗️ Architecture

The backend follows a clean **Layered (N‑Tier) Architecture**:

```
┌─────────────────────────────────────────────┐
│  Controller Layer   (controller/)            │  ← REST endpoints, request/response only
├─────────────────────────────────────────────┤
│  Service Layer      (business/abstracts +    │  ← Business rules, validation logic,
│                       business/concretes/)    │     orchestrates DAOs, builds Result/DataResult
├─────────────────────────────────────────────┤
│  Repository Layer   (repository/*Dao.java)   │  ← Spring Data JPA interfaces
├─────────────────────────────────────────────┤
│  Entity Layer        (entity/)                │  ← JPA entities mapped to MySQL tables
└─────────────────────────────────────────────┘
```

Supporting layers that cut across the above:

- **DTO Layer** (`dto/`, `dto/request/`) — keeps entities out of the wire format; separate `*Dto` (response) and `*Request` (inbound, validated) classes per resource
- **Core / Utilities** (`core/utilities/`) — `Result`, `DataResult`, `SuccessResult`, `SuccessDataResult`, `ErrorResult`, `ErrorDataResult`: a small, consistent response‑wrapper pattern used by every service method
- **Exception Layer** (`core/exceptions/GlobalExceptionHandler.java`) — global `@ControllerAdvice` turning validation exceptions into structured JSON error maps
- **Config / Security Layer** (`config/SecurityBeans.java`) — currently exposes a single `PasswordEncoder` bean (BCrypt); no `SecurityFilterChain` / authentication is configured yet
- **Interface‑first Services** — every business service is defined as an interface in `business/abstracts/` with a single concrete `*Manager` implementation in `business/concretes/`, enabling easy mocking/testing and future swap‑in of alternate implementations

---

## 🗄️ Database Design

7 tables, all managed by Hibernate (`ddl-auto=update`) against a MySQL schema (`hrms_db`).

### `cities`
| Column | Type | Constraints |
|---|---|---|
| city_id | INT (PK, AI) | |
| city_name | VARCHAR(100) | `NOT NULL`, `UNIQUE` |

### `employers`
| Column | Type | Constraints |
|---|---|---|
| id | INT (PK, AI) | |
| company_name | VARCHAR(200) | `NOT NULL` |
| web_page | VARCHAR(255) | `NOT NULL` |
| email | VARCHAR(180) | `NOT NULL`, `UNIQUE` |
| phone_number | VARCHAR(30) | `NOT NULL` |
| password | VARCHAR(100) | `NOT NULL` (BCrypt hash, never serialized) |

### `job_positions`
| Column | Type | Constraints |
|---|---|---|
| job_position_id | INT (PK, AI) | |
| title | VARCHAR(150) | `NOT NULL`, `UNIQUE` |

### `job_advertisement`
| Column | Type | Constraints |
|---|---|---|
| job_advertisement_id | INT (PK, AI) | |
| open_position_count | INT | `NOT NULL`, positive |
| description | VARCHAR(5000) | `NOT NULL` |
| min_salary / max_salary | INT | nullable, ≥ 0 |
| job_relase_date | DATE | `NOT NULL`, defaults to today |
| application_deadline | DATE | `NOT NULL`, must be in the future |
| job_position_id | INT (FK → job_positions) | `NOT NULL` |
| city_id | INT (FK → cities) | `NOT NULL` |
| employer_id | INT (FK → employers) | `NOT NULL` |
| active | BOOLEAN | `NOT NULL`, defaults `true` |

### `job_seekers`
| Column | Type | Constraints |
|---|---|---|
| job_seeker_id | INT (PK, AI) | |
| name / last_name | VARCHAR(100) | `NOT NULL` |
| national_id | VARCHAR(20) | `NOT NULL`, `UNIQUE` |
| birthDate | DATE | `NOT NULL`, must be in the past |
| email | VARCHAR(180) | `NOT NULL`, `UNIQUE` |
| password | VARCHAR(100) | `NOT NULL` (BCrypt hash) |

### `job_applications`
| Column | Type | Constraints |
|---|---|---|
| job_application_id | INT (PK, AI) | |
| job_advertisement_id | INT (FK → job_advertisement) | `NOT NULL` |
| job_seeker_id | INT (FK → job_seekers) | `NOT NULL` |
| application_date | DATETIME | `NOT NULL`, defaults to now |
| status | ENUM (`PENDING`,`ACCEPTED`,`REJECTED`) | `NOT NULL`, defaults `PENDING` |
| — | — | `UNIQUE(job_advertisement_id, job_seeker_id)` |

### `system_employee`
| Column | Type | Constraints |
|---|---|---|
| sytem_employeeId | INT (PK, AI) | |
| name / lastName | VARCHAR(100) | `NOT NULL` |

**Relationships:** `job_advertisement` is the hub — it many‑to‑one's into `job_positions`, `cities`, and `employers`; `job_applications` many‑to‑one's into both `job_advertisement` and `job_seekers`, with a composite uniqueness rule preventing duplicate applications.

---

## 📁 Project Structure

```
hrms/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/hrms/
│   │   │   ├── HrmsApplication.java
│   │   │   └── hrms/
│   │   │       ├── business/
│   │   │       │   ├── abstracts/         # Service interfaces
│   │   │       │   └── concretes/         # *Manager service implementations
│   │   │       ├── config/
│   │   │       │   └── SecurityBeans.java # PasswordEncoder bean
│   │   │       ├── controller/            # REST controllers (@RequestMapping)
│   │   │       ├── core/
│   │   │       │   ├── abstracts/         # MailVerificationService, HrConfirmaitonService
│   │   │       │   ├── concretes/         # Stub implementations
│   │   │       │   ├── exceptions/        # GlobalExceptionHandler
│   │   │       │   └── utilities/         # Result / DataResult response wrappers
│   │   │       ├── dto/                   # Response DTOs
│   │   │       │   └── request/           # Validated inbound request DTOs
│   │   │       ├── entity/                # JPA entities
│   │   │       └── repository/            # Spring Data JPA *Dao interfaces
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/                    # Front-end dashboard (served by Spring Boot)
│   │           ├── index.html
│   │           ├── login.html
│   │           ├── css/style.css
│   │           └── js/script.js
│   └── test/
│       ├── java/hrms/hrms/                # JUnit 5 controller & repository tests
│       └── resources/application-test.properties
```

---

## 🔌 API Endpoints

All endpoints return the `Result` / `DataResult` JSON envelope: `{ "success": true, "message": "...", "data": [...] }`.

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/cities/add` | Add a new city | Public* |
| `GET` | `/api/cities/getAll` | List all cities | Public* |
| `POST` | `/api/employers/register` | Register a new employer | Public* |
| `GET` | `/api/employers/getAll` | List all employers | Public* |
| `POST` | `/api/candidateController/register` | Register a new job seeker | Public* |
| `GET` | `/api/candidateController/getAll` | List all job seekers | Public* |
| `POST` | `/api/jobPosition/add` | Add a new job position | Public* |
| `GET` | `/api/jobPosition/getAll` | List all job positions | Public* |
| `POST` | `/api/jobPost/add` | Post a new job advertisement | Public* |
| `GET` | `/api/jobPost/getAll` | List all job advertisements | Public* |
| `GET` | `/api/jobPost/active` | List active job advertisements | Public* |
| `GET` | `/api/jobPost/active/by-employer?employerId=` | Active advertisements for one employer | Public* |
| `GET` | `/api/jobPost/sorted-by-deadline` | All advertisements sorted by deadline (asc) | Public* |
| `GET` | `/api/jobPost/by-deadline?date=` | Advertisements matching a specific deadline | Public* |
| `POST` | `/api/applications/apply` | Apply to a job advertisement | Public* |
| `POST` | `/api/applications/update-status` | Update an application's status | Public* |
| `GET` | `/api/applications/by-advertisement/{adId}` | Applications for one advertisement | Public* |
| `GET` | `/api/applications/by-jobseeker/{seekerId}` | Applications submitted by one job seeker | Public* |
| `POST` | `/api/hrController/add` | Add a system/HR employee record | Public* |
| `GET` | `/api/hrController/getAll/systemEmployee` | List all system/HR employee records | Public* |

<sup>* No authentication/authorization layer is currently configured — every endpoint is reachable without a token. See [Security Features](#-security-features) and [Future Enhancements](#-future-enhancements).</sup>

---

## ⚙️ Installation Guide

### Prerequisites
- JDK 17+
- Maven 3.8+
- MySQL 8.x running locally (or reachable)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/hrms.git
cd hrms
```

### 2. Configure MySQL
Create the database the app expects:
```sql
CREATE DATABASE hrms_db;
```
Hibernate will create/update all tables automatically on startup (`ddl-auto=update`) — no manual schema scripts needed.

### 3. Update `application.properties`
Edit `src/main/resources/application.properties` with your own credentials:
```properties
spring.application.name=hrms
spring.datasource.url=jdbc:mysql://localhost:3306/hrms_db
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.database.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```
> ⚠️ Never commit real credentials — use environment variables or a `.gitignore`d local properties file for production.

### 4. Run the Maven build
```bash
mvn clean install
```

### 5. Start the application
```bash
mvn spring-boot:run
```
The API and the dashboard will both be available at:
```
http://localhost:8080
```
Open it in a browser to land on the dashboard directly (served from `src/main/resources/static/`), or open `http://localhost:8080/login.html` for the sign‑in screen preview.

---

## 🖼️ Screenshots

> Replace these placeholders with real screenshots before publishing.

| Login Page | Dashboard |
|---|---|
| `docs/screenshots/login.png` | `docs/screenshots/dashboard.png` |

| Job Advertisements | Applications |
|---|---|
| `docs/screenshots/job-advertisements.png` | `docs/screenshots/applications.png` |

| Employers & Job Seekers | Employee Management *(UI preview)* |
|---|---|
| `docs/screenshots/employers-seekers.png` | `docs/screenshots/employees-preview.png` |

| Department Management *(UI preview)* | Leave Management *(UI preview)* |
|---|---|
| `docs/screenshots/departments-preview.png` | `docs/screenshots/leave-preview.png` |

---

## 🔐 Security Features

**Implemented:**
- **Password hashing** — employer and job seeker passwords are hashed with `BCryptPasswordEncoder` before persistence and excluded from JSON responses via `@JsonIgnore`
- **Server‑side validation** — Jakarta Bean Validation annotations on every request DTO, enforced before a request reaches the service layer
- **Centralized error handling** — `GlobalExceptionHandler` normalizes validation failures into structured JSON instead of leaking stack traces
- **Database‑level integrity** — unique constraints on employer email, job seeker email/national ID, city name, job position title, and the advertisement/seeker application pair

**Not yet implemented** *(see Future Enhancements)*:
- Spring Security filter chain / authenticated sessions
- JWT‑based login and token refresh
- Role‑Based Access Control (Admin / HR / Employer / Candidate)
- CORS policy configuration for production origins

---

## 🚀 Future Enhancements

- 🔑 JWT‑based authentication with login/refresh endpoints and a real `/api/auth` controller
- 🛡️ Spring Security + Role‑Based Access Control (Admin, HR, Employer, Candidate roles)
- 🧑‍💼 Real Employee, Department, and Leave Management modules — the dashboard already ships fully‑designed **UI‑preview** screens for these; wiring them to new entities/services/controllers is the natural next step
- 🕒 Attendance tracking module
- 📧 Replace the stub `MailVerificationService` with real SMTP‑based email verification
- 📄 Resume/document upload (multipart file storage)
- 📃 Pagination, sorting, and filtering on all list endpoints
- 📚 OpenAPI/Swagger documentation
- 🐳 Dockerfile + docker-compose for one‑command local spin‑up
- ✅ Expanded automated test coverage (service layer, integration tests)

---

## 🎓 Learning Outcomes

Building this project involved hands‑on practice with:

- **Spring Boot** — auto‑configuration, dependency injection, application properties, embedded Tomcat
- **Spring Data JPA / Hibernate** — entity mapping, relationships (`@ManyToOne`/`@OneToMany`), unique constraints, `ddl-auto` schema generation
- **REST API design** — resource‑oriented controllers, consistent response envelopes (`Result`/`DataResult`), path/query parameter handling
- **Jakarta Bean Validation** — declarative request validation and centralized exception translation via `@ControllerAdvice`
- **MySQL** — relational schema design, foreign keys, and unique/composite constraints
- **Layered (N‑Tier) / MVC‑style Architecture** — separating controllers, services (interface + implementation), repositories, and entities for testability and maintainability
- **Password security fundamentals** — one‑way hashing with BCrypt instead of plain‑text storage
- **Front‑end integration without a framework** — building a full dashboard UI in vanilla JS against a REST API with the Fetch API

---

## 👤 Author

**Lekhit Patil**
Java Full‑Stack Developer

- 💼 Open to backend/full‑stack opportunities
- 🔗 GitHub: `github.com/<your-username>`
- 🔗 LinkedIn: `linkedin.com/in/<your-profile>`
- 📧 Email: `your.email@example.com`

*(Update the links above with your real profiles before publishing.)*

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please open an issue first for major changes so we can discuss what you'd like to add.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ If you found this project useful, consider giving it a star!**

</div>
