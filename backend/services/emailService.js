const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.apiUrl = process.env.BREVO_API_URL || "https://api.brevo.com/v3";
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM;
    this.senderName = process.env.BREVO_SENDER_NAME || "Classtro";
    this.timeout = 10000; // 10 seconds timeout for requests

    if (!this.apiKey) {
      console.error("BREVO_API_KEY is not set. Email service will not work.");
    }
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/smtp/email`,
        {
          sender: {
            email: this.senderEmail,
            name: this.senderName,
          },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || this.stripHtml(html),
        },
        {
          headers: {
            "api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          timeout: this.timeout,
        }
      );

      console.log("Email sent successfully:", response.data.messageId);
      return {
        success: true,
        messageId: response.data.messageId,
        message: "Email sent successfully",
        raw: response.data,
      };
    } catch (error) {
      console.error("Error sending email:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        message: "Failed to send email",
      };
    }
  }

  async sendOTP(email, otp, userName = "User") {
    const subject = "Verify Your Email - Classtro";
    const html = this.getOTPTemplate(otp, userName);
    return await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, userName) {
    const subject = "Welcome to Classtro!";
    const html = this.getWelcomeTemplate(userName);
    return await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email, resetToken, userName = "User") {
    const subject = "Reset Your Password - Classtro";
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    const html = this.getPasswordResetTemplate(resetUrl, userName);
    return await this.sendEmail(email, subject, html);
  }

  async verifyConnection() {
    try {
      const response = await axios.get(`${this.apiUrl}/account`, {
        headers: {
          "api-key": this.apiKey,
        },
        timeout: this.timeout,
      });

      console.log("Brevo API connection verified:", response.data);
      return true;
    } catch (error) {
      console.error("Brevo API connection failed:", error.response?.data || error.message);
      return false;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "");
  }

  getOTPTemplate(otp, userName) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Classtro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Email Verification</h1>
          <p>Complete your Classtro registration</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Thank you for registering with Classtro. To complete your registration, please verify your email address using the OTP below:</p>
          <div class="otp-box">
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
          </div>
          <p>If you didn't request this verification, please ignore this email.</p>
          <div class="footer">
            <p>Best regards,<br>The Classtro Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getWelcomeTemplate(userName) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Classtro!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Classtro!</h1>
          <p>Your interactive classroom experience starts here</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>Welcome to Classtro! We're excited to have you join our community of educators and learners.</p>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetTemplate(resetUrl, userName) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - Classtro</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Password Reset Request</h1>
          <p>Reset your Classtro account password</p>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>We received a request to reset your password for your Classtro account.</p>
          <a href="${resetUrl}">Reset Password</a>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();



(async () => {
  const emailService = new EmailService();
  const isEmailServiceReady = await emailService.verifyConnection();
  if (!isEmailServiceReady) {
    console.error("Email service is not ready. Check your Brevo API key and configuration.");
    process.exit(1); // Exit if email service is not ready
  }
})();