import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
} from "lucide-react";

/* Components import  */
import AllSessionsTable from "../../components/Host/dashboard/AllSessionsTable";
import QuizCreation from "../../components/Host/QuizCreation";

/* Api import */
import api from "../../utils/api";
import safeToast from "../../utils/toastUtils";


function SessionsPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quizName, setQuizName] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [isQuizCreated, setIsQuizCreated] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load quizzes from API
  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get("/api/quiz-templates");
      setQuizzes(response.data);
    } catch (err) {
      console.error("Error loading quizzes:", err);
      setError("Failed to load quizzes. Please try again.");
      // Fallback to localStorage if API fails
      setQuizzes(JSON.parse(localStorage.getItem("quizzes") || "[]"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Get auth token from localStorage
  let token = null;
  try {
    token = localStorage.getItem("accessToken");
  } catch (e) {
    token = null;
  }

  const handleSessionClick = (session) => {
    // Navigate to the session workspace with session data as state
    navigate("/sessionWorkspace", {
      state: {
        sessionId: session._id,
        sessionData: session,
        roomId: session.roomId,
        roomName: session.roomName || "",
      },
    });
  };

  const handleCreateQuiz = async () => {
    if (quizName.trim()) {
      setIsModalOpen(false);
      try {
        setIsLoading(true);
        // Create draft directly in DB
        const response = await api.post("/api/quiz-templates", {
          title: quizName,
          description: quizDescription,
          isDraft: true,
          questions: []
        });
        const newQuiz = response.data;
        setEditingQuiz(newQuiz);
        setQuizName(newQuiz.title);
        setQuizDescription(newQuiz.description || "");
        setIsQuizCreated(true); // Open edit page
      } catch (err) {
        console.error("Error creating draft quiz", err);
        safeToast.error("Failed to create quiz draft. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      safeToast.error("Please enter a quiz name.");
    }
  };

  const handleEditQuiz = async (quiz) => {
    try {
      // Fetch full quiz details from API
      const response = await api.get(`/api/quiz-templates/${quiz._id}`);
      const fullQuiz = response.data;

      setEditingQuiz(fullQuiz);
      console.log("Updating existing quiz...", fullQuiz);
      setQuizName(fullQuiz.title);
      setQuizDescription(fullQuiz.description || "");
      setIsQuizCreated(true);
    } catch (err) {
      console.error("Error loading quiz details:", err);
      safeToast.error("Failed to load quiz details. Please try again.");
    }
  };

  const handleDeleteQuiz = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      localStorage.removeItem(`quiz_draft_${quizToDelete._id}`);
      console.log("Attempting to delete quiz:", quizToDelete._id);
      const response = await api.delete(
        `/api/quiz-templates/${quizToDelete._id}`,
      );
      console.log("Delete response:", response);

      // Update local state
      setQuizzes(quizzes.filter((q) => q._id !== quizToDelete._id));
      setShowDeleteConfirm(false);
      setQuizToDelete(null);

      // Show success message
      safeToast.success("Quiz deleted successfully!");
    } catch (err) {
      console.error("Error deleting quiz:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Failed to delete quiz";
      safeToast.error(`Error: ${errorMessage}`);
    }
  };

  const handleBackToList = () => {
    setIsQuizCreated(false);
    setQuizName("");
    setQuizDescription("");
    setEditingQuiz(null);
    loadQuizzes(); // Reload quizzes from API after returning from creation/editing
  };

  return (
    <>
      {isQuizCreated ? (
        <QuizCreation
          quizName={quizName}
          quizDescription={quizDescription}
          onBack={handleBackToList}
          existingQuiz={editingQuiz}
        />
      ) : (
        <>
          {/* <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Quizes
          </h2> */}

          {/* Quizzes List */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Your Quizzes
            </h2>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Loading quizzes...
                </span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-500 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z"
                    />
                  </svg>
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-medium">
                      {error}
                    </p>
                    <button
                      onClick={loadQuizzes}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm underline mt-1"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quizzes Content */}
            {!isLoading && !error && quizzes.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create Quiz Card */}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Create New Quiz
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Start building interactive assessments
                  </p>
                </div>
              </div>
            ) : (
              !isLoading &&
              !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Create Quiz Card */}
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Plus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Create New Quiz
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Add another interactive assessment
                    </p>
                  </div>

                  {/* Quiz Cards */}
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      onClick={() => handleEditQuiz(quiz)}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 group"
                    >
                      {/* Header with title and delete button */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={quiz.title}>
                              {quiz.title}
                            </h3>
                            {/* <span className="inline-flex items-center px-2.5 mt-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Quiz
                            </span> */}
                             {quiz.isDraft && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Draft
                                </span>
                              )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteQuiz(quiz);
                            }}
                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 relative z-10"
                            title="Delete this quiz"
                            type="button"
                          >
                            <Trash2 size={18} className="text-red-500 dark:text-red-400 hover:text-red-600" />
                          </button>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {quiz.description || "No description provided"}
                        </p>

                        {/* Stats section - simplified like sessions */}
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {quiz.questionsCount || 0} Questions
                          </span>

                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {quiz.totalPoints || 0} Points
                          </span>
                        </div>
                      </div>

                      {/* Footer with date */}
                      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Created {new Date(quiz.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Quiz
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Quiz Name
              </label>
              <input
                type="text"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-white"
                placeholder="Enter quiz name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300 ">
                Description
              </label>
              <textarea
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-white"
                placeholder="Enter quiz description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuiz}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Delete Quiz
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  "{quizToDelete?.title}"
                </span>
                ?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start">
                  <svg
                    className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z"
                    />
                  </svg>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-normal">
                      This action cannot be undone. The quiz and all its
                      questions will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setQuizToDelete(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 hover:cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuiz}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 hover:cursor-pointer"
              >
                Delete Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SessionsPage;
