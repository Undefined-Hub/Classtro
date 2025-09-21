# Frontend Detailed Review

## 1. Overview

This React + Vite frontend implements the SPA for Classtro. It uses React 19, Vite, TailwindCSS for styling, react-hot-toast for notifications, and React Router v7 for navigation. The app is structured around context providers for authentication and session state, lazy-loaded routes for improved performance, and modular components for verification and role selection.

## 2. Key Files & Structure

- `src/main.jsx` - App bootstrap: wraps the app in `BrowserRouter`, `AuthProvider` and `ParticipantSessionProvider`, and mounts the `Toaster` for notifications.
- `src/App.jsx` - Route definitions: lazy-loaded pages (Landing, Login, Register, VerifyAndRole, dashboards), protected routes via `ProtectedRoute` component that uses `useAuth` context.
- `src/context/UserContext.jsx` - Handles login/logout, persists `accessToken` and `user` in `localStorage`. Exposes `login`, `logout`, and `isAuthenticated`.
- `src/pages/Login.jsx` - Handles local and Google OAuth login. Uses a popup bridge for OAuth (`window.open` + postMessage). Handles 403 responses to redirect incomplete registrations to `/verify`.
- `src/pages/Register.jsx` - Handles user registration, posts to `/api/auth/register`, then redirects to `/verify` with verification state.
- `src/pages/VerifyAndRole.jsx` - Multi-step page: email OTP verification (step 1) and role selection (step 2). Works for both local registration and OAuth flows.
- `src/components/verification/*` - Reusable UI components for verification flow: OTP input, role cards, header.
- `src/utils/toastUtils.js` - Safe wrapper around `react-hot-toast` (used as `safeToast`) to display consistent messages without crashing.

## 3. Authentication & Routing Flow

- Registration: POST `/api/auth/register` → server creates user with `role: "UNKNOWN"` and `emailVerified: false`, sends OTP → frontend navigates to `/verify`.
- Verification: `/verify` uses `EmailVerificationStep` to verify OTP via `/api/auth/verify-email`. On success, `emailVerified` is set and user proceeds to role selection.
- Role Selection: POST `/api/auth/set-role` updates user's role. For OAuth users the frontend will log the user in (using the OAuth access token passed via popup) and redirect to the appropriate dashboard.
- Login: POST `/api/auth/login` for local login — now the backend returns 403 with `requiresVerification` if the account lacks verification or role. The frontend catches this and navigates users to `/verify` with proper state.
- OAuth: `/api/auth/google` opens Google consent/prompt. Callback posts a small HTML bridge to the opener window containing `accessToken`, `user` and `isNewUser`.

## 4. Strengths

- Clean separation of concerns: auth context handles auth state, pages are lazy-loaded, and verification flows are componentized.
- Good UX patterns: informative toasts, progress during async operations, redirection flow based on state.
- Reusable verification components make the multi-step flow consistent.
- Popup-based OAuth flow prevents full-page redirects and provides a smooth SPA UX.

## 5. Issues & Recommendations

- Token Storage: Access token is stored in `localStorage` which is vulnerable to XSS; consider using in-memory storage and refresh via HTTP-only cookies where possible.
- Popup security: The popup posts messages using `window.opener.postMessage`. The backend bridge uses `targetOrigin` but frontend already checks origin; ensure production `FRONTEND_ORIGIN` is set correctly.
- Error handling: Some fetch calls assume body is JSON. Use guarded parsing to avoid crashes when server returns non-JSON.
- Accessibility: Inputs should have aria attributes and focus management for OTP inputs.

## 6. Minor Fixes Completed

- Frontend now handles 403 `requiresVerification` responses and redirects to `/verify` with appropriate state.
- Login and Register pages were updated to include `prompt=select_account` for Google popup to force account chooser when requested.

## 7. Suggested Next Steps

1. Keep access tokens out of localStorage if possible. Use refresh tokens in HTTP-only cookies + short-lived access tokens in memory.
2. Harmonize role enums between frontend and backend (TEACHER/STUDENT vs Employee/Manager).
3. Add a small migration script to set `emailVerified` for existing users if needed.
4. Add unit/integration tests for auth flows.
5. Harden rate-limiting on OTP endpoints to prevent abuse.

## 8. How to run locally (quick)

From repo root:

```powershell
# Start backend
cd backend
npm install
npm run start

# Start frontend
cd ../frontend
npm install
npm run dev
```

---

Created by automated workspace review.
