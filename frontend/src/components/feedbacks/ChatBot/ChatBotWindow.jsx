import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Minimize2, Maximize2 } from "lucide-react";
import ChatMessage from "./ChatMessage";

const ChatBotWindow = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "How can I help you today?",
      isBot: true,
      timestamp: new Date(),
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
    setInputMessage("");
    setIsTyping(true);

    // TODO: Replace with actual Gemini API call
    // Simulating bot response for now
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: "I'm here to help! This is a placeholder response. The Gemini API integration will be added soon.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[10000] transition-all duration-300 ${
        isMinimized
          ? "bottom-6 w-[320px] h-[60px]"
          : "bottom-6 w-[380px] h-[600px] sm:w-[420px] sm:h-[650px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base m-0">
              Classtro AI Assistant
            </h3>
            <p className="text-blue-100 text-xs m-0">
              {isTyping ? "Typing..." : "Online"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMinimize}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer border-none bg-transparent"
            aria-label={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 cursor-pointer border-none bg-transparent"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div className="h-[calc(100%-140px)] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg.text} isBot={msg.isBot} />
            ))}

            {isTyping && (
              <div className="flex gap-3 mb-4 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className={`p-3 rounded-xl border-none cursor-pointer transition-all duration-200 ${
                  inputMessage.trim()
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:scale-105"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </form>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 m-0 text-center">
              AI-powered by Gemini • Ask about Classtro or general topics
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatBotWindow;
