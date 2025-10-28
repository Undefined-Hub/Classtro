import React, { useState } from "react";
import FloatingButton from "./FloatingButton";
import OptionsPanel from "./OptionsPanel";
import FeedbackModal from "./FeedbackModal";

const FloatingBugButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    severity: "medium",
    userEmail: "",
    screenshot: null,
  });

  const handleFloatingButtonClick = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (type) => {
    setReportType(type);
    setShowModal(true);
    setIsOpen(false);
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
      severity: "medium",
      userEmail: "",
      screenshot: null,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("type", reportType);
    formDataToSend.append("title", formData.title.trim());
    formDataToSend.append("description", formData.description.trim());

    const metadata = {
      userAgent: navigator.userAgent,
      appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      console: [],
    };
    formDataToSend.append("metadata", JSON.stringify(metadata));

    if (reportType === "bug") {
      formDataToSend.append(
        "stepsToReproduce",
        formData.stepsToReproduce.trim(),
      );
      formDataToSend.append("severity", formData.severity);
      formDataToSend.append("userEmail", formData.userEmail.trim());
      if (formData.screenshot) {
        formDataToSend.append("screenshot", formData.screenshot);
      }
    } else {
      if (formData.userEmail.trim()) {
        formDataToSend.append("userEmail", formData.userEmail.trim());
      }
    }

    try {
      const BACKEND_BASE_URL =
        import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${BACKEND_BASE_URL}/api/feedback`, {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `${reportType === "bug" ? "Bug report" : "Feedback"} submitted successfully! Report #${result.reportNumber || result.id}`,
        );
        handleCloseModal();
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        let errorMessage = "Failed to submit report. ";
        if (errorData.details && Array.isArray(errorData.details)) {
          errorMessage += errorData.details.map((d) => d.msg).join(", ");
        } else if (errorData.error) {
          errorMessage += errorData.error;
        } else {
          errorMessage += "Please try again.";
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Network error. Please check your connection and try again.");
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
        onClose={handleCloseModal}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onRemoveScreenshot={handleRemoveScreenshot}
      />
    </>
  );
};

export default FloatingBugButton;
