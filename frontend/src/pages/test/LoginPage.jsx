
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const navigate = useNavigate();

  // const handleGoogleLogin = () => {
  //   window.location.href = "http://localhost:3000/api/auth/google";
  // };

  const handleGoogleLogin = () => {
    const popup = window.open(
      "http://localhost:3000/api/auth/google",
      "google-oauth",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    // Listen for messages from the popup
    const messageListener = (event) => {
      // Only accept messages from our backend origin (the popup)
      if (event.origin !== "http://localhost:3000") return;

      if (event.data.type === "OAUTH_SUCCESS") {
        const { accessToken, user } = event.data;
        // Persist auth and update app state
        localStorage.setItem("accessToken", accessToken);
        onLogin(user);
        // Navigate the main window to the desired page
        // (previously backend redirected popup to /test/success)
        navigate("/test/success", { replace: true, state: { accessToken, user } });
        // Cleanup popup and listener
        popup.close();
        window.removeEventListener("message", messageListener);
      } else if (event.data.type === "OAUTH_ERROR") {
        setError("OAuth login failed");
        popup.close();
        window.removeEventListener("message", messageListener);
      }
    };

    window.addEventListener("message", messageListener);

    // Handle popup being closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        window.removeEventListener("message", messageListener);
        clearInterval(checkClosed);
      }
    }, 1000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <input
          className="w-full mb-4 px-3 py-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full mb-6 px-3 py-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          type="submit"
        >
          Login
        </button>
        <div className="my-4 text-center text-gray-500">or</div>
        <button
          type="button"
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 flex items-center justify-center"
          onClick={handleGoogleLogin}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.64 2.54 30.74 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z" /><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.4c-.54 2.9-2.18 5.36-4.64 7.04l7.18 5.6C43.98 37.1 46.1 31.23 46.1 24.5z" /><path fill="#FBBC05" d="M10.67 28.64c-1.13-3.36-1.13-6.96 0-10.32l-7.98-6.2C.86 16.09 0 19.94 0 24c0 4.06.86 7.91 2.69 11.88l7.98-6.2z" /><path fill="#EA4335" d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.18-5.6c-2.01 1.35-4.6 2.14-8.71 2.14-6.38 0-11.87-3.63-14.33-8.94l-7.98 6.2C6.71 42.52 14.82 48 24 48z" /></g></svg>
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
