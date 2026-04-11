import React, { useState } from "react";
import FloatingButton from "./FloatingButton";
import OptionsPanel from "./OptionsPanel";
import FeedbackModal from "./FeedbackModal";
import ChatBotWindow from "./ChatBot/ChatBotWindow.jsx";
import toast from "../../utils/toastUtils";

// Static list of bug report modules
const BUG_MODULES = [
  "Authentication",
  "Room Management",
  "Session Dashboard",
  "QR Code Joining",
  "Polls",
  "Q&A",
  "Live Chat",
  "Attendance Tracking",
  "Analytics",
  "Session Feedback",
  "System Feedback",
  "User Profile",
  "Notifications",
  "File Upload",
  "Other",
];

const FloatingBugButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    module: "",
    severity: "medium",
    userEmail: "",
    screenshot: null,
    rating: 0,
  });

  const handleFloatingButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (type) => {
    if (type === "chatbot") {
      setShowChatBot(true);
      setIsOpen(false);
    } else {
      setReportType(type);
      setShowModal(true);
      setIsOpen(false);
    }
  };

  const handleCloseChatBot = () => {
    setShowChatBot(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setReportType(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    setFormData({
      title: "",
      description: "",
      stepsToReproduce: "",
      module: "",
      severity: "medium",
      userEmail: "",
      screenshot: null,
      rating: 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && name === "screenshot" && files[0]) {
      const file = files[0];
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreview(previewUrl);
      setFormData((prev) => ({ ...prev, [name]: file }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? checked : type === "file" ? files[0] : value,
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataToSend = new FormData();

    const metadata = {
      userAgent: navigator.userAgent,
      appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      console: [],
    };
    formDataToSend.append("metadata", JSON.stringify(metadata));
    formDataToSend.append("description", formData.description.trim());

    if (reportType === "bug") {
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append(
        "stepsToReproduce",
        formData.stepsToReproduce.trim(),
      );
      formDataToSend.append("module", formData.module);
      formDataToSend.append("severity", formData.severity);
      formDataToSend.append("userEmail", formData.userEmail.trim());
      if (formData.screenshot) {
        formDataToSend.append("screenshot", formData.screenshot);
      }
    } else {
      // Feedback - add rating
      formDataToSend.append("rating", formData.rating);
      if (formData.userEmail.trim()) {
        formDataToSend.append("userEmail", formData.userEmail.trim());
      }
    }

    try {
      const BACKEND_BASE_URL =
        import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";
      const endpoint = reportType === "bug" ? "systemBug" : "systemFeedback";
      const response = await fetch(
        `${BACKEND_BASE_URL}/api/feedback/${endpoint}`,
        {
          method: "POST",
          body: formDataToSend,
        },
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `${reportType === "bug" ? "Bug report" : "Feedback"} submitted successfully! Report #${result.reportNumber || result.id}`,
          { duration: 4000 },
        );
        handleCloseModal();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error occurred" }));

        let errorMessage = "";

        // Handle validation errors from backend
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage = errorData.details
            .map((d) => d.msg || d.message)
            .join(", ");
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = "Failed to submit report. Please try again.";
        }

        toast.error(errorMessage, { duration: 5000 });
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(
        "Network error. Please check your connection and try again.",
        {
          duration: 5000,
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setScreenshotPreview(null);
    setFormData((prev) => ({ ...prev, screenshot: null }));
    const fileInput = document.getElementById("screenshot");
    if (fileInput) fileInput.value = "";
  };

  return (
    <>
      <FloatingButton isOpen={isOpen} onClick={handleFloatingButtonClick} />

      <OptionsPanel isOpen={isOpen} onOptionSelect={handleOptionSelect} />

      <FeedbackModal
        isOpen={showModal}
        reportType={reportType}
        formData={formData}
        screenshotPreview={screenshotPreview}
        isSubmitting={isSubmitting}
        modules={BUG_MODULES}
        onClose={handleCloseModal}
        onInputChange={handleInputChange}
        onRatingChange={handleRatingChange}
        onSubmit={handleSubmit}
        onRemoveScreenshot={handleRemoveScreenshot}
      />

      <ChatBotWindow isOpen={showChatBot} onClose={handleCloseChatBot} />
    </>
  );
};

export default FloatingBugButton;
