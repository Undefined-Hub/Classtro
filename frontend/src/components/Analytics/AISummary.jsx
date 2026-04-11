import React, { useMemo, useState } from "react";
import { useAnalyticsData } from "../../context/AnalyticsContext";

const AISummary = () => {
  const { analyticsData, loading } = useAnalyticsData();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const sessionInfo = analyticsData?.sessionInfo || {};
  const questions = analyticsData?.questions || [];
  const polls = analyticsData?.polls || [];
  const aiData = analyticsData?.ai || analyticsData?.sections?.ai || null;

  const safeArray = (value) =>
    Array.isArray(value)
      ? value
          .map((item) => (typeof item === "string" ? item.trim() : item))
          .filter((item) =>
            typeof item === "string" ? item.length > 0 : !!item,
          )
      : [];

  const buildFallbackInsights = () => {
    const duration =
      sessionInfo.startAt && sessionInfo.endAt
        ? Math.max(
            1,
            Math.round(
              (new Date(sessionInfo.endAt) - new Date(sessionInfo.startAt)) /
                (1000 * 60),
            ),
          )
        : 0;
    const answeredQuestions = questions.filter((q) => q.answered).length;
    const responseRate = questions.length
      ? Math.round((answeredQuestions / questions.length) * 100)
      : 0;
    const mostUpvotedQuestion = questions.reduce(
      (max, q) => ((q.upvotes || 0) > (max.upvotes || 0) ? q : max),
      questions[0] || { text: "", upvotes: 0 },
    );
    const avgPollResponses = polls.length
      ? Math.round(
          polls.reduce((sum, p) => sum + (p.totalResponses || 0), 0) /
            polls.length,
        )
      : 0;
    const overallScore = Math.max(
      1,
      Math.min(
        100,
        Math.round(
          (sessionInfo.peakParticipants || 0) * 1.3 +
            responseRate * 0.35 +
            avgPollResponses * 0.3 +
            (sessionInfo.totalParticipants || 0) * 0.15,
        ),
      ),
    );

    return {
      source: "fallback",
      model: "heuristic-preview",
      generatedAt: new Date().toISOString(),
      overallScore,
      scoreMeta: {
        showScore: true,
        isReliable: true,
        reason: "frontend-fallback",
        message: "Fallback score generated from visible activity signals.",
        availableSignals: 5,
        totalSignals: 5,
        coveragePercent: 100,
      },
      executiveSummary: `This ${duration}-minute session on "${sessionInfo.title || "Session"}" reached ${sessionInfo.peakParticipants || 0} peak participants and delivered enough interaction to extract coaching signals.`,
      overview: `The session brought together ${sessionInfo.totalParticipants || 0} participants with a peak of ${sessionInfo.peakParticipants || 0}.`,
      engagementAnalysis: `${questions.length} questions were asked, ${answeredQuestions} were answered, and the response rate landed at ${responseRate}%. ${mostUpvotedQuestion?.text ? `The most active question was "${String(mostUpvotedQuestion.text).slice(0, 80)}".` : ""}`,
      interactionPatterns: `${polls.length} polls were conducted with an average of ${avgPollResponses} responses per poll. Interaction likely peaked around the mid-session checkpoints where participation was highest.`,
      strengths: [
        (sessionInfo.peakParticipants || 0) > 0
          ? "The session created a live participation peak, which is a good sign that the content reached the room at some point."
          : "Analytics captured enough data to evaluate the session flow.",
        responseRate >= 70
          ? "Q&A response was reasonably strong, suggesting that the audience was willing to ask and receive answers."
          : "The audience was active enough to surface questions, but the response loop needs to be tighter.",
        polls.length >= 2
          ? "Polls were used as interactive checkpoints rather than as a one-off activity."
          : "The session included at least one structured interaction mechanism.",
      ],
      risks: [
        responseRate < 70
          ? "Some questions may have been left unresolved, which can reduce perceived value after the session ends."
          : "Question flow was healthy, but it still needs consistency across longer sessions.",
        (sessionInfo.totalParticipants || 0) >
        (sessionInfo.peakParticipants || 0)
          ? "Not every attendee appears to have been engaged at the same intensity, so there may be room to improve pacing or interaction timing."
          : "Peak engagement was good, but the challenge is sustaining it through the full session arc.",
        polls.length < 3
          ? "The session may not have used enough interaction checkpoints to reset attention regularly."
          : "Poll volume was acceptable, but the discussion after each poll can still be stronger.",
      ],
      recommendations: [
        responseRate < 70
          ? "Insert a dedicated question pause before the final segment so unresolved doubts are not carried out of the session."
          : "Keep the current Q&A cadence, but surface one or two high-value questions earlier to model active participation.",
        polls.length < 3
          ? "Add at least one early pulse poll and one closing reflection poll to create clearer engagement anchors."
          : "Use each poll result as a brief discussion trigger instead of moving on immediately.",
        "Break long explanations into shorter teaching blocks with short recap prompts to reduce silent drop-off.",
        "Follow up after the session with a concise recap, the top unanswered question, and one recommended next step.",
      ],
      priorityActions: [
        {
          label: "Close unanswered questions",
          priority: responseRate < 70 ? "high" : "medium",
          why: `${questions.length - answeredQuestions} of ${questions.length} questions were not answered during the session.`,
        },
        {
          label: "Add more interaction checkpoints",
          priority: polls.length < 3 ? "high" : "medium",
          why: `Only ${polls.length} polls were used, so the session may benefit from more frequent participation resets.`,
        },
        {
          label: "Revisit pacing near drop-off points",
          priority: "medium",
          why: "The engagement curve should be reviewed to identify where attention starts to soften and where a recap or poll should be inserted.",
        },
      ],
      scoreBreakdown: {
        overall: overallScore,
        engagement: Math.max(
          1,
          Math.min(
            100,
            Math.round(
              responseRate * 0.7 + (sessionInfo.totalParticipants || 0) * 0.8,
            ),
          ),
        ),
        participation: Math.max(
          1,
          Math.min(100, Math.round((sessionInfo.peakParticipants || 0) * 2)),
        ),
        clarity: Math.max(
          1,
          Math.min(
            100,
            Math.round(
              questions.length
                ? (answeredQuestions / questions.length) * 100
                : 0,
            ),
          ),
        ),
      },
    };
  };

  const aiSummary = aiData
    ? {
        source: aiData.source || "ai",
        generatedAt: aiData.generatedAt,
        overallScore: aiData.overallScore,
        executiveSummary: aiData.executiveSummary || aiData.overview || "",
        overview: aiData.overview || "",
        engagementAnalysis: aiData.engagementAnalysis || "",
        interactionPatterns: aiData.interactionPatterns || "",
        strengths: safeArray(aiData.strengths),
        risks: safeArray(aiData.risks),
        recommendations: safeArray(aiData.recommendations),
        priorityActions: safeArray(aiData.priorityActions),
        scoreBreakdown: aiData.scoreBreakdown || {},
        scoreMeta: aiData.scoreMeta || null,
      }
    : buildFallbackInsights();

  const fallbackInsights = buildFallbackInsights();

  const resolvedScoreMeta = aiSummary.scoreMeta || fallbackInsights.scoreMeta;
  const shouldShowScore = resolvedScoreMeta?.showScore !== false;

  const resolvedScore = shouldShowScore
    ? Number.isFinite(Number(aiSummary.overallScore)) &&
      Number(aiSummary.overallScore) > 0
      ? Number(aiSummary.overallScore)
      : Number(fallbackInsights.overallScore) || 35
    : null;

  const resolvedSummary = {
    ...fallbackInsights,
    ...aiSummary,
    overallScore: resolvedScore,
    scoreMeta: resolvedScoreMeta,
    executiveSummary:
      aiSummary.executiveSummary || fallbackInsights.executiveSummary,
    engagementAnalysis:
      aiSummary.engagementAnalysis || fallbackInsights.engagementAnalysis,
    interactionPatterns:
      aiSummary.interactionPatterns || fallbackInsights.interactionPatterns,
    strengths:
      safeArray(aiSummary.strengths).length > 0
        ? safeArray(aiSummary.strengths)
        : fallbackInsights.strengths,
    risks:
      safeArray(aiSummary.risks).length > 0
        ? safeArray(aiSummary.risks)
        : fallbackInsights.risks,
    recommendations:
      safeArray(aiSummary.recommendations).length > 0
        ? safeArray(aiSummary.recommendations)
        : fallbackInsights.recommendations,
    priorityActions:
      safeArray(aiSummary.priorityActions).length > 0
        ? safeArray(aiSummary.priorityActions)
        : fallbackInsights.priorityActions,
    scoreBreakdown:
      aiSummary.scoreBreakdown &&
      Object.keys(aiSummary.scoreBreakdown).length > 0
        ? aiSummary.scoreBreakdown
        : fallbackInsights.scoreBreakdown,
  };

  const sections = useMemo(
    () => [
      {
        key: "executiveSummary",
        title: "Executive Summary",
        iconColor: "text-blue-600 dark:text-blue-400",
        type: "text",
        value: resolvedSummary.executiveSummary || resolvedSummary.overview,
      },
      {
        key: "engagementAnalysis",
        title: "Engagement Analysis",
        iconColor: "text-green-600 dark:text-green-400",
        type: "text",
        value: resolvedSummary.engagementAnalysis,
      },
      {
        key: "interactionPatterns",
        title: "Interaction Patterns",
        iconColor: "text-purple-600 dark:text-purple-400",
        type: "text",
        value: resolvedSummary.interactionPatterns,
      },
      {
        key: "strengths",
        title: "Strengths",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        type: "list",
        value: safeArray(resolvedSummary.strengths),
      },
      {
        key: "risks",
        title: "Risks to Watch",
        iconColor: "text-rose-600 dark:text-rose-400",
        type: "list",
        value: safeArray(resolvedSummary.risks),
      },
      {
        key: "priorityActions",
        title: "Priority Actions",
        iconColor: "text-amber-600 dark:text-amber-400",
        type: "actions",
        value: safeArray(resolvedSummary.priorityActions),
      },
      {
        key: "recommendations",
        title: "Recommendations for Next Session",
        iconColor: "text-orange-600 dark:text-orange-400",
        type: "list",
        value: safeArray(resolvedSummary.recommendations),
      },
    ],
    [resolvedSummary],
  );

  const visibleSections = sections.filter((section) => {
    if (section.type === "text") return Boolean(section.value);
    return Array.isArray(section.value) && section.value.length > 0;
  });

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

  const scoreColorClass =
    (resolvedSummary.overallScore || 0) >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : (resolvedSummary.overallScore || 0) >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-rose-600 dark:text-rose-400";

  const meterColorClass =
    (resolvedSummary.overallScore || 0) >= 75
      ? "bg-emerald-500"
      : (resolvedSummary.overallScore || 0) >= 50
        ? "bg-amber-500"
        : "bg-rose-500";

  const sectionIcon = {
    executiveSummary: "bar",
    engagementAnalysis: "trend",
    interactionPatterns: "users",
    strengths: "spark",
    risks: "alert",
    priorityActions: "target",
    recommendations: "check",
  };

  const renderSectionIcon = (key, colorClass) => {
    if (sectionIcon[key] === "bar") {
      return (
        <svg
          className={`w-4 h-4 ${colorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m6 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m6 0V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v14"
          />
        </svg>
      );
    }

    if (sectionIcon[key] === "trend") {
      return (
        <svg
          className={`w-4 h-4 ${colorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      );
    }

    if (sectionIcon[key] === "users") {
      return (
        <svg
          className={`w-4 h-4 ${colorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20h10M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      );
    }

    if (sectionIcon[key] === "spark") {
      return (
        <svg
          className={`w-4 h-4 ${colorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3l2.2 4.5L19 9l-3.5 3.3.8 4.7L12 14.8 7.7 17l.8-4.7L5 9l4.8-1.5L12 3z"
          />
        </svg>
      );
    }

    if (sectionIcon[key] === "alert") {
      return (
        <svg
          className={`w-4 h-4 ${colorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v4m0 4h.01M10.29 3.86l-8 14A1 1 0 003.16 19h17.68a1 1 0 00.87-1.5l-8-14a1 1 0 00-1.74 0z"
          />
        </svg>
      );
    }

    if (sectionIcon[key] === "target") {
      return (
        <svg
          className={`w-4 h-4 ${colorClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    return (
      <svg
        className={`w-4 h-4 ${colorClass}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    );
  };

  const clampStyle = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const renderCompactSection = (section) => {
    if (section.type === "text") {
      return (
        <p
          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
          style={clampStyle}
        >
          {section.value}
        </p>
      );
    }

    if (section.type === "actions") {
      return (
        <div className="space-y-2">
          {section.value.slice(0, 2).map((action, index) => (
            <div
              key={index}
              className="rounded-lg border border-orange-200 dark:border-orange-900/50 bg-white/70 dark:bg-gray-900/30 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {action.label}
                </p>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${action.priority === "high" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" : action.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}
                >
                  {action.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <ul className="space-y-1.5">
        {section.value.slice(0, 3).map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            <span
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              style={clampStyle}
            >
              {typeof item === "string" ? item : item?.label || ""}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              AI Insights
            </h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
              Beta
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Executive coaching analysis for host improvement
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          {resolvedSummary.scoreMeta?.showScore !== false ? (
            <>
              <div className={`text-lg font-bold ${scoreColorClass}`}>
                {resolvedSummary.overallScore || 0}/100
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                session score
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Score hidden
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                low data coverage
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        {resolvedSummary.scoreMeta?.showScore !== false ? (
          <div className="h-2 rounded-full bg-white/70 dark:bg-gray-800/70 overflow-hidden border border-blue-200 dark:border-blue-800">
            <div
              className={`h-full ${meterColorClass}`}
              style={{
                width: `${Math.min(100, Math.max(0, resolvedSummary.overallScore || 0))}%`,
              }}
            />
          </div>
        ) : (
          <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-md px-3 py-2">
            {resolvedSummary.scoreMeta?.message ||
              "Session score is hidden because available signals are too limited for a reliable benchmark."}
          </div>
        )}
        <div className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>
            Generated{" "}
            {resolvedSummary.generatedAt
              ? new Date(resolvedSummary.generatedAt).toLocaleString()
              : "now"}
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreenOpen(true)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-1 hide-scrollbar">
        {visibleSections.map((section) => (
          <section key={section.key}>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              {renderSectionIcon(section.key, section.iconColor)}
              {section.title}
            </h4>
            {renderCompactSection(section)}
          </section>
        ))}
      </div>

      {isFullscreenOpen && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto h-full flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Insights - Full View
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generated{" "}
                  {resolvedSummary.generatedAt
                    ? new Date(resolvedSummary.generatedAt).toLocaleString()
                    : "now"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreenOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 hide-scrollbar">
              {visibleSections.map((section) => (
                <section key={`full-${section.key}`}>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    {renderSectionIcon(section.key, section.iconColor)}
                    {section.title}
                  </h4>

                  {section.type === "text" && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {section.value}
                    </p>
                  )}

                  {section.type === "list" && (
                    <ul className="space-y-2">
                      {section.value.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.type === "actions" && (
                    <div className="space-y-3">
                      {section.value.map((action, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-gray-800/40 p-3"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {action.label}
                            </p>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${action.priority === "high" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" : action.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"}`}
                            >
                              {action.priority}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {action.why}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISummary;
