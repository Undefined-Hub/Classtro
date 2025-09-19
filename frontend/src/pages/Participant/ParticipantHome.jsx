import React, { useState } from 'react';
import { useAuth } from '../../context/UserContext';
import Header from '../../components/Participant/Header';
import TabNavigation from '../../components/Participant/TabNavigation';
import JoinSessionTab from '../../components/Participant/JoinSessionTab';
import ClassroomTab from '../../components/Participant/ClassroomTab';
import { useNavigate } from 'react-router-dom';

const ParticipantHome = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('join');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const navigate = useNavigate();

  // Mock data for classrooms - replace with actual API call
  const [rooms] = useState([
    {
      id: '1',
      name: 'Advanced React Development',
      description: 'Learn advanced React patterns, hooks, and state management with Redux and Context API.',
      teacherName: 'Dr. Sarah Johnson',
      teacherId: 'teacher1',
      sessionCount: 24,
      enrolledStudents: 45,
      hasActiveSession: true,
      activeSessions: 1,
      bannerImage: '/banner1.jpg',
      subject: 'Computer Science',
      grade: 'College',
      createdAt: '2024-01-15',
      lastActivity: '2024-03-15'
    },
    {
      id: '2',
      name: 'Mathematics Grade 10',
      description: 'Comprehensive mathematics course covering algebra, geometry, and trigonometry fundamentals.',
      teacherName: 'Prof. Michael Chen',
      teacherId: 'teacher2',
      sessionCount: 18,
      enrolledStudents: 32,
      hasActiveSession: false,
      activeSessions: 0,
      bannerImage: '/banner2.jpg',
      subject: 'Mathematics',
      grade: '10th Grade',
      createdAt: '2024-02-01',
      lastActivity: '2024-03-14'
    },
    {
      id: '3',
      name: 'English Literature',
      description: 'Explore classic and contemporary literature with critical analysis and creative writing.',
      teacherName: 'Ms. Emily Rodriguez',
      teacherId: 'teacher3',
      sessionCount: 12,
      enrolledStudents: 28,
      hasActiveSession: true,
      activeSessions: 2,
      bannerImage: '/banner3.jpg',
      subject: 'English',
      grade: '11th Grade',
      createdAt: '2024-01-20',
      lastActivity: '2024-03-15'
    },
    {
      id: '4',
      name: 'Physics Fundamentals',
      description: 'Understanding the principles of physics through practical experiments and theoretical concepts.',
      teacherName: 'Dr. Robert Kim',
      teacherId: 'teacher4',
      sessionCount: 20,
      enrolledStudents: 35,
      hasActiveSession: false,
      activeSessions: 0,
      bannerImage: '/banner4.jpg',
      subject: 'Physics',
      grade: '12th Grade',
      createdAt: '2024-02-10',
      lastActivity: '2024-03-13'
    },
    {
      id: '5',
      name: 'World History',
      description: 'Journey through major historical events and civilizations from ancient times to modern era.',
      teacherName: 'Prof. Lisa Thompson',
      teacherId: 'teacher5',
      sessionCount: 15,
      enrolledStudents: 40,
      hasActiveSession: false,
      activeSessions: 0,
      bannerImage: '/banner5.jpg',
      subject: 'History',
      grade: '9th Grade',
      createdAt: '2024-01-25',
      lastActivity: '2024-03-12'
    }
  ]);

  // Filter rooms based on search term
  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClassroomSelect = (classroom) => {
    setSelectedClassroom(classroom);
    // TODO: Navigate to classroom details or sessions
    console.log('Selected classroom:', classroom);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  // Session navigation now handled inside JoinSessionTab via context

  // No longer render ParticipantSession here; handled by /participant/session route

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <TabNavigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            roomCount={rooms.length} 
          />

          <div className="p-6">
            {activeTab === 'join' && <JoinSessionTab />}

            {activeTab === 'classrooms' && (
              <ClassroomTab
                rooms={rooms}
                selectedClassroom={selectedClassroom}
                onClassroomSelect={handleClassroomSelect}
                onSearchChange={handleSearchChange}
                searchTerm={searchTerm}
                filteredRooms={filteredRooms}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantHome;
