import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Clock,
  Zap,
  Medal,
  ArrowLeft,
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
    // HOST_CONTROLLED state
    hcCurrentQuestion,
    hcQuestionIndex,
    hcTimeRemaining,
    setHcTimeRemaining,
    hcQuestionDuration,
    hcAnswerSubmitted,
    setHcAnswerSubmitted,
    hcLeaderboard,
    hcFinalResults,
    hcShowResults,
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
  const [hcSelectedOption, setHcSelectedOption] = useState(null);
  const [hcSubmitting, setHcSubmitting] = useState(false);

  const questions = activeQuiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  // Check if this is a HOST_CONTROLLED quiz
  const isHostControlled = activeQuiz?.mode === "HOST_CONTROLLED";

  // Timer effect for HOST_CONTROLLED mode
  useEffect(() => {
    if (!isHostControlled || !hcCurrentQuestion || hcAnswerSubmitted || hcShowResults) return;
    
    const timer = setInterval(() => {
      setHcTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHostControlled, hcCurrentQuestion, hcAnswerSubmitted, hcShowResults, setHcTimeRemaining]);

  // Reset selected option when new question arrives
  useEffect(() => {
    if (isHostControlled && hcCurrentQuestion) {
      setHcSelectedOption(null);
    }
  }, [isHostControlled, hcCurrentQuestion?._id]);

  // Handle HC answer submission
  const handleHCSubmitAnswer = useCallback(() => {
    if (!hcSelectedOption || hcAnswerSubmitted || !activeQuiz || !hcCurrentQuestion) return;
    
    setHcSubmitting(true);
    const socket = socketRef.current;
    
    if (socket) {
      socket.emit("quiz:hc:answer", {
        quizId: activeQuiz._id,
        questionId: hcCurrentQuestion._id,
        selectedOptions: [hcSelectedOption],
      });
      
      // Optimistically mark as submitted
      setHcAnswerSubmitted(true);
      setHcSubmitting(false);
    }
  }, [hcSelectedOption, hcAnswerSubmitted, activeQuiz, hcCurrentQuestion, socketRef, setHcAnswerSubmitted]);

  // Auto-submit when time runs out (if answer selected)
  useEffect(() => {
    if (isHostControlled && hcTimeRemaining === 0 && hcSelectedOption && !hcAnswerSubmitted) {
      handleHCSubmitAnswer();
    }
  }, [isHostControlled, hcTimeRemaining, hcSelectedOption, hcAnswerSubmitted, handleHCSubmitAnswer]);

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

  // ========== HOST_CONTROLLED MODE RENDERING ==========
  
  // HC: Final Results Screen
  if (isHostControlled && hcFinalResults) {
    const myResult = hcFinalResults.participants?.find(
      p => p.participantId === socketRef.current?.id
    );
    const myRank = hcFinalResults.leaderboard?.findIndex(
      l => l.participantId === socketRef.current?.id
    ) + 1;

    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/20 rounded-3xl p-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Quiz Complete! 🎉
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {activeQuiz?.title}
          </p>

          {myRank > 0 && (
            <div className="mb-6">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                #{myRank}
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300">
                Your Final Rank
              </p>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4 mt-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-2">
              <Medal className="w-5 h-5 text-amber-500" />
              Final Leaderboard
            </h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {hcFinalResults.leaderboard?.slice(0, 10).map((entry, idx) => (
                <div
                  key={entry.participantId}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    entry.participantId === socketRef.current?.id
                      ? "bg-purple-100 dark:bg-purple-900/40 border-2 border-purple-500"
                      : "bg-slate-50 dark:bg-slate-700/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? "bg-yellow-400 text-yellow-900" :
                      idx === 1 ? "bg-slate-300 text-slate-700" :
                      idx === 2 ? "bg-orange-400 text-orange-900" :
                      "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {entry.participantName}
                    </span>
                  </div>
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {entry.totalScore.toFixed(2)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Back to Dashboard Button */}
          <button
            onClick={() => {
              setActiveQuiz(null);
              setQuizAnswers({});
              setQuizSubmitted(false);
              setQuizResult(null);
              setHcCurrentQuestion(null);
              setHcQuestionIndex(-1);
              setHcAnswerSubmitted(false);
              setHcLeaderboard([]);
              setHcFinalResults(null);
              setHcShowResults(false);
            }}
            className="w-full mt-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Session Dashboard
          </button>
        </div>
      </div>
    );
  }

  // HC: Waiting for question / Leaderboard view
  if (isHostControlled && hcShowResults && !hcFinalResults) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Leaderboard
          </h2>

          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {hcLeaderboard.length === 0 ? (
                <p className="text-slate-500 py-4">Waiting for results...</p>
              ) : (
                hcLeaderboard.map((entry, idx) => (
                  <div
                    key={entry.participantId}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.participantId === socketRef.current?.id
                        ? "bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-500"
                        : "bg-slate-50 dark:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? "bg-yellow-400 text-yellow-900" :
                        idx === 1 ? "bg-slate-300 text-slate-700" :
                        idx === 2 ? "bg-orange-400 text-orange-900" :
                        "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {entry.participantName}
                      </span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {entry.totalScore.toFixed(2)} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Waiting for next question...</span>
          </div>
        </div>
      </div>
    );
  }

  // HC: Active Question View
  if (isHostControlled && hcCurrentQuestion && !hcShowResults) {
    const timePercentage = (hcTimeRemaining / hcQuestionDuration) * 100;
    const isLowTime = hcTimeRemaining <= 10;

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Timer Header */}
        <div className={`rounded-2xl p-4 mb-4 ${
          isLowTime 
            ? "bg-gradient-to-r from-red-500 to-orange-500" 
            : "bg-gradient-to-r from-blue-600 to-indigo-600"
        } text-white`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">
                Question {hcQuestionIndex + 1}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className={`text-2xl font-bold ${isLowTime ? "animate-pulse" : ""}`}>
                {hcTimeRemaining}s
              </span>
            </div>
          </div>
          {/* Timer bar */}
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-1000"
              style={{ width: `${timePercentage}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Question Text */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xl font-medium text-slate-900 dark:text-white leading-relaxed">
              {hcCurrentQuestion.questionText}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full font-medium">
                {hcCurrentQuestion.points} points
              </span>
              {hcAnswerSubmitted && (
                <span className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Submitted
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="p-4 space-y-3">
            {hcCurrentQuestion.options?.map((option, index) => {
              const isSelected = hcSelectedOption === option._id;
              const optionColors = [
                "from-red-500 to-rose-600",
                "from-blue-500 to-indigo-600",
                "from-green-500 to-emerald-600",
                "from-yellow-500 to-amber-600",
              ];

              return (
                <button
                  key={option._id || index}
                  onClick={() => !hcAnswerSubmitted && setHcSelectedOption(option._id)}
                  disabled={hcAnswerSubmitted || hcTimeRemaining === 0}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                    isSelected
                      ? `border-transparent bg-gradient-to-r ${optionColors[index % 4]} text-white shadow-lg`
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                  } ${hcAnswerSubmitted || hcTimeRemaining === 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className={`flex-1 font-medium text-lg ${
                    isSelected ? "text-white" : "text-slate-700 dark:text-slate-300"
                  }`}>
                    {option.text || option.optionText}
                  </span>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          {!hcAnswerSubmitted && hcTimeRemaining > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleHCSubmitAnswer}
                disabled={!hcSelectedOption || hcSubmitting}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {hcSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Lock In Answer
              </button>
            </div>
          )}

          {/* Waiting state after submission */}
          {hcAnswerSubmitted && (
            <div className="p-6 text-center bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-green-700 dark:text-green-300">
                Answer submitted!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Waiting for results...
              </p>
            </div>
          )}

          {/* Time's up state */}
          {hcTimeRemaining === 0 && !hcAnswerSubmitted && (
            <div className="p-6 text-center bg-red-50 dark:bg-red-900/20">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="font-semibold text-red-700 dark:text-red-300">
                Time's up!
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                You didn't submit an answer in time
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // HC: Waiting for quiz to start
  if (isHostControlled && !hcCurrentQuestion && !hcShowResults) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/20 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-lg animate-pulse">
            <Zap className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {activeQuiz?.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Host-Controlled Quiz
          </p>

          <div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl p-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="font-semibold text-slate-900 dark:text-white">
              Waiting for the host to start...
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Questions will appear one at a time. Answer quickly for bonus points!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========== ONE_SHOT MODE (ORIGINAL) RENDERING ==========

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
