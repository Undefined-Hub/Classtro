import React from 'react';
const ParticipantQnA = ({ questions, onUpvote, askOpen, setAskOpen, onBack }) => {
    return (
        <div className="max-w-xs sm:max-w-md lg:max-w-lg mx-auto px-2 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <button onClick={onBack} className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-1 -ml-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        <span className="text-sm sm:text-base">Back</span>
                    </button>
                    <h2 className="text-lg sm:text-xl font-semibold text-blue-600 dark:text-blue-400">Q&A</h2>
                    <div className="w-12" />
                </div>
                {/* // ! If there are no questions, show prompt to ask */}
                {questions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 sm:h-56 lg:h-64 text-center px-4">
                        <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed">Do you have a question for the presenter?<br />Be the first one to ask!</p>
                        <button onClick={() => setAskOpen(true)} className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base">Ask a question</button>
                    </div>
                ) : (
                    // ! If there are questions, show list
                    <div className="space-y-4 sm:space-y-0">
                        <div className="mb-4 sm:mb-6">
                            <button onClick={() => setAskOpen(true)} className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base">Ask a question</button>
                        </div>

                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                            {[...questions].sort((a, b) => {
                                if ((b.upvotes || 0) !== (a.upvotes || 0)) return (b.upvotes || 0) - (a.upvotes || 0);
                                return new Date(b.timestamp) - new Date(a.timestamp);
                            }).map((q) => (
                                <div key={q.id} className={`flex items-center space-x-3 py-3 sm:py-4 first:pt-0 last:pb-0 relative`}>
                                    <div className="flex-1 min-w-0 flex items-center">
                                        <p className="text-gray-900 dark:text-white text-sm sm:text-base leading-relaxed text-left break-words">{q.text}</p>
                                    </div>

                                    <div className="flex flex-col items-center flex-shrink-0 min-w-[2rem]">
                                        <button onClick={() => onUpvote(q.id)} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors p-1.5 -m-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:cursor-pointer">
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                        </button>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">{q.upvotes || 0}</span>
                                    </div>

                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* AskQuestionModal is controlled by the parent ParticipantSession */}
        </div>
    );
};

export default ParticipantQnA;
