import React, { useState, useEffect } from "react";

const OTPInput = ({ value, onChange, onComplete, disabled = false, error = false }) => {
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);

    // Initialize digits from value prop
    useEffect(() => {
        if (value && value.length <= 6) {
            const newDigits = value.split("").concat(Array(6).fill("")).slice(0, 6);
            setDigits(newDigits);
        } else if (!value) {
            setDigits(["", "", "", "", "", ""]);
        }
    }, [value]);

    // Update parent when digits change
    useEffect(() => {
        const otpValue = digits.join("");
        onChange(otpValue);
        
        // Call onComplete when all 6 digits are filled
        if (otpValue.length === 6 && onComplete) {
            onComplete(otpValue);
        }
    }, [digits, onChange, onComplete]);

    const handleDigitChange = (index, digitValue) => {
        // Only allow single digits
        if (digitValue.length > 1) return;
        
        // Only allow numbers
        if (digitValue && !/^\d$/.test(digitValue)) return;
        
        const newDigits = [...digits];
        newDigits[index] = digitValue;
        setDigits(newDigits);
        
        // Auto-focus next input
        if (digitValue && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
        
        // Handle arrow keys
        if (e.key === "ArrowLeft" && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
        
        if (e.key === "ArrowRight" && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newDigits = [...digits];
        
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pastedData[i] || "";
        }
        
        setDigits(newDigits);
        
        // Focus the next empty input or the last input
        const nextIndex = Math.min(pastedData.length, 5);
        const nextInput = document.getElementById(`otp-${nextIndex}`);
        nextInput?.focus();
    };

    const getInputClassName = (hasError) => {
        const baseClasses = "w-12 h-12 text-center text-lg font-bold border-2 rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
        
        if (hasError) {
            return `${baseClasses} border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500`;
        }
        
        return `${baseClasses} border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 dark:hover:border-blue-500`;
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                Enter 6-Digit OTP
            </label>
            <div className="flex justify-center gap-3 mb-6">
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className={getInputClassName(error)}
                        autoComplete="off"
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default OTPInput;