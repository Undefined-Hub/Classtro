// LivePoll.jsx
import React, { use, useState } from "react";
import { useHostSession } from "../../../context/HostSessionContext";
import { X, BarChart3, Users, Zap, PieChart, BarChart2, TrendingUp, Layers } from "lucide-react";
const LivePoll = ({ onPollSubmit }) => {
  const { activePoll } = useHostSession();
  const [chartType, setChartType] = useState('horizontal'); // horizontal, vertical, pie, donut
  
  if (!activePoll) return null;
  const totalVotes = activePoll.options.reduce(
    (sum, opt) => sum + opt.votes,
    0,
  );

  // Chart type options
  const chartTypes = [
    { id: 'horizontal', name: 'Horizontal Bars', icon: BarChart3 },
    { id: 'vertical', name: 'Vertical Bars', icon: BarChart2 },
    { id: 'pie', name: 'Pie Chart', icon: PieChart },
    { id: 'donut', name: 'Donut Chart', icon: Layers },
  ];

  // Color scheme for different options - softer, muted colors
  const colors = [
    'bg-blue-400/70 dark:bg-blue-500',
    'bg-emerald-400/70 dark:bg-emerald-500', 
    'bg-violet-400/70 dark:bg-violet-500',
    'bg-amber-400/70 dark:bg-amber-500',
    'bg-rose-400/70 dark:bg-rose-500',
    'bg-teal-400/70 dark:bg-teal-500'
  ];

  const colorClasses = [
    'text-blue-500',
    'text-emerald-500',
    'text-violet-500',
    'text-amber-500',
    'text-rose-500',
    'text-teal-500'
  ];

  // Render different chart types
  const renderChart = () => {
    switch (chartType) {
      case 'horizontal':
        return renderHorizontalBars();
      case 'vertical':
        return renderVerticalBars();
      case 'pie':
        return renderPieChart();
      case 'donut':
        return renderDonutChart();
      default:
        return renderHorizontalBars();
    }
  };

  const renderHorizontalBars = () => (
    <div className="space-y-4">
      {activePoll.options.map((option, index) => {
        const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
        
        return (
          <div key={option._id} className="relative">
            <div className="relative bg-gray-100 dark:bg-gray-600 rounded-xl overflow-hidden min-h-[60px] flex items-center">
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out rounded-xl ${colors[index % colors.length]}`}
                style={{ width: `${percentage}%` }}
              />
              
              <div className="relative z-10 flex justify-between items-center w-full px-4 py-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm md:text-base">
                      {option.text}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                    {percentage}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderVerticalBars = () => (
    <div className="flex items-end justify-center space-x-4 h-64 p-4">
      {activePoll.options.map((option, index) => {
        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
        const height = Math.max(percentage * 2, 8); // Min 8px height
        
        return (
          <div key={option._id} className="flex flex-col items-center space-y-2 flex-1 max-w-20">
            <div className="text-center">
              <div className="font-bold text-sm text-gray-900 dark:text-white">
                {Math.round(percentage)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {option.votes}
              </div>
            </div>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ease-out ${colors[index % colors.length]} min-h-[8px]`}
              style={{ height: `${height}px` }}
            />
            <div className="text-center">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs mb-1">
                {String.fromCharCode(65 + index)}
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                {option.text.length > 8 ? option.text.slice(0, 8) + '...' : option.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPieChart = () => {
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    // Show pie chart structure even with 0 votes
    if (totalVotes === 0) {
      // Equal segments for all options when no votes
      const equalAngle = 360 / activePoll.options.length;
      
      return (
        <div className="flex items-center justify-center p-8">
          <div className="relative">
            <svg width="200" height="200">
              {activePoll.options.map((option, index) => {
                const startAngle = index * equalAngle;
                const endAngle = (index + 1) * equalAngle;
                
                // Convert angles to radians
                const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                
                // Calculate path coordinates
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                
                const largeArcFlag = equalAngle > 180 ? 1 : 0;
                
                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                return (
                  <path
                    key={option._id}
                    d={pathData}
                    fill={`hsl(${200 + index * 40}, 30%, 80%)`}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No votes yet
                </div>
              </div>
            </div>
          </div>
          <div className="ml-8 space-y-2">
            {activePoll.options.map((option, index) => (
              <div key={option._id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: `hsl(${200 + index * 40}, 30%, 80%)` }}
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.text}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">
                    0% • 0 votes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    let cumulativeAngle = 0;
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <svg width="200" height="200">
            {activePoll.options.map((option, index) => {
              const percentage = (option.votes / totalVotes) * 100;
              
              // Skip rendering if percentage is 0
              if (percentage === 0) return null;
              
              const angle = (percentage / 100) * 360;
              const startAngle = cumulativeAngle;
              const endAngle = cumulativeAngle + angle;
              
              cumulativeAngle += angle;
              
              // Handle 100% case - render as full circle
              if (percentage >= 100) {
                return (
                  <circle
                    key={option._id}
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    fill={`hsl(${200 + index * 40}, 60%, 60%)`}
                    className="transition-all duration-500 hover:opacity-80"
                  />
                );
              }
              
              // Convert angles to radians
              const startAngleRad = (startAngle - 90) * (Math.PI / 180);
              const endAngleRad = (endAngle - 90) * (Math.PI / 180);
              
              // Calculate path coordinates
              const x1 = centerX + radius * Math.cos(startAngleRad);
              const y1 = centerY + radius * Math.sin(startAngleRad);
              const x2 = centerX + radius * Math.cos(endAngleRad);
              const y2 = centerY + radius * Math.sin(endAngleRad);
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');
              
              return (
                <path
                  key={option._id}
                  d={pathData}
                  fill={`hsl(${200 + index * 40}, 60%, 60%)`}
                  className="transition-all duration-500 hover:opacity-80"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="ml-8 space-y-2">
          {activePoll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <div key={option._id} className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: `hsl(${200 + index * 40}, 60%, 60%)` }}
                />
                <div className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {String.fromCharCode(65 + index)}. {option.text}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">
                    {percentage}% ({option.votes})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDonutChart = () => {
    // Show donut chart structure even with 0 votes
    if (totalVotes === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="30"
                className="dark:stroke-gray-600"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-500 dark:text-gray-400">
                  0
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Responses
                </div>
              </div>
            </div>
          </div>
          
          <div className="ml-8 grid grid-cols-1 gap-2">
            {activePoll.options.map((option, index) => (
              <div key={option._id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-600/30 rounded-lg opacity-60">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {option.text}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    0% • 0 votes
                  </div>
                </div>
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-500"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="30"
              className="dark:stroke-gray-600"
            />
            {activePoll.options.map((option, index) => {
              const percentage = (option.votes / totalVotes) * 100;
              
              // Skip rendering if percentage is 0
              if (percentage === 0) return null;
              
              // For 100% case, render full circle
              if (percentage >= 100) {
                return (
                  <circle
                    key={option._id}
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke={`hsl(${200 + index * 40}, 60%, 60%)`}
                    strokeWidth="30"
                    className="transition-all duration-500"
                  />
                );
              }
              
              const strokeDasharray = `${percentage * 5.03} 502`;
              const strokeDashoffset = -cumulativePercentage * 5.03;
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={option._id}
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={`hsl(${200 + index * 40}, 60%, 60%)`}
                  strokeWidth="30"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {totalVotes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Responses
              </div>
            </div>
          </div>
        </div>
        
        <div className="ml-8 grid grid-cols-1 gap-2">
          {activePoll.options.map((option, index) => {
            const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <div key={option._id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-600/30 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {option.text}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    {percentage}% • {option.votes} votes
                  </div>
                </div>
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `hsl(${200 + index * 40}, 60%, 60%)` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl shadow-xl mb-8 overflow-hidden border border-gray-100 dark:border-gray-600">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 shadow-sm">
                <Zap className="w-3 h-3 mr-1" />
                Live Poll
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight pr-4">
              {activePoll.question}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Students are voting now - results update live
            </p>
          </div>
          <button
            onClick={onPollSubmit}
            className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-all duration-200 shadow-sm border border-red-200 dark:border-red-800"
          >
            <X className="w-4 h-4 mr-2" />
            End Poll
          </button>
        </div>
      </div>
      
      {/* Chart Type Selector Dock */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-600/20">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
            View:
          </span>
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-700 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-600">
            {chartTypes.map((type) => {
              const Icon = type.icon;
              const isActive = chartType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id)}
                  className={`inline-flex items-center px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                  title={type.name}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {type.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="p-5">
        {renderChart()}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-600/30 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            {/* Total Responses */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalVotes}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total Responses
                </div>
              </div>
            </div>
            
            {/* Live Status */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 mb-1">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Auto Updates
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Real-time results
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePoll;
