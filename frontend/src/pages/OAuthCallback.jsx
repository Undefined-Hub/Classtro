import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/UserContext.jsx";
import safeToast from "../utils/toastUtils";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return;

    const handleOAuthCallback = () => {
      hasProcessed.current = true;

      // Get OAuth result from URL parameters
      const success = searchParams.get("success");
      const error = searchParams.get("error");
      const accessToken = searchParams.get("accessToken");
      const userData = searchParams.get("user");
      const isNewUser = searchParams.get("isNewUser") === "true";

      // Get the return destination from localStorage
      const returnTo = localStorage.getItem("oauth_return_to");
      const redirectTo = localStorage.getItem("oauth_redirect_to");
      const timestamp = localStorage.getItem("oauth_timestamp");

      // Clean up localStorage
      localStorage.removeItem("oauth_return_to");
      localStorage.removeItem("oauth_redirect_to");
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

            // Small delay to ensure state is updated before navigation
            setTimeout(() => {
              safeToast.success("Welcome back!");

              // Check for redirect parameter first
              if (redirectTo) {
                navigate(redirectTo, { replace: true });
              } else {
                // Navigate to dashboard based on role
                if (user.role === "TEACHER") {
                  navigate("/dashboard", { replace: true });
                } else if (user.role === "STUDENT") {
                  navigate("/participant/home", { replace: true });
                }
              }
            }, 100);
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
  }, []); // Empty dependency array to prevent re-execution

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-100 mb-2">
          Completing Authentication...
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please wait while we log you in securely.
        </p>
      </div>
    </div>
  );
}
