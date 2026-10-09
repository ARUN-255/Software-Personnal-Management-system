> Cloud, AI and workspace upgrade: see [UPGRADE_SETUP.md](UPGRADE_SETUP.md) for the current setup, API-key placeholders and new features. Demo accounts are now disabled by default; use your existing login or configure the initial owner for an empty database.

# Software Personnel Management System

A complete academic full-stack employee portal with separate Admin, Owner and Employee experiences.

## Stack

- React 18, React Router and Vite
- Java 17, Spring Boot 3, Spring Security and Spring Data JPA
- H2 for zero-setup development; PostgreSQL profile for final database setup
- Local server storage in `backend/uploads` for photos and certificates

## Run now

```bash
cd backend
mvn spring-boot:run

cd frontend
npm install
npm run dev
```

The backend runs at `http://localhost:8080`, and Vite at `http://localhost:5173`.

Demo accounts created on first start:

| Role | Username | Password |
| --- | --- | --- |
| Owner | owner | Owner@123 |
| Admin | admin | Admin@123 |
| Employee | employee | Employee@123 |

Change these credentials before using real data.

## PostgreSQL last step

Create a database named `personnel_management`, then run:

```bash
SPRING_PROFILES_ACTIVE=postgres DB_URL=jdbc:postgresql://localhost:5432/personnel_management DB_USERNAME=postgres DB_PASSWORD=your_password mvn spring-boot:run
```

Uploads stay on the local server. Configure `APP_UPLOAD_DIR` to select another directory.
