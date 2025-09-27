import React, { useState } from 'react';
import { MessageCircle, Bug, Send, X, AlertCircle, Heart } from 'lucide-react';
import './FloatingBugButton.css';

const FloatingBugButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stepsToReproduce: '',
    severity: 'medium',
    userEmail: '',
    screenshot: null
  });

  const handleOpenModal = (type) => {
    setReportType(type);
    setShowModal(true);
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setReportType(null);
    // Clear screenshot preview
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    setFormData({
      title: '',
      description: '',
      stepsToReproduce: '',
      severity: 'medium',
      userEmail: '',
      screenshot: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && name === 'screenshot' && files[0]) {
      const file = files[0];
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreview(previewUrl);
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Build FormData for file upload
    const formDataToSend = new FormData();
    
    // Add basic fields
    formDataToSend.append('type', reportType);
    formDataToSend.append('title', formData.title.trim());
    formDataToSend.append('description', formData.description.trim());
    
    // Add metadata as JSON string
    const metadata = {
      userAgent: navigator.userAgent,
      appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      console: []
    };
    formDataToSend.append('metadata', JSON.stringify(metadata));

    // Add bug-specific fields
    if (reportType === 'bug') {
      formDataToSend.append('stepsToReproduce', formData.stepsToReproduce.trim());
      formDataToSend.append('severity', formData.severity);
      formDataToSend.append('userEmail', formData.userEmail.trim());
    } else {
      // For feedback, email is optional
      if (formData.userEmail.trim()) {
        formDataToSend.append('userEmail', formData.userEmail.trim());
      }
    }

    // Add screenshot if provided (only for bug reports)
    if (reportType === 'bug' && formData.screenshot) {
      formDataToSend.append('screenshot', formData.screenshot);
    }

    try {
      const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${BACKEND_BASE_URL}/api/feedback`, {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${reportType === 'bug' ? 'Bug report' : 'Feedback'} submitted successfully! Report #${result.reportNumber || result.id}`);
        handleCloseModal();
      } else {
        // Get detailed error information
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error response:', errorData);
        
        let errorMessage = 'Failed to submit report. ';
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage += errorData.details.map(d => d.msg).join(', ');
        } else if (errorData.error) {
          errorMessage += errorData.error;
        } else {
          errorMessage += 'Please try again.';
        }
        
        alert(errorMessage);
        return;
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  try {
    return (
      <>
        {/* Floating Button */}
        <div className="fixed bottom-6 right-6 z-[9999] font-sans floating-bug-responsive">
        <button
          className={`floating-bug-button w-12 h-12 rounded-full border-none shadow-lg cursor-pointer flex items-center justify-center transition-all duration-300 ease-out ${
            isOpen 
              ? 'bg-gradient-to-br from-red-500 to-red-600 rotate-45 shadow-xl shadow-red-500/40 dark:from-red-600 dark:to-red-700' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:-translate-y-1 hover:shadow-xl shadow-blue-500/40 dark:from-blue-600 dark:to-blue-700 dark:shadow-blue-600/40'
          } text-white`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Report Bug or Feedback"
        >
          <div className="relative">
            {isOpen ? (
              <X size={18} className="transition-all duration-300" />
            ) : (
              <AlertCircle size={20} className="transition-all duration-300" />
            )}
          </div>
        </button>
        
        {/* Options Panel */}
        {isOpen && (
          <div className="absolute bottom-[56px] right-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 min-w-[180px] animate-slide-up floating-bug-options-mobile backdrop-blur-sm">
            <button
              className="w-full p-4 border-none bg-transparent rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 group"
              onClick={() => handleOpenModal('feedback')}
            >
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                <Heart size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span>Submit Feedback</span>
            </button>
            <button
              className="w-full p-4 border-none bg-transparent rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 group"
              onClick={() => handleOpenModal('bug')}
            >
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 group-hover:bg-red-200 dark:group-hover:bg-red-800/50 transition-colors">
                <Bug size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <span>Report Bug</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-5 animate-fade-in">
          <div className="floating-bug-modal bg-white dark:bg-gray-800 rounded-3xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-in floating-bug-modal-mobile" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="flex items-center gap-3 m-0 text-xl font-bold text-gray-900 dark:text-white">
                {reportType === 'bug' ? (
                  <>
                    <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                      <Bug size={24} className="text-red-600 dark:text-red-400" />
                    </div>
                    Report a Bug
                  </>
                ) : (
                  <>
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                      <Heart size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    Submit Feedback
                  </>
                )}
              </h3>
              <button 
                className="bg-none border-none cursor-pointer p-2 rounded-xl text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
                onClick={handleCloseModal}
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label htmlFor="title" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={reportType === 'bug' ? 'Brief description of the issue' : 'Feedback title'}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="description" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={reportType === 'bug' ? 'Describe what happened' : 'Your feedback'}
                  rows="3"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 resize-vertical min-h-[72px] hide-scrollbar"
                  required
                />
              </div>

              {reportType === 'bug' && (
                <div className="mb-4">
                  <label htmlFor="stepsToReproduce" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                    Steps to Reproduce *
                  </label>
                  <textarea
                    id="stepsToReproduce"
                    name="stepsToReproduce"
                    value={formData.stepsToReproduce}
                    onChange={handleInputChange}
                    placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                    rows="3"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 resize-vertical min-h-[72px] hide-scrollbar"
                    required
                  />
                </div>
              )}

              {reportType === 'bug' && (
                <div className="mb-4">
                  <label htmlFor="severity" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                    Severity
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              )}

              {reportType === 'bug' && (
                <div className="mb-4">
                  <label htmlFor="screenshot" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                    Screenshot (optional)
                  </label>
                  <input
                    type="file"
                    id="screenshot"
                    name="screenshot"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
                  />
                  <small className="block mt-1 text-gray-500 dark:text-gray-400 text-xs">
                    📸 Upload a screenshot to help us understand the issue better (Max 5MB)
                  </small>
                  {screenshotPreview && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                      <div className="relative">
                        <img 
                          src={screenshotPreview} 
                          alt="Screenshot preview" 
                          className="max-w-full h-auto max-h-32 rounded border object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            URL.revokeObjectURL(screenshotPreview);
                            setScreenshotPreview(null);
                            setFormData(prev => ({ ...prev, screenshot: null }));
                            // Reset file input
                            const fileInput = document.getElementById('screenshot');
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors"
                          title="Remove screenshot"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="userEmail" className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  Email {reportType === 'bug' ? '*' : '(optional)'}
                </label>
                <input
                  type="email"
                  id="userEmail"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  required={reportType === 'bug'}
                />
                <small className="block mt-1 text-gray-500 dark:text-gray-400 text-xs">
                  {reportType === 'bug' 
                    ? '📧 Required for bug reports so we can follow up'
                    : '💌 Optional - we\'ll use this to follow up on your feedback'
                  }
                </small>
              </div>

              <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 floating-bug-form-mobile">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 border-none text-white rounded-xl cursor-pointer font-medium text-sm flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${
                    reportType === 'bug' 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/30 dark:from-red-600 dark:to-red-700' 
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-600/30 dark:from-blue-500 dark:to-blue-600'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit {reportType === 'bug' ? 'Bug Report' : 'Feedback'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
    );
  } catch (error) {
    console.error('FloatingBugButton error:', error);
    return null; // Return nothing if there's an error
  }
};

export default FloatingBugButton;