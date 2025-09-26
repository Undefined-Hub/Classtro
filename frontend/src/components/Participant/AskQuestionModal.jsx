import React, { useState } from 'react';

const AskQuestionModal = ({ open, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(false);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const payload = { text: text.trim(), isAnonymous: anon };
    console.log('[AskQuestionModal] submit', payload);
    onSubmit(payload);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <form onSubmit={handleSubmit} className="relative bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-lg w-full max-w-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ask a question</h3>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white" placeholder="Type your question..." />
        <div className="flex items-center justify-between mt-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="mr-2" /> Ask anonymously
          </label>
          <div className="space-x-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-white border rounded-md">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-md">Submit</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AskQuestionModal;
