import React, { useEffect, useState } from "react";
import api from "../../../utils/api";
import { useHostSession } from "../../../context/HostSessionContext";
const PollManager = ({
  activePoll,
  pastPolls,
  showPollForm,
  setShowPollForm,
  onCreatePoll,
  onEndPoll,
  activeView,
  setActiveView,
}) => {
  const { sessionData, socketRef, setActivePoll, setPastPolls } = useHostSession();
  // useEffect(() => {
  //   socketRef.current.on("polls:update", ({pollId,counts}) => {
  //     console.log("Received poll ID : ",pollId, " with counts: ", counts);
  //     // setActivePoll(updatedPoll);
  //   });
  // }, [socketRef]);
  // // Listen for poll updates from the server

  // Hydrate activePoll and pastPolls on mount

  const fetchPolls = async () => {
    console.log("Fetching past polls for session:", sessionData);
      if (!sessionData?._id) return;
      try {
        const token = localStorage.getItem("accessToken");
        const res = await api.get(`/api/sessions/${sessionData._id}/polls`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        console.log("Fetched past polls:", res.data);
        if (Array.isArray(res.data)) {
          setPastPolls(res.data.filter(p => !p.isActive));
          setActivePoll(res.data.find(p => p.isActive) || null);
        }
      } catch (err) {
        // Optionally handle error
        console.error("Failed to fetch past polls:", err);
      }
    };


  useEffect(() => {
    fetchPolls();

    try {
      const raw = sessionStorage.getItem("hostActivePoll");
      if (raw) {
        setActivePoll(JSON.parse(raw));
      }
    } catch {}
    // Fetch past polls from backend
    
    // eslint-disable-next-line
  }, [sessionData?._id]);

  useEffect(() => {
    if (!socketRef.current) return;

    const handlePollUpdate = ({ pollId, counts }) => {
      // Only update if this is the active poll
      if (activePoll && activePoll._id === pollId) {
        const newOptions = activePoll.options.map((opt, idx) => ({ ...opt, votes: counts[idx] || 0 }));
        const updated = { ...activePoll, options: newOptions };
        setActivePoll(updated);
        sessionStorage.setItem("hostActivePoll", JSON.stringify(updated));
      }
    };

    socketRef.current.on("poll:update", handlePollUpdate);

    // Cleanup listener on unmount
    return () => {
      // socketRef.current.off("poll:update", handlePollUpdate);
    };
  }, [socketRef, activePoll, setActivePoll]);

  // Persist activePoll to sessionStorage
  useEffect(() => {
    if (activePoll) {
      sessionStorage.setItem("hostActivePoll", JSON.stringify(activePoll));
    } else {
      sessionStorage.removeItem("hostActivePoll");
    }
  }, [activePoll]);
  

  const [pollFormData, setPollFormData] = useState({
    question: "",
    options: ["", "", "", ""],
  });

  const token = localStorage.getItem("accessToken");
  // Handle creating a new poll
  const handleCreatePoll = async (e) => {
    e.preventDefault();

    // Filter out any empty options
    const validOptions = pollFormData.options.filter(
      (option) => option.trim() !== ""
    );

    if (pollFormData.question.trim() === "" || validOptions.length < 2) {
      alert("Please provide a question and at least 2 options");
      return;
    }

    onCreatePoll(pollFormData.question, validOptions);
    setPollFormData({ question: "", options: ["", "", "", ""] });

    const pollOptions = validOptions.map((option) => ({
      text: option,
      votes: 0,
    }));

    const pollData = {
      sessionId: sessionData._id,
      question: pollFormData.question,
      options: pollOptions,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    console.log("Poll Created:", pollData, "Session Data :", sessionData);
    console.log(token);

    // socketRef.current.emit("poll:create", {
    //   code: sessionData.code,
    //   sessionId: sessionData._id,
    //   question: pollFormData.question,
    //   options: pollOptions,
    // });

    const res = await api.post(
      `/api/sessions/${sessionData._id}/polls`,
      pollData,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );
    console.log("API Response:", res.data);
    setActivePoll(res.data);

    socketRef.current.emit("poll:create", {
      code: sessionData.code,
      poll: res.data,
    });

    setShowPollForm(false);
  };

  // Handle poll option change
  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollFormData.options];
    newOptions[index] = value;
    setPollFormData({ ...pollFormData, options: newOptions });
  };

  // Handle adding a poll option
  const handleAddPollOption = () => {
    if (pollFormData.options.length < 6) {
      setPollFormData({
        ...pollFormData,
        options: [...pollFormData.options, ""],
      });
    }
  };

  // Handle removing a poll option
  const handleRemovePollOption = (index) => {
    if (pollFormData.options.length > 2) {
      const newOptions = [...pollFormData.options];
      newOptions.splice(index, 1);
      setPollFormData({ ...pollFormData, options: newOptions });
    }
  };

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
                  alert("A poll is already active. Please end the current poll before creating a new one.");
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
        {activePoll && (
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg mb-8 overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Live Poll
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                  {activePoll.question}
                </h3>
              </div>
              <button
                onClick={onEndPoll}
                className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                End Poll
              </button>
            </div>

            <div className="p-5">
              <div className="space-y-4">
                {activePoll.options.map((option, index) => {
                  const totalVotes = activePoll.options.reduce(
                    (sum, opt) => sum + opt.votes,
                    0
                  );
                  const percentage =
                    totalVotes > 0
                      ? Math.round((option.votes / totalVotes) * 100)
                      : 0;

                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {option.text}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {option.votes} votes ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  Total Responses:{" "}
                  {activePoll.options.reduce((sum, opt) => sum + opt.votes, 0)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Students can vote in real-time
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Past Polls */}
        {pastPolls.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Past Polls
            </h3>
            <div className="space-y-4">
              {pastPolls.map((poll) => {
                const totalVotes = poll.options.reduce(
                  (sum, opt) => sum + opt.votes,
                  0
                );
                const winningOption = [...poll.options].sort(
                  (a, b) => b.votes - a.votes
                )[0];
                const winningPercentage =
                  totalVotes > 0
                    ? Math.round((winningOption.votes / totalVotes) * 100)
                    : 0;

                return (
                  <div
                    key={poll.id}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {poll.question}
                      </h4>
                      <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Ended{" "}
                        {new Date(poll.endedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-sm mb-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Most Popular Answer:
                        </span>{" "}
                        <span className="text-gray-900 dark:text-white">
                          "{winningOption.text}" ({winningPercentage}%)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {poll.options.map((option) => {
                          const optionPercentage =
                            totalVotes > 0
                              ? Math.round((option.votes / totalVotes) * 100)
                              : 0;

                          return (
                            <div key={option.id} className="flex items-center">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  option.id === winningOption.id
                                    ? "bg-green-500"
                                    : "bg-gray-300 dark:bg-gray-500"
                                }`}
                              ></div>
                              <span className="text-gray-700 dark:text-gray-300 truncate">
                                {option.text}
                              </span>
                              <span className="ml-auto text-gray-500 dark:text-gray-400">
                                {optionPercentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                        Total responses: {totalVotes}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
