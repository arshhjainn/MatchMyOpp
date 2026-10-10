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

The deployed application runs idempotent startup migrations after `create_all()`:

- Adds nullable `created_at DATETIME`, `updated_at DATETIME`, and `submitted_at DATE` columns to an existing `applications` table when missing.
- Adds a unique student/opportunity constraint to prevent duplicate tracker entries when the existing table has no duplicate pairs.
- Does not drop tables, rewrite existing values, or infer dates for older rows.
- Existing application rows remain valid; their timestamps remain `NULL` until new edits provide an update timestamp.

If legacy duplicate student/opportunity pairs already exist, startup preserves them and skips adding the unique constraint rather than deleting data or failing deployment. The API still rejects ordinary duplicate creates with HTTP 409. Review and resolve any legacy duplicates intentionally before adding the constraint manually if database-level concurrency protection is required.

Application status values are `Interested`, `Preparing`, `Applied`, `Shortlisted`, `Interview`, `Selected`, `Rejected`, and `Withdrawn`. The legacy value `Accepted` remains readable/updatable for existing records. New unsupported status values return HTTP 422. Moving an application to `Applied` sets `submitted_at` once; later status changes do not overwrite it.

New and extended routes:

- `GET /api/applications/{student_id}` returns tracker rows joined with their opportunity title, category, actual deadline, official application URL, notes, and timestamps. Its original response fields remain present.
- `GET /api/application/{application_id}` returns one application with the same response shape. The singular route avoids colliding with the existing student list route.
- `GET /api/dashboard/{student_id}` returns tracked/submitted/shortlisted counts and deadline totals.
- `GET /api/deadlines/{student_id}?reminder_windows=7,3,1` groups actual opportunity deadlines into due today, 3 days, 7 days, upcoming, overdue, and unknown. `reminder_candidates` only includes still-actionable `Interested`/`Preparing` applications exactly 7, 3, or 1 day before the deadline. `delivery` is `in_app_only`.

Deadline/reminder responses are derived on each GET, not persisted notifications. Re-reading the feed returns the current reminder candidate again by design; the backend does not send email or push messages, and does not claim delivery. Each student/opportunity pair remains unique through the existing database constraint.

Run the pure backend logic checks from the `backend` directory:

```sh
python -m unittest discover -s tests -v
```

Deploy by pushing the `backend` branch. Render uses the existing service's `backend` root directory and runs the migration on startup. No additional environment variable is required for the in-app deadline feed; email delivery is not configured.
