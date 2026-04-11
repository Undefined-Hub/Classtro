# Quiz feature — End-to-end documentation

This document describes the complete quiz flow in the Classtro application: front-end components, backend routes/controllers, real-time socket events, and database interactions for each operation. It is intended as a developer-facing reference for maintenance and further enhancements.

---

## Table of contents

- Overview
- Important files (frontend & backend)
- Data models (DB schemas)
- Teacher (host) flow
- Student (participant) flow
- Socket authentication and namespace
- API endpoints (methods, payloads, responses)
- Database interactions per operation
- Common debugging tips

---

## Overview

The quiz feature uses a combination of REST API calls (for CRUD and state transitions) and a Socket.IO namespace (/sessions) for real-time events. Teachers prepare quiz templates, import a template into a session (creating a LiveQuiz document), launch it (server marks it LIVE and emits a `quiz:launched` event to the session room), participants receive the quiz in real-time, submit their answers over sockets, the backend evaluates submissions, stores results, and notifies the host with `quiz:new:submission`.

Key design points:

- Templates are reusable (`QuizTemplate`).
- A `LiveQuiz` is created from a template and can be in DRAFT, LIVE, or CLOSED states.
- Submissions are stored as `QuizSubmission` documents and evaluated server-side.
- Real-time traffic uses the `/sessions` namespace and room naming `session:{sessionCode}`.

---

## Important files

- Frontend
  - [frontend/src/components/Host/sessionWorkspace/QuizManager.jsx](frontend/src/components/Host/sessionWorkspace/QuizManager.jsx) — Teacher UI to import templates, launch/close quizzes, view live submissions and results.
  - [frontend/src/components/Participant/ParticipantLiveQuiz.jsx](frontend/src/components/Participant/ParticipantLiveQuiz.jsx) — Student UI for taking a live quiz, navigation, and submission.
  - [frontend/src/context/HostSessionContext.jsx](frontend/src/context/HostSessionContext.jsx) — Host session state: `activeQuiz`, `quizSubmissions`, `pastQuizzes`, `showQuizImport`, `socketRef`.
  - [frontend/src/context/ParticipantSessionContext.jsx](frontend/src/context/ParticipantSessionContext.jsx) — Participant session state and socket lifecycle (`activeQuiz`, `quizAnswers`, `quizSubmitted`, `socketRef`).
  - [frontend/src/utils/api.js](frontend/src/utils/api.js) — Axios instance with auth header interceptor used for REST calls.

- Backend
  - [backend/controllers/quizTemplateController.js](backend/controllers/quizTemplateController.js) — CRUD for `QuizTemplate`.
  - [backend/controllers/liveQuizController.js](backend/controllers/liveQuizController.js) — Create/launch/close live quizzes, get session quizzes, and quiz results.
  - [backend/controllers/quizEvaluationController.js](backend/controllers/quizEvaluationController.js) — Evaluates a `QuizSubmission` and returns participant submission retrieval.
  - [backend/routes/quizTemplateRoutes.js](backend/routes/quizTemplateRoutes.js) — Routes for quiz templates (protected by JWT middleware).
  - [backend/routes/liveQuizRoutes.js](backend/routes/liveQuizRoutes.js) — Routes for live quizzes and results (protected by JWT middleware).
  - [backend/socket/quizSocket.js](backend/socket/quizSocket.js) — Socket handlers for `quiz:submit`, `quiz:request` and emits results to host using the session room.
  - [backend/socket.js](backend/socket.js) — Socket.IO setup, `/sessions` namespace, and `authenticateSocket` middleware.

---

## Data models (high-level)

- QuizTemplate (backend/models/QuizTemplate.js)
  - title, description, createdBy, roomId, questions[]
  - question: { type, questionText, options[] (with \_id), correctAnswers[], points, negativePoints }

- LiveQuiz (backend/models/LiveQuiz.js)
  - sessionId, launchedBy, sourceTemplateId, title, questions[], status (DRAFT|LIVE|CLOSED), durationSeconds, startedAt, closedAt, allowLateSubmission
  - questions use their own `_id` values (LiveOptionSchema preserves option \_id)

