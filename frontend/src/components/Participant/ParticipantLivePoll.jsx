// ParticipantLivePoll.jsx
import React, { use } from "react";
import { useParticipantSession } from "../../context/ParticipantSessionContext";

const ParticipantLivePoll = ({ onVote }) => {
  const { activePoll, selectedOption, pollSubmitting, pollSubmitted } =
    useParticipantSession();
  if (!activePoll) return null;

  const totalVotes = activePoll.options.reduce(
    (sum, opt) => sum + (typeof opt.votes === "number" ? opt.votes : 0),
    0
  );

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-8 animate-fade-in">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight text-center">
        {activePoll.question}
      </h3>
      <div className="flex flex-col gap-4 mb-8">
        {activePoll.options?.map((opt) => {
          const votes = typeof opt.votes === "number" ? opt.votes : 0;
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === opt._id;
          const isDisabled = pollSubmitting || pollSubmitted;
          return (
            <button
              key={opt._id}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onVote(opt._id);
              }}
              className={`relative w-full text-left rounded-xl border transition-all shadow-sm overflow-hidden px-0 py-0
                ${isSelected
                  ? 'border-blue-700 bg-blue-500/90 dark:bg-blue-700/90 ring-2 ring-blue-400 dark:ring-blue-500'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-blue-300 dark:hover:border-blue-500'}
                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{ minHeight: '3.5rem' }}
            >
              {/* Progress bar background */}
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-300 ${isSelected ? 'bg-blue-400/60 dark:bg-blue-800/60' : 'bg-gray-100 dark:bg-gray-800/40'}`}
                style={{ width: `${percentage}%`, zIndex: 1 }}
              />
              {/* Option content */}
              <div className="relative flex items-center justify-between px-4 py-3 z-10">
                <span
                  className={`text-base font-semibold transition-colors ${isSelected ? 'text-white dark:text-white' : 'text-gray-900 dark:text-gray-100'} ${!isSelected ? 'group-hover:text-blue-700 dark:group-hover:text-blue-300' : ''}`}
                >
                  {opt.text}
                </span>
                <span className={`ml-4 px-3 py-1 rounded-lg text-xs font-semibold min-w-[2.5rem] text-center border ${isSelected ? 'bg-blue-100/60 dark:bg-blue-900/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200' : 'bg-white/80 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'}`}>
                  {votes} vote{votes === 1 ? '' : 's'}
                  {totalVotes > 0 && (
                    <span className="ml-1 text-[10px] text-gray-500 dark:text-gray-400">({percentage}%)</span>
                  )}
                </span>
              </div>
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-blue-700 dark:border-blue-400 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>
      {pollSubmitting && (
        <div className="w-full flex items-center justify-center gap-2 mt-2 text-blue-600 dark:text-blue-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
