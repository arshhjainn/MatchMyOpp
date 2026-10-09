# Deploy the API on Render

This API uses MySQL-compatible storage. The current deployment is connected to TiDB Cloud; keep its current `DB_*` settings unless you intentionally move databases. The application tracker migration adds only nullable columns and preserves existing rows.

## Configure the Render Web Service

Connect the `arshhjainn/MatchMyOpp` GitHub repository and select the `backend` branch. Set:

- **Root Directory:** `backend`
- **Runtime:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/api/health`

Add these environment variables in Render using the values from the database provider:

- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT` (`4000` for TiDB Cloud; otherwise use the provider's port)
- `DB_NAME`
- `DB_SSL=true` for TLS-required providers such as TiDB Cloud
- `DB_SSL_CA=/etc/ssl/certs/ca-certificates.crt` when TLS is enabled

For TiDB Cloud, copy the host and generated username from its connection panel (the username may include an account prefix), use port `4000`, and set the database name to `opportunity_radar`. Create that database/schema in TiDB if it is not already present. Enter the password directly in Render; do not commit it or send it in chat.

Never put live database credentials in Git. `backend/.env.example` documents the local names only.

## Confirm the frontend origin is allowed

`backend/main.py` allows `https://matchmyopp.vercel.app`, plus the two local Vite origins. After deployment, check `GET /api/health`, then check a profile preflight from a terminal:

```sh
curl -i -X OPTIONS 'https://matchmyopp-1.onrender.com/api/profile' \
  -H 'Origin: https://matchmyopp.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

The response should include `access-control-allow-origin: https://matchmyopp.vercel.app` and permit `POST` and `content-type`. A successful response from `/` alone does not confirm CORS is configured.

The frontend is configured to use `https://matchmyopp-1.onrender.com` by default. Override it only when a different API URL is intentionally used.

## Application tracker and deadline APIs

The deployed application runs idempotent additive startup migrations after `create_all()`:

- Adds nullable `created_at DATETIME`, `updated_at DATETIME`, and `submitted_at DATE` columns to an existing `applications` table when missing.
- Adds nullable `email VARCHAR(254)` and `email_reminders_enabled BOOLEAN NOT NULL DEFAULT 0` columns to an existing `students` table when missing.
- Creates the `reminder_deliveries` table for deduplicating email reminders.
- Does not drop tables, rewrite existing values, or infer dates for older rows.
- Existing application rows remain valid; their timestamps remain `NULL` until new edits provide an update timestamp.

Application status values are `Interested`, `Preparing`, `Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`, and `Withdrawn`. The legacy value `Accepted` remains readable/updatable for existing records. New unsupported status values return HTTP 422. Moving an application to `Applied` sets `submitted_at` once; later status changes do not overwrite it.

New and extended routes:

- `GET /api/applications/{student_id}` returns tracker rows joined with their opportunity title, category, actual deadline, official application URL, notes, and timestamps. Its original response fields remain present.
- `GET /api/application/{application_id}` returns one application with the same response shape. The singular route avoids colliding with the existing student list route.
- `GET /api/dashboard/{student_id}` returns tracked/submitted/shortlisted counts and deadline totals.
- `GET /api/deadlines/{student_id}?reminder_windows=7,3,1` groups actual opportunity deadlines into due today, 3 days, 7 days, upcoming, overdue, and unknown. `reminder_candidates` only includes still-actionable `Interested`/`Preparing` applications exactly 7, 3, or 1 day before the deadline. Email is sent by the separate scheduled worker only for students who provide an email and opt in.
- `POST /api/profile` and `GET /api/profile/{student_id}` accept/return optional `email` and `email_reminders_enabled` fields. Opt-in requires a valid email address; reminders default to disabled for existing and new profiles unless the student enables them.

The deadline feed is computed on each GET. Email deduplication is persisted by application, reminder window, and deadline, so daily cron runs do not re-send a successfully delivered reminder. SMTP failures are marked failed and can be retried by the next run. A process crash after SMTP accepts a message but before the database records success can still result in a retry; SMTP does not provide a general exactly-once guarantee.

### Configure email reminders in Render

Use SMTP from a transactional email provider (for example, the SMTP credentials from your chosen provider). Add these values to the existing Render web service **and** the Cron Job below. Keep credentials private and never commit them:

- `SMTP_HOST` — provider SMTP hostname.
- `SMTP_PORT` — usually `587` for STARTTLS.
- `SMTP_USERNAME` and `SMTP_PASSWORD` — provider-issued SMTP credentials; set both or neither.
- `SMTP_FROM_EMAIL` — a sender address verified with the provider.
- `SMTP_USE_STARTTLS=true` — use TLS on port 587.
- `REMINDER_WINDOWS_DAYS=7,3,1` — optional comma-separated day windows; values may range from 1 to 30.

The repository contains `backend/reminder_worker.py`. In Render, create a **Cron Job** from the same repository and `backend` branch, with root directory `backend`, build command `pip install -r requirements.txt`, and command `python reminder_worker.py`. Schedule it once daily (UTC). Copy the existing `DB_*` values and the SMTP values into the Cron Job environment. The API service itself does not send recurring mail during requests.

The frontend must let students enter an email and explicitly enable reminders in their profile submission. Until that UI is added and the Render Cron Job and SMTP credentials are configured, users will continue to see in-app deadlines only.

Run the pure backend logic checks from the `backend` directory:

```sh
python -m unittest discover -s tests -v
```

Deploy by pushing the `backend` branch. Render uses the existing service's `backend` root directory and runs the migration on startup. No additional environment variable is required for the in-app deadline feed; email delivery is not configured.
