import React, { useState } from "react";
import { ArrowLeft, Save, PlusCircle, Plus, PlusSquare, Edit, Trash2, BarChart3, MessageCircle, CircleDot, Circle, CheckCircle, X, HelpCircle } from "lucide-react";
import api from "../../utils/api";

function QuizCreation({ quizName, quizDescription, onBack, existingQuiz }) {
  const [questions, setQuestions] = useState(existingQuiz ? existingQuiz.questions : []);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [points, setPoints] = useState(1);
  const [negativePoints, setNegativePoints] = useState(0);
  const [showNegativePoints, setShowNegativePoints] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddQuestion = () => {
    if (currentQuestion.trim() && options.every(opt => opt.trim())) {
      const optionObjects = options.map((text, index) => ({
        optionId: `opt_${Date.now()}_${index}`,
        text,
      }));
      const newQuestion = {
        type: "MCQ",
        questionText: currentQuestion,
        options: optionObjects,
        correctAnswers: [optionObjects[correctIndex].optionId],
        points,
        negativePoints: negativePoints || undefined,
      };
      setQuestions([...questions, newQuestion]);
      setCurrentQuestion("");
      setOptions(["", ""]);
      setCorrectIndex(0);
      setPoints(1);
      setNegativePoints(0);
    } else {
      alert("Please fill in the question and all options.");
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctIndex >= newOptions.length) {
        setCorrectIndex(newOptions.length - 1);
      }
    }
  };

  const handleEditQuestion = (index) => {
    const q = questions[index];
    setCurrentQuestion(q.questionText);
    setOptions(q.options.map(opt => opt.text));
    setCorrectIndex(q.options.findIndex(opt => q.correctAnswers.includes(opt.optionId)));
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
        // For editing existing quizzes, just update localStorage for now
        // TODO: Implement update API endpoint when available
    
        const quizObject = {
          _id: existingQuiz._id,
          title: quizName,
          description: quizDescription,
          createdBy: existingQuiz.createdBy,
          roomId: existingQuiz.roomId,
          questions,
          totalPoints,
          createdAt: existingQuiz.createdAt,
          updatedAt: new Date().toISOString(),
        };
        console.log("QUIZ DATA : ",quizObject);
        const res = await api.post('/api/quiz-templates', quizObject); // Placeholder for actual update API call
        const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        const index = existingQuizzes.findIndex(q => q._id === existingQuiz._id);
        if (index !== -1) {
          existingQuizzes[index] = quizObject;
        }
        localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));
        
        alert("Quiz updated successfully!");
        onBack();
        return;
      }

      // Transform questions to match API format for new quizzes
      const timestamp = Date.now();
      const transformedQuestions = questions.map(question => ({
        type: question.type,
        questionText: question.questionText,
        options: question.options.map((option, index) => ({
          optionId: `opt${timestamp}_${index}`,
          text: option.text
        })),
        correctAnswers: question.correctAnswers.map(answerId => {
          // Find the option and get its new optionId
          const optionIndex = question.options.findIndex(opt => opt.optionId === answerId);
          return `opt${timestamp}_${optionIndex}`;
        }),
        points: question.points,
        negativePoints: question.negativePoints || 0
      }));

      const quizPayload = {
        title: quizName,
        description: quizDescription,
        roomId: null, // Will be set when creating a session
        questions: transformedQuestions
      };

      // Make API call
      const response = await api.post('/api/quiz-templates', quizPayload);
      
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
        
        const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
        existingQuizzes.push(quizObject);
        localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));
        
        alert("Quiz saved successfully!");
        onBack();
      } else {
        throw new Error('Failed to save quiz');
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      
      // Fallback to localStorage only
      const quizObject = {
        _id: existingQuiz ? existingQuiz._id : `quiz_${Date.now()}`,
        title: quizName,
        description: quizDescription,
        createdBy: existingQuiz ? existingQuiz.createdBy : "teacherId_placeholder",
        roomId: existingQuiz ? existingQuiz.roomId : null,
        questions,
        totalPoints,
        createdAt: existingQuiz ? existingQuiz.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const existingQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
      if (existingQuiz) {
        const index = existingQuizzes.findIndex(q => q._id === existingQuiz._id);
        if (index !== -1) {
          existingQuizzes[index] = quizObject;
        }
      } else {
        existingQuizzes.push(quizObject);
      }
      localStorage.setItem('quizzes', JSON.stringify(existingQuizzes));
      
      alert(`API call failed, but quiz saved locally. ${existingQuiz ? "Quiz updated successfully!" : "Quiz saved successfully!"}`);
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
        `}
      </style>
      
      <main className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                {existingQuiz ? "Editing" : "Creating"} Quiz: {quizName}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                  {existingQuiz ? "Editing" : "Draft"}
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  <BarChart3 size={14} />
                  Total Points: <span className="font-semibold text-slate-900 dark:text-white">{totalPoints}</span>
                </span>
                <button
                  onClick={() => setShowNegativePoints(!showNegativePoints)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all ${
                    showNegativePoints
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Negative Points: {showNegativePoints ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDiscard} 
              className="px-5 py-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500"
            >
              Discard
            </button>
            <button 
              onClick={handleSaveQuiz} 
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/40 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Question Creation Form */}
          <section className="lg:col-span-7 xl:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <PlusCircle className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Question</h3>
              </div>

              <form className="space-y-6">
                {/* Question Text */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 pt-1 flex items-center gap-2">
                      <HelpCircle size={16} className="text-blue-600 dark:text-blue-400" />
                      Question Text
                    </label>
                    <div className="flex items-end gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          Points
                        </label>
                        <input
                          value={points}
                          onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                          className="w-16 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-center text-sm"
                          type="number"
                          min="0"
                        />
                      </div>
                      {showNegativePoints && (
                        <div className="flex flex-col items-center gap-1">
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Negative
                          </label>
                          <input
                            value={negativePoints}
                            onChange={(e) => setNegativePoints(parseInt(e.target.value) || 0)}
                            className="w-16 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-2 py-1 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-all text-center text-sm"
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
                    className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 placeholder-slate-400 dark:placeholder-slate-500 resize-none transition-all"
                    placeholder="Enter your question here..."
                    rows="4"
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Answer Options
                  </label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="relative group">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCorrectIndex(index)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all ${
                              correctIndex === index
                                ? "bg-emerald-500 border-emerald-500 dark:bg-emerald-400 dark:border-emerald-400"
                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500"
                            }`}
                          >
                            {correctIndex === index && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </button>
                          <input
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
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
                    ))}
                  </div>
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold flex items-center gap-2 transition-colors mt-3 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    >
                      <Plus size={16} /> Add Another Option
                    </button>
                  )}
                </div>

                {/* Add Question Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all transform active:scale-95 hover:shadow-xl hover:shadow-blue-500/40 flex items-center gap-2"
                  >
                    <PlusSquare size={20} />
                    Add Question
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Questions List Sidebar */}
          <aside className="lg:col-span-5 xl:col-span-4">
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
                      className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          Question {index + 1}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditQuestion(index)} 
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteQuestion(index)} 
                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm font-semibold mb-3 text-slate-900 dark:text-white leading-relaxed">
                        {q.questionText}
                      </p>

                      <ul className="space-y-2 mb-3">
                        {q.options.map((opt) => (
                          <li 
                            key={opt._id} 
                            className={`text-xs flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              q.correctAnswers.includes(opt.optionId)
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800"
                                : "text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50"
                            }`}
                          >
                            {q.correctAnswers.includes(opt.optionId) ? (
                              <CheckCircle size={14} className="flex-shrink-0" />
                            ) : (
                              <Circle size={14} className="flex-shrink-0" />
                            )}
                            <span className="flex-1">{opt.text}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex justify-between items-center pt-2 border-t-2 border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          Points: <span className="text-slate-900 dark:text-white">{q.points}</span>
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          Penalty: <span className="text-slate-900 dark:text-white">{q.negativePoints || 0}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Chat Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 border-4 border-white dark:border-slate-900">
        <MessageCircle size={28} />
      </button>
    </div>
  );
}

export default QuizCreation;