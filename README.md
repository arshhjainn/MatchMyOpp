# Opportunity Radar

Student opportunity discovery powered by the MatchMyOpp FastAPI backend.

## Run the frontend

```sh
npm install
npm run dev
```

Open the app at `http://localhost:5173`. Copy `.env.example` to `.env.local` to configure the API URL. By default, the frontend calls `https://matchmyopp.onrender.com`; Swagger is available at `https://matchmyopp.onrender.com/docs`.

Set `VITE_API_BASE_URL` to the API origin (without `/api`) to override the default. For local backend development, use `http://127.0.0.1:8000`. If this variable is already set in Vercel, update it to `https://matchmyopp.onrender.com` and redeploy; otherwise the frontend's deployed default is used.

The backend must allow the frontend origin in FastAPI CORS. Add `https://matchmyopp.vercel.app` to `allow_origins` on the backend before using it from the deployed site. For local development, allow `http://localhost:5173` (and the actual Vite port if it differs).

## Checks

```sh
npm run lint
npm run build
```
