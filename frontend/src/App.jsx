import { useState, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/UserContext.jsx";
// import Dashboard from './pages/Dashboard'
// import JoinSession from './pages/JoinSession'
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const LoginPage = lazy(() => import("./pages/test/LoginPage"));
const RegisterPage = lazy(() => import("./pages/test/RegisterPage"));
const SuccessPage = lazy(() => import("./pages/test/SucessPage"));
const FailurePage = lazy(() => import("./pages/test/FailurePage"));
const DashboardPage = lazy(() => import("./pages/test/DashboardPage"));
const SessionWorkspace = lazy(() => import("./pages/test/SessionWorkspace"));
const ParticipantHome = lazy(() =>
  import("./pages/Participant/ParticipantHome")
);
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:2000";
console.log("Backend Base URL:", BACKEND_BASE_URL);
function ProfilePage({ onLogout }) {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">
        Welcome, {user?.name || user?.username}!
      </h2>
      <button
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  );
}

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
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/join" element={<JoinSession />} /> */}
        <Route
          path="/test/login"
          element={<LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/test/register"
          element={<RegisterPage onRegister={() => navigate("/test/login")} />}
        />
        {/* Protected routes group */}
        <Route element={<ProtectedRoute roles={["TEACHER"]} />}>
          <Route
            path="/test/profile"
            element={<ProfilePage onLogout={handleLogout} />}
          />
          <Route path="/test/dashboard" element={<DashboardPage />} />
          <Route path="/test/sessionWorkspace" element={<SessionWorkspace />} />
        </Route>

        <Route element={<ProtectedRoute roles={["STUDENT"]} />}>
          <Route path="/participant/home" element={<ParticipantHome />} />
        </Route>
        
        <Route path="/test/success" element={<SuccessPage />} />
        <Route path="/test/failure" element={<FailurePage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
        {/* Add more routes here as needed */}
      </Routes>
    </>
  );
}

export default App;
