import React from 'react';

const QuestionsPanel = ({ questions, onUpvote }) => {
  const sorted = [...questions].sort((a, b) => {
    if ((b.upvotes || 0) !== (a.upvotes || 0)) return (b.upvotes || 0) - (a.upvotes || 0);
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Questions</h3>
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center text-gray-500">No questions yet. Be the first to ask!</div>
        ) : (
          sorted.map((q) => (
            <div key={q.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm flex items-start justify-between">
              <div>
                <p className="text-gray-900 dark:text-white">{q.text}</p>
                <div className="text-xs text-gray-500 mt-1">{q.isAnonymous ? 'Anonymous' : q.studentName} • {new Date(q.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div className="flex flex-col items-center">
                <button onClick={() => onUpvote(q.id)} className="text-gray-500 hover:text-blue-500">
                  ▲
                </button>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.upvotes || 0}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionsPanel;
