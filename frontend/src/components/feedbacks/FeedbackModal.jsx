import React from "react";
import { X, Bug, Heart, Send, Star } from "lucide-react";

const StarRating = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-all duration-200 hover:scale-110 focus:outline-none"
        >
          <Star
            size={32}
            className={`${
              star <= (hoverRating || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            } transition-colors duration-200`}
          />
        </button>
      ))}
    </div>
  );
};

const FeedbackModal = ({
  isOpen,
  reportType,
  formData,
  screenshotPreview,
  isSubmitting,
  modules = [],
  onClose,
  onInputChange,
  onRatingChange,
  onSubmit,
  onRemoveScreenshot,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-5 transition-all duration-300">
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="flex items-center gap-3 m-0 text-xl font-bold text-gray-900 dark:text-white">
            {reportType === "bug" ? (
              <>
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50">
                  <Bug size={24} className="text-red-600 dark:text-red-400" />
                </div>
                Report a Bug
              </>
            ) : (
              <>
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <Heart
                    size={24}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                Submit Feedback
              </>
            )}
          </h3>
          <button
            className="bg-none border-none cursor-pointer p-2 rounded-xl text-gray-500 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-4">
          {reportType === "bug" ? (
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={onInputChange}
                placeholder="Brief description of the issue"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                required
              />
            </div>
          ) : (
            <div className="mb-4">
              <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">
                Rate your experience *
              </label>
              <div className="flex justify-center">
                <StarRating rating={formData.rating || 0} onRatingChange={onRatingChange} />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              placeholder={
                reportType === "bug"
                  ? "Describe what happened"
                  : "Your feedback"
              }
              rows="3"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 resize-vertical min-h-[72px]"
              required
            />
          </div>

          {reportType === "bug" && (
            <>
              <div className="mb-4">
                <label
                  htmlFor="stepsToReproduce"
                  className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
                >
                  Steps to Reproduce *
                </label>
                <textarea
                  id="stepsToReproduce"
                  name="stepsToReproduce"
                  value={formData.stepsToReproduce}
                  onChange={onInputChange}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                  rows="3"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 resize-vertical min-h-[72px]"
                  required
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="module"
                  className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
                >
                  Module *
                </label>
                <select
                  id="module"
                  name="module"
                  value={formData.module}
                  onChange={onInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                  required
                >
                  <option value="">Select affected module</option>
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="severity"
                  className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
                >
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={onInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="screenshot"
                  className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
                >
                  Screenshot (optional)
                </label>
                <input
                  type="file"
                  id="screenshot"
                  name="screenshot"
                  accept="image/*"
                  onChange={onInputChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
                />
                <small className="block mt-1 text-gray-500 dark:text-gray-400 text-xs">
                  📸 Upload a screenshot to help us understand the issue better
                  (Max 5MB)
                </small>
                {screenshotPreview && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Preview:
                    </p>
                    <div className="relative">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="max-w-full h-auto max-h-32 rounded border object-contain"
                      />
                      <button
                        type="button"
                        onClick={onRemoveScreenshot}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold transition-colors"
                        title="Remove screenshot"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mb-4">
            <label
              htmlFor="userEmail"
              className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
            >
              Email {reportType === "bug" ? "*" : "(optional)"}
            </label>
            <input
              type="email"
              id="userEmail"
              name="userEmail"
              value={formData.userEmail}
              onChange={onInputChange}
              placeholder="your@email.com"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
              required={reportType === "bug"}
            />
            <small className="block mt-1 text-gray-500 dark:text-gray-400 text-xs">
              {reportType === "bug"
                ? "📧 Required for bug reports so we can follow up"
                : "💌 Optional - we'll use this to follow up on your feedback"}
            </small>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-col sm:flex-row">
            <button
              type="button"
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-60 disabled:cursor-not-allowed order-2 sm:order-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 border-none text-white rounded-xl cursor-pointer font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none order-1 sm:order-2 ${
                reportType === "bug"
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/30 dark:from-red-600 dark:to-red-700"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-blue-600/30 dark:from-blue-500 dark:to-blue-600"
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
                  Submit {reportType === "bug" ? "Bug Report" : "Feedback"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
