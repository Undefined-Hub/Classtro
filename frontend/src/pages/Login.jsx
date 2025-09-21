import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext.jsx";
import safeToast from "../utils/toastUtils";

function Login({ onLogin }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const pending = safeToast.loading("Signing in...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: username, password }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error("Error parsing JSON:", jsonErr);
        // If response is not JSON, fallback to text
        data = { message: await res.text() };
      }
      if (res.ok) {
        // Update global auth state
        login(data.user, data.accessToken);
        safeToast.dismiss(pending);
        safeToast.success("Logged in successfully");
        // Navigate by role
        if (data.user?.role === "TEACHER") {
          navigate("/test/dashboard", { replace: true });
        } else if (data.user?.role === "STUDENT") {
          navigate("/participant/home", { replace: true });
        } else {
          navigate("/test/dashboard", { replace: true });
        }
      } else if (res.status === 403 && data.requiresVerification) {
        // ! Handle incomplete registration
        safeToast.dismiss(pending);
        
        if (data.step === 1) {
          // Email verification needed
          safeToast.success("Please verify your email to continue");
          navigate("/verify", {
            replace: true,
            state: {
              step: 1,
              email: username,
              google: false,
              oauth: false,
              emailSent: data.emailSent,
              expiresIn: data.expiresIn
            },
          });
        } else if (data.step === 2) {
          // Role selection needed
          safeToast.success("Please complete your profile");
          navigate("/verify", {
            replace: true,
            state: {
              step: 2,
              email: data.email,
              google: false,
              oauth: false
            },
          });
        }
      } else {
        safeToast.dismiss(pending);
        safeToast.error(
          data.message ||
            "Login failed. Please check your credentials and try again.",
        );
        setError(
          data.message ||
            "Login failed. Please check your credentials and try again.",
        );
      }
    } catch (err) {
      safeToast.dismiss(pending);
      safeToast.error(
        "Network error. Please check your connection and try again.",
      );
      setError(
        err?.message
          ? ` ${err}`
          : "Network error. Please check your connection and try again.",
      );
    }
  };

  const handleGoogleLogin = () => {
    const popup = window.open(
      `${BACKEND_URL}/api/auth/google?prompt=select_account`,
      "google-oauth",
      "width=500,height=600,scrollbars=yes,resizable=yes",
    );

    // Listen for messages from the popup
    const messageListener = (event) => {
      // Only accept messages from our backend origin (the popup)
      try {
        const backendOrigin = new URL(BACKEND_URL).origin;
        if (event.origin !== backendOrigin) return;
      } catch (err) {
        return;
      }

      if (event.data.type === "OAUTH_SUCCESS") {
        const { accessToken, user, isNewUser } = event.data;

        // For existing users with roles, log them in directly
        if (!isNewUser && user.role && user.role !== "UNKNOWN") {
          // Persist auth and update app state via context
          login(user, accessToken);
          // Navigate to dashboard based on role
          if (user.role === "TEACHER") {
            navigate("/test/dashboard", { replace: true });
          } else if (user.role === "STUDENT") {
            navigate("/participant/home", { replace: true });
          }
        } else {
          // For new users or existing users without roles, go to role selection
          // Note: We don't log them in yet - this happens after role selection
          navigate("/verify", {
            replace: true,
            state: {
              step: 2,
              google: true,
              email: user.email,
              oauth: true,
              accessToken, // Pass token to be used after role selection
              user, // Pass user data
            },
          });
        }

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

  // const handleClick = (e) => {
  //     e.preventDefault();
  //     navigate('/dashboard');
  // }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
            <p className="text-blue-100 text-lg">
              Sign in to your Classtro account to continue
            </p>
          </div>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Login to Classtro
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </p>
              {error && (
                <div className="mt-4 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200 shadow-sm">
                  <svg
                    className="w-5 h-5 mr-2 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Enter your email address"
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800"
                  />
                  <label
                    htmlFor="remember"
                    className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    Remember me
                  </label>
                </div>
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-5 py-2.5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Sign In
              </button>
              <div className="text-center">
                <p className="text-sm flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <a
                    className="text-blue-600 hover:cursor-pointer hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    onClick={() => navigate("/register")}
                  >
                    Create one here
                  </a>
                </p>
              </div>
              <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="mx-4 text-gray-400 dark:text-gray-500 text-sm">
                  or
                </span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleGoogleLogin}
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <g>
                    <path
                      fill="#4285F4"
                      d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.64 2.54 30.74 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"
                    />
                    <path
                      fill="#34A853"
                      d="M46.1 24.5c0-1.64-.15-3.22-.42-4.74H24v9.04h12.4c-.54 2.9-2.18 5.36-4.64 7.04l7.18 5.6C43.98 37.1 46.1 31.23 46.1 24.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.67 28.64c-1.13-3.36-1.13-6.96 0-10.32l-7.98-6.2C.86 16.09 0 19.94 0 24c0 4.06.86 7.91 2.69 11.88l7.98-6.2z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 48c6.48 0 11.92-2.14 15.89-5.82l-7.18-5.6c-2.01 1.35-4.6 2.14-8.71 2.14-6.38 0-11.87-3.63-14.33-8.94l-7.98 6.2C6.71 42.52 14.82 48 24 48z"
                    />
                  </g>
                </svg>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  Sign in with Google
                </span>
              </button>
            </form>
          </div>

          {/* Additional Info Section */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                New to Classtro?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join thousands of educators creating interactive and engaging
                classroom experiences.
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Real-time Polls
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Interactive Sessions
                </div>
                <div className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Easy Setup
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