- QuizSubmission (backend/models/QuizSubmission.js)
  - liveQuizId, participantId, sessionId, answers[], score, maxScore, percentage, evaluated, submittedAt, isLate
  - answers: [{ questionId, selectedOptions[], answeredAt }]

---

## Teacher (Host) flow — sequence and files involved

1. Create templates (one-time):
   - File: [quizTemplateController.js](backend/controllers/quizTemplateController.js)
   - Frontend: user creates templates via the UI (not shown in this doc). Templates stored in `QuizTemplate`.

2. Open Quiz Manager in session workspace:
   - Component: `QuizManager.jsx` reads `sessionData` and calls `GET /api/live-quizzes/session/:sessionId` to fetch existing live/past quizzes.
   - Sets `activeQuiz` if a quiz with status `LIVE` is returned.

3. Import template (opens modal):
   - `QuizManager` opens import modal and calls `GET /api/quiz-templates` to list templates (filters are applied server-side by createdBy/roomId).

4. Create a LiveQuiz from Template (Draft):
   - Action: Teacher clicks Launch → `QuizManager` calls `POST /api/live-quizzes` with `{ sessionId, templateId }`.
   - Controller: `createLiveQuiz` in `liveQuizController.js` loads `QuizTemplate`, maps template questions/options (preserves `_id`), and creates `LiveQuiz` with status `DRAFT`.

5. Launch quiz (make LIVE):
   - Action: `QuizManager` calls `POST /api/live-quizzes/:id/launch`.
   - Controller: `launchQuiz` sets `status='LIVE'`, `startedAt=Date.now()`, saves the `LiveQuiz`, finds the `Session` to read `session.code`, and emits via Socket.IO: `quiz:launched` to room `session:{code}`.
   - Socket payload sent intentionally excludes `correctAnswers` (the server sends only question metadata and option text).

6. Monitor submissions in real-time:
   - `QuizManager` registers socket listener for `quiz:new:submission`.
   - On `quiz:new:submission`, `QuizManager` calls `GET /api/live-quizzes/:id/results` to refresh `quizSubmissions` and update UI (leaderboard/stats).

7. Close quiz:
   - Action: Teacher clicks End Quiz → `QuizManager` calls `POST /api/live-quizzes/:id/close`.
   - Controller: `closeQuiz` sets `status='CLOSED'`, `closedAt=Date.now()`, persists, finds the session and emits `quiz:closed` to `session:{code}`.
   - `QuizManager` then calls `GET /api/live-quizzes/:id/results` to fetch final results and shows the results screen.

---

## Student (Participant) flow — sequence and files involved

1. Participant joins a session:
   - `ParticipantSessionContext.jsx` creates a Socket.IO connection to `${BACKEND_BASE}/sessions` namespace with `auth: { token }` (token from `localStorage`).
   - On connect, the client emits `join-session` with `{ code: sessionData.joinCode, participantId }` to join the Socket room `session:{code}` on the server.

2. Receive quiz launch in real-time:
   - Server emits `quiz:launched` to `session:{code}` when teacher launches. Payload includes quiz metadata (id, title, questions array with option `_id` & text, points, startedAt).
   - The frontend (some listener in `ParticipantSession.jsx` or another component) receives `quiz:launched` and sets `activeQuiz` in `ParticipantSessionContext`.
   - `ParticipantLiveQuiz.jsx` subscribes to `activeQuiz` and renders the quiz UI.

3. Request quiz data (late joiners):
   - If a participant arrives after launch and needs the current quiz, the client can emit `quiz:request` with `{ quizId }`.
   - `backend/socket/quizSocket.js` handles `quiz:request` and emits back `quiz:data` (without correct answers) or `quiz:error`.

4. Answering & submitting:
   - Participant selects options; `ParticipantLiveQuiz.jsx` updates `quizAnswers` in `ParticipantSessionContext` (object mapping questionId => [optionId...]).
   - On submit, the client emits socket event `quiz:submit` with { quizId, answers } where `answers` are formatted like `[{ questionId, selectedOptions, answeredAt }]`.

