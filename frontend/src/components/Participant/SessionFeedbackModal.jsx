import React, { useState } from "react";
import { X, Send, Star, Heart } from "lucide-react";

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

const SessionFeedbackModal = ({
  isOpen,
  sessionTitle,
  roomName,
  onSubmit,
  isSubmitting,
}) => {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert("Please select a rating before submitting");
      return;
    }

    onSubmit({ rating, description: description.trim() });
  };

  const handleSkip = () => {
    onSubmit({ rating: 0, description: "", skipped: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-5 transition-all duration-300">
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 scrollbar-hide"
        onClick={(e) => e.stopPropagation()}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="flex items-center gap-3 m-0 text-xl font-bold text-gray-900 dark:text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Heart size={24} className="text-white" />
            </div>
            Session Ended - Share Your Feedback
          </h3>
        </div>

        {/* Session Info */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Session
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {sessionTitle || "Untitled Session"}
            </p>
            {roomName && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-1">
                  Room
                </p>
                <p className="font-medium text-gray-800 dark:text-gray-200">
                  {roomName}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-4">
          {/* Rating */}
          <div className="mb-6">
            <label className="block mb-3 font-semibold text-gray-700 dark:text-gray-200 text-sm text-center">
              How would you rate this session? *
            </label>
            <div className="flex justify-center">
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            {rating > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                {rating === 5 && "⭐ Excellent!"}
                {rating === 4 && "😊 Great!"}
                {rating === 3 && "👍 Good"}
                {rating === 2 && "😐 Could be better"}
                {rating === 1 && "😞 Needs improvement"}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block mb-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"
            >
              Additional Comments (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share your thoughts about the session..."
              rows="4"
              maxLength={1000}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 resize-vertical min-h-[100px]"
            />
            <small className="block mt-1 text-gray-500 dark:text-gray-400 text-xs">
              {description.length}/1000 characters
            </small>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-col sm:flex-row">
            <button
              type="button"
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl cursor-pointer font-medium text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-60 disabled:cursor-not-allowed order-2 sm:order-1"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip for now
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 border-none text-white rounded-xl cursor-pointer font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-600/30 dark:from-blue-500 dark:to-purple-500"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionFeedbackModal;
