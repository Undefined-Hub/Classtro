import { useState, useRef, useEffect } from "react";
import {
  Minus,
  Plus,
  Sparkles,
  MoreVertical,
  X,
  Sprout,
  Target,
  Flame,
} from "lucide-react";
import api from "../../utils/api";

export default function AIQuizGenerator({
  onGenerate,
  defaultPoints = 1,
  maxQuestions = 10,
  onGenerationStart,
  onGenerationEnd,
}) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [count, setCount] = useState(5);
  const [questionMode, setQuestionMode] = useState("both");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    if (count <= 0 || count > maxQuestions) {
      setError(`Question count must be between 1 and ${maxQuestions}`);
      return;
    }

    setIsGenerating(true);
    setError(null);
    if (onGenerationStart) onGenerationStart(count);
    try {
      const payload = {
        topic: topic.trim(),
        keywords: keywords.trim(),
        difficulty,
        count,
        defaultPoints,
        questionMode,
      };

      const res = await api.post("/api/ai/generate-quiz", payload);
      if (res && res.data && Array.isArray(res.data.questions)) {
        // Normalize returned questions to internal shape
        const timestamp = Date.now();
        const mapped = res.data.questions.map((q, qi) => {
          const opts = (q.options || []).map((opt, oi) => ({
            optionId: opt.optionId || `ai_${timestamp}_${qi}_${oi}`,
            text: typeof opt === "string" ? opt : opt.text || String(opt),
          }));

          const correct = (q.correctAnswers || [])
            .map((answerId) => {
              // If model returned indexes, map to optionId
              if (typeof answerId === "number") return opts[answerId]?.optionId;
              // If model returned the exact option text, try to match
              const matched = opts.find(
                (o) => o.text.trim() === String(answerId).trim(),
              );
              if (matched) return matched.optionId;
              return String(answerId);
            })
            .filter(Boolean);

          return {
            type: q.type || "MCQ",
            questionText: q.questionText || "",
            options: opts,
            correctAnswers: correct.length
              ? correct
              : [opts[0]?.optionId].filter(Boolean),
            points: typeof q.points === "number" ? q.points : defaultPoints,
            negativePoints:
              typeof q.negativePoints === "number" ? q.negativePoints : 0,
          };
        });

        onGenerate(mapped);
      } else {
        setError("AI returned unexpected response");
      }
    } catch (err) {
      console.error("AI generate error", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate questions",
      );
    } finally {
      setIsGenerating(false);
      if (onGenerationEnd) onGenerationEnd();
    }
  };

  const difficulties = [
    { value: "beginner", label: "Beginner", Icon: Sprout },
    { value: "intermediate", label: "Intermediate", Icon: Target },
    { value: "hard", label: "Hard", Icon: Flame },
  ];

  const incrementCount = () => {
    if (count < maxQuestions) setCount(count + 1);
  };

  const decrementCount = () => {
    if (count > 1) setCount(count - 1);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 shadow-sm">
      {/* Main Input Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
          <Sparkles
            className="text-blue-600 dark:text-blue-400 flex-shrink-0"
            size={20}
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter quiz topic... (e.g., Photosynthesis, World War II)"
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />

          {/* 3-Dot Menu Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Options"
            >
              <MoreVertical size={20} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      Quiz Options
                    </h4>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Question Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Question Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "both", label: "Both" },
                        { value: "mcq", label: "MCQ" },
                        { value: "multi", label: "Multi" },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setQuestionMode(mode.value)}
                          className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            questionMode === mode.value
                              ? "bg-blue-600 dark:bg-blue-500 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {difficulties.map((diff) => {
                        const Icon = diff.Icon;
                        return (
                          <button
                            key={diff.value}
                            type="button"
                            onClick={() => setDifficulty(diff.value)}
                            className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                              difficulty === diff.value
                                ? "bg-blue-600 dark:bg-blue-500 text-white"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                            }`}
                          >
                            <Icon size={14} />
                            <span className="hidden sm:inline">
                              {diff.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Number of Questions{" "}
                      <span className="text-slate-400 font-normal">
                        (max {maxQuestions})
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      

                      <div className="h-6 bg-slate-300 dark:bg-slate-600"></div>

                      {/* Custom Input with Stepper */}
                      <button
                        type="button"
                        onClick={decrementCount}
                        disabled={count <= 1}
                        className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus size={14} />
                      </button>

                      <input
                        type="number"
                        value={count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setCount(Math.max(1, Math.min(maxQuestions, val)));
                        }}
                        min="1"
                        max={maxQuestions}
                        className="w-14 text-center text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-md py-1.5 px-2 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />

                      <button
                        type="button"
                        onClick={incrementCount}
                        disabled={count >= maxQuestions}
                        className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                      >
                        <Plus size={14} />
                      </button>
                      <hr className="border border-slate-700 h-8"/>
                      {/* Preset Buttons */}
                      {[3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCount(preset)}
                          className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                            count === preset
                              ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    
                  </div>

                  {/* Keywords */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Keywords{" "}
                      <span className="text-slate-400 font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g., chloroplast, energy"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles
              size={16}
              className={isGenerating ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">
              {isGenerating ? "Generating..." : "Generate"}
            </span>
          </button>
        </div>

        {/* Active Options Display */}
        <div className="px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Options:</span>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">
            {questionMode === "both"
              ? "Both Types"
              : questionMode === "mcq"
                ? "MCQ Only"
                : "Multi-Select Only"}
          </span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium flex items-center gap-1">
            {(() => {
              const DiffIcon = difficulties.find(
                (d) => d.value === difficulty,
              )?.Icon;
              return DiffIcon ? <DiffIcon size={12} /> : null;
            })()}
            {difficulties.find((d) => d.value === difficulty)?.label}
          </span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full font-medium">
            {count} {count === 1 ? "Question" : "Questions"}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-3 mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}
    </div>
  );
}
