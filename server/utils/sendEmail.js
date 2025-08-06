const nodemailer = require('nodemailer');

// Email configuration for different providers
const emailConfigs = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  },
  bracu: {
    host: 'smtp.gmail.com', // BRAC University uses Gmail
    port: 587,
    secure: false,
    auth: {
      user: process.env.BRACU_EMAIL_USER,
      pass: process.env.BRACU_EMAIL_PASS
    }
  }
};

// Determine which email config to use based on recipient
const getEmailConfig = (recipientEmail) => {
  if (recipientEmail.endsWith('@g.bracu.ac.bd')) {
    return emailConfigs.bracu;
  }
  return emailConfigs.gmail;
};

// Get the appropriate sender email
const getSenderEmail = (recipientEmail) => {
  if (recipientEmail.endsWith('@g.bracu.ac.bd')) {
    return process.env.BRACU_EMAIL_USER || process.env.EMAIL_USER;
  }
  return process.env.EMAIL_USER;
};

const sendEmail = async (options) => {
  try {
    const emailConfig = getEmailConfig(options.email);
    const senderEmail = getSenderEmail(options.email);

    // Create transporter
    const transporter = nodemailer.createTransporter(emailConfig);

    // Verify transporter configuration
    await transporter.verify();
    console.log('Email server is ready to send messages');

    // Email options
    const mailOptions = {
      from: `DigiDiary <${senderEmail}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || generateHTMLTemplate(options)
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Email could not be sent: ${error.message}`);
  }
};

// Generate HTML template for password reset
const generateHTMLTemplate = (options) => {
  if (options.type === 'password-reset') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - DigiDiary</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>DigiDiary - Your Personal Digital Journey</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>You requested a password reset for your DigiDiary account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${options.resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 10 minutes</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>For security, this link can only be used once</li>
              </ul>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${options.resetUrl}</p>
          </div>
          <div class="footer">
            <p>This email was sent from DigiDiary. Please do not reply to this email.</p>
            <p>If you have any questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Default template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DigiDiary</title>
    </head>
    <body>
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">DigiDiary</h2>
        <p>${options.message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">This email was sent from DigiDiary.</p>
      </div>
    </body>
    </html>
  `;
};

module.exports = sendEmail; 