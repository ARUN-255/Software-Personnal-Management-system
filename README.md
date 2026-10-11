# Software Personnel Management System

A focused academic mini project with separate Admin, Owner and Employee experiences.

## Main features

- Admin-created employee accounts and employee profile management
- Employee photo storage on the local computer
- Attendance check-in, check-out and admin updates
- Gemini AI assistant with Tamil and English support
- Voice-to-text questions and spoken AI answers
- Owner approval for new administrator accounts

## Stack

- React 18, React Router and Vite
- Java 17, Spring Boot 3, Spring Security and Spring Data JPA
- H2 for zero-setup development; PostgreSQL profile for final database setup
- Local server storage in `backend/uploads` for employee photos

## Run now

```bash
cd backend
bash run-local.sh

cd frontend
npm install
npm run dev
```

The backend runs at `http://localhost:8080`, and Vite at `http://localhost:5173`.

Optional demo accounts are created only when `APP_DEMO_DATA=true`:

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

Photos stay on the local server. Configure `APP_UPLOAD_DIR` to select another directory. AWS is not required.
