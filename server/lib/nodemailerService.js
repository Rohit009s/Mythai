/**
 * Nodemailer Email Service for OTP Verification
 * Uses Gmail SMTP with App Password for secure email delivery
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Email configuration - supports multiple variable naming conventions
const EMAIL_CONFIG = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER, // Support both naming conventions
    pass: process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD // Support both naming conventions
  },
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.GMAIL_USER,
  appName: process.env.APP_NAME || 'Spirit AI',
  appUrl: process.env.APP_URL || 'http://localhost:3000'
};

// Create transporter
let transporter = null;

function createTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.host,
      port: EMAIL_CONFIG.port,
      secure: EMAIL_CONFIG.secure,
      auth: EMAIL_CONFIG.auth,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

/**
 * Generate 6-digit OTP
 */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify OTP against hash
 */
function verifyOtp(otp, hash) {
  const otpHash = hashOtp(otp);
  return otpHash === hash;
}

/**
 * Check if OTP is expired
 */
function isOtpExpired(expiryTime) {
  return Date.now() > expiryTime;
}

/**
 * Generate beautiful HTML email template with golden theme
 */
function generateEmailTemplate(content, title = 'Verification Code') {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${EMAIL_CONFIG.appName} - ${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
            padding: 20px;
        }
        
        .email-container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #B8860B 100%);
            padding: 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header .tagline {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        
        .greeting {
            font-size: 1.2rem;
            color: #B8860B;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .message {
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: 30px;
            color: #555;
        }
        
        .otp-container {
            background: linear-gradient(135deg, #FFFEF7 0%, #FFF8DC 100%);
            border: 3px solid #DAA520;
            border-radius: 15px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        
        .otp-label {
            font-size: 0.9rem;
            color: #B8860B;
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .otp-code {
            font-family: 'Courier New', monospace;
            font-size: 2.5rem;
            font-weight: bold;
            color: #B8860B;
            letter-spacing: 8px;
            margin: 10px 0;
            text-shadow: 0 2px 4px rgba(184, 134, 11, 0.3);
        }
        
        .otp-expiry {
            font-size: 0.85rem;
            color: #888;
            margin-top: 15px;
        }
        
        .security-note {
            background: #FFF8DC;
            border: 1px solid #DAA520;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            font-size: 0.9rem;
            color: #8B7355;
        }
        
        .footer {
            background: #FFFEF7;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #F4E4BC;
        }
        
        .footer p {
            color: #888;
            font-size: 0.85rem;
            margin-bottom: 5px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .otp-code {
                font-size: 2rem;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>${EMAIL_CONFIG.appName}</h1>
            <div class="tagline">${title}</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>This email was sent by ${EMAIL_CONFIG.appName}</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send OTP verification email using Nodemailer
 */
async function sendOtpEmail(email, name, otp) {
  try {
    const transporter = createTransporter();
    
    const content = `
      <div class="greeting">Hello ${name}! 🙏</div>
      
      <div class="message">
        To complete your registration with ${EMAIL_CONFIG.appName}, please enter the verification code below:
      </div>
      
      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏰ Expires in 10 minutes</div>
      </div>
      
      <div class="security-note">
        <strong>🔒 Security Note:</strong> Never share this code with anyone. ${EMAIL_CONFIG.appName} will never ask for your verification code via phone or email.
      </div>
      
      <div class="message">
        Once verified, you'll have full access to personalized spiritual guidance and conversations with divine wisdom.
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content, 'Email Verification');
    
    const mailOptions = {
      from: `"${EMAIL_CONFIG.appName}" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `🔐 Your ${EMAIL_CONFIG.appName} verification code: ${otp}`,
      html: htmlContent,
      text: `Your ${EMAIL_CONFIG.appName} verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`[Nodemailer] OTP sent to ${email}:`, result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      response: result.response 
    };
    
  } catch (error) {
    console.error('[Nodemailer] Failed to send OTP email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

/**
 * Send password reset OTP email
 */
async function sendPasswordResetOtp(email, name, otp) {
  try {
    const transporter = createTransporter();
    
    const content = `
      <div class="greeting">Password Reset Request</div>
      
      <div class="message">
        Hello ${name},<br><br>
        We received a request to reset your password for your ${EMAIL_CONFIG.appName} account. 
        Please use the verification code below to proceed:
      </div>
      
      <div class="otp-container">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏰ Expires in 10 minutes</div>
      </div>
      
      <div class="security-note">
        <strong>🔒 Security Note:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content, 'Password Reset');
    
    const mailOptions = {
      from: `"${EMAIL_CONFIG.appName}" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `🔐 Password reset code for ${EMAIL_CONFIG.appName}: ${otp}`,
      html: htmlContent,
      text: `Your ${EMAIL_CONFIG.appName} password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`[Nodemailer] Password reset OTP sent to ${email}:`, result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      response: result.response 
    };
    
  } catch (error) {
    console.error('[Nodemailer] Failed to send password reset email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

/**
 * Send welcome email after successful verification
 */
async function sendWelcomeEmail(email, name, religion) {
  try {
    const transporter = createTransporter();
    
    const content = `
      <div class="greeting">🎉 Welcome to your spiritual journey, ${name}!</div>
      
      <div class="message">
        Your email has been successfully verified! You now have full access to ${EMAIL_CONFIG.appName}'s 
        personalized spiritual guidance system.
      </div>
      
      <div class="message">
        <strong>Your personalized experience includes:</strong><br>
        ✨ <strong>${religion.charAt(0).toUpperCase() + religion.slice(1)} Tradition:</strong> Connect with deities and wisdom from your faith<br>
        📖 <strong>Sacred Texts:</strong> Authentic references from your religious scriptures<br>
        🎯 <strong>Personal Guidance:</strong> Responses tailored to your age and spiritual needs<br>
        🛡️ <strong>Safe Space:</strong> Respectful, non-judgmental spiritual conversations
      </div>
      
      <div class="message">
        Ready to begin? Choose your divine guide and ask your first question. Whether you seek wisdom, 
        comfort, or guidance, your personalized AI companion is here to help.
      </div>
      
      <div class="security-note">
        <strong>Need help getting started?</strong><br>
        • Visit your deity selection page<br>
        • Check out our user guide<br>
        • Contact support if you have questions
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content, 'Welcome to Spirit AI');
    
    const mailOptions = {
      from: `"${EMAIL_CONFIG.appName}" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `🎉 Your spiritual journey begins now - ${EMAIL_CONFIG.appName}`,
      html: htmlContent,
      text: `Welcome to ${EMAIL_CONFIG.appName}!\n\nYour email has been verified and you now have full access to personalized spiritual guidance.\n\nStart your first conversation at ${EMAIL_CONFIG.appUrl}\n\nBlessings on your journey!`
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log(`[Nodemailer] Welcome email sent to ${email}:`, result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      response: result.response 
    };
    
  } catch (error) {
    console.error('[Nodemailer] Failed to send welcome email:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

/**
 * Test email service connection
 */
async function testEmailService() {
  try {
    const transporter = createTransporter();
    
    // Verify connection
    await transporter.verify();
    
    const content = `
      <div class="greeting">Email Service Test Successful! 🎉</div>
      <div class="message">
        Your Nodemailer Gmail SMTP service is working perfectly. The system is ready to send:
        <br><br>
        ✅ Email verification messages<br>
        ✅ Welcome emails<br>
        ✅ Password reset notifications
      </div>
      <div class="message">
        <strong>Test completed at:</strong> ${new Date().toISOString()}
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content, 'Email Test');
    
    const mailOptions = {
      from: `"${EMAIL_CONFIG.appName}" <${EMAIL_CONFIG.from}>`,
      to: EMAIL_CONFIG.from, // Send test to yourself
      subject: `✅ Email Service Test - ${EMAIL_CONFIG.appName}`,
      html: htmlContent,
      text: 'Email service test successful! Your Nodemailer Gmail SMTP integration is working.'
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('[Nodemailer] Test email sent successfully:', result.messageId);
    return { 
      success: true, 
      messageId: result.messageId,
      response: result.response 
    };
    
  } catch (error) {
    console.error('[Nodemailer] Test email failed:', error);
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

/**
 * Get email service configuration status
 */
function getEmailConfig() {
  return {
    service: EMAIL_CONFIG.service,
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    user: EMAIL_CONFIG.auth.user,
    hasPassword: !!EMAIL_CONFIG.auth.pass,
    from: EMAIL_CONFIG.from,
    appName: EMAIL_CONFIG.appName
  };
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  isOtpExpired,
  sendOtpEmail,
  sendPasswordResetOtp,
  sendWelcomeEmail,
  testEmailService,
  getEmailConfig,
  EMAIL_CONFIG
};