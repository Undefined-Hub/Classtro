import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SucessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const [countdown, setCountdown] = useState(5);
    
    useEffect(() => {
        // Save token to localStorage if it exists
        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            
            // Optional: Close the popup window if this page is in a popup
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                    { type: "OAUTH_SUCCESS", accessToken },
                    "http://localhost:5173"
                );
            }
        }
        
        // Start countdown
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/test/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [accessToken, navigate]);
    
    const handleContinue = () => {
        navigate('/test/dashboard');
    };
    
    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                <div className="max-w-screen-xl mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
                            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Login Successful!</h1>
                        <p className="text-green-100 text-lg">You have been successfully authenticated</p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-screen-xl mx-auto px-4 py-16">
                <div className="max-w-lg mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Classtro</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                You will be redirected to your dashboard in <span className="text-green-600 dark:text-green-400 font-bold">{countdown}</span> seconds
                            </p>
                            
                            <button
                                onClick={handleContinue}
                                className="w-full inline-flex items-center justify-center px-5 py-3 text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Continue to Dashboard
                            </button>
                        </div>
                        
                        {accessToken && (
                            <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Authentication Details</h3>
                                <div className="overflow-x-auto">
                                    <div className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                                        {accessToken}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    Your access token has been securely stored.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SucessPage;
