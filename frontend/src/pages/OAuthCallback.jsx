import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/UserContext.jsx";
import safeToast from "../utils/toastUtils";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = () => {
      // Get OAuth result from URL parameters
      const success = searchParams.get("success");
      const error = searchParams.get("error");
      const accessToken = searchParams.get("accessToken");
      const userData = searchParams.get("user");
      const isNewUser = searchParams.get("isNewUser") === "true";

      // Get the return destination from localStorage
      const returnTo = localStorage.getItem("oauth_return_to");
      const timestamp = localStorage.getItem("oauth_timestamp");

      // Clean up localStorage
      localStorage.removeItem("oauth_return_to");
      localStorage.removeItem("oauth_timestamp");

      // Check if OAuth session is valid (within 10 minutes)
      if (timestamp && Date.now() - parseInt(timestamp) > 10 * 60 * 1000) {
        safeToast.error("OAuth session expired. Please try again.");
        navigate("/login", { replace: true });
        return;
      }

      if (error) {
        safeToast.error(decodeURIComponent(error));
        // Navigate back to the original page
        if (returnTo === "register") {
          navigate("/register", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
        return;
      }

      if (success === "true" && accessToken && userData) {
        try {
          const user = JSON.parse(decodeURIComponent(userData));

          // For existing users with roles, log them in directly
          if (!isNewUser && user.role && user.role !== "UNKNOWN") {
            login(user, accessToken);

            // Navigate to dashboard based on role
            if (user.role === "TEACHER") {
              safeToast.success("Welcome back!");
              navigate("/dashboard", { replace: true });
            } else if (user.role === "STUDENT") {
              safeToast.success("Welcome back!");
              navigate("/participant/home", { replace: true });
            }
          } else {
            // For new users or existing users without roles, go to role selection
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
        } catch (parseError) {
          console.error("Failed to parse user data:", parseError);
          safeToast.error("Authentication failed. Please try again.");
          navigate("/login", { replace: true });
        }
      } else {
        safeToast.error("Authentication failed. Please try again.");
        navigate("/login", { replace: true });
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Processing Authentication
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we complete your sign-in...
          </p>
        </div>
      </div>
    </div>
  );
}
