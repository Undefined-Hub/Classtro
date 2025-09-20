const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates in development
      },
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.stripHtml(html), // Fallback to stripped HTML if no text provided
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        message: "Email sent successfully",
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error.message,
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
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
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
            <p style="margin: 0; font-size: 18px; color: #374151;">Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
          </div>
          
          <p>If you didn't request this verification, please ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Classtro Team</p>
            <p style="font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
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
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .features { display: flex; justify-content: space-around; margin: 20px 0; }
          .feature { text-align: center; flex: 1; margin: 0 10px; }
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
          
          <div class="features">
            <div class="feature">
              <h3>📊 Real-time Polls</h3>
              <p>Engage your audience</p>
            </div>
            <div class="feature">
              <h3>💬 Interactive Sessions</h3>
              <p>Foster collaboration</p>
            </div>
            <div class="feature">
              <h3>⚡ Easy Setup</h3>
              <p>Get started quickly</p>
            </div>
          </div>
          
          <p>Ready to get started? Access your dashboard and begin creating engaging classroom experiences!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" class="button">Go to Dashboard</a>
          </div>
          
          <p>Best regards,<br>The Classtro Team</p>
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
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .warning { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 15px; border-radius: 5px; margin: 20px 0; }
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
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </div>
          
          <p>For security reasons, if you need to reset your password again, you'll need to make a new request.</p>
          
          <p>Best regards,<br>The Classtro Team</p>
        </div>
      </body>
      </html>
    `;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, "");
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready to send emails");
      return true;
    } catch (error) {
      console.error("Email service verification failed:", error);
      return false;
    }
  }
}

module.exports = new EmailService();
