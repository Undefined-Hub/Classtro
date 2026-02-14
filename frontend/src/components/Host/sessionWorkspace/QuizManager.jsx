import React, { useEffect, useState } from "react";
import api from "../../../utils/api";
import { useHostSession } from "../../../context/HostSessionContext";
import {
  FileQuestion,
  Users,
  Play,
  Square,
  Import,
  CheckCircle,
  XCircle,
  Trophy,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  Target,
  Award,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

const QuizManager = ({ isParticipantListOpen = true }) => {
  const {
    socketRef,
    sessionData,
    activeQuiz,
    setActiveQuiz,
    quizSubmissions,
    setQuizSubmissions,
    showQuizImport,
    setShowQuizImport,
    pastQuizzes,
    setPastQuizzes,
    setActiveView,
  } = useHostSession();

  // Local states
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch quiz templates
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get("/api/quiz-templates");
      setTemplates(res.data);
    } catch (err) {
      console.error("Failed to fetch quiz templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fetch past quizzes for this session
  const fetchSessionQuizzes = async () => {
    if (!sessionData?._id) return;
    try {
      const res = await api.get(`/api/live-quizzes/session/${sessionData._id}`);
      const quizzes = res.data || [];
      
      // Find active quiz
      const liveQuiz = quizzes.find((q) => q.status === "LIVE");
      if (liveQuiz) {
        setActiveQuiz(liveQuiz);
      }
      
      // Set past quizzes (closed ones)
      setPastQuizzes(quizzes.filter((q) => q.status === "CLOSED"));
    } catch (err) {
      console.error("Failed to fetch session quizzes:", err);
    }
  };

  useEffect(() => {
    fetchSessionQuizzes();
  }, [sessionData?._id]);

  // Fetch templates when import modal opens
  useEffect(() => {
    if (showQuizImport) {
      fetchTemplates();
    }
  }, [showQuizImport]);

  // Socket listeners for quiz events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onNewSubmission = ({ quizId, participantId, submissionId }) => {
      if (activeQuiz && activeQuiz._id === quizId) {
        // Fetch updated submissions
        fetchQuizResults(quizId);
      }
    };

    socket.on("quiz:new:submission", onNewSubmission);

    return () => {
      socket.off("quiz:new:submission", onNewSubmission);
    };
  }, [activeQuiz, socketRef]);

  // Fetch quiz results
  const fetchQuizResults = async (quizId) => {
    try {
      const res = await api.get(`/api/live-quizzes/${quizId}/results`);
      setQuizSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("Failed to fetch quiz results:", err);
    }
  };

  // Launch quiz from template
  const handleLaunchQuiz = async () => {
    if (!selectedTemplate || !sessionData?._id) return;
    
    setLaunching(true);
    try {
      // Create live quiz from template
      const createRes = await api.post("/api/live-quizzes", {
        sessionId: sessionData._id,
        templateId: selectedTemplate._id,
      });

      // Launch the quiz
      const launchRes = await api.post(`/api/live-quizzes/${createRes.data._id}/launch`);
      
      setActiveQuiz(launchRes.data.quiz);
      setShowQuizImport(false);
      setSelectedTemplate(null);
      setQuizSubmissions([]);
      
      console.log("✅ Quiz launched successfully");
    } catch (err) {
      console.error("Failed to launch quiz:", err);
      alert("Failed to launch quiz. Please try again.");
    } finally {
      setLaunching(false);
    }
  };

  // Close active quiz
  const handleCloseQuiz = async () => {
    if (!activeQuiz) return;
    
    setClosing(true);
    try {
      await api.post(`/api/live-quizzes/${activeQuiz._id}/close`);
      
      // Move to past quizzes
      setPastQuizzes((prev) => [{ ...activeQuiz, status: "CLOSED" }, ...prev]);
      setShowResults(true);
      
      // Fetch final results
      await fetchQuizResults(activeQuiz._id);
      
      // Keep activeQuiz for results display
      setActiveQuiz((prev) => ({ ...prev, status: "CLOSED" }));
      
      console.log("✅ Quiz closed successfully");
    } catch (err) {
      console.error("Failed to close quiz:", err);
      alert("Failed to close quiz. Please try again.");
    } finally {
      setClosing(false);
    }
  };

  // Reset to main quiz view
  const handleBackToQuizList = () => {
    setShowResults(false);
    setActiveQuiz(null);
    setQuizSubmissions([]);
    fetchSessionQuizzes();
  };

  // Render import modal
  const renderImportModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <Import className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Import Quiz Template
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Select a quiz to launch in this session
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowQuizImport(false);
                setSelectedTemplate(null);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <FileQuestion className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Quiz Templates
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                Create quiz templates from the Sessions page first.
              </p>
              <button
                onClick={() => setActiveView("main")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Sessions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template._id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTemplate?._id === template._id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {template.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {template.description || "No description"}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedTemplate?._id === template._id
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedTemplate?._id === template._id && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Target className="w-3.5 h-3.5" />
                      {(template.questionsCount ?? template.questions?.length ?? 0)} questions
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Award className="w-3.5 h-3.5" />
                      {template.totalPoints} points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Launch Button */}
        {selectedTemplate && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handleLaunchQuiz}
              disabled={launching}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
            >
              {launching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Launch Quiz
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Render active quiz view
  const renderActiveQuiz = () => (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wide">
                {activeQuiz.status === "LIVE" ? "🔴 Live" : "Closed"}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{activeQuiz.title}</h2>
            <p className="text-blue-100 mt-1">
              {activeQuiz.questions?.length || 0} questions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-200" />
            <div className="text-2xl font-bold">{quizSubmissions.length}</div>
            <div className="text-blue-200 text-sm">Submissions</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-200" />
            <div className="text-2xl font-bold">
              {quizSubmissions.length > 0
                ? Math.round(
                    quizSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) /
                      quizSubmissions.length
                  )
                : 0}
              %
            </div>
            <div className="text-blue-200 text-sm">Avg Score</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
            <div className="text-2xl font-bold">
              {quizSubmissions.length > 0 ? quizSubmissions[0]?.score || 0 : 0}
            </div>
            <div className="text-blue-200 text-sm">Top Score</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {activeQuiz.status === "LIVE" && (
        <div className="flex gap-3">
          <button
            onClick={() => fetchQuizResults(activeQuiz._id)}
            className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            Refresh Results
          </button>
          <button
            onClick={handleCloseQuiz}
            disabled={closing}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {closing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            End Quiz
          </button>
        </div>
      )}

      {activeQuiz.status === "CLOSED" && (
        <button
          onClick={handleBackToQuizList}
          className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Quiz List
        </button>
      )}

      {/* Submissions List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            Submissions ({quizSubmissions.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
          {quizSubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p>No submissions yet</p>
              <p className="text-sm mt-1">Waiting for students to submit...</p>
            </div>
          ) : (
            quizSubmissions.map((submission, index) => (
              <div
                key={submission._id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                        : index === 1
                        ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        : index === 2
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {submission.participantId?.name || "Anonymous"}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {submission.isLate && (
                        <span className="text-orange-500 mr-2">Late</span>
                      )}
                      Submitted{" "}
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-slate-900 dark:text-white">
                    {submission.score}/{submission.maxScore}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      submission.percentage >= 70
                        ? "text-green-600 dark:text-green-400"
                        : submission.percentage >= 40
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {Math.round(submission.percentage)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div
      className={`p-4 lg:p-6 mx-auto transition-all duration-300 ${
        isParticipantListOpen ? "max-w-3xl" : "max-w-4xl"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView("main")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              Quiz Manager
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Launch and manage quizzes for your session
            </p>
          </div>
        </div>
        {!activeQuiz && (
          <button
            onClick={() => setShowQuizImport(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/25"
          >
            <Import className="w-5 h-5" />
            Import Quiz
          </button>
        )}
      </div>

      {/* Content */}
      {activeQuiz ? (
        renderActiveQuiz()
      ) : (
        <div className="space-y-6">
          {/* Empty State or Past Quizzes */}
          {pastQuizzes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
              <FileQuestion className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                No Quizzes Yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Import a quiz template to launch an interactive quiz for your
                students.
              </p>
              <button
                onClick={() => setShowQuizImport(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
              >
                <Import className="w-5 h-5" />
                Import Quiz Template
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Past Quizzes
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastQuizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    onClick={() => {
                      setActiveQuiz(quiz);
                      fetchQuizResults(quiz._id);
                    }}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <FileQuestion className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {quiz.title}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {quiz.questions?.length || 0} questions • Closed{" "}
                          {new Date(quiz.closedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showQuizImport && renderImportModal()}
    </div>
  );
};

export default QuizManager;
