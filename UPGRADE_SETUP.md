# Bronzera Labs cloud and AI upgrade

## What is included

- Private AWS S3 storage for new photos and certificates, with authorized backend downloads.
- Local storage remains available. Existing locally stored files continue to load even after switching new uploads to S3.
- Gemini assistant with employee-only personal summaries and administrator aggregate summaries. It cannot approve requests or change records. Questions and the displayed authorized monthly context are sent to Google only when the user clicks Ask.
- Leave applications, overlap checks, admin approval/rejection and review comments.
- Attendance correction requests, one check-in/check-out per day, working hours and monthly attendance summaries.
- Existing salary components and payroll history, downloadable published PDF payslips, attendance CSV and print-to-PDF monthly reports.
- In-app notifications for requests, decisions, published payroll and missing-certificate reminders.
- Audit history, CSRF protection, hidden password hashes, session ID rotation on login, and disabled-account session rejection.
- Account password changes, disabled-by-default demo accounts, Docker packaging and GitHub build/test workflow.

## 1. Update and back up

Back up your PostgreSQL database and backend/uploads folder before upgrading. Keep the uploads directory: existing database photo/document records still reference those files. The application adds new tables and nullable columns through its existing Hibernate `ddl-auto: update` configuration. A startup migration initializes the new attendance version column on existing records. No existing accounts are reset or removed.

```bash
git pull origin main
cd backend
cp .env.example .env
```

Open `backend/.env` in VS Code. This is the place to paste your configuration. It is excluded from Git. Values containing spaces or shell characters should be quoted when using the local runner.

| Setting | Enter |
| --- | --- |
| DB_URL | Your existing PostgreSQL JDBC URL |
| DB_USERNAME / DB_PASSWORD | Your existing database login |
| FRONTEND_URL | `http://localhost:5173` for Vite |
| GEMINI_API_KEY | Your Google AI Studio key |
| GEMINI_MODEL | A model ID currently available to your key; do not paste the model display name |
| STORAGE_PROVIDER | `local` initially; change to `s3` after setting up a bucket |
| AWS_REGION | Your bucket's region, e.g. `ap-south-1` |
| AWS_S3_BUCKET | Your private bucket name |
| AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY | Local development IAM credentials with access only to the bucket's `personnel/` prefix |
| AWS_SESSION_TOKEN | Only if using temporary AWS credentials |
| APP_TIME_ZONE | `Asia/Kolkata` by default |
| COOKIE_SECURE | `false` for local HTTP; `true` for hosted HTTPS |

For a **new empty database only**, set `BOOTSTRAP_OWNER_PASSWORD` to a strong password with at least 12 characters. This creates the owner account. Existing installations use their current accounts. After initial creation, remove the bootstrap password from configuration. Owner approves admin requests; admins add departments/designations and employees.

Run the backend (Java 17 and Maven required):

```bash
bash run-local.sh
```

In another terminal, from the project root:

```bash
cd frontend
npm ci
npm run dev
```

The shell runner loads backend/.env. Running Maven directly does **not** automatically load that file. Never put these keys in frontend variables or commit the filled .env.

## 2. S3 setup

Create an S3 bucket in your selected region. Keep **Block Public Access enabled** and default encryption enabled. New files are stored under `personnel/` with random keys and explicit SSE-S3 encryption. The browser downloads through the authenticated backend, so no public bucket policy or browser-to-S3 CORS configuration is required.

Give the development IAM identity or production IAM role only `s3:PutObject` and `s3:GetObject` on:

```
arn:aws:s3:::YOUR_BUCKET_NAME/personnel/*
```

Set STORAGE_PROVIDER=s3 and the bucket/region, then restart the backend. Upload a photo or certificate to test. Do not use AWS root credentials. On EC2/ECS, prefer an IAM role and omit static key environment variables entirely. In a container, ensure the AWS SDK can reach the chosen task/instance credentials provider.

