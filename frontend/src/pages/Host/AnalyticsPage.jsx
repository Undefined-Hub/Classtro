import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsProvider } from '../../context/AnalyticsContext';
import SessionHeader from '../../components/Analytics/SessionHeader';
import OverviewCards from '../../components/Analytics/OverviewCards';
import ParticipantTimeline from '../../components/Analytics/ParticipantTimeline';
import PollAnalytics from '../../components/Analytics/PollAnalytics';
import QandAInsights from '../../components/Analytics/QandAInsights';
import FeedbackSection from '../../components/Analytics/FeedbackSection';
import AISummary from '../../components/Analytics/AISummary';
import AttendanceTable from '../../components/Analytics/AttendanceTable';

function AnalyticsPage() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <AnalyticsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={handleBackToDashboard}
                className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Analytics Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Perfect 3-Column Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Row 1: Session Header - Full Width */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[120px]">
                <SessionHeader />
              </div>
            </div>

            {/* Row 2: Overview Cards - Full Width */}
            <div className="lg:col-span-3">
              <OverviewCards />
            </div>

            {/* Row 3: Main Analytics Row - Different Heights */}
            {/* Participant Timeline - 2 Columns */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[420px]">
                <ParticipantTimeline />
              </div>
            </div>

            {/* Q&A Insights - 1 Column, 2 Rows */}
            <div className="lg:col-span-1 lg:row-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[856px]">
                <QandAInsights />
              </div>
            </div>

            {/* Row 4: Poll Analytics - 2 Columns */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[420px]">
                <PollAnalytics />
              </div>
            </div>

            {/* Row 5: Feedback Section and AI Summary */}
            {/* AI Summary - 1 Column */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 min-h-[320px] ">
                <AISummary />
              </div>
            </div>
            {/* Feedback Section - 2 Columns */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[320px]">
                <FeedbackSection />
              </div>
            </div>

            {/* Row 6: Attendance Table - Full Width */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
                <AttendanceTable />
              </div>
            </div>


          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Session analytics generated on {new Date().toLocaleDateString()} • 
                <button className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
                  Download Full Report
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsProvider>
  );
}

export default AnalyticsPage;
