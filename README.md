# Opportunity Radar

Student opportunity discovery with personalized mock matches.

## Run the frontend

```sh
npm install
npm run dev
```

Open the app at `http://localhost:5173` so it matches the backend CORS configuration. The frontend calls FastAPI at `http://127.0.0.1:8000`; Swagger is available at `http://127.0.0.1:8000/docs`.

The API base URL can be overridden with `VITE_API_BASE_URL`.

## Checks

```sh
npm run lint
npm run build
```
