import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsData } from '../../context/AnalyticsContext';

const QandAInsights = () => {
  const { analyticsData, loading } = useAnalyticsData();
  const [sortBy, setSortBy] = useState('upvotes'); // 'upvotes', 'time', 'status'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const maxVisibleQuestions = 5; // Show up to 5 questions in the main view

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { questions } = analyticsData;

  // Sort questions
  const sortedQuestions = [...questions].sort((a, b) => {
    if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
    if (sortBy === 'time') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'status') return b.answered - a.answered;
    return 0;
  });

  // Chart data for questions asked vs answered
  const chartData = [
    {
      category: 'Asked',
      count: questions.length,
      fill: '#3B82F6'
    },
    {
      category: 'Answered',
      count: questions.filter(q => q.answered).length,
      fill: '#10B981'
    },
    {
      category: 'Pending',
      count: questions.filter(q => !q.answered).length,
      fill: '#F59E0B'
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const QuestionCard = ({ question, isInModal = false }) => (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${
      isInModal ? 'p-4' : 'p-3'
    } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex-shrink-0`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className={`${isInModal ? 'text-base' : 'text-sm'} font-medium text-gray-900 dark:text-white mb-1`}>
            {question.text}
          </p>
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span>By {question.author}</span>
            <span>•</span>
            <span>{new Date(question.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-3">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-xs text-gray-500 dark:text-gray-400">{question.upvotes}</span>
          </div>
          {question.answered ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              Answered
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
              Pending
            </span>
          )}
        </div>
      </div>
      {question.answered && question.answer && (
        <div className="mt-2 pl-3 border-l-2 border-green-200 dark:border-green-800">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-green-600 dark:text-green-400">Answer:</span> {question.answer}
          </p>
        </div>
      )}
    </div>
  );

  const QuestionsModal = () => (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Q&A ({sortedQuestions.length} questions)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Student questions and answers from the session
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 sm:p-6">
          {/* Sort dropdown in modal */}
          <div className="mb-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="upvotes">Sort by Upvotes</option>
              <option value="time">Sort by Time</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
          
          {/* Questions list in modal */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-4 hide-scrollbar">
            {sortedQuestions.map((question) => (
              <QuestionCard key={question.id} question={question} isInModal={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-6 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Q&A Insights
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Student questions & engagement
            </p>
          </div>
          
          {sortedQuestions.length > maxVisibleQuestions && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All ({sortedQuestions.length})
            </button>
          )}
        </div>
        
        <div className="mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="upvotes">Sort by Upvotes</option>
            <option value="time">Sort by Time</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {/* Compact Chart Section */}
        <div className="mb-4 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Questions Overview
          </h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="category" 
                  stroke="#6B7280"
                  fontSize={10}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {questions.length}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {questions.filter(q => q.answered).length}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Answered</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {Math.round((questions.filter(q => q.answered).length / questions.length) * 100)}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">Rate</div>
          </div>
        </div>

        {/* Questions List with Limited View */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Recent Questions ({Math.min(sortedQuestions.length, maxVisibleQuestions)} of {sortedQuestions.length})
            </h4>
            {sortedQuestions.length > maxVisibleQuestions && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 hide-scrollbar">
            {sortedQuestions.slice(0, maxVisibleQuestions).map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
            
            {sortedQuestions.length > maxVisibleQuestions && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + {sortedQuestions.length - maxVisibleQuestions} more questions
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click to view all questions in detail
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && <QuestionsModal />}
    </>
  );
};

export default QandAInsights;