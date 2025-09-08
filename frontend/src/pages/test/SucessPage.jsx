import React from 'react';
import { useLocation } from 'react-router-dom';

const SucessPage = () => {
        const location = useLocation();
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('accessToken');

        return (
                <div className="flex items-center justify-center min-h-screen bg-green-100">
                        <div className="bg-white p-8 rounded shadow-md text-center">
                                <h2 className="text-3xl font-bold mb-4 text-green-600">Success!</h2>
                                <p className="text-lg text-gray-700">You have successfully logged in with Google OAuth.</p>
                                {accessToken && (
                                    <div className="mt-4">
                                        <span className="font-mono text-xs break-all">Access Token: {accessToken}</span>
                                    </div>
                                )}
                        </div>
                </div>
        );
}

export default SucessPage;
