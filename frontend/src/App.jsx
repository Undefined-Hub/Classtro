import { useState, lazy, Suspense } from "react";
import { HostSessionProvider } from "./context/HostSessionContext.jsx";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/UserContext.jsx";
import FloatingBugButton from "./components/FloatingBugButton.jsx";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const DashboardPage = lazy(() => import("./pages/Host/DashboardPage.jsx"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout.jsx"));
const RoomsPage = lazy(() => import("./pages/Host/RoomsPage.jsx"));
const SessionsPage = lazy(() => import("./pages/Host/SessionsPage.jsx"));
const RoomDetailPage = lazy(() => import("./pages/Host/RoomDetailPage.jsx"));
const SessionWorkspace = lazy(
  () => import("./pages/Host/SessionWorkspace.jsx"),
);
const ParticipantHome = lazy(
  () => import("./pages/Participant/ParticipantHome"),
);
const ParticipantSession = lazy(
  () => import("./pages/Participant/ParticipantSession"),
);
const ParticipantJoin = lazy(
  () => import("./pages/Participant/ParticipantJoin"),
);
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Register = lazy(() => import("./pages/Register"));
const VerifyAndRole = lazy(() => import("./pages/VerifyAndRole"));
const AnalyticsPage = lazy(() => import("./pages/Host/AnalyticsPage.jsx"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback.jsx"));
const HostProfilePage = lazy(() => import("./pages/Host/HostProfilePage.jsx"));
const ParticipantProfilePage = lazy(() => import("./pages/Participant/ParticipantProfilePage.jsx"));

// Profile redirect component
const ProfileRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === "TEACHER") {
    return <Navigate to="/teacher/profile" replace />;
  } else if (user?.role === "STUDENT") {
    return <Navigate to="/participant/profile" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";
//

function App() {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();

  const handleLogin = (userObj) => {
    // For components still passing onLogin prop; delegate to context
    login(userObj, localStorage.getItem("accessToken"));
    if (userObj.role === "TEACHER") {
      navigate("/dashboard/rooms");
    } else if (userObj.role === "STUDENT") {
      navigate("/participant/home");
    } else {
      navigate("/dashboard/rooms");
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyAndRole />} />
        <Route
          path="/auth/callback"
          element={<OAuthCallback onLogin={handleLogin} />}
        />
        {/* Universal Profile Route - redirects based on role */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute />
          }
        >
          <Route index element={<ProfileRedirect />} />
        </Route>

        {/* Protected routes group */}
        <Route element={<ProtectedRoute roles={["TEACHER"]} />}>
          {/* Redirect /dashboard to /dashboard/rooms */}
          <Route
            path="/dashboard"
            element={<Navigate to="/dashboard/rooms" replace />}
          />

          {/* Dashboard with nested routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/:roomId" element={<RoomDetailPage />} />
            <Route path="sessions" element={<SessionsPage />} />
          </Route>

          <Route path="/test/sessionWorkspace" element={<SessionWorkspace />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/teacher/profile" element={<HostProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
          <Route path="/participant/home" element={<ParticipantHome />} />
          <Route path="/participant/session" element={<ParticipantSession />} />
          <Route path="/participant/profile" element={<ParticipantProfilePage />} />
        </Route>
        
        {/* QR Join Route - Public but requires login */}
        <Route path="/participant/join" element={<ParticipantJoin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Floating Bug Report Button - appears on all pages */}
      <FloatingBugButton />
    </>
  );
}

export default App;
