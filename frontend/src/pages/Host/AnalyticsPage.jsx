import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AnalyticsProvider,
  useAnalyticsData,
} from "../../context/AnalyticsContext";
import SessionHeader from "../../components/Analytics/SessionHeader";
import OverviewCards from "../../components/Analytics/OverviewCards";
import ParticipantTimeline from "../../components/Analytics/ParticipantTimeline";
import PollAnalytics from "../../components/Analytics/PollAnalytics";
import QandAInsights from "../../components/Analytics/QandAInsights";
import FeedbackSection from "../../components/Analytics/FeedbackSection";
import AISummary from "../../components/Analytics/AISummary";
import AttendanceTable from "../../components/Analytics/AttendanceTable";
import { exportAnalyticsToPdf } from "../../utils/analyticsPdfExport";
import {
  AlertTriangle,
  Activity,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Users,
} from "lucide-react";

function AnalyticsPageContent() {
  const navigate = useNavigate();
  const { analyticsData, isGenerated, error } = useAnalyticsData();

  const defaultSections = {
    participants: true,
    timeline: true,
    polls: true,
    qna: true,
    attendance: true,
    feedback: true,
    ai: true,
  };

  const includedSections =
    analyticsData?.includedSections || (isGenerated ? {} : defaultSections);

  const hasTimelineData =
    (analyticsData?.participantsTimeline || []).length > 0;
  const hasPollData = (analyticsData?.polls || []).length > 0;
  const hasQnaData = (analyticsData?.questions || []).length > 0;
  const hasAttendanceData = (analyticsData?.participants || []).length > 0;
  const hasFeedbackData =
    (analyticsData?.feedback?.comments || []).length > 0 ||
    (analyticsData?.feedback?.averageRating || 0) > 0;

  const timelineColSpan = includedSections.qna
    ? "lg:col-span-2"
    : "lg:col-span-3";
  const timelineHeight = includedSections.qna ? "h-[420px]" : "min-h-[320px]";
  const pollColSpan = includedSections.qna ? "lg:col-span-2" : "lg:col-span-3";
  const feedbackColSpan = includedSections.ai
    ? "lg:col-span-2"
    : "lg:col-span-3";
  const qnaRowSpan = includedSections.polls ? "lg:row-span-2" : "";
  const qnaHeight = includedSections.polls ? "h-[856px]" : "min-h-[420px]";

  const SectionFallback = ({
    title,
    description,
    icon: Icon,
    className = "",
  }) => (
    <div
      className={`h-full w-full flex items-center justify-center p-6 text-center ${className}`}
    >
      <div className="max-w-xs">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  );

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleExportPdf = () => {
    exportAnalyticsToPdf(analyticsData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Analytics Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner for Mock Data */}
        {!isGenerated && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                  Preview Mode - Mock Data
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  {error ||
                    "Analytics have not been generated for this session yet. The data shown below is for preview purposes only. Generate analytics to see real data."}
                </p>
              </div>
            </div>
          </div>
        )}

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

          {/* Participant Timeline */}
          {includedSections.timeline !== undefined && (
            <div className={timelineColSpan}>
              <div
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 ${timelineHeight}`}
              >
                {includedSections.timeline ? (
                  hasTimelineData ? (
                    <ParticipantTimeline />
                  ) : (
                    <SectionFallback
                      icon={Activity}
                      title="No participant timeline"
                      description="No activity was recorded for this session."
                    />
                  )
                ) : (
                  <SectionFallback
                    icon={Activity}
                    title="Timeline not generated"
                    description="This section was not selected during analytics generation."
                  />
                )}
              </div>
            </div>
          )}

          {/* Q&A Insights */}
          {includedSections.qna !== false && (
            <div className={`lg:col-span-1 ${qnaRowSpan}`}>
              <div
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 ${qnaHeight}`}
              >
                {includedSections.qna ? (
                  hasQnaData ? (
                    <QandAInsights />
                  ) : (
                    <SectionFallback
                      icon={HelpCircle}
                      title="No questions asked"
                      description="There were no Q&A submissions for this session."
                    />
                  )
                ) : (
                  <SectionFallback
                    icon={HelpCircle}
                    title="Q&A not generated"
                    description="This section was not selected during analytics generation."
                  />
                )}
              </div>
            </div>
          )}

          {/* Poll Analytics */}
          {includedSections.polls !== undefined && (
            <div className={pollColSpan}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-[420px]">
                {includedSections.polls ? (
                  hasPollData ? (
                    <PollAnalytics />
                  ) : (
                    <SectionFallback
                      icon={BarChart3}
                      title="No polls taken"
                      description="No polls were created or answered for this session."
                    />
                  )
                ) : (
                  <SectionFallback
                    icon={BarChart3}
                    title="Polls not generated"
                    description="This section was not selected during analytics generation."
                  />
                )}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {includedSections.ai !== undefined && (
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 h-[620px]">
                {includedSections.ai ? (
                  <AISummary />
                ) : (
                  <SectionFallback
                    icon={Activity}
                    className="min-h-[320px]"
                    title="AI summary not generated"
                    description="This section was not selected during analytics generation."
                  />
                )}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {includedSections.feedback !== undefined && (
            <div className={feedbackColSpan}>
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[320px]">
                {includedSections.feedback ? (
                  hasFeedbackData ? (
                    <FeedbackSection />
                  ) : (
                    <SectionFallback
                      icon={MessageSquare}
                      className="min-h-[320px]"
                      title="No feedback yet"
                      description="No ratings or comments were submitted."
                    />
                  )
                ) : (
                  <SectionFallback
                    icon={MessageSquare}
                    className="min-h-[320px]"
                    title="Feedback not generated"
                    description="This section was not selected during analytics generation."
                  />
                )}
              </div>
            </div>
          )}

          {/* Attendance Table */}
          {includedSections.attendance !== undefined && (
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
                {includedSections.attendance ? (
                  hasAttendanceData ? (
                    <AttendanceTable />
                  ) : (
                    <SectionFallback
                      icon={Users}
                      className="min-h-[400px]"
                      title="No attendance recorded"
                      description="No participant attendance data is available."
                    />
                  )
                ) : (
                  <SectionFallback
                    icon={Users}
                    className="min-h-[400px]"
                    title="Attendance not generated"
                    description="This section was not selected during analytics generation."
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Session analytics generated on {new Date().toLocaleDateString()} •
              <button
                onClick={handleExportPdf}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Download Full Report
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <AnalyticsProvider>
      <AnalyticsPageContent />
    </AnalyticsProvider>
  );
}

export default AnalyticsPage;
