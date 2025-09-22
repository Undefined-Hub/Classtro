import { useState, lazy, Suspense } from "react";
import { HostSessionProvider } from "./context/HostSessionContext.jsx";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/UserContext.jsx";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const DashboardPage = lazy(() => import("./pages/Host/DashboardPage.jsx"));
const SessionWorkspace = lazy(
  () => import("./pages/Host/SessionWorkspace.jsx"),
);
const ParticipantHome = lazy(
  () => import("./pages/Participant/ParticipantHome"),
);
const ParticipantSession = lazy(
  () => import("./pages/Participant/ParticipantSession"),
);
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Register = lazy(() => import("./pages/Register"));
const VerifyAndRole = lazy(() => import("./pages/VerifyAndRole"));

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";
// console.log("Backend Base URL:", BACKEND_BASE_URL);

function App() {
  const navigate = useNavigate();
  const { user, logout, login } = useAuth();

  const handleLogin = (userObj) => {
    // For components still passing onLogin prop; delegate to context
    login(userObj, localStorage.getItem("accessToken"));
    if (userObj.role === "TEACHER") {
      navigate("/test/dashboard");
    } else if (userObj.role === "STUDENT") {
      navigate("/participant/home");
    } else {
      navigate("/test/dashboard");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/test/login");
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyAndRole />} />
        {/* Protected routes group */}
        <Route element={<ProtectedRoute roles={["TEACHER"]} />}>
          <Route path="/test/dashboard" element={<DashboardPage />} />
          <Route
            path="/test/sessionWorkspace"
            element={
              <HostSessionProvider>
                <SessionWorkspace />
              </HostSessionProvider>
            }
          />
        </Route>
        <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
          <Route path="/participant/home" element={<ParticipantHome />} />
          <Route path="/participant/session" element={<ParticipantSession />} />
        </Route>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
