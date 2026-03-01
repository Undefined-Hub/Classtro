import { useState } from "react";
import {
  ArrowLeft,
  Save,
  PlusCircle,
  Plus,
  PlusSquare,
  Edit,
  Trash2,
  BarChart3,
  Circle,
  CheckCircle,
  X,
  HelpCircle,
  Bot,
  Cpu,
} from "lucide-react";
import api from "../../utils/api";
import AIQuizGenerator from "./AIQuizGenerator";

function QuizCreation({ quizName, quizDescription, onBack, existingQuiz }) {
  const [questions, setQuestions] = useState(
    existingQuiz ? existingQuiz.questions : [],
  );
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [optionIds, setOptionIds] = useState([null, null]); // Store _ids alongside options
  const [questionType, setQuestionType] = useState("MCQ");
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctIndices, setCorrectIndices] = useState([0]); // For MULTI_SELECT
  const [points, setPoints] = useState(1);
  const [negativePoints, setNegativePoints] = useState(0);
  const [showNegativePoints, setShowNegativePoints] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const handleAddQuestion = () => {
    if (currentQuestion.trim() && options.every((opt) => opt.trim())) {
      const optionObjects = options.map((text, index) => {
        // Preserve existing _id if available, otherwise create temp optionId
        if (optionIds[index]) {
          return {
            _id: optionIds[index],
            text,
          };
        }
        return {
          optionId: `opt_${Date.now()}_${index}`,
          text,
        };
      });

      // Determine correct answers based on question type
      let correctAnswerIndices = [];
      if (questionType === "MULTI_SELECT") {
        correctAnswerIndices = correctIndices;
      } else {
        correctAnswerIndices = [correctIndex];
      }

      const newQuestion = {
        type: questionType,
        questionText: currentQuestion,
        options: optionObjects,
        correctAnswers: correctAnswerIndices.map(
          (idx) => optionObjects[idx]._id || optionObjects[idx].optionId,
        ),
        points,
        negativePoints: negativePoints || undefined,
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion("");
      setOptions(["", ""]);
      setOptionIds([null, null]);
      setQuestionType("MCQ");
      setCorrectIndex(0);
      setCorrectIndices([0]);
      setPoints(1);
      setNegativePoints(0);
    } else {
      alert("Please fill in the question and all options.");
    }
  };

  // Receive generated questions from AI generator and append to questions state
  const handleAIQuestionsGenerated = (generated) => {
    if (!Array.isArray(generated) || generated.length === 0) return;
    // Ensure optionIds exist and do not conflict
    const timestamp = Date.now();
    const normalized = generated.map((q, qi) => ({
      type: q.type || "MCQ",
      questionText: q.questionText || "",
      options: (q.options || []).map((opt, oi) => ({
        optionId: opt.optionId || `ai_${timestamp}_${qi}_${oi}`,
        text: opt.text || String(opt),
      })),
      correctAnswers: (q.correctAnswers || []).map((a) => String(a)),
      points: typeof q.points === "number" ? q.points : 1,
      negativePoints:
        typeof q.negativePoints === "number" ? q.negativePoints : 0,
    }));

    setQuestions((prev) => [...prev, ...normalized]);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
      setOptionIds([...optionIds, null]); // New option has no _id yet
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      const newOptionIds = optionIds.filter((_, i) => i !== index);
      setOptions(newOptions);
      setOptionIds(newOptionIds);
      if (correctIndex >= newOptions.length) {
        setCorrectIndex(newOptions.length - 1);
      }
    }
  };

  const handleEditQuestion = (index) => {
    const q = questions[index];
    setCurrentQuestion(q.questionText);
    setOptions(q.options.map((opt) => opt.text));
    setOptionIds(q.options.map((opt) => opt._id || null)); // Preserve _ids
    setQuestionType(q.type || "MCQ");

    // Set correct indices based on question type
    const correctIndicesArray = q.options
      .map((opt, idx) => {
        const optionId = opt._id || opt.optionId;
        return q.correctAnswers.includes(optionId) ? idx : -1;
      })
      .filter((idx) => idx !== -1);

    if (q.type === "MULTI_SELECT") {
      setCorrectIndices(
        correctIndicesArray.length > 0 ? correctIndicesArray : [0],
      );
    } else {
      setCorrectIndex(
        correctIndicesArray.length > 0 ? correctIndicesArray[0] : 0,
      );
    }

    setPoints(q.points);
    setNegativePoints(q.negativePoints || 0);
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleDeleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const handleSaveQuiz = async () => {
    setIsSaving(true);

    try {
      if (existingQuiz) {
        // Update existing quiz template
        const quizObject = {
          title: quizName,
          description: quizDescription,
          questions,
          totalPoints,
          updatedAt: new Date().toISOString(),
        };

        const res = await api.put(
          `/api/quiz-templates/${existingQuiz._id}`,
          quizObject,
        );

        if (res.status === 200 || res.status === 204) {
          // Update localStorage as backup
          const existingQuizzes = JSON.parse(
            localStorage.getItem("quizzes") || "[]",
          );
          const index = existingQuizzes.findIndex(
            (q) => q._id === existingQuiz._id,
          );
          if (index !== -1) {
            existingQuizzes[index] = {
              ...existingQuiz,
              title: quizName,
              description: quizDescription,
              questions,
              totalPoints,
              updatedAt: new Date().toISOString(),
            };
          }
          localStorage.setItem("quizzes", JSON.stringify(existingQuizzes));

          alert("Quiz updated successfully!");
          onBack();
          return;
        } else {
          throw new Error("Failed to update quiz");
        }
      }

      // Transform questions to match API format for new quizzes
      const timestamp = Date.now();
      const transformedQuestions = questions.map((question) => ({
        type: question.type,
        questionText: question.questionText,
        options: question.options.map((option, index) => ({
          optionId: `opt${timestamp}_${index}`,
          text: option.text,
        })),
        correctAnswers: question.correctAnswers.map((answerId) => {
          // Find the option and get its new optionId
          const optionIndex = question.options.findIndex(
            (opt) => opt.optionId === answerId,
          );
          return `opt${timestamp}_${optionIndex}`;
        }),
        points: question.points,
        negativePoints: question.negativePoints || 0,
      }));

      const quizPayload = {
        title: quizName,
        description: quizDescription,
        roomId: null,
        questions: transformedQuestions,
      };

      // Make API call
      const response = await api.post("/api/quiz-templates", quizPayload);

      if (response.status === 201) {
        // Save to localStorage as backup
        const quizObject = {
          _id: response.data._id || `quiz_${Date.now()}`,
          title: quizName,
          description: quizDescription,
          createdBy: response.data.createdBy || "teacherId_placeholder",
          roomId: response.data.roomId || null,
          questions,
          totalPoints,
          createdAt: response.data.createdAt || new Date().toISOString(),
          updatedAt: response.data.updatedAt || new Date().toISOString(),
        };

        const existingQuizzes = JSON.parse(
          localStorage.getItem("quizzes") || "[]",
        );
        existingQuizzes.push(quizObject);
        localStorage.setItem("quizzes", JSON.stringify(existingQuizzes));

        alert("Quiz saved successfully!");
        onBack();
      } else {
        throw new Error("Failed to save quiz");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      console.error("Error response:", error.response?.data);

      // Fallback to localStorage only
      const quizObject = {
        _id: existingQuiz ? existingQuiz._id : `quiz_${Date.now()}`,
        title: quizName,
        description: quizDescription,
        createdBy: existingQuiz
          ? existingQuiz.createdBy
          : "teacherId_placeholder",
        roomId: existingQuiz ? existingQuiz.roomId : null,
        questions,
        totalPoints,
        createdAt: existingQuiz
          ? existingQuiz.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const existingQuizzes = JSON.parse(
        localStorage.getItem("quizzes") || "[]",
      );
      if (existingQuiz) {
        const index = existingQuizzes.findIndex(
          (q) => q._id === existingQuiz._id,
        );
        if (index !== -1) {
          existingQuizzes[index] = quizObject;
        }
      } else {
        existingQuizzes.push(quizObject);
      }
      localStorage.setItem("quizzes", JSON.stringify(existingQuizzes));

      alert(
        `API call failed, but quiz saved locally. ${existingQuiz ? "Quiz updated successfully!" : "Quiz saved successfully!"}`,
      );
      onBack();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this quiz?")) {
      onBack();
    }
  };

  return (
    <div className="text-slate-900 dark:text-slate-100 min-h-screen">
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #64748b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        
        @keyframes glow-border {
          0%, 100% {
            box-shadow: 0 0 5px rgba(147, 51, 234, 0.3), 0 0 10px rgba(147, 51, 234, 0.2);
            border-color: rgba(147, 51, 234, 0.4);
          }
          50% {
            box-shadow: 0 0 15px rgba(147, 51, 234, 0.5), 0 0 25px rgba(147, 51, 234, 0.3), 0 0 35px rgba(147, 51, 234, 0.1);
            border-color: rgba(147, 51, 234, 0.7);
          }
        }
        
        .dark .ai-glow-button {
          animation: glow-border 3s ease-in-out infinite;
        }
        
        .ai-glow-button {
          animation: glow-border 3s ease-in-out infinite;
        }
        `}
      </style>

      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 justify-center">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                {existingQuiz ? "Editing" : "Draft"}
              </span>
              <span className="text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <BarChart3 size={14} />
                Total Points:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {totalPoints}
                </span>
              </span>
              <button
                onClick={() => setShowNegativePoints(!showNegativePoints)}
                className={`px-3 py-1 rounded-full text-xs  tracking-wider border transition-all ${
                  showNegativePoints
                    ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                Negative Points: {showNegativePoints ? "ON" : "OFF"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="px-5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
            >
              Discard
            </button>
            <button
              onClick={handleSaveQuiz}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-6 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Question Creation Form */}
          <section className="lg:col-span-5 xl:col-span-7">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-5">
              <div className="flex items-center gap-3 mb-4 justify-between">
                <div className="flex justify-center items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <PlusCircle
                      className="text-blue-600 dark:text-blue-400"
                      size={20}
                    />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Add New Question
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAIGenerator(!showAIGenerator)}
                  title={
                    showAIGenerator ? "Hide AI Generator" : "Show AI Generator"
                  }
                  className="ml-3 p-2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 border-1 border-transparent ai-glow-button"
                >
                  <Bot
                    size={18}
                    className="text-purple-600 dark:text-purple-400"
                  />
                  <span className="text-sm font-semibold">Clario</span>
                </button>
              </div>

              {showAIGenerator && (
                <AIQuizGenerator
                  onGenerate={handleAIQuestionsGenerated}
                  defaultPoints={points}
                  maxQuestions={15}
                />
              )}

              <form className="space-y-4">
                {/* Question Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Question Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["MCQ", "MULTI_SELECT"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setQuestionType(type);
                          setCorrectIndex(0);
                          setCorrectIndices([0]);
                        }}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                          questionType === type
                            ? "bg-blue-600 dark:bg-blue-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {type === "MULTI_SELECT" ? "Multi-Select" : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Question
                    </label>
                    <div className="flex items-center gap-3">
                      {showNegativePoints && (
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Penalty:
                          </label>
                          <input
                            value={negativePoints}
                            onChange={(e) =>
                              setNegativePoints(parseInt(e.target.value) || 0)
                            }
                            className="w-14 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-center text-xs"
                            type="number"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition-all text-sm"
                    placeholder="Enter your question here..."
                    rows="2"
                  />
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Answer Options{" "}
                    {questionType === "MULTI_SELECT" && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        (select all correct)
                      </span>
                    )}
                  </label>
                  <div className="space-y-2">
                    {options.map((option, index) => {
                      const isMulti = questionType === "MULTI_SELECT";
                      const isSelected = isMulti
                        ? correctIndices.includes(index)
                        : correctIndex === index;
                      return (
                        <div key={index} className="relative group">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                if (isMulti) {
                                  const newIndices = correctIndices.includes(
                                    index,
                                  )
                                    ? correctIndices.filter((i) => i !== index)
                                    : [...correctIndices, index];
                                  setCorrectIndices(
                                    newIndices.length > 0 ? newIndices : [0],
                                  );
                                } else {
                                  setCorrectIndex(index);
                                }
                              }}
                              className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-all ${
                                isMulti ? "rounded-lg" : "rounded-full"
                              } ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 dark:bg-emerald-400 dark:border-emerald-400"
                                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-white" />
                              )}
                            </button>
                            <input
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(index, e.target.value)
                              }
                              className="flex-1 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                              placeholder={`Option ${index + 1}`}
                              type="text"
                            />
                            {options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors mt-2 px-2.5 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      <Plus size={14} /> Add Another Option
                    </button>
                  )}
                </div>

                {/* Add Question Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-bold transition-all transform active:scale-95 flex items-center gap-2 text-sm"
                  >
                    <PlusSquare size={18} />
                    Add Question
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Questions List Sidebar */}
          <aside className="lg:col-span-7 xl:col-span-5">
            <div className="sticky top-8 flex flex-col h-[calc(100vh-200px)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Added Questions
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                    {questions.length}
                  </span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {questions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-xl text-center">
                    <div className="text-slate-400 dark:text-slate-500 mb-2">
                      <PlusCircle size={48} className="mx-auto opacity-30" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      No questions added yet
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Start by adding your first question
                    </p>
                  </div>
                ) : (
                  questions.map((q, index) => (
                    <div
                      key={q._id}
                      className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-center gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            {q.type || "MCQ"} • Q{index + 1}
                          </span>
                        </div>
                        <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg opacity-100">
                            +{q.points}
                          </span>
                          {(q.negativePoints || 0) > 0 && (
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg opacity-100">
                              -{q.negativePoints}
                            </span>
                          )}
                          <button
                            onClick={() => handleEditQuestion(index)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(index)}
                            className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default QuizCreation;
