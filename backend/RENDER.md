# Deploy the API on Render

This API uses MySQL. Create or use a reachable MySQL database first; Render's web service needs its host, port, database name, user, and password.

## Configure the Render Web Service

Connect the `arshhjainn/MatchMyOpp` GitHub repository and select the `backend` branch. Set:

- **Root Directory:** `backend`
- **Runtime:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/api/health`

Add these environment variables in Render using the values from the MySQL provider:

- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT` (usually `3306`)
- `DB_NAME`

Never put live database credentials in Git. `backend/.env.example` documents the local names only.

## Confirm the frontend origin is allowed

`backend/main.py` allows `https://matchmyopp.vercel.app`, plus the two local Vite origins. After deployment, check `GET /api/health`, then check a profile preflight from a terminal:

```sh
curl -i -X OPTIONS 'https://matchmyopp.onrender.com/api/profile' \
  -H 'Origin: https://matchmyopp.vercel.app' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

The response should include `access-control-allow-origin: https://matchmyopp.vercel.app` and permit `POST` and `content-type`. A successful response from `/` alone does not confirm CORS is configured.

The frontend is configured to use `https://matchmyopp.onrender.com` by default. Override it only when a different API URL is intentionally used.
