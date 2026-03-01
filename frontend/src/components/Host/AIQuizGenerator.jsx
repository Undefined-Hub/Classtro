import { useState } from "react";
import api from "../../utils/api";

export default function AIQuizGenerator({ onGenerate, defaultPoints = 1, maxQuestions = 10, questionMode = 'both' }) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

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
    try {
      const payload = {
        topic: topic.trim(),
        keywords: keywords.trim(),
        difficulty,
        count,
        defaultPoints,
        questionMode,
      };

      const res = await api.post('/api/ai/generate-quiz', payload);
      if (res && res.data && Array.isArray(res.data.questions)) {
        // Normalize returned questions to internal shape
        const timestamp = Date.now();
        const mapped = res.data.questions.map((q, qi) => {
          const opts = (q.options || []).map((opt, oi) => ({
            optionId: opt.optionId || `ai_${timestamp}_${qi}_${oi}`,
            text: typeof opt === 'string' ? opt : opt.text || String(opt),
          }));

          const correct = (q.correctAnswers || []).map(answerId => {
            // If model returned indexes, map to optionId
            if (typeof answerId === 'number') return opts[answerId]?.optionId;
            // If model returned the exact option text, try to match
            const matched = opts.find(o => o.text.trim() === String(answerId).trim());
            if (matched) return matched.optionId;
            return String(answerId);
          }).filter(Boolean);

          return {
            type: q.type || 'MCQ',
            questionText: q.questionText || "",
            options: opts,
            correctAnswers: correct.length ? correct : [opts[0]?.optionId].filter(Boolean),
            points: typeof q.points === 'number' ? q.points : defaultPoints,
            negativePoints: typeof q.negativePoints === 'number' ? q.negativePoints : 0,
          };
        });

        onGenerate(mapped);
      } else {
        setError('AI returned unexpected response');
      }
    } catch (err) {
      console.error('AI generate error', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-6">
      <h4 className="font-semibold mb-2">AI Quiz (Instant)</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. Photosynthesis)" className="p-2 rounded-md border" />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords (comma separated)" className="p-2 rounded-md border" />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="p-2 rounded-md border">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input value={count} onChange={(e) => setCount(parseInt(e.target.value) || 0)} type="number" min="1" max={maxQuestions} className="p-2 rounded-md border" />
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button onClick={handleGenerate} disabled={isGenerating} className="bg-blue-600 text-white px-4 py-2 rounded-md">
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    </div>
  );
}
