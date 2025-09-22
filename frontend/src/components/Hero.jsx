import React from 'react'
import { useNavigate } from 'react-router-dom'

function Hero() {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/login');
  };
  
  const handleJoinSession = () => {
    navigate('/participant/home');
  };
  
  return (
    <div>
      <section className="bg-white dark:bg-gray-900 mt-20">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
          
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            Engage Any Audience, Anywhere
          </h1>
          
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 xl:px-48 dark:text-gray-400">
            Run live polls, quizzes, and interactive Q&A to make every session engaging
            - whether in classrooms, meetings, or large events.
          </p>
          
          <div className="flex flex-col mb-8 lg:mb-16 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleGetStarted}
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              Get Started
            </button>
            
            <button
              onClick={handleJoinSession}
              className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-blue-700 rounded-lg border border-blue-700 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-blue-500 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
              Join Session with Code
            </button>
          </div>
          
          <div className="mt-20">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">Who Can Use Classtro</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              Our platform is designed to meet the needs of various environments where audience engagement is key
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full scale-125 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-center text-blue-600 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300">Education</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">Interactive classes. Engaged students.</p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full scale-125 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-center text-blue-600 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300">Corporate</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">Engage teams and collect instant meeting feedback.</p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-center text-blue-600 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300">Conferences</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">Connect audiences with live polls and Q&A.</p>
              </div>

              <div className="p-6 rounded-xl bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl text-center text-blue-600 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300">Workshops</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center">Gamify learning and encourage collaboration.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-24">
            <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">How It Works</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
            
            <div className="max-w-4xl mx-auto relative">
              {/* Connecting line - stops at step 3 */}
              <div className="absolute left-8 top-10 w-1 bg-gradient-to-b from-blue-400 to-blue-500 h-[calc(66%)] rounded-full hidden md:block"></div>
              
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row items-start mb-12 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg z-10 mb-4 md:mb-0">
                  1
                </div>
                <div className="md:ml-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full md:w-auto transform transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                    Create a Session
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Set up a new poll, quiz, or Q&A session in just seconds. No complicated setup required — works from any device with a browser.
                  </p>
                  <div className="inline-flex items-center text-blue-600 dark:text-blue-300 font-medium">
                    <span>Start creating</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col md:flex-row items-start mb-12 relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg z-10 mb-4 md:mb-0">
                  2
                </div>
                <div className="md:ml-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full md:w-auto transform transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                    Share Access Code or QR
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Invite participants to join instantly by sharing a simple 6-digit code or displaying the auto-generated QR code. No downloads or accounts needed for participants.
                  </p>
                  <div className="inline-flex items-center text-blue-600 dark:text-blue-300 font-medium">
                    <span>View demo</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col md:flex-row items-start relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg z-10 mb-4 md:mb-0">
                  3
                </div>
                <div className="md:ml-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full md:w-auto transform transition-all duration-300 hover:shadow-xl">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
                    Engage in Real-Time
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Launch polls, quizzes, and Q&A sessions with live results. Watch as responses appear instantly and visualize data with beautiful charts.
                  </p>
                  <div className="inline-flex items-center text-blue-600 dark:text-blue-300 font-medium">
                    <span>Try it now</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}

export default Hero
