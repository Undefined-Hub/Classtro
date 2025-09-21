import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Details() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("engagement");
  const [tabChanging, setTabChanging] = useState(false);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setTabChanging(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabChanging(false);
    }, 300);
  };

  useEffect(() => {
    // Add the animation styles dynamically
    const style = document.createElement("style");
    style.textContent = `
      @keyframes rise {
        0% { height: 0; opacity: 0; }
        100% { opacity: 1; }
      }
      .animate-rise {
        animation: rise 0.8s ease-out forwards;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div>
      {/* What We Provide Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-0"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 dark:bg-blue-900/20 rounded-full filter blur-3xl opacity-30 z-0"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-300 dark:bg-blue-800/20 rounded-full filter blur-3xl opacity-30 z-0"></div>

        <div className="max-w-screen-xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            {/* <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
              Innovative Features
            </span> */}
            <h2 className="text-5xl font-extrabold mt-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 bg-clip-text text-transparent">
              Elevate Your Interactions
            </h2>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our platform transforms passive audiences into active participants
              through powerful, intuitive tools that anyone can use
            </p>
          </div>

          {/* Featured Tools - Tab Interface */}
          <div className="mb-16 max-w-5xl mx-auto">
            <div className="flex overflow-x-auto pb-4 hide-scrollbar mb-8 justify-center">
              <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button
                  onClick={() => handleTabChange("engagement")}
                  disabled={tabChanging}
                  className={`px-6 py-2.5 font-medium rounded-lg transition-all duration-300 ${
                    activeTab === "engagement"
                      ? "bg-white dark:bg-blue-700 text-blue-700 dark:text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  } ${tabChanging ? "opacity-70 pointer-events-none" : ""}`}
                >
                  Engagement Tools
                </button>
                <button
                  onClick={() => handleTabChange("analytics")}
                  disabled={tabChanging}
                  className={`px-6 py-2.5 font-medium rounded-lg transition-all duration-300 ${
                    activeTab === "analytics"
                      ? "bg-white dark:bg-blue-700 text-blue-700 dark:text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  } ${tabChanging ? "opacity-70 pointer-events-none" : ""}`}
                >
                  Analytics
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>

              <div className="relative min-h-[700px]">
                {/* Engagement Tab Content */}
                <div
                  className={`absolute inset-0 p-8 md:p-12 transition-all duration-700 ease-in-out transform ${
                    activeTab === "engagement"
                      ? "translate-x-0 opacity-100 z-10"
                      : "translate-x-full opacity-0 z-0"
                  }`}
                >
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        Interactive Audience Tools
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                        Create dynamic sessions that transform your audience
                        from passive listeners to active participants with our
                        suite of real-time engagement tools.
                      </p>

                      <div className="space-y-6">
                        {[
                          {
                            title: "Live Polling & Quizzes",
                            description:
                              "Launch polls and quizzes with results that appear in real-time as participants respond.",
                            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                          },
                          {
                            title: "Q&A and Discussion",
                            description:
                              "Enable anonymous questions with upvoting to focus on what matters most to your audience.",
                            icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                          },
                          {
                            title: "Word Clouds & Feedback",
                            description:
                              "Collect open-ended responses and visualize them in beautiful interactive displays.",
                            icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z",
                          },
                        ].map((item, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={item.icon}
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {item.title}
                              </h4>
                              <p className="mt-1 text-gray-600 dark:text-gray-300">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        <button
                          onClick={handleLoginClick}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Try it yourself
                          <svg
                            className="ml-2 -mr-1 w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Visual Demo/Mockup for Engagement Tools */}
                    <div className="relative">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-6 transform rotate-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                          <h4 className="text-center font-bold text-gray-800 dark:text-white mb-4">
                            Which topic interests you most?
                          </h4>

                          <div className="space-y-3">
                            {[
                              {
                                label: "Interactive polls",
                                percent: 42,
                                color: "bg-blue-500",
                              },
                              {
                                label: "Live Q&A sessions",
                                percent: 28,
                                color: "bg-green-500",
                              },
                              {
                                label: "Data visualization",
                                percent: 18,
                                color: "bg-purple-500",
                              },
                              {
                                label: "Export & reporting",
                                percent: 12,
                                color: "bg-yellow-500",
                              },
                            ].map((option, idx) => (
                              <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {option.label}
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {option.percent}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${option.color}`}
                                    style={{ width: `${option.percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-3">
                            Total votes: 124
                          </div>
                        </div>

                        <div className="text-center bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium inline-block">
                          Live Results
                        </div>
                      </div>

                      {/* Floating elements */}
                      <div className="absolute -top-6 -right-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg shadow-sm p-3 transform -rotate-3">
                        <div className="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-yellow-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Results in seconds
                          </span>
                        </div>
                      </div>

                      <div className="absolute -bottom-4 -left-4 bg-green-100 dark:bg-green-900/30 rounded-lg shadow-sm p-3 transform rotate-2">
                        <div className="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Works on any device
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Tab Content */}
                <div
                  className={`absolute inset-0 p-8 md:p-12 transition-all duration-700 ease-in-out transform overflow-y-auto ${
                    activeTab === "analytics"
                      ? "translate-x-0 opacity-100 z-10"
                      : "-translate-x-full opacity-0 z-0"
                  }`}
                >
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                        Powerful Data Analytics
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                        Transform participant responses into actionable insights
                        with our comprehensive analytics suite. Track
                        engagement, measure learning outcomes, and identify
                        trends.
                      </p>

                      <div className="space-y-6">
                        {[
                          {
                            title: "Performance Dashboards",
                            description:
                              "View real-time metrics and comprehensive summaries of all your sessions in one intuitive dashboard.",
                            icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
                          },
                          {
                            title: "Progress Tracking",
                            description:
                              "Monitor individual and group performance over time with detailed progression charts and metrics.",
                            icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                          },
                          {
                            title: "Custom Reports & Exports",
                            description:
                              "Generate detailed reports and export data in multiple formats for further analysis or sharing.",
                            icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                          },
                        ].map((item, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={item.icon}
                                />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {item.title}
                              </h4>
                              <p className="mt-1 text-gray-600 dark:text-gray-300">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8">
                        <button
                          onClick={handleLoginClick}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Analytics Demo
                          <svg
                            className="ml-2 -mr-1 w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Visual Demo/Mockup for Analytics */}
                    <div className="relative">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow-lg p-6 transform rotate-1">
                        {/* Session name */}
                        <div className="bg-blue-600 text-white py-2 px-4 rounded-t-lg text-sm font-medium mb-3">
                          <div className="flex justify-between items-center">
                            <span>Session: React Basics</span>
                            <span className="bg-white text-blue-600 rounded-full text-xs py-0.5 px-2">
                              LIVE
                            </span>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
                          <h4 className="text-center font-bold text-gray-800 dark:text-white mb-3">
                            Response Analytics
                          </h4>

                          {/* Total participants banner */}
                          <div className="bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg mb-3 flex justify-between items-center">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-blue-600 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Total Participants
                              </span>
                            </div>
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              42
                            </span>
                          </div>

                          {/* Leaderboard */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                              Leaderboard
                            </h5>
                            <div className="space-y-3">
                              {[
                                { name: "Alice", points: 950, rank: 1 },
                                { name: "Bob", points: 820, rank: 2 },
                                { name: "Charlie", points: 780, rank: 3 },
                              ].map((student, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2.5"
                                >
                                  <div className="flex items-center">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                                        student.rank === 1
                                          ? "bg-yellow-500"
                                          : student.rank === 2
                                          ? "bg-gray-400"
                                          : student.rank === 3
                                          ? "bg-amber-700"
                                          : "bg-blue-500"
                                      } mr-2.5`}
                                    >
                                      {student.rank}
                                    </div>
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                      {student.name}
                                    </span>
                                  </div>
                                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                    {student.points} pts
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-center bg-blue-600 text-white py-2 px-6 rounded-lg text-sm font-medium inline-block">
                          Download Report
                        </div>
                      </div>

                      {/* Floating elements */}
                      <div className="absolute -top-6 -right-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm p-3 transform -rotate-3">
                        <div className="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Export data
                          </span>
                        </div>
                      </div>

                      <div className="absolute -bottom-4 -left-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm p-3 transform rotate-2">
                        <div className="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Weekly reports
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Video Section */}
          <section className="bg-gray-50 dark:bg-gray-800 py-16">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="gap-8 items-center py-8 px-4 mx-auto xl:gap-16 md:grid md:grid-cols-2 lg:px-6">
                <div className="mt-4 md:mt-0">
                  <h2 className="mb-4 text-3xl tracking-tight font-bold text-gray-900 dark:text-white">
                    See Classtro in Action
                  </h2>
                  <p className="mb-6 text-gray-500 md:text-lg dark:text-gray-400">
                    Watch how Classtro transforms classroom engagement with
                    real-time polls and interactive Q&A sessions. Create
                    engaging learning experiences in seconds and boost
                    participation instantly.
                  </p>
                  <a
                    onClick={handleLoginClick}
                    href="#"
                    className="inline-flex items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-blue-900"
                  >
                    Get started
                    <svg
                      className="ml-2 -mr-1 w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </a>
                </div>

                <div className="mt-8 md:mt-0 relative rounded-lg overflow-hidden shadow-xl">
                  {/* Replace with actual video or placeholder */}
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-20 h-20 text-blue-700 opacity-80"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <img
                      className="w-full h-auto opacity-70"
                      src="/image.webp"
                      alt="Classtro Demo Video Thumbnail"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Feature Highlights */}
          <div className="mt-20">
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Why educators and presenters choose Classtro
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                  title: "Instant Setup",
                  description: "Create sessions in seconds, not minutes",
                },
                {
                  icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                  title: "Secure & Private",
                  description: "GDPR-compliant with data protection",
                },
                {
                  icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                  title: "Detailed Analytics",
                  description: "Measure engagement and track progress",
                },
                {
                  icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9",
                  title: "Works Everywhere",
                  description: "No downloads, works on all devices",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={feature.icon}
                      />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Details;
