import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Clock,
  Zap,
  SkipForward,
  Timer,
  Medal,
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

  // HOST_CONTROLLED mode states
  const [selectedMode, setSelectedMode] = useState("ONE_SHOT");
  const [questionDuration, setQuestionDuration] = useState(30);
  const [templateValidation, setTemplateValidation] = useState(null);
  const [validatingTemplate, setValidatingTemplate] = useState(false);
  
  // HOST_CONTROLLED live states
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [answerCount, setAnswerCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionResults, setQuestionResults] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosingQuestion, setIsClosingQuestion] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Ref to track current activeQuiz for socket handlers (avoids stale closure during race conditions)
  const activeQuizRef = useRef(activeQuiz);
  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

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

  // Validate template for mode compatibility
  const validateTemplate = useCallback(async (templateId, mode) => {
    if (!templateId || mode !== "HOST_CONTROLLED") {
      setTemplateValidation(null);
      return;
    }
    
    setValidatingTemplate(true);
    try {
      const res = await api.get(`/api/live-quizzes/validate-template?templateId=${templateId}&mode=${mode}`);
      setTemplateValidation(res.data);
    } catch (err) {
      console.error("Failed to validate template:", err);
      setTemplateValidation({ compatible: false, issues: ["Failed to validate template"] });
    } finally {
      setValidatingTemplate(false);
    }
  }, []);

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
        // Initialize HC state if applicable
        if (liveQuiz.mode === "HOST_CONTROLLED") {
          setCurrentQuestionIndex(liveQuiz.currentQuestionIndex ?? -1);
          setLeaderboard(liveQuiz.leaderboard || []);
        }
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
      setSelectedMode("ONE_SHOT");
      setSelectedTemplate(null);
      setTemplateValidation(null);
    }
  }, [showQuizImport]);

  // Validate template when selection or mode changes
  useEffect(() => {
    if (selectedTemplate && selectedMode === "HOST_CONTROLLED") {
      validateTemplate(selectedTemplate._id, selectedMode);
    } else {
      setTemplateValidation(null);
    }
  }, [selectedTemplate, selectedMode, validateTemplate]);

  // Socket listeners for quiz events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // ONE_SHOT mode submission handler
    const onNewSubmission = ({ quizId, participantId, submissionId }) => {
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && currentQuiz._id === quizId) {
        fetchQuizResults(quizId);
      }
    };

    // HOST_CONTROLLED: answer received notification
    const onHCAnswerReceived = ({ quizId, questionId, participantId, participantName }) => {
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && currentQuiz._id === quizId) {
        setAnswerCount(prev => prev + 1);
      }
    };

    // HOST_CONTROLLED: question published (both host and participants receive this)
    const onHCQuestion = (data) => {
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && currentQuiz._id === data.quizId) {
        setCurrentQuestion(data.question);
        setCurrentQuestionIndex(data.questionIndex);
        setIsPublishing(false);
        setShowLeaderboard(false);
        setQuestionResults(null);
        console.log("📥 Question published:", data.questionIndex + 1);
      }
    };

    // HOST_CONTROLLED: question results
    const onHCResults = (data) => {
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && currentQuiz._id === data.quizId) {
        setQuestionResults(data);
        setLeaderboard(data.leaderboard || []);
        setShowLeaderboard(true);
        setIsClosingQuestion(false);
      }
    };

    // HOST_CONTROLLED: final results
    const onHCFinal = (data) => {
      const currentQuiz = activeQuizRef.current;
      if (currentQuiz && currentQuiz._id === data.quizId) {
        setLeaderboard(data.leaderboard || []);
        setShowLeaderboard(true);
        setActiveQuiz(prev => ({ ...prev, status: "CLOSED" }));
        setPastQuizzes(prev => [{ ...currentQuiz, status: "CLOSED" }, ...prev]);
      }
    };

    // HOST_CONTROLLED: error handler
    const onHCError = ({ error }) => {
      console.error("HOST_CONTROLLED error:", error);
      alert(error);
      setIsPublishing(false);
      setIsClosingQuestion(false);
    };

    socket.on("quiz:new:submission", onNewSubmission);
    socket.on("quiz:hc:answer:received", onHCAnswerReceived);
    socket.on("quiz:hc:question", onHCQuestion);
    socket.on("quiz:hc:results", onHCResults);
    socket.on("quiz:hc:final", onHCFinal);
    socket.on("quiz:hc:error", onHCError);

    return () => {
      socket.off("quiz:new:submission", onNewSubmission);
      socket.off("quiz:hc:answer:received", onHCAnswerReceived);
      socket.off("quiz:hc:question", onHCQuestion);
      socket.off("quiz:hc:results", onHCResults);
      socket.off("quiz:hc:final", onHCFinal);
      socket.off("quiz:hc:error", onHCError);
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
    
    // Check validation for HOST_CONTROLLED
    if (selectedMode === "HOST_CONTROLLED" && templateValidation && !templateValidation.compatible) {
      alert("This template is not compatible with HOST_CONTROLLED mode.");
      return;
    }
    
    setLaunching(true);
    try {
      // Create live quiz from template with mode
      const createRes = await api.post("/api/live-quizzes", {
        sessionId: sessionData._id,
        templateId: selectedTemplate._id,
        mode: selectedMode,
        questionDurationSeconds: selectedMode === "HOST_CONTROLLED" ? questionDuration : undefined,
      });

      // Launch the quiz
      const launchRes = await api.post(`/api/live-quizzes/${createRes.data._id}/launch`);
      
      setActiveQuiz(launchRes.data.quiz);
      setShowQuizImport(false);
      setSelectedTemplate(null);
      setQuizSubmissions([]);
      
      // Reset HC states
      if (selectedMode === "HOST_CONTROLLED") {
        setCurrentQuestionIndex(-1);
        setCurrentQuestion(null);
        setAnswerCount(0);
        setLeaderboard([]);
        setQuestionResults(null);
        setShowLeaderboard(false);
      }
      
      console.log("✅ Quiz launched successfully in", selectedMode, "mode");
    } catch (err) {
      console.error("Failed to launch quiz:", err);
      alert(err.response?.data?.error || "Failed to launch quiz. Please try again.");
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
    // Reset HC states
    setCurrentQuestionIndex(-1);
    setCurrentQuestion(null);
    setAnswerCount(0);
    setLeaderboard([]);
    setQuestionResults(null);
    setShowLeaderboard(false);
    fetchSessionQuizzes();
  };

  // HOST_CONTROLLED: Publish next question
  const handlePublishQuestion = useCallback(() => {
    const socket = socketRef.current;
    if (!activeQuiz || !socket || isPublishing) return;
    
    setIsPublishing(true);
    setAnswerCount(0);
    // Note: showLeaderboard, questionResults, and currentQuestion 
    // will be updated when quiz:hc:question event is received
    
    socket.emit("quiz:hc:publish", {
      quizId: activeQuiz._id,
    });
    
    console.log("📤 Publishing next question...");
  }, [activeQuiz, socketRef, isPublishing]);

  // HOST_CONTROLLED: Close current question (stop accepting answers)
  const handleCloseCurrentQuestion = useCallback(() => {
    const socket = socketRef.current;
    if (!activeQuiz || !socket || isClosingQuestion || currentQuestionIndex < 0) return;
    
    setIsClosingQuestion(true);
    
    socket.emit("quiz:hc:close", {
      quizId: activeQuiz._id,
    });
    
    // Results will arrive via quiz:hc:results event
    console.log("📤 Closing current question...");
  }, [activeQuiz, socketRef, isClosingQuestion, currentQuestionIndex]);

  // HOST_CONTROLLED: End the entire quiz
  const handleEndHCQuiz = useCallback(() => {
    const socket = socketRef.current;
    if (!activeQuiz || !socket) return;
    
    const confirmEnd = window.confirm(
      "Are you sure you want to end the quiz? This will show final results to all participants."
    );
    
    if (!confirmEnd) return;
    
    socket.emit("quiz:hc:end", {
      quizId: activeQuiz._id,
    });
    
    console.log("📤 Ending HOST_CONTROLLED quiz...");
  }, [activeQuiz, socketRef]);

  // Render mode selector for import modal
  const renderModeSelector = () => (
    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-amber-500" />
        <span className="font-semibold text-slate-900 dark:text-white">Quiz Mode</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSelectedMode("ONE_SHOT")}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            selectedMode === "ONE_SHOT"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="font-semibold text-slate-900 dark:text-white mb-1">One Shot</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Students see all questions at once and submit when ready
          </div>
        </button>
        
        <button
          onClick={() => setSelectedMode("HOST_CONTROLLED")}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            selectedMode === "HOST_CONTROLLED"
              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/30"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
          }`}
        >
          <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            Host Controlled
            <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              Kahoot-style
            </span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            You control question timing. Speed bonus scoring!
          </div>
        </button>
      </div>
      
      {selectedMode === "HOST_CONTROLLED" && (
        <>
          {/* Duration slider */}
          <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Time per question
                </span>
              </div>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {questionDuration}s
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={questionDuration}
              onChange={(e) => setQuestionDuration(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>10s</span>
              <span>120s</span>
            </div>
          </div>
          
          {/* Validation warning */}
          {validatingTemplate && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating template compatibility...
            </div>
          )}
          
          {templateValidation && !templateValidation.compatible && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-700 dark:text-red-300">
                    Incompatible Template
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {templateValidation.reason}
                  </div>
                  {templateValidation.invalidQuestions?.length > 0 && (
                    <div className="text-xs text-red-500 mt-2">
                      Questions with issues: {templateValidation.invalidQuestions.map(q => q.index + 1).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {templateValidation && templateValidation.compatible && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Template compatible with Host Controlled mode</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

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
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {template.title}
                      </h3>
                      {selectedTemplate?._id === template._id && (
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {template.description || "No description"}
                    </p>
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
          
          {/* Mode Selector - show when template is selected */}
          {selectedTemplate && renderModeSelector()}
        </div>

        {/* Launch Button */}
        {selectedTemplate && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              onClick={handleLaunchQuiz}
              disabled={launching || validatingTemplate || (selectedMode === "HOST_CONTROLLED" && templateValidation && !templateValidation.compatible)}
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
                  Launch {selectedMode === "HOST_CONTROLLED" ? "Host Controlled" : ""} Quiz
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
          className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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

  // Render HOST_CONTROLLED quiz control panel
  const renderHCControlPanel = () => {
    const totalQuestions = activeQuiz?.questions?.length || 0;
    const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
    const hasStarted = currentQuestionIndex >= 0;
    
    return (
      <div className="space-y-6">
        {/* Quiz Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wide">
                  🎮 Host Controlled
                </span>
                <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-semibold">
                  {activeQuiz.status === "LIVE" ? "🔴 Live" : "Closed"}
                </span>
              </div>
              <h2 className="text-2xl font-bold">{activeQuiz.title}</h2>
              <p className="text-amber-100 mt-1">
                Question {Math.max(0, currentQuestionIndex + 1)} of {totalQuestions}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{questionDuration}s</div>
              <div className="text-amber-200 text-sm">per question</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/80 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-amber-200" />
              <div className="text-2xl font-bold">{answerCount}</div>
              <div className="text-amber-200 text-sm">Answers Received</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Medal className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
              <div className="text-2xl font-bold">{leaderboard.length}</div>
              <div className="text-amber-200 text-sm">On Leaderboard</div>
            </div>
          </div>
        </div>

        {/* Current Question Display */}
        {currentQuestion && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                Current Question
              </h3>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">
                {currentQuestion.points} points
              </span>
            </div>
            <p className="text-lg text-slate-800 dark:text-slate-200 mb-4">
              {currentQuestion.questionText}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options?.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border-2 ${
                    questionResults
                      ? opt.isCorrect
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : "border-slate-200 dark:border-slate-700"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span className="text-slate-700 dark:text-slate-300">
                    {String.fromCharCode(65 + idx)}. {opt.optionText}
                  </span>
                  {questionResults && opt.isCorrect && (
                    <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Results / Leaderboard */}
        {showLeaderboard && questionResults && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No scores yet
                </div>
              ) : (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.participantId}
                    className="p-4 flex items-center justify-between"
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
                      <span className="font-medium text-slate-900 dark:text-white">
                        {entry.participantName}
                      </span>
                    </div>
                    <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                      {entry.totalScore.toFixed(2)} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        {activeQuiz.status === "LIVE" && (
          <div className="space-y-3">
            {/* Main Action Button */}
            <div className="flex gap-3">
              {!hasStarted && !isPublishing ? (
                // Not started yet - show Start Quiz button
                <button
                  onClick={handlePublishQuestion}
                  disabled={isPublishing}
                  className="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Start Quiz - Show First Question
                </button>
              ) : isPublishing ? (
                // Publishing in progress - show loading state
                <div className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg opacity-75">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing Question...
                </div>
              ) : showLeaderboard && questionResults ? (
                // Showing leaderboard - can publish next or end
                !isLastQuestion ? (
                  <button
                    onClick={handlePublishQuestion}
                    disabled={isPublishing}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                  >
                    <SkipForward className="w-5 h-5" />
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleEndHCQuiz}
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
                  >
                    <Trophy className="w-5 h-5" />
                    Show Final Results
                  </button>
                )
              ) : currentQuestion && !questionResults ? (
                // Question is active - show close button
                <button
                  onClick={handleCloseCurrentQuestion}
                  disabled={isClosingQuestion}
                  className="flex-1 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                >
                  {isClosingQuestion ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                  Close Question & Show Results
                </button>
              ) : null}
            </div>
            
            {/* End Quiz Early Button - always visible when quiz has started */}
            {hasStarted && !isLastQuestion && (
              <button
                onClick={handleEndHCQuiz}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800"
              >
                <Square className="w-4 h-4" />
                End Quiz Early
              </button>
            )}
          </div>
        )}

        {activeQuiz.status === "CLOSED" && (
          <button
            onClick={handleBackToQuizList}
            className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quiz List
          </button>
        )}
      </div>
    );
  };

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
        activeQuiz.mode === "HOST_CONTROLLED" ? renderHCControlPanel() : renderActiveQuiz()
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
