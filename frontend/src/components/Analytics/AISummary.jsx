import React from 'react';
import { useAnalyticsData } from '../../context/AnalyticsContext';

const AISummary = () => {
  const { analyticsData, loading } = useAnalyticsData();

  if (loading) {
    return (
      <div className="p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const { sessionInfo, questions, polls } = analyticsData;

  // Generate dynamic AI summary based on actual data
  const generateAISummary = () => {
    const duration = Math.round((new Date(sessionInfo.endAt) - new Date(sessionInfo.startAt)) / (1000 * 60));
    const answeredQuestions = questions.filter(q => q.answered).length;
    const responseRate = Math.round((answeredQuestions / questions.length) * 100);
    const mostUpvotedQuestion = questions.reduce((max, q) => q.upvotes > max.upvotes ? q : max, questions[0]);
    const avgPollResponses = Math.round(polls.reduce((sum, p) => sum + p.totalResponses, 0) / polls.length);

    return {
      overview: `This ${duration}-minute session on "${sessionInfo.title}" successfully engaged ${sessionInfo.totalParticipants} students with peak attendance of ${sessionInfo.peakParticipants} participants.`,
      engagement: `High student engagement was observed with ${questions.length} questions asked and ${answeredQuestions} answered (${responseRate}% response rate). The most popular question "${mostUpvotedQuestion?.text?.substring(0, 50)}..." received ${mostUpvotedQuestion?.upvotes} upvotes.`,
      interaction: `Interactive elements performed well with ${polls.length} polls conducted, averaging ${avgPollResponses} responses per poll. Students showed strong participation throughout the session.`,
      recommendations: [
        duration > 45 ? "Consider breaking longer sessions into smaller segments for better retention" : "Session duration was optimal for student attention span",
        responseRate < 70 ? "Encourage more Q&A interaction to improve response rates" : "Excellent Q&A engagement - maintain current interactive approach",
        polls.length < 3 ? "Consider adding more polls to increase interactivity" : "Good use of polls for engagement",
        "Follow up on unanswered questions in next session or via email"
      ]
    };
  };

  const aiSummary = generateAISummary();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            AI Insights
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            AI-powered session analysis
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
            Beta
          </span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        {/* Overview */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </h4>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
            {aiSummary.overview}
          </p>
        </div>

        {/* Engagement Analysis */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Engagement Analysis
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {aiSummary.engagement}
          </p>
        </div>

        {/* Interaction Patterns */}
        <div>
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Interaction Patterns
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {aiSummary.interaction}
          </p>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Recommendations for Next Session
          </h4>
          <ul className="space-y-2">
            {aiSummary.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <svg className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      {/* <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          AI insights are generated based on session data and engagement patterns. Results may vary and should be used as guidance alongside your teaching expertise.
        </p>
      </div> */}
    </div>
  );
};

export default AISummary;