import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext.jsx";
import PageHeader from "../components/verification/PageHeader.jsx";
import EmailVerificationStep from "../components/verification/EmailVerificationStep.jsx";
import RoleSelectionStep from "../components/verification/RoleSelectionStep.jsx";
import safeToast from "../utils/toastUtils";

export default function VerifyAndRole() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:3000";
  const {
    email,
    google,
    step: initialStep,
    oauth,
    accessToken,
    user,
  } = location.state || {};

  const [step, setStep] = useState(initialStep || 1); // Use passed step or default to 1 for email verification
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [role, setRole] = useState("");
  const [roleError, setRoleError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  // ! Scroll to top on mount and after navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // ! Step 1: Email Verification
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setOtpError("");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        safeToast.success("Email verified successfully");
        setStep(2);
      } else {
        setOtpError(data.message || "Invalid OTP");
        safeToast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Network error");
      safeToast.error("Network error while verifying OTP");
    }
    setLoading(false);
  };

  //! Resend OTP functionality
  const handleResendOTP = async () => {
    setResendLoading(true);
    setResendMessage("");
    setOtpError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendMessage(
          `New OTP sent successfully!${data.expiresIn ? ` (Expires in ${data.expiresIn} minutes)` : ""}`,
        );
        setOtp("");
        safeToast.success(
          `New OTP sent (expires in ${data.expiresIn || "N/A"} mins)`,
        );
      } else {
        setOtpError(data.message || "Failed to resend OTP");
        safeToast.error(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setOtpError("Network error while resending OTP");
      safeToast.error("Network error while resending OTP");
    }
    setResendLoading(false);
  };

  // ! Step 2: Role Selection
  const handleSelectRole = async () => {
    setRoleError("");
    if (!role) {
      setRoleError("Please select a role");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/set-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        if (oauth) {
          // ! For OAuth users, log them in after role selection
          if (accessToken && user) {
            // ! Update user object with the new role
            const updatedUser = { ...user, role };
            // ! Log the user in at frontend
            login(updatedUser, accessToken);
          }

          // ! Navigate to appropriate dashboard
          if (role === "TEACHER") {
            safeToast.success("Role set successfully — redirecting...");
            navigate("/test/dashboard", { replace: true });
          } else if (role === "STUDENT") {
            safeToast.success("Role set successfully — redirecting...");
            navigate("/participant/home", { replace: true });
          }
        } else {
          safeToast.success("Role set successfully — please login");
          // ! For manual registration users, redirect to login
          navigate("/login");
        }
      } else {
        setRoleError(data.message || "Failed to set role");
        safeToast.error(data.message || "Failed to set role");
      }
    } catch (err) {
      setRoleError("Network error");
      safeToast.error("Network error while setting role");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      {/* // ! Header Section */}
      <PageHeader
        title="Account Verification"
        subtitle="Complete your registration to access Classtro"
      />

      {/* // ! Verification/Role Selection Section */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {step === 1 && (
              <EmailVerificationStep
                email={email}
                otp={otp}
                onOtpChange={setOtp}
                onSubmit={handleVerifyEmail}
                onResendOtp={handleResendOTP}
                otpError={otpError}
                resendMessage={resendMessage}
                loading={loading}
                resendLoading={resendLoading}
              />
            )}
            {step === 2 && (
              <RoleSelectionStep
                selectedRole={role}
                onRoleSelect={setRole}
                onSubmit={handleSelectRole}
                roleError={roleError}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