5. Server-side submission handling (in `backend/socket/quizSocket.js`):
   - The server authenticates the socket (see Socket authentication section) and reads `socket.user.id`.
   - Checks:
     - LiveQuiz exists and status is `LIVE`.
     - Participant has not already submitted (unique index enforces this at DB level too).
     - Late submission rules (durationSeconds + allowLateSubmission).
   - Creates a `QuizSubmission` document with `liveQuizId`, `participantId`, `sessionId`, `answers`, `submittedAt`, `isLate`.
   - Calls `evaluateQuizSubmission` (server-side evaluation) which:
     - Loads `LiveQuiz` questions and correctAnswers.
     - Compares selected options (sorted string arrays) and awards `points` / applies `negativePoints`.
     - Computes `score`, `maxScore`, `percentage`, marks `evaluated = true` and saves the submission.
   - Emits acknowledgment back to submitting socket: `quiz:submission:ack` with `{ quizId, submissionId, score, maxScore, percentage }`.
   - Notifies host/session: `io.to('session:{session.code}').emit('quiz:new:submission', { quizId, participantId, participantName, submissionId, score, total, percentage, submittedAt })`.

6. Student receives ack and result UI:
   - The participant client listens for `quiz:submission:ack` and sets `quizResult` and `quizSubmitted` in context to render the results screen.

---

## Socket authentication & namespace

- Namespace: `/sessions` (created in `backend/socket.js`).
- Middleware: `authenticateSocket` reads `socket.handshake.auth?.token`, verifies JWT with `process.env.JWT_SECRET`, and attaches `socket.user = { id, email, name }` to each socket. If token missing or invalid, `socket.user` is set to null (some socket events still allowed but submission requires authenticated user).
- Room naming: `session:{sessionCode}` (session join code). Client emits `join-session` upon connect with `{ code: session.joinCode, participantId }` to join the room. Teacher and students share the same room; server emits to this room for quiz events.

---

## API endpoints (summary)

- Quiz templates
  - `POST /api/quiz-templates` — create a new template (body: title, description, questions[]). Uses `quizTemplateController.createQuizTemplate`.
  - `GET /api/quiz-templates` — list templates for the logged-in user. Used by `QuizManager` import modal.
  - `GET /api/quiz-templates/:id` — get a single template (for editing/import preview).

- Live quizzes
  - `POST /api/live-quizzes` — create a `LiveQuiz` (draft). Body example: `{ sessionId, templateId }` or full `{ title, questions }`. Controller: `createLiveQuiz`.
  - `POST /api/live-quizzes/:id/launch` — marks LiveQuiz as `LIVE`, sets `startedAt`, emits `quiz:launched` via sockets. Controller: `launchQuiz`.
  - `POST /api/live-quizzes/:id/close` — marks `CLOSED`, sets `closedAt`, emits `quiz:closed`. Controller: `closeQuiz`.
  - `GET /api/live-quizzes/session/:sessionId` — list live/past quizzes for a session. Used by `QuizManager` to populate `activeQuiz` and `pastQuizzes`.
  - `GET /api/live-quizzes/:id/results` — return quiz results and ranked submissions.
  - `GET /api/live-quizzes/:quizId/my-submission` — participant's own submission (via `quizEvaluationController.getParticipantSubmission`).

All API routes are protected by JWT middleware (`authenticateJWT`) — tokens are attached to `Authorization: Bearer <token>` by the frontend axios `api` instance.

---

## Database operations per major action

- Create Quiz Template (`createQuizTemplate`):
  - Writes `QuizTemplate` document with questions and option `_id` values created server-side.

- Create LiveQuiz (`createLiveQuiz`):
  - Reads `QuizTemplate` (if `templateId` provided), maps questions and options (preserving `_id`), then creates `LiveQuiz` document with `status: 'DRAFT'` and `launchedBy`.

- Launch LiveQuiz (`launchQuiz`):
  - Updates `LiveQuiz.status = 'LIVE'` and `startedAt`, then saves document.
  - No submission changes here.

