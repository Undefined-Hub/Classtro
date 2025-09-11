import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Landing from './pages/Landing'
import Login from './pages/Login'
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
// import Dashboard from './pages/Dashboard'
// import JoinSession from './pages/JoinSession'
import LoginPage from './pages/test/LoginPage'
import RegisterPage from "./pages/test/RegisterPage";
import SuccessPage from "./pages/test/SucessPage";
import FailurePage from "./pages/test/FailurePage";
import DashboardPage from "./pages/test/DashboardPage";
import SessionWorkspace from './pages/test/SessionWorkspace'

function ProfilePage({ user, onLogout }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name || user?.username}!</h2>
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
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (userObj) => {
    setUser(userObj);
    navigate("/test/profile");
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/test/login");
  };
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onLogin={handleLogin}/>} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/join" element={<JoinSession />} /> */}
        <Route path="/test/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/test/register" element={<RegisterPage onRegister={() => navigate("/test/login")} />} />
        <Route path="/test/profile" element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/test/login" />} />
        <Route path="/test/success" element={<SuccessPage />} />
        <Route path="/test/failure" element={<FailurePage />} />
        <Route path="/test/dashboard" element={<DashboardPage />} />
        <Route path="/test/sessionWorkspace" element={<SessionWorkspace />} />
        {/* Add more routes here as needed */}
      </Routes>
    </>
  )
}

export default App
