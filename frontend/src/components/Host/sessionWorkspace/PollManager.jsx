import React, { useEffect, useState } from "react";
import api from "../../../utils/api";
import LivePoll from "./LivePoll";
import PastPolls from "./PastPolls";
import { useHostSession } from "../../../context/HostSessionContext";
const PollManager = () => {
  // * Context
  const {
    socketRef,
    sessionData,

    activePoll,
    setActivePoll,

    setPastPolls,
    pastPolls,

    showPollForm,
    setShowPollForm,

    activeView,
    setActiveView,
  } = useHostSession();

  // * Poll Form State (USED IN THE FORM MODAL)
  const [pollFormData, setPollFormData] = useState({
    question: "",
    options: ["", "", "", ""],
  });

  // * Handle Create New Poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();

    // * Filter out any empty options
    const validOptions = pollFormData.options.filter(
      (option) => option.trim() !== ""
    );

    // * Validate Question and Options
    if (pollFormData.question.trim() === "" || validOptions.length < 2) {
      alert("Please provide a question and at least 2 options");
      return;
    }

    // * Setting poll form data to initial state
    setPollFormData({ question: "", options: ["", "", "", ""] });

    // * Prepare Poll Data
    const pollOptions = validOptions.map((option) => ({
      text: option,
      votes: 0,
    }));

    // * Poll Data Object
    const pollData = {
      sessionId: sessionData._id,
      question: pollFormData.question,
      options: pollOptions,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // * Debug Logs
    console.log("Poll Created:", pollData, "Session Data :", sessionData);

    // * API Call to create the poll
    const res = await api.post(
      `/api/sessions/${sessionData._id}/polls`,
      pollData
    );

    // * Set Active Poll
    console.log("API Response:", res.data);
    setActivePoll(res.data);

    // * Emit Socket Event for New Poll Creation
    socketRef.current.emit("poll:create", {
      code: sessionData.code,
      poll: res.data,
    });

    // * Close Poll Form Modal
    setShowPollForm(false);
  };

  // * Handle End Poll
  const handleEndPoll = async () => {
      if (activePoll) {
        console.log("Active Poll is Ending", activePoll);
  
        // * Poll Object with End Parameters
        const endedPoll = {
          ...activePoll,
          isActive: false,
          endedAt: new Date().toISOString(),
        };
  
        // * Api call to patch and make the poll isActive false
        await api.patch(`/api/polls/${activePoll._id}`);
  
        // * Poll Close Socket Emit
        console.log("Ending poll:", activePoll.id);
        socketRef.current.emit("poll:close", {
          code: sessionData.code,
          pollId: activePoll._id,
        });
  
        // * Add to Past Polls and Clear Active Poll
        setPastPolls([endedPoll, ...pastPolls]);
        setActivePoll(null);
      }
    };


  // * Handle poll option change
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollFormData.options];
    newOptions[index] = value;

    // * Update Poll Form Data State to New Options State
    setPollFormData({ ...pollFormData, options: newOptions });
  };

  // * Handle adding a poll option
  const handleAddPollOption = () => {
    if (pollFormData.options.length < 6) {
      // * Update Poll Form Data State to Add New Empty Option
      setPollFormData({
        ...pollFormData,
        options: [...pollFormData.options, ""],
      });
    }
  };

  // * Handle removing a poll option
  const handleRemovePollOption = (index) => {
    if (pollFormData.options.length > 2) {
      const newOptions = [...pollFormData.options];
      newOptions.splice(index, 1);

      // * Update Poll Form Data State to New Options State (REDUCED BY 1)
      setPollFormData({ ...pollFormData, options: newOptions });
    }
  };

  // * Fetch Past Polls and Active Polls for the Session (ISOLATED)
  const fetchPolls = async () => {
    console.log("Fetching past polls for session:", sessionData);

    // * Validate Session._id
    if (!sessionData?._id) return;

    // * Session is Valid, Fetching Polls
    try {
      // * API call to fetch polls for a specific session (USING SESSION._ID)
      const res = await api.get(`/api/sessions/${sessionData._id}/polls`);
      console.log("Fetched past polls:", res.data);

      // * If res is array then set pastPolls and activePoll
      if (Array.isArray(res.data)) {
        setPastPolls(res.data.filter((p) => !p.isActive));
        setActivePoll(res.data.find((p) => p.isActive) || null);
      }
    } catch (err) {
      console.error("Failed to fetch past polls:", err);
    }
  };

  // * Fetch Polls UseEffect (ON SESSIONDATA._ID CHANGE)
  useEffect(() => {
    // * Fetch Polls for the session
    fetchPolls();
    try {
      // * Load activePoll and set it from sessionStorage if available
      const raw = sessionStorage.getItem("hostActivePoll");
      setActivePoll(raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.error("Failed to parse activePoll from sessionStorage:", error);
    }
  }, [sessionData?._id]);

  // * Poll Vote Update UseEffect
  useEffect(() => {
    // * Validate Socket
    if (!socketRef.current) return;

    // * Poll Vote Update Handler
    const handlePollUpdate = ({ pollId, counts }) => {
      // * Only update if this is the active poll
      if (activePoll && activePoll._id === pollId) {
        const newOptions = activePoll.options.map((opt, idx) => ({
          ...opt,
          votes: counts[idx] || 0,
        }));

        // * Update Active Poll State and sessionStorage
        const updated = { ...activePoll, options: newOptions };
        setActivePoll(updated);
        sessionStorage.setItem("hostActivePoll", JSON.stringify(updated));
      }
    };

    // * Poll Vote Update Listener
    socketRef.current.on("poll:update", handlePollUpdate);

    // ! Cleanup listener on unmount
    // TODO: implement cleanup
    return () => {
      //! socketRef.current.off("poll:update", handlePollUpdate);
    };
  }, [socketRef, activePoll, setActivePoll]);

  // * Persist activePoll to sessionStorage
  useEffect(() => {
    if (activePoll) {
      // * Setting activePoll in sessionStorage
      sessionStorage.setItem("hostActivePoll", JSON.stringify(activePoll));
    } else {
      // * Removing activePoll from sessionStorage
      sessionStorage.removeItem("hostActivePoll");
    }
  }, [activePoll]);

  // * Active View Check
  if (activeView !== "polls") return null;

  return (
    <>
      <div className="p-3 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Live Polls
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView("main")}
              className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
            <button
              onClick={() => {
                if (activePoll) {
                  alert(
                    "A poll is already active. Please end the current poll before creating a new one."
                  );
                  return;
                }
                setShowPollForm(true);
              }}
              className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              New Poll
            </button>
          </div>
        </div>

        {/* Active Poll Display */}
        {activePoll ? (
          <LivePoll onPollSubmit={handleEndPoll} />
        ) : pastPolls.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-gray-400 dark:text-gray-500 text-lg font-medium text-center">
              No live polls yet
            </span>
          </div>
        ) : null}

        {/* Past Polls */}
        {pastPolls.length > 0 && <PastPolls />}

        {/* Empty State */}
        {!activePoll && pastPolls.length === 0 && !showPollForm && (
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Polls Created Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first poll to check student understanding or gather
              opinions.
            </p>
            <button
              onClick={() => setShowPollForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Your First Poll
            </button>
          </div>
        )}
      </div>

      {/* Poll Creation Form Modal */}
      {showPollForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create New Poll
                </h3>
                <button
                  onClick={() => setShowPollForm(false)}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleCreatePoll}>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Poll Question
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="e.g., Which of these is NOT a MongoDB data type?"
                    value={pollFormData.question}
                    onChange={(e) =>
                      setPollFormData({
                        ...pollFormData,
                        question: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options
                  </label>
                  {pollFormData.options.map((option, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) =>
                          handlePollOptionChange(index, e.target.value)
                        }
                        required={index < 2} // At least 2 options required
                      />
                      {index > 1 && ( // Can remove options beyond the first two
                        <button
                          type="button"
                          onClick={() => handleRemovePollOption(index)}
                          className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollFormData.options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Add Option
                  </button>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-lg flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPollForm(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Launch Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PollManager;
