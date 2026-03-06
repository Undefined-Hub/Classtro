# Copilot instructions for Classtro

## Big-picture architecture
- Monorepo with backend (Express + MongoDB + Socket.IO) and frontend (React + Vite + Tailwind). Start reading at [backend/app.js](backend/app.js) and [frontend/src/main.jsx](frontend/src/main.jsx).
- API surface is composed in [backend/routes/index.js](backend/routes/index.js); some routes are protected via `authenticateJWT` (Passport JWT).
- Real-time features use Socket.IO namespace `/sessions` with rooms named `session:{code}`; server logic is in [backend/socket.js](backend/socket.js). Clients connect from [frontend/src/context/ParticipantSessionContext.jsx](frontend/src/context/ParticipantSessionContext.jsx) and [frontend/src/pages/Host/SessionWorkspace.jsx](frontend/src/pages/Host/SessionWorkspace.jsx).

## Data flow & auth patterns
- JWT auth uses Passport strategies in [backend/config/Passport.js](backend/config/Passport.js) and middleware in [backend/middlewares/authenticateJWT.js](backend/middlewares/authenticateJWT.js). Access tokens are sent as `Authorization: Bearer ...`.
- Frontend API calls go through the shared Axios instance in [frontend/src/utils/api.js](frontend/src/utils/api.js), which attaches the latest access token and uses `withCredentials: true`.
- Input validation uses Zod schemas in backend/schemas and the helper `validateInput()` in [backend/utils/validateInput.js](backend/utils/validateInput.js). Error responses follow [backend/middlewares/errorHandler.js](backend/middlewares/errorHandler.js).

## Key services & integrations
- MongoDB connection and startup are handled in [backend/config/db.js](backend/config/db.js) and invoked by [backend/app.js](backend/app.js).
- Socket.IO is initialized in [backend/socket.js](backend/socket.js) and mounted in [backend/server.js](backend/server.js).
- CORS allowlist logic is centralized in [backend/app.js](backend/app.js) and supports local + Vercel preview domains.

## Developer workflows (from package.json)
- Backend: npm run dev (nodemon server.js) or npm start (node server.js) in [backend/package.json](backend/package.json).
- Frontend: npm run dev, npm run build, npm run lint in [frontend/package.json](frontend/package.json).
- Default ports observed in code: backend 5000 (see [backend/server.js](backend/server.js)), Vite 5173; frontend expects VITE_BACKEND_BASE_URL or falls back in [frontend/src/utils/api.js](frontend/src/utils/api.js).

## Project-specific conventions
- Routes are grouped by domain (auth, rooms, sessions, polls, qna, feedback, analytics) under backend/routes; check [backend/routes/index.js](backend/routes/index.js) for mounting paths.
- Realtime participation updates emit `participants:update` and `room:members` from the server; client-side listeners are in [frontend/src/pages/Host/SessionWorkspace.jsx](frontend/src/pages/Host/SessionWorkspace.jsx).
- Session state on the participant side is persisted in sessionStorage under `participantSession` (see `STORAGE_KEY` in [frontend/src/context/ParticipantSessionContext.jsx](frontend/src/context/ParticipantSessionContext.jsx)).
