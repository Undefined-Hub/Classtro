import React from "react";
import OTPInput from "./OTPInput";
import AlertMessage from "./AlertMessage";

const EmailVerificationStep = ({
  email,
  otp,
  onOtpChange,
  onSubmit,
  onResendOtp,
  otpError,
  resendMessage,
  loading,
  resendLoading,
  resendCooldown = 0,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
          Verify Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          An OTP has been sent to <span className="font-semibold">{email}</span>
        </p>

        <AlertMessage type="error" message={otpError} />
        <AlertMessage type="success" message={resendMessage} />
      </div>

      <OTPInput
        value={otp}
        onChange={onOtpChange}
        error={!!otpError}
        disabled={loading}
      />

      <button
        className="w-full inline-flex items-center justify-center px-5 py-3 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={loading || otp.length !== 6}
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
            d="M5 13l4 4L19 7"
          />
        </svg>
        {loading ? "Verifying..." : "Verify"}
      </button>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Didn't receive the code?
        </p>
        <button
          type="button"
          onClick={onResendOtp}
          disabled={resendLoading || resendCooldown > 0}
          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resendLoading
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend OTP"}
        </button>
      </div>
    </form>
  );
};

export default EmailVerificationStep;
