import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsData } from '../../context/AnalyticsContext';

const PollAnalytics = () => {
  const { analyticsData, loading } = useAnalyticsData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'scroll'

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { polls } = analyticsData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Votes: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const PollCard = ({ poll, index, isInModal = false }) => (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 ${
      isInModal ? 'w-full' : 'flex-shrink-0'
    } ${!isInModal && viewMode === 'scroll' ? 'w-72 sm:w-80' : ''}`}>
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
          Poll {index + 1}: {poll.question}
        </h4>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{poll.totalResponses} responses</span>
          <span>•</span>
          <span>{Math.round((poll.totalResponses / 45) * 100)}% rate</span>
        </div>
      </div>

      <div className={`${isInModal ? 'h-48 sm:h-64' : 'h-32 sm:h-40'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={poll.options} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="text" 
              stroke="#6B7280"
              fontSize={isInModal ? 11 : 9}
              tick={{fontSize: isInModal ? 11 : 9}}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={isInModal ? 11 : 9}
              tick={{fontSize: isInModal ? 11 : 9}}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="votes" 
              fill="#8B5CF6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-3 grid ${poll.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
        {poll.options.map((option, optionIndex) => (
          <div key={optionIndex} className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {option.votes}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {option.text}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {Math.round((option.votes / poll.totalResponses) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PollModal = () => (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            All Poll Results ({polls.length} polls)
          </h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-80px)] hide-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {polls.map((poll, index) => (
              <PollCard key={poll.id} poll={poll} index={index} isInModal={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-4 sm:p-6 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 flex-shrink-0">
          <div className="mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Poll Analytics
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Response distribution for polls conducted
            </p>
          </div>
          
          {polls.length > 2 && (
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('scroll')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    viewMode === 'scroll'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  Scroll
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          {viewMode === 'grid' ? (
            <div className="h-full overflow-y-auto hide-scrollbar">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {polls.slice(0, 2).map((poll, index) => (
                  <PollCard key={poll.id} poll={poll} index={index} />
                ))}
              </div>
              
              {polls.length > 2 && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View {polls.length - 2} more polls
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-x-auto hide-scrollbar">
              <div className="flex space-x-4 pb-4" style={{ width: 'max-content' }}>
                {polls.map((poll, index) => (
                  <PollCard key={poll.id} poll={poll} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && <PollModal />}
    </>
  );
};

export default PollAnalytics;