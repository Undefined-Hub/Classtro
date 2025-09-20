import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6 py-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H5a3 3 0 00-3 3v6a3 3 0 003 3h7a3 3 0 003-3zm0 0V7a3 3 0 013-3h4a3 3 0 013 3v6a3 3 0 01-3 3h-7a3 3 0 01-3-3z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">403</h1>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Unauthorized Access</h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You don't have permission to access this page. Please check your credentials or contact an administrator.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
     
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 transition-colors"
          >
            Go to Home
          </button>
     
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;