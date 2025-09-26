import React, { useState } from 'react';
import { useAnalyticsData } from '../../context/AnalyticsContext';

const FeedbackSection = () => {
  const { analyticsData, loading } = useAnalyticsData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const maxVisibleComments = 5; // Show up to 5 comments in the main view

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { feedback } = analyticsData;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => {
      const filled = index < Math.floor(rating);
      const partial = index === Math.floor(rating) && rating % 1 !== 0;
      
      return (
        <svg
          key={index}
          className={`w-6 h-6 ${
            filled ? 'text-yellow-400' : partial ? 'text-yellow-200' : 'text-gray-300 dark:text-gray-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    });
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'negative':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      default:
        return '😐';
    }
  };

  const CommentCard = ({ comment, index, isInModal = false }) => (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg ${
      isInModal ? 'p-4' : 'p-4'
    } bg-gray-50 dark:bg-gray-700/50`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <p className={`${isInModal ? 'text-base' : 'text-sm'} text-gray-700 dark:text-gray-300`}>
            "{comment}"
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Anonymous Student #{index + 1}
          </p>
        </div>
      </div>
    </div>
  );

  const CommentsModal = () => (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              All Student Comments ({feedback.comments.length} comments)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete feedback from students about the session
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
        
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] hide-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {feedback.comments.map((comment, index) => (
              <CommentCard key={index} comment={comment} index={index} isInModal={true} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <div className="p-6 h-full flex flex-col">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Session Feedback
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Student ratings and comments (coming soon - demo data)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          {/* Rating and Sentiment */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                Overall Rating
              </h4>
              <div className="flex items-center space-x-3">
                <div className="flex">{renderStars(feedback.averageRating)}</div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {feedback.averageRating}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ 5.0</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Based on {feedback.comments.length} responses
              </p>
            </div>

            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                Sentiment Analysis
              </h4>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getSentimentColor(feedback.sentiment)}`}>
                <span className="mr-2 text-lg">{getSentimentIcon(feedback.sentiment)}</span>
                Overall {feedback.sentiment} feedback
              </div>
            </div>

            {/* Future placeholder for word cloud */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Word Cloud
              </h5>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Coming soon - visual representation of common feedback themes
              </p>
            </div>
          </div>

          {/* Comments - Spans 2 columns */}
          <div className="md:col-span-2 ">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                Recent Comments ({Math.min(feedback.comments.length, maxVisibleComments)} of {feedback.comments.length})
              </h4>
              {feedback.comments.length > maxVisibleComments && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-100 overflow-y-auto hide-scrollbar">
              {feedback.comments.slice(0, maxVisibleComments).map((comment, index) => (
                <CommentCard key={index} comment={comment} index={index} />
              ))}
              
              {feedback.comments.length > maxVisibleComments && (
                <div className="lg:col-span-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + {feedback.comments.length - maxVisibleComments} more comments
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Click to view all student feedback
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {Math.round((feedback.comments.filter(c => c.includes('Great') || c.includes('Excellent')).length / feedback.comments.length) * 100)}%
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Positive</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {feedback.averageRating}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Avg Rating</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {feedback.comments.length}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Comments</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                85%
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Response Rate</div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && <CommentsModal />}
    </>
  );
};

export default FeedbackSection;