- Close LiveQuiz (`closeQuiz`):
  - Updates `LiveQuiz.status = 'CLOSED'`, sets `closedAt` and saves.

- Submit Quiz (socket `quiz:submit`):
  - Validates `LiveQuiz` exists and is `LIVE`.
  - Checks for existing `QuizSubmission` (unique index ensures single submission per user per quiz).
  - Inserts `QuizSubmission` document and then runs evaluation (server reads `LiveQuiz` questions).
  - Evaluation updates the `QuizSubmission` with `score`, `maxScore`, `percentage`, `evaluated=true`.

- Fetch Results (`getQuizResults`):
  - Reads `QuizSubmission` documents for the `liveQuizId`, populates `participantId` data, sorts by score desc.

---

## Socket event list (server ↔ client)

- Emitted by server to clients in room `session:{code}`:
  - `quiz:launched` — Payload: `{ quizId, title, questions: [{ _id, type, questionText, options: [{_id, text}], points }], durationSeconds, startedAt }` (no correct answers).
  - `quiz:closed` — Payload: `{ quizId, closedAt }` (notifies clients to show closed UI).
  - `quiz:new:submission` — Payload: `{ quizId, participantId, participantName, submissionId, score, total, percentage, submittedAt }` (host updates leaderboard/realtime counts).

- Client -> server (socket):
  - `join-session` — `{ code, participantId, role }` to join `session:{code}` room.
  - `leave-session` — leave the session room.
  - `quiz:request` — `{ quizId }` to request quiz data (for late joiners). Server responds with `quiz:data` or `quiz:error`.
  - `quiz:submit` — `{ quizId, answers }` where `answers` is `[{ questionId, selectedOptions, answeredAt }]`.

- Server -> submitting client (socket):
  - `quiz:submission:ack` — `{ quizId, submissionId, score, maxScore, percentage }` (acknowledgment + immediate score info).
  - `quiz:submission:error` — `{ error }` if submission invalid.

---

## Where sockets are registered (server)

- `backend/socket.js` creates the `sessionNamespace = io.of("/sessions")` and applies `authenticateSocket` middleware.
- On each socket `connection`, `registerQuizSocket(sessionNamespace, socket)` is called which registers handlers (`quiz:submit`, `quiz:request`).

Important: When controllers emit real-time events (e.g. `launchQuiz`, `closeQuiz`), they use `req.io` which should be set to the `/sessions` namespace instance (server startup wires this in). That ensures HTTP controllers and socket handlers target the same namespace and room naming scheme.

---

## Common debugging tips

- 304 responses in backend logs: these are HTTP caching responses (Not Modified). They are not errors — the client validated a cached copy using `If-None-Match`/`If-Modified-Since`. To disable, set cache headers `Cache-Control: no-store` for API endpoints or disable ETag generation in Express with `app.disable('etag')`.

- Socket auth failures: Verify the client connects with `auth: { token }` to the namespace and the server `authenticateSocket` reads `socket.handshake.auth.token`. Tokens must be valid JWTs signed with `process.env.JWT_SECRET`.

- Option \_id missing in UI: Templates set option `_id` values in `QuizTemplate` and `createLiveQuiz` copies these `_id` into the `LiveQuiz` questions/options. If option `_id` is missing, verify template creation logic and mapping in `createQuizTemplate` & `createLiveQuiz`.

- Duplicate submissions: `QuizSubmission` has a unique index on `{ liveQuizId, participantId }`; handle `E11000` duplicate key errors and surface user-friendly messages.

---

## Suggested next improvements (optional)

- Streamline events payloads: include `participantName`/avatar where possible to reduce repeated DB fetches on the host.
- Add per-question partial saves (so students can persist answers in progress in low-connectivity scenarios).
- Add an admin API to retract or re-evaluate a submission if teacher needs manual adjustments.

---

If you want, I can also:

- Add sequence diagrams (Mermaid) for the flows above.
- Create a developer checklist for testing the complete flow locally.
- Apply small server-side cache-control middleware to ensure API endpoints are never 304-cached.

File created: [docs/QUIZ_FLOW.md](docs/QUIZ_FLOW.md)
