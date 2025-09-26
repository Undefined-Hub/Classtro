// ParticipantLivePoll.jsx
import React, { useEffect } from "react";
import { useParticipantSession } from "../../context/ParticipantSessionContext";
import { useState } from "react";

const ParticipantLivePoll = () => {
  const {
    sessionData,
    socketRef,
    pollSubmitting,
    pollSubmitted,
    activePoll,
    setPollSubmitted,
    setPollSubmitting,
  } = useParticipantSession();

  const [selectedOption, setSelectedOption] = useState();

  // Restore previous selection for this poll from sessionStorage (per participant)
  useEffect(() => {
    if (!activePoll || !sessionData?.participantId) return;
    try {
      const key = `pollVote:${activePoll._id}:${sessionData.participantId}`;
      const saved = sessionStorage.getItem(key);
      if (saved) setSelectedOption(saved);
    } catch (err) {
      // ignore
    }
  }, [activePoll, sessionData?.participantId]);

  if (!activePoll) {
    alert("active poll yet nahi");
    return null;
  }

  const totalVotes = activePoll.options.reduce(
    (sum, opt) => sum + (typeof opt.votes === "number" ? opt.votes : 0),
    0
  );
  useEffect(() => {
    console.log("Active Poll Updated:", activePoll);
  }, [activePoll]);

  const handlePollSubmit = (optionId) => {
    // * Guard clauses
    if (!activePoll) return;
    if (!optionId) return;
    if (!socketRef.current) {
      console.warn("No socket available to submit vote");
      return;
    }

    // * Find option index and validate
    const optionIndex = activePoll.options.findIndex((opt) => opt._id === optionId);
    if (optionIndex === -1) return;

    // Optimistically mark selected option so UI updates immediately
    setSelectedOption(optionId);
    // persist the selection so it survives reloads
    try {
      const key = `pollVote:${activePoll._id}:${sessionData?.participantId}`;
      sessionStorage.setItem(key, optionId);
    } catch (err) {}

    // * set submitting state
    setPollSubmitting(true);

    // * Debug log
    console.log("Submitting vote for option index:", {
      code: sessionData?.joinCode,
      pollId: activePoll._id,
      participantId: sessionData?.participantId,
      optionIndex,
    });

    // * Emit poll:vote event
    socketRef.current.emit(
      "poll:vote",
      {
        code: sessionData?.joinCode,
        pollId: activePoll._id,
        participantId: sessionData?.participantId,
        optionIndex,
      },

      // * Callback on acknowledgment
      () => {
        // server acknowledged
        setPollSubmitting(false);
        setPollSubmitted(true);
      }
    );

    // Fallback: if server does not ack within 8s, clear submitting state
    setTimeout(() => {
      if (pollSubmitting) {
        console.warn("Vote ack timeout - clearing submitting state");
        setPollSubmitting(false);
      }
    }, 8000);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-8 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight text-center">
        {activePoll.question}
      </h3>
      <div className="flex flex-col gap-4 mb-8">
        {activePoll.options?.map((opt) => {
          const votes = typeof opt.votes === "number" ? opt.votes : 0;
          const percentage =
            totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt._id;
          const isDisabled = pollSubmitting || pollSubmitted;
          return (
            <button
              key={opt._id}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) handlePollSubmit(opt._id);
              }}
              className={`
    relative w-full text-left rounded-lg border overflow-hidden
    transition-all duration-200 min-h-[3.5rem] 
    ${
      isSelected
        ? "border-blue-500 bg-white dark:bg-gray-900"
        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    }
    ${
      isDisabled
        ? "opacity-50 cursor-not-allowed"
        : "cursor-pointer hover:border-gray-300 dark:hover:border-blue-600 hover:shadow-sm"
    } hover:border-blue-500
  `}
            >
              {/* Simplified progress bar */}
              {percentage > 0 && (
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-950/50"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center justify-between px-4 py-3">
                <span
                  className={`font-medium ${
                    isSelected
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {opt.text}
                </span>

                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {votes} {votes === 1 ? "vote" : "votes"}
                  {totalVotes > 0 && (
                    <span className="ml-1 opacity-75">({percentage}%)</span>
                  )}
                </div>
              </div>

              {/* Subtle selected indicator */}
              {isSelected && (
                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
      {pollSubmitting && (
        <div className="w-full flex items-center justify-center gap-2 mt-2 text-blue-600 dark:text-blue-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Submitting...
        </div>
      )}
      {pollSubmitted && (
        <div className="mt-8 text-green-600 dark:text-green-400 text-base font-semibold text-center">
          Your answer has been submitted.
        </div>
      )}
    </div>
  );
};

export default ParticipantLivePoll;
