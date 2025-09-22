import React, { useState } from 'react';
import { useAnalyticsData } from '../../context/AnalyticsContext';

const AttendanceTable = () => {
  const { analyticsData, loading } = useAnalyticsData();
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { participants } = analyticsData;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedParticipants = [...participants].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'joinAt' || sortBy === 'leaveAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sortBy === 'duration') {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    }

    if (sortBy === 'name') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedParticipants.length / itemsPerPage);
  const paginatedParticipants = sortedParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getProfileColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-cyan-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left w-full group"
    >
      <span>{children}</span>
      <div className="flex flex-col">
        <svg
          className={`w-3 h-3 ${
            sortBy === field && sortOrder === 'asc'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400 group-hover:text-gray-600'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </button>
  );

  const AttendanceRow = ({ participant, showActions = false }) => {
    const joinTime = new Date(participant.joinAt);
    const leaveTime = new Date(participant.leaveAt);
    const isStillActive = leaveTime > new Date(Date.now() - 60000);
    
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        {/* Participant */}
        <td className="py-3 px-4 min-w-[200px]">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-full ${getProfileColor(
                participant.name
              )} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}
            >
              {getInitials(participant.name)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {participant.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID: {participant.id.toString().padStart(3, '0')}
              </p>
            </div>
          </div>
        </td>

        {/* Join Time */}
        <td className="py-3 px-4 min-w-[120px]">
          <div className="text-sm">
            <p className="text-gray-900 dark:text-white">
              {formatTime(participant.joinAt)}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {joinTime.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </td>

        {/* Leave Time */}
        <td className="py-3 px-4 min-w-[120px]">
          <div className="text-sm">
            {isStillActive ? (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Active
                </span>
              </div>
            ) : (
              <>
                <p className="text-gray-900 dark:text-white">
                  {formatTime(participant.leaveAt)}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {leaveTime.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </>
            )}
          </div>
        </td>

        {/* Duration */}
        <td className="py-3 px-4 min-w-[140px]">
          <div className="flex items-center space-x-2">
            <span className="text-gray-900 dark:text-white font-medium">
              {formatDuration(participant.duration)}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-20">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((participant.duration / 60) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="py-3 px-4 text-center min-w-[100px]">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              isStillActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : participant.duration >= 45
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}
          >
            {isStillActive 
              ? 'Active' 
              : participant.duration >= 45 
              ? 'Full' 
              : 'Partial'
            }
          </span>
        </td>

        {/* Actions (only in fullscreen) */}
        {showActions && (
          <td className="py-3 px-4 text-center min-w-[100px]">
            <div className="flex items-center justify-center space-x-1">
              <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </td>
        )}
      </tr>
    );
  };

  const FullscreenModal = () => (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Complete Attendance Report
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {participants.length} total participants • Showing {paginatedParticipants.length} per page
            </p>
          </div>
          <button
            onClick={() => setIsFullscreenOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-hidden p-6 ">
          <div className="h-full overflow-auto hide-scrollbar border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                    <SortButton field="name">Participant</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                    <SortButton field="joinAt">Join Time</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                    <SortButton field="leaveAt">Leave Time</SortButton>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
                    <SortButton field="duration">Duration</SortButton>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedParticipants.map((participant) => (
                  <AttendanceRow key={participant.id} participant={participant} showActions={true} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, participants.length)} to {Math.min(currentPage * itemsPerPage, participants.length)} of {participants.length} participants
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white "
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Attendance Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {participants.length} participants • Session attendance tracking
          </p>
        </div>
        
        {/* Export/Actions */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsFullscreenOpen(true)}
            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Fullscreen View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          {/* {participants.length > 6 && (
            <button
              onClick={() => setIsFullscreenOpen(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
              title="View all participants in fullscreen"
            >
              View All {participants.length}
            </button>
          )} */}
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Download attendance report"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Export to CSV"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="flex-1 overflow-hidden">
        <div className="overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                  <SortButton field="name">Participant</SortButton>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                  <SortButton field="joinAt">Join Time</SortButton>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                  <SortButton field="leaveAt">Leave Time</SortButton>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
                  <SortButton field="duration">Duration</SortButton>
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedParticipants.slice(0, 6).map((participant) => (
                <AttendanceRow key={participant.id} participant={participant} />
              ))}
            </tbody>
          </table>
        </div>
        {participants.length > 6 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsFullscreenOpen(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              View All {participants.length} Participants
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {participants.filter(p => p.duration >= 45).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Full Attendance</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round(participants.reduce((acc, p) => acc + p.duration, 0) / participants.length)}m
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg Duration</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.round((participants.filter(p => p.duration >= 30).length / participants.length) * 100)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Retention Rate</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreenOpen && <FullscreenModal />}
    </div>
  );
};

export default AttendanceTable;