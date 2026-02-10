import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileQuestion, Calendar, Target, Award, Plus, Trash2 } from "lucide-react";

/* Components import  */
import AllSessionsTable from "../../components/Host/dashboard/AllSessionsTable";
import QuizCreation from "../../components/Host/QuizCreation";

/* Api import */
import api from "../../utils/api";

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
      const response = await api.get('/api/quiz-templates');
      setQuizzes(response.data);
    } catch (err) {
      console.error('Error loading quizzes:', err);
      setError('Failed to load quizzes. Please try again.');
      // Fallback to localStorage if API fails
      setQuizzes(JSON.parse(localStorage.getItem('quizzes') || '[]'));
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
    navigate("/test/sessionWorkspace", {
      state: {
        sessionId: session._id,
        sessionData: session,
        roomId: session.roomId,
        roomName: session.roomName || "",
      },
    });
  };

  const handleCreateQuiz = () => {
    if (quizName.trim()) {
      setEditingQuiz(null); // Ensure it's a new quiz
      setIsQuizCreated(true);
      setIsModalOpen(false);
    } else {
      alert("Please enter a quiz name.");
    }
  };

  const handleEditQuiz = async (quiz) => {
    try {
      // Fetch full quiz details from API
      const response = await api.get(`/api/quiz-templates/${quiz._id}`);
      const fullQuiz = response.data;
      
      setEditingQuiz(fullQuiz);
          console.log("Updating existing quiz...",fullQuiz);
      setQuizName(fullQuiz.title);
      setQuizDescription(fullQuiz.description || "");
      setIsQuizCreated(true);
    } catch (err) {
      console.error('Error loading quiz details:', err);
      alert('Failed to load quiz details. Please try again.');
    }
  };

  const handleDeleteQuiz = (quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      // Delete from API
      await api.delete(`/api/quiz-templates/${quizToDelete._id}`);
      
      
      // Update local state
      setQuizzes(quizzes.filter(q => q._id !== quizToDelete._id));
      setShowDeleteConfirm(false);
      setQuizToDelete(null);
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert('Failed to delete quiz. Please try again.');
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading quizzes...</span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z" />
                  </svg>
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
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
                  className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors min-h-[280px]"
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
            ) : !isLoading && !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create Quiz Card */}
                <div
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors min-h-[280px]"
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
                    className="group relative bg-white dark:bg-slate-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden hover:-translate-y-1"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Header with icon */}
                    <div className="relative p-6 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                            <FileQuestion className="text-blue-600 dark:text-blue-400" size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {quiz.title}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Quiz
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      {/* Description */}
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                        {quiz.description || "No description provided"}
                      </p>
                    </div>

                    {/* Stats section */}
                    <div className="relative px-6 pb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                          <Target className="text-slate-500 dark:text-slate-400 flex-shrink-0" size={16} />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Questions</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{quiz.questionsCount || 0}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                          <Award className="text-slate-500 dark:text-slate-400 flex-shrink-0" size={16} />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Points</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{quiz.totalPoints}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer with date */}
                    <div className="relative px-6 pb-6">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Calendar size={14} />
                        <span>Created {new Date(quiz.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </div>

                    {/* Subtle border animation */}
                    <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors duration-300"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="Enter quiz name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
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
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{quizToDelete?.title}"</span>?
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <div className="flex items-start">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5C3.962 16.333 4.924 18 6.464 18z" />
                  </svg>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-normal">This action cannot be undone. The quiz and all its questions will be permanently deleted.</p>
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
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuiz}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
