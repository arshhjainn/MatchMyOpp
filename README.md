# Opportunity Radar

Student opportunity discovery with personalized mock matches.

## Run the frontend

```sh
npm install
npm run dev
```

Open the app at `http://localhost:5173`. Copy `.env.example` to `.env.local` to configure the API URL. By default, the frontend calls FastAPI at `http://127.0.0.1:8000`; Swagger is available at `http://127.0.0.1:8000/docs`.

Set `VITE_API_BASE_URL` to the API origin (without `/api`) when running locally or deploying. In Vercel, add it under **Project Settings → Environment Variables** and redeploy. A deployed frontend needs a publicly reachable HTTPS backend URL; `127.0.0.1` only points to the browser user's own computer.

The backend must allow the frontend origin in FastAPI CORS. Its current `backend` branch allows only `http://localhost:5173` and `http://127.0.0.1:5173`; add the deployed Vercel origin (for example, `https://matchmyopp.vercel.app`) to `allow_origins` before using it from the deployed site. Also configure the backend's MySQL environment variables for its hosting provider.

## Checks

```sh
npm run lint
npm run build
```
