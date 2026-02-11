import React, { useState, useEffect, useMemo } from "react";
import { useParticipantSession } from "../../context/ParticipantSessionContext";
import {
  CheckCircle,
  Circle,
  Square,
  CheckSquare,
  Send,
  Trophy,
  Target,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react";

const ParticipantLiveQuiz = () => {
  const {
    socketRef,
    activeQuiz,
    setActiveQuiz,
    quizAnswers,
    setQuizAnswers,
    quizSubmitted,
    setQuizSubmitted,
    quizResult,
    setQuizResult,
  } = useParticipantSession();

  // Debug log on render
  console.log("ParticipantLiveQuiz render:", {
    hasQuiz: !!activeQuiz,
    quizSubmitted,
    answersCount: Object.keys(quizAnswers).length,
    quizData: activeQuiz,
  });

  // Local states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const questions = activeQuiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Handle option selection for MCQ/TRUE_FALSE
  const handleSingleSelect = (optionId) => {
    console.log("Single select clicked:", optionId, "Submitted:", quizSubmitted);
    console.log("Current question ID:", currentQuestion?._id);
    console.log("Current quizAnswers before update:", quizAnswers);
    if (quizSubmitted) return;
    if (!optionId) {
      console.error("Option ID is undefined!");
      return;
    }
    if (!currentQuestion?._id) {
      console.error("Current question ID is undefined!");
      return;
    }
    const newAnswers = {
      ...quizAnswers,
      [currentQuestion._id]: [optionId],
    };
    console.log("Setting new answers:", newAnswers);
    setQuizAnswers(newAnswers);
  };

  // Handle option selection for MULTI_SELECT
  const handleMultiSelect = (optionId) => {
    console.log("Multi select clicked:", optionId, "Submitted:", quizSubmitted);
    console.log("Current question ID:", currentQuestion?._id);
    console.log("Current quizAnswers before update:", quizAnswers);
    if (quizSubmitted) return;
    if (!optionId) {
      console.error("Option ID is undefined!");
      return;
    }
    if (!currentQuestion?._id) {
      console.error("Current question ID is undefined!");
      return;
    }
    const currentAnswers = quizAnswers[currentQuestion._id] || [];
    const isSelected = currentAnswers.includes(optionId);

    const newAnswers = {
      ...quizAnswers,
      [currentQuestion._id]: isSelected
        ? currentAnswers.filter((id) => id !== optionId)
        : [...currentAnswers, optionId],
    };
    console.log("Setting new answers:", newAnswers);
    setQuizAnswers(newAnswers);
  };

  // Check if option is selected
  const isOptionSelected = (optionId) => {
    const answers = quizAnswers[currentQuestion?._id] || [];
    return answers.includes(optionId);
  };

  // Navigate questions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Count answered questions
  const answeredCount = useMemo(() => {
    return Object.keys(quizAnswers).filter(
      (qId) => quizAnswers[qId] && quizAnswers[qId].length > 0
    ).length;
  }, [quizAnswers]);

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (quizSubmitted || submitting) return;

    setSubmitting(true);

    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(quizAnswers).map(([questionId, selectedOptions]) => ({
        questionId,
        selectedOptions,
        answeredAt: new Date(),
      }));

      const socket = socketRef.current;
      if (socket) {
        socket.emit("quiz:submit", {
          quizId: activeQuiz._id,
          answers: formattedAnswers,
        });

        // Wait for acknowledgment
        socket.once("quiz:submission:ack", (result) => {
          setQuizResult(result);
          setQuizSubmitted(true);
          setSubmitting(false);
        });

        socket.once("quiz:submission:error", ({ error }) => {
          console.error("Quiz submission error:", error);
          alert(error || "Failed to submit quiz");
          setSubmitting(false);
        });

        // Timeout fallback
        setTimeout(() => {
          if (!quizSubmitted) {
            setSubmitting(false);
          }
        }, 10000);
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setSubmitting(false);
    }
  };

  // Render result screen
  if (quizSubmitted && quizResult) {
    const percentage = Math.round(quizResult.percentage || 0);
    const isPassing = percentage >= 60;

    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className={`rounded-3xl p-8 text-center ${
          isPassing 
            ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20" 
            : "bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/20"
        }`}>
          {/* Trophy/Icon */}
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
            isPassing 
              ? "bg-green-500 text-white" 
              : "bg-orange-500 text-white"
          }`}>
            {isPassing ? (
              <Trophy className="w-12 h-12" />
            ) : (
              <Target className="w-12 h-12" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isPassing ? "Great Job! 🎉" : "Quiz Completed!"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {activeQuiz?.title}
          </p>

          {/* Score */}
          <div className={`text-6xl font-bold mb-2 ${
            isPassing ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
          }`}>
            {percentage}%
          </div>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
            Score: {quizResult.score}/{quizResult.maxScore}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {answeredCount}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Questions Answered
              </div>
            </div>
            <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {questions.length}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Total Questions
              </div>
            </div>
          </div>

          {/* Message */}
          <div className={`rounded-xl p-4 ${
            isPassing 
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
              : "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
          }`}>
            {isPassing ? (
              <p className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Excellent performance! Keep it up!
              </p>
            ) : (
              <p className="flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Keep practicing, you'll do better next time!
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz closed state
  if (activeQuiz?.status === "CLOSED" && !quizSubmitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Quiz Ended
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            This quiz has been closed by the host.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">
              {activeQuiz?.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Question Text */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold text-sm">
                {currentQuestionIndex + 1}
              </span>
              <div className="flex-1">
                <p className="text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
                  {currentQuestion.questionText}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
                    {currentQuestion.type === "MULTI_SELECT" ? "Select multiple" : "Select one"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentQuestion.points} point{currentQuestion.points !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="p-4 space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = isOptionSelected(option._id);
              const isMulti = currentQuestion.type === "MULTI_SELECT";
              
              // Debug logging
              if (index === 0) {
                console.log("First option:", option, "Has _id:", !!option._id);
              }

              return (
                <button
                  key={option._id || index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Button clicked! Option:", option._id);
                    if (isMulti) {
                      handleMultiSelect(option._id);
                    } else {
                      handleSingleSelect(option._id);
                    }
                  }}
                  disabled={quizSubmitted}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  } ${quizSubmitted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {/* Selection indicator */}
                  <div className="flex-shrink-0">
                    {isMulti ? (
                      isSelected ? (
                        <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Square className="w-6 h-6 text-slate-400" />
                      )
                    ) : isSelected ? (
                      <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Option letter */}
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </span>

                  {/* Option text */}
                  <span
                    className={`flex-1 font-medium ${
                      isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {/* Question dots */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] px-2">
              {questions.map((q, idx) => {
                const isAnswered = quizAnswers[q._id] && quizAnswers[q._id].length > 0;
                const isCurrent = idx === currentQuestionIndex;

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`flex-shrink-0 w-3 h-3 rounded-full transition-all ${
                      isCurrent
                        ? "w-6 bg-blue-600"
                        : isAnswered
                        ? "bg-green-500"
                        : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  />
                );
              })}
            </div>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={goToNextQuestion}
                className="px-4 py-2 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting || answeredCount === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {answeredCount} of {questions.length} answered
          </span>
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting || answeredCount === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantLiveQuiz;
