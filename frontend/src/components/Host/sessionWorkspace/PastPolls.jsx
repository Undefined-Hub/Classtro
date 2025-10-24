// PastPolls.jsx
import React, { useState } from "react";
import { useHostSession } from "../../../context/HostSessionContext";
import { Clock, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
const PastPolls = () => {
  const { pastPolls } = useHostSession();
  const [expandedPoll, setExpandedPoll] = useState(null);
  
  if (!pastPolls || pastPolls.length === 0) return null;

  // Same color scheme as LivePoll
  const colors = [
    'bg-blue-400/70 dark:bg-blue-500/70',
    'bg-emerald-400/70 dark:bg-emerald-500/70', 
    'bg-violet-400/70 dark:bg-violet-500/70',
    'bg-amber-400/70 dark:bg-amber-500/70',
    'bg-rose-400/70 dark:bg-rose-500/70',
    'bg-teal-400/70 dark:bg-teal-500/70'
  ];

  const toggleExpanded = (pollId) => {
    setExpandedPoll(expandedPoll === pollId ? null : pollId);
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        Past Polls ({pastPolls.length})
      </h3>
      
      <div className="space-y-3">
        {pastPolls.map((poll, pollIndex) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
          const winningOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0];
          const isExpanded = expandedPoll === poll._id;

          return (
            <div
              key={poll._id}
              className="bg-white dark:bg-gray-700 rounded-xl shadow-md border border-gray-100 dark:border-gray-600 overflow-hidden transition-all duration-200"
            >
              {/* Compact Header - Always Visible */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-colors"
                onClick={() => toggleExpanded(poll._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate pr-4">
                      {poll.question}
                    </h4>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      Ended {new Date(poll.endedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      <span className="mx-2">•</span>
                      <span className="font-medium">{totalVotes} responses</span>
                    </div>
                  </div>
                  
                  {/* Quick Visual Summary */}
                  <div className="flex items-center space-x-3">
                    {/* Mini Bar Chart - Larger and More Visible */}
                    <div className="flex items-end space-x-1 h-10">
                      {poll.options.map((option, index) => {
                        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                        // Larger scale: 0.4 instead of 0.2, with 4px minimum for all options (visible baseline)
                        const height = Math.max(percentage * 0.4, 4);
                        return (
                          <div
                            key={option._id || index}
                            className={`w-3 rounded-sm transition-all duration-300 ${colors[index % colors.length]} ${percentage === 0 ? 'opacity-30' : 'opacity-100'}`}
                            style={{ height: `${height}px` }}
                            title={`${option.text}: ${Math.round(percentage)}%`}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Expand/Collapse Icon */}
                    <div className="text-gray-400 dark:text-gray-500">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details - Shows on Click */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50/50 dark:bg-gray-600/20">
                  <div className="space-y-3">
                    {poll.options.map((option, index) => {
                      const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                      
                      return (
                        <div key={option._id || index} className="relative">
                          <div className="relative bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden min-h-[40px] flex items-center">
                            {/* Progress Bar */}
                            <div
                              className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out rounded-lg ${colors[index % colors.length]}`}
                              style={{ width: `${percentage}%` }}
                            />
                            
                            {/* Content */}
                            <div className="relative z-10 flex justify-between items-center w-full px-3 py-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {option.text}
                                </span>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-bold text-gray-900 dark:text-white text-sm">
                                  {percentage}%
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                  {option.votes}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PastPolls;