Switching providers does not migrate old files. Keep your uploads volume or copy existing data and update records with a separately reviewed migration. Back up both the database and local uploads. Keep S3 versioning/backups according to your deployment needs.

## 3. Gemini setup

Create a Gemini API key in Google AI Studio and choose an available model ID from its model list. Paste both values into backend/.env and restart the backend. No key is sent to React. A blank key/model leaves the assistant disabled with a clear message; the rest of the application still works.

Go to **AI assistant in the sidebar**, choose a reporting month and ask a question. Employee requests contain that employee's report and published salary components, department and designation; admin requests contain aggregate totals. Passwords, contact details, uploaded documents, coworker names and API keys are excluded. Do not type confidential information into questions. Answers are advisory and must be checked against records. Each account is limited to one AI request per 10 seconds per backend process, with a 40-second provider timeout.

## 4. Docker

From the repository root, after filling backend/.env:

```bash
docker compose --env-file backend/.env up --build
```

Use `http://localhost:8088`. For this mode, set FRONTEND_URL=http://localhost:8088 in backend/.env. Docker creates a **separate PostgreSQL database volume**; it does not automatically import the PostgreSQL database on your laptop. Set a bootstrap owner password for the new database or restore your existing database backup. Never run `docker compose down -v` if you want to retain data.

AWS hosting is **prepared, not provisioned**: deploy the containers to your chosen EC2/ECS environment, use HTTPS at an ALB/reverse proxy, attach an S3 IAM role, and set FRONTEND_URL to your real HTTPS origin and COOKIE_SECURE=true. For RDS use a private PostgreSQL instance, its JDBC URL with `sslmode=require`, and security groups permitting only the backend. The supplied Compose database is for local/self-hosted setup; replace that service configuration when using RDS. Keep the frontend and `/api` on the same origin using the included nginx proxy. Budget alerts, a domain and TLS certificate must be configured in your own AWS account.

## 5. Verify

```bash
cd backend
mvn test package
```

```bash
cd frontend
npm ci
npm run build
```

The GitHub Actions workflow performs these checks and a Chromium browser smoke test covering real sign-in, clock-in/out, leave approval, notifications, CSV export, audit navigation and PDF download. Integration tests cover access control, CSRF, password-hash exclusion, check-in/out rules, leave overlap, single-review enforcement, request/notification isolation, PDF authorization and disabled-AI behavior. Live S3/Gemini calls require your own credentials and are not made by CI.

Manual acceptance checks:

1. Sign in as employee, open Attendance, check in and check out, then confirm the monthly hours.
2. Submit leave and an attendance correction. As admin, review with a comment; confirm employee notification and corrected record.
3. Publish payroll from the employee profile. As employee, download the PDF. Download the admin CSV and print the monthly report.
4. Upload an image with local storage, then another with S3 configured. Both should load only for authorized sessions.
5. Configure Gemini; ask an employee about their monthly payroll and an admin about aggregate attendance.
6. Check audit history and change your password from Account security.

## Scope and limitations

Leave is recorded separately from attendance and salary: it does not calculate entitlements, holiday calendars or automatic deductions. Clocking supports same-day shifts only, not overnight shifts, location tracking or biometric proof. Payroll deductions are entered by admins; no tax-compliance calculations are implied. Notifications are in-app, not email/SMS. Audit history records actor, endpoint and time rather than before/after record snapshots. Reports currently scan stored records and suit this mini-project; add database-level aggregation/pagination before large-scale deployment. PDF payslips use a standard Latin font; unsupported characters display as `?`. AI limits are per process; a scaled deployment needs a shared rate limiter. Hibernate schema updates should be replaced with reviewed versioned migrations before a production rollout.

## Provider references

- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/api-key
- https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/credentials-chain.html

## Redesigned workspace

Each sidebar item opens its own screen within the scrollable workspace. Mobile navigation opens from the menu button. The AI assistant supports follow-up questions, safe formatted answers, stop, copy and new chat. Chat history lasts only while that screen remains open; changing month starts a new conversation. Keep the existing backend environment configuration and restart both servers after updating.
