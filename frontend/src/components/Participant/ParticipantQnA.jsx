import React, { useEffect, useState, useRef } from "react";
import { useParticipantSession } from "../../context/ParticipantSessionContext";
import { useAuth } from "../../context/UserContext";

// Module-level AskPanel to keep its state stable across parent re-renders
const AskPanel = ({ onSubmit: handleSubmit }) => {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const CHAR_LIMIT = 300;

  const submit = async () => {
    if (!text.trim()) return;
    if (handleSubmit) await handleSubmit({ text: text.trim(), isAnonymous });
    setText("");
  };

  return (
    <div>
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, CHAR_LIMIT))}
          rows={6}
          className="w-full p-3 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="Type your question here..."
        />

        <div className="text-xs text-gray-600 dark:text-gray-300 absolute bottom-3 right-3 select-none">
          {text.length}/{CHAR_LIMIT}
        </div>
      </div>

      <div className="flex flex-col justify-center items-center gap-2 mt-3">
        <label className="inline-flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                isAnonymous ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            ></div>
            <div
              className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                isAnonymous ? "translate-x-5" : ""
              }`}
            ></div>
          </div>
          <span className="ml-3 text-sm text-gray-700 dark:text-gray-400">
            Ask anonymously
          </span>
        </label>

        <button
          onClick={submit}
          className="w-3/4 py-3 sm:py-4 px-3 sm:px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base shadow-lg mt-2 "
        >
          Submit
        </button>
      </div>
    </div>
  );
};

const ParticipantQnA = ({
  questions,
  onUpvote,
  askOpen,
  setAskOpen,
  onBack,
  onSubmit,
}) => {
  const { user } = useAuth();
  const { sessionData } = useParticipantSession();

  // Track upvoted question ids for this participant in sessionStorage so UI persists across reloads
  const [upvotedSet, setUpvotedSet] = useState(() => {
    try {
      const key = `qna:upvotes:${sessionData?.participantId || "anon"}`;
      const raw = sessionStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (err) {
      return new Set();
    }
  });

  useEffect(() => {
    // when participantId changes, reload the set
    try {
      const key = `qna:upvotes:${sessionData?.participantId || "anon"}`;
      const raw = sessionStorage.getItem(key);
      setUpvotedSet(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch (err) {
      setUpvotedSet(new Set());
    }
  }, [sessionData?.participantId]);

  const toggleLocalUpvote = (questionId) => {
    const key = `qna:upvotes:${sessionData?.participantId || "anon"}`;
    setUpvotedSet((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      try {
        sessionStorage.setItem(key, JSON.stringify(Array.from(next)));
      } catch (err) {}
      return next;
    });
  };

  const scrollRef = useRef(null);
  useEffect(() => {
    if (askOpen && scrollRef.current) {
      // scroll to top so AskPanel is visible
      try {
        scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        scrollRef.current.scrollTop = 0;
      }
    }
  }, [askOpen]);

  // Inline ask panel component
  
  return (
    <div className="max-w-xs sm:max-w-md lg:max-w-lg mx-auto px-1 sm:px-0">
      {/* Make the QnA container visually blend with the page background by removing
                explicit background, border and rounded corners while keeping padding,
                spacing and the sticky button behavior. */}
      <div
        className="sm:p-4 lg:p-6 flex flex-col"
        style={{ height: "min(80vh, 600px)", minHeight: "350px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
          <button
            onClick={() => {
              // single back control: if ask panel is open, close it; otherwise go back to previous screen
              if (askOpen) return setAskOpen(false);
              return onBack && onBack();
            }}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 -ml-1"
          >
            <svg
              className="w-4 h-4 mr-1"
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
            <span className="text-sm sm:text-base">Back</span>
          </button>
          <h2 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400">
            Q&A
          </h2>
          <div className="w-12" />
        </div>

        {/* Questions Content Area - Scrollable */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto mb-4 sm:mb-6 no-scrollbar"
        >
          {/* If askOpen is true, show only the AskPanel (hide the questions list) */}
          {askOpen ? (
            <div className="mb-4 p-2">
              <h3 className="text-sm font-semibold mb-3 dark:text-gray-400">
                New question
              </h3>
              <AskPanel
                onSubmit={async (payload) => {
                  if (!onSubmit) return;
                  await onSubmit(payload);
                  setAskOpen(false);
                }}
              />
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">
                Do you have a question for the presenter?
                <br />
                Be the first one to ask!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-600">

              {[...questions]
                .sort((a, b) => {
                  if ((b.upvotes || 0) !== (a.upvotes || 0))
                    return (b.upvotes || 0) - (a.upvotes || 0);
                  return new Date(b.timestamp) - new Date(a.timestamp);
                })
                .map((q) => (
                  <div
                    key={q.id}
                    className="flex justify-between space-x-3 py-3 sm:py-4 first:pt-0 last:pb-0 relative"
                  >
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      {q.authorId && user?.id && q.authorId === user.id && (
                        <span className="self-start text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 rounded-xl text-xs border-2 border-blue-200 dark:border-blue-700 font-bold text-center">
                          your question
                        </span>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex-1 min-w-0 flex items-center">
                          <p className="text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-relaxed text-left break-words w-full">
                            {q.text}
                          </p>
                        </div>
                      </div>

                      {/* Show author's name when question is not anonymous
    {!q.isAnonymous && (q.studentName || q.authorName) && (
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">
        {q.studentName || q.authorName}
      </div>
    )} */}
                    </div>

                    <div className="flex flex-col items-center flex-shrink-0 min-w-[2rem] mt-2 gap-2">
                      <button
                        onClick={() => {
                          // optimistic UI toggle
                          toggleLocalUpvote(q.id);
                          onUpvote(q.id);
                        }}
                        className={`transition-colors p-1.5 -m-1.5 rounded-lg border ${
                          upvotedSet.has(q.id)
                            ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                            : "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {q.upvotes || 0}
                      </span>
                    </div>

                    {/* {q.answered && (
    <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 h-8 sm:h-10 w-1 sm:w-1.5 rounded-full bg-green-500 dark:bg-green-400" aria-hidden="true" />
  )} */}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Sticky Ask Question Button (hidden while ask panel is open) */}
        {!askOpen && (
          <div className="flex-shrink-0">
            <button
              onClick={() => setAskOpen(true)}
              className="w-full py-3 sm:py-4 px-3 sm:px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base shadow-lg"
            >
              Ask a question
            </button>
          </div>
        )}
      </div>

      {/* AskQuestionModal is controlled by the parent ParticipantSession */}
    </div>
  );
};

export default ParticipantQnA;
