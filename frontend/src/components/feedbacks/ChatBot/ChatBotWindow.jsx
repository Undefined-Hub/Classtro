import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Minimize2, Maximize2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import ChatMessage from "./ChatMessage";
import { useAuth } from "../../../context/UserContext";
import api from "../../../utils/api";
import toast from "../../../utils/toastUtils";

const ChatBotWindow = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Determine if user is logged in
  const isAuthenticated = !!user;
  
  // Get initial suggestions based on auth status and role
  const getInitialSuggestions = useCallback(() => {
    if (!isAuthenticated) {
      // Guest suggestions (before login)
      return [
        "What is Classtro?",
        "How can I improve my study habits?",
        "How does online learning work?"
      ];
    } else if (user.role === 'TEACHER') {
      // Teacher suggestions
      return [
        "How do I create a room?",
        "What's the session workflow?",
        "How to manage student questions?"
      ];
    } else {
      // Student suggestions
      return [
        "How do I join a session?",
        "What features are available?",
        "How to ask questions anonymously?"
      ];
    }
  }, [isAuthenticated, user?.role]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      suggestions: getInitialSuggestions(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Reset chat when user changes (login/logout/role change)
  useEffect(() => {
    // Clear chat history and reset to welcome message with fresh suggestions
    setMessages([
      {
        id: 1,
        text: "How can I help you today?",
        isBot: true,
        timestamp: new Date(),
        suggestions: getInitialSuggestions(),
      },
    ]);
  }, [user?.id, user?.role, getInitialSuggestions]); // Triggers on user change or role change

  // Function to send message to AI and get response
  const sendMessageToAI = async (message, role, page, isAuthenticated) => {
    try {
      const response = await api.post('/api/ai/chat', {
        role: isAuthenticated ? role : 'guest',
        page,
        message,
        isAuthenticated
      });
      
      if (response.data.success) {
        return {
          message: response.data.data.message,
          timestamp: response.data.data.timestamp
        };
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw error;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  // Function to handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputMessage.trim();
    setInputMessage("");
    setIsTyping(true);

    try {
      const currentPage = location.pathname.split('/')[1] || 'home';
      const aiResponse = await sendMessageToAI(
        userInput,
        user?.role || 'student',
        currentPage,
        isAuthenticated
      );
      
      const botMessage = {
        id: messages.length + 2,
        text: aiResponse.message,
        isBot: true,
        timestamp: new Date(aiResponse.timestamp),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: error.response?.data?.message || "Sorry, I'm having trouble responding right now. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsTyping(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[10000] transition-all duration-300 ${
        isMinimized
          ? "bottom-4 right-4 w-[280px] sm:w-[320px] h-[60px]"
          : "bottom-6 right-6 w-[calc(100%-3rem)] sm:w-[420px] md:w-[460px] h-[calc(100vh-3rem)] sm:h-[650px] md:h-[700px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Bot size={20} className="text-white sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base m-0">
              Classtro AI Assistant
            </h3>
            <p className="text-blue-100 text-xs m-0">
              {isTyping ? "Typing..." : "Online"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={toggleMinimize}
            className="p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer border-none bg-transparent"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Minimize2 size={16} className="sm:w-[18px] sm:h-[18px]" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className="h-[calc(100%-140px)] sm:h-[calc(100%-140px)] overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 hide-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage message={msg.text} isBot={msg.isBot} />
                
                {/* Show suggestions only for first bot message */}
                {msg.isBot && msg.suggestions && msg.id === 1 && (
                  <div className="flex flex-wrap gap-2 mb-4 ml-0 sm:ml-11">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        // className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:border-blue-400 transition-all duration-200"
                        className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs bg-blue-50/50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-full text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-800/40 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 justify-start">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Bot size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-3 py-2 sm:px-4 sm:py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className={`p-2.5 sm:p-3 rounded-xl border-none cursor-pointer transition-all duration-200 ${
                  inputMessage.trim()
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:scale-105"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send size={18} className="sm:w-5 sm:h-5" />
              </button>
            </form>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 m-0 text-center">
              AI-powered by Gemini • Ask about Classtro or general topics
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBotWindow;
