import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AnalyticsContext = createContext();

// Mock data generator
const generateMockData = (sessionData) => {
  const now = new Date();
  const startTime = sessionData?.startAt ? new Date(sessionData.startAt) : new Date(now.getTime() - 3600000); // 1 hour ago
  const endTime = new Date(now.getTime() - 300000); // 5 minutes ago
  
return {
    sessionInfo: {
        title: sessionData?.title || 'Introduction to Web Development',
        roomName: sessionData?.roomName || 'Computer Science 101',
        startAt: startTime.toISOString(),
        endAt: endTime.toISOString(),
        totalParticipants: 45,
        peakParticipants: 42,
        pollsConducted: 5,
        questionsAsked: 17
    },
    participants: [
        { id: 1, name: 'Alice Johnson', joinAt: startTime.toISOString(), leaveAt: endTime.toISOString(), duration: 55 },
        { id: 2, name: 'Bob Smith', joinAt: new Date(startTime.getTime() + 300000).toISOString(), leaveAt: endTime.toISOString(), duration: 50 },
        { id: 3, name: 'Carol White', joinAt: startTime.toISOString(), leaveAt: new Date(endTime.getTime() - 600000).toISOString(), duration: 45 },
        { id: 4, name: 'David Brown', joinAt: new Date(startTime.getTime() + 600000).toISOString(), leaveAt: endTime.toISOString(), duration: 40 },
        { id: 5, name: 'Emma Davis', joinAt: startTime.toISOString(), leaveAt: endTime.toISOString(), duration: 55 },
        { id: 6, name: 'Frank Miller', joinAt: new Date(startTime.getTime() + 900000).toISOString(), leaveAt: new Date(endTime.getTime() - 300000).toISOString(), duration: 35 },
        { id: 7, name: 'Grace Chen', joinAt: startTime.toISOString(), leaveAt: endTime.toISOString(), duration: 55 },
        { id: 8, name: 'Henry Wilson', joinAt: new Date(startTime.getTime() + 1200000).toISOString(), leaveAt: endTime.toISOString(), duration: 35 },
        { id: 9, name: 'Ivy Rodriguez', joinAt: new Date(startTime.getTime() + 150000).toISOString(), leaveAt: new Date(endTime.getTime() - 900000).toISOString(), duration: 40 },
        { id: 10, name: 'Jack Thompson', joinAt: startTime.toISOString(), leaveAt: new Date(endTime.getTime() - 1200000).toISOString(), duration: 35 },
        { id: 11, name: 'Kelly Martinez', joinAt: new Date(startTime.getTime() + 450000).toISOString(), leaveAt: endTime.toISOString(), duration: 47 },
        { id: 12, name: 'Liam Anderson', joinAt: startTime.toISOString(), leaveAt: endTime.toISOString(), duration: 55 },
        { id: 13, name: 'Maya Patel', joinAt: new Date(startTime.getTime() + 750000).toISOString(), leaveAt: new Date(endTime.getTime() - 450000).toISOString(), duration: 42 },
        { id: 14, name: 'Noah Garcia', joinAt: new Date(startTime.getTime() + 1800000).toISOString(), leaveAt: endTime.toISOString(), duration: 25 },
        { id: 15, name: 'Olivia Lee', joinAt: startTime.toISOString(), leaveAt: new Date(endTime.getTime() - 1500000).toISOString(), duration: 30 }
    ],
    participantsTimeline: [
        { time: '10:00', activeCount: 5 },
        { time: '10:15', activeCount: 15 },
        { time: '10:30', activeCount: 28 },
        { time: '10:45', activeCount: 42 },
        { time: '11:00', activeCount: 40 },
        { time: '11:15', activeCount: 38 },
        { time: '11:30', activeCount: 35 },
        { time: '11:45', activeCount: 30 },
        { time: '12:00', activeCount: 25 }
    ],
    polls: [
        {
            id: 1,
            question: 'Which programming language would you like to learn next?',
            options: [
                { text: 'Python', votes: 18 },
                { text: 'JavaScript', votes: 15 },
                { text: 'Java', votes: 8 },
                { text: 'C++', votes: 4 }
            ],
            totalResponses: 45
        },
        {
            id: 2,
            question: 'How confident do you feel about HTML/CSS?',
            options: [
                { text: 'Very Confident', votes: 12 },
                { text: 'Somewhat Confident', votes: 20 },
                { text: 'Not Confident', votes: 10 },
                { text: 'Need More Practice', votes: 3 }
            ],
            totalResponses: 45
        },
        {
            id: 3,
            question: 'What is your preferred learning style?',
            options: [
                { text: 'Visual', votes: 16 },
                { text: 'Hands-on', votes: 22 },
                { text: 'Reading', votes: 4 },
                { text: 'Discussion', votes: 3 }
            ],
            totalResponses: 45
        },
        {
            id: 4,
            question: 'How often do you participate in online coding challenges?',
            options: [
                { text: 'Weekly', votes: 10 },
                { text: 'Monthly', votes: 20 },
                { text: 'Rarely', votes: 12 },
                { text: 'Never', votes: 3 }
            ],
            totalResponses: 45
        },
        {
            id: 5,
            question: 'Which topic should be covered in the next session?',
            options: [
                { text: 'APIs & REST', votes: 14 },
                { text: 'Frontend Frameworks', votes: 18 },
                { text: 'Database Design', votes: 8 },
                { text: 'DevOps Basics', votes: 5 }
            ],
            totalResponses: 45
        }
    ],
    questions: [
        { id: 1, askedBy: 'Alice Johnson', text: 'What is the difference between SQL and NoSQL databases?', upvotes: 8, answered: true, createdAt: new Date(startTime.getTime() + 1200000).toISOString() },
        { id: 2, askedBy: 'Anonymous', text: 'How do you implement authentication in a web app?', upvotes: 12, answered: true, createdAt: new Date(startTime.getTime() + 1800000).toISOString() },
        { id: 3, askedBy: 'Bob Smith', text: 'What are the best practices for responsive design?', upvotes: 6, answered: false, createdAt: new Date(startTime.getTime() + 2400000).toISOString() },
        { id: 4, askedBy: 'Carol White', text: 'How does React state management work?', upvotes: 9, answered: true, createdAt: new Date(startTime.getTime() + 3000000).toISOString() },
        { id: 5, askedBy: 'Anonymous', text: 'What is the difference between let, const, and var?', upvotes: 15, answered: true, createdAt: new Date(startTime.getTime() + 3600000).toISOString() },
        { id: 6, askedBy: 'David Brown', text: 'Can you explain the concept of closures in JavaScript?', upvotes: 7, answered: false, createdAt: new Date(startTime.getTime() + 3900000).toISOString() },
        { id: 7, askedBy: 'Emma Davis', text: 'How do you optimize website performance?', upvotes: 5, answered: true, createdAt: new Date(startTime.getTime() + 4200000).toISOString() },
        { id: 8, askedBy: 'Anonymous', text: 'What are web accessibility best practices?', upvotes: 10, answered: false, createdAt: new Date(startTime.getTime() + 4500000).toISOString() },
        { id: 9, askedBy: 'Bob Smith', text: 'How does the virtual DOM work in React?', upvotes: 11, answered: true, createdAt: new Date(startTime.getTime() + 4800000).toISOString() },
        { id: 10, askedBy: 'Carol White', text: 'What is the use of useEffect in React?', upvotes: 8, answered: true, createdAt: new Date(startTime.getTime() + 5100000).toISOString() }
    ],
    feedback: {
        averageRating: 4.3,
        comments: [
            'Great session! Very informative and well-structured.',
            'Could use more hands-on examples.',
            'Excellent explanation of complex concepts.',
            'The pace was perfect for beginners.',
            'Would love more interactive exercises.',
            'Loved the Q&A segment, very helpful.',
            'Slides were clear and easy to follow.',
            'Looking forward to more advanced topics.',
            'Breakout discussions were engaging.',
            'Appreciated the real-world examples.'
        ],
        sentiment: 'positive'
    }
};
};

export const AnalyticsProvider = ({ children }) => {
  const location = useLocation();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call delay
    const loadData = async () => {
      try {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const sessionData = location.state?.sessionData;
        const mockData = generateMockData(sessionData);
        setAnalyticsData(mockData);
      } catch (err) {
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.state]);

  const value = {
    analyticsData,
    loading,
    error,
    refetch: () => {
      const sessionData = location.state?.sessionData;
      const mockData = generateMockData(sessionData);
      setAnalyticsData(mockData);
    }
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsData = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsData must be used within an AnalyticsProvider');
  }
  return context;
};