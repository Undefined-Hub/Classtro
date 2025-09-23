import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsData } from '../../context/AnalyticsContext';

const ParticipantTimeline = () => {
  const { analyticsData, loading } = useAnalyticsData();

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const { participantsTimeline } = analyticsData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Time: {label}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Active Participants: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
        <div className="mb-3 sm:mb-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Participant Timeline
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Active participants throughout the session
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Active Count</span>
        </div>
      </div>
      
      <div className="h-48 sm:h-56 md:h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={participantsTimeline} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#6B7280"
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={10}
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="activeCount" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
            {Math.max(...participantsTimeline.map(p => p.activeCount))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Peak</div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round(participantsTimeline.reduce((sum, p) => sum + p.activeCount, 0) / participantsTimeline.length)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
        </div>
        <div className="text-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
            {Math.min(...participantsTimeline.map(p => p.activeCount))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Lowest</div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantTimeline;