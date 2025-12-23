/**
 * Professional Email Service using Resend
 * Handles email verification, welcome emails, and notifications
 * with beautiful, branded templates
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM_VERIFIED || 'rohithneelam87@gmail.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Spirit AI',
  replyTo: process.env.EMAIL_REPLY_TO || 'rohithneelam87@gmail.com',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  appName: process.env.APP_NAME || 'Spirit AI'
};

/**
 * Generate beautiful HTML email template
 */
function generateEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${EMAIL_CONFIG.appName}</title>
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
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #B8860B 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .header .tagline {
            font-size: 1.1rem;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 1.3rem;
            color: #B8860B;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .message {
            font-size: 1.1rem;
            line-height: 1.8;
            margin-bottom: 30px;
            color: #555;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #B8860B 100%);
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 1.1rem;
            text-align: center;
            box-shadow: 0 10px 30px rgba(218, 165, 32, 0.4);
            transition: transform 0.3s ease;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
        }
        
        .verification-code {
            background: #FFFEF7;
            border: 2px dashed #DAA520;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
            font-size: 1.2rem;
            font-weight: bold;
            color: #B8860B;
        }
        
        .features {
            background: #FFFEF7;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .features h3 {
            color: #B8860B;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
        }
        
        .feature-list li {
            padding: 8px 0;
            color: #666;
            position: relative;
            padding-left: 25px;
        }
        
        .feature-list li:before {
            content: "✨";
            position: absolute;
            left: 0;
            top: 8px;
        }
        
        .footer {
            background: #FFFEF7;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #F4E4BC;
        }
        
        .footer p {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #B8860B;
            text-decoration: none;
            font-weight: 500;
        }
        
        .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, #DAA520, transparent);
            margin: 30px 0;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 10px;
                border-radius: 15px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .cta-button {
                display: block;
                margin: 20px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>${EMAIL_CONFIG.appName}</h1>
            <div class="tagline">Connect with Divine Wisdom</div>
        </div>
        
        <div class="content">
            ${content}
        </div>
        
        <div class="footer">
            <p>This email was sent by ${EMAIL_CONFIG.appName}</p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="social-links">
                <a href="${EMAIL_CONFIG.appUrl}">Visit Website</a>
                <a href="${EMAIL_CONFIG.appUrl}/support">Support</a>
            </div>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send email verification with beautiful template
 */
async function sendVerificationEmail(email, name, verificationToken) {
  try {
    const verificationUrl = `${EMAIL_CONFIG.appUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    const content = `
      <div class="greeting">Welcome, ${name}! 🙏</div>
      
      <div class="message">
        Thank you for joining ${EMAIL_CONFIG.appName}, your gateway to personalized spiritual wisdom. 
        We're excited to help you connect with divine guidance tailored to your faith and journey.
      </div>
      
      <div class="message">
        To ensure the security and authenticity of your spiritual conversations, please verify your email address by clicking the button below:
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="cta-button">
          ✨ Verify My Email & Begin Journey
        </a>
      </div>
      
      <div class="features">
        <h3>What awaits you after verification:</h3>
        <ul class="feature-list">
          <li>Personalized conversations with deities from your faith tradition</li>
          <li>Sacred text references tailored to your questions</li>
          <li>Age-appropriate spiritual guidance and wisdom</li>
          <li>Safe, respectful interfaith dialogue</li>
          <li>Voice-enabled spiritual conversations (coming soon)</li>
        </ul>
      </div>
      
      <div class="divider"></div>
      
      <div class="message" style="font-size: 0.95rem; color: #666;">
        <strong>Can't click the button?</strong> Copy and paste this link into your browser:<br>
        <div class="verification-code">${verificationUrl}</div>
      </div>
      
      <div class="message" style="font-size: 0.9rem; color: #888;">
        This verification link will expire in 24 hours for your security.
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content);
    
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🙏 Welcome to ${EMAIL_CONFIG.appName} - Verify Your Email`,
      html: htmlContent,
      text: `Welcome to ${EMAIL_CONFIG.appName}!\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link expires in 24 hours.\n\nThank you for joining our spiritual community!`
    });
    
    console.log(`[Email] Verification email sent to ${email}:`, result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('[Email] Failed to send verification email:', error);
    console.error('[Email] Error details:', {
      message: error.message,
      name: error.name,
      status: error.status,
      response: error.response?.data
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email after successful verification
 */
async function sendWelcomeEmail(email, name, religion) {
  try {
    const content = `
      <div class="greeting">🎉 Welcome to your spiritual journey, ${name}!</div>
      
      <div class="message">
        Your email has been successfully verified! You now have full access to ${EMAIL_CONFIG.appName}'s 
        personalized spiritual guidance system.
      </div>
      
      <div class="features">
        <h3>Your personalized experience includes:</h3>
        <ul class="feature-list">
          <li><strong>${religion.charAt(0).toUpperCase() + religion.slice(1)} Tradition:</strong> Connect with deities and wisdom from your faith</li>
          <li><strong>Sacred Texts:</strong> Authentic references from your religious scriptures</li>
          <li><strong>Personal Guidance:</strong> Responses tailored to your age and spiritual needs</li>
          <li><strong>Safe Space:</strong> Respectful, non-judgmental spiritual conversations</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${EMAIL_CONFIG.appUrl}/home" class="cta-button">
          🚀 Start Your First Conversation
        </a>
      </div>
      
      <div class="message">
        Ready to begin? Choose your divine guide and ask your first question. Whether you seek wisdom, 
        comfort, or guidance, your personalized AI companion is here to help.
      </div>
      
      <div class="divider"></div>
      
      <div class="message" style="font-size: 0.95rem; color: #666;">
        <strong>Need help getting started?</strong><br>
        • Visit your <a href="${EMAIL_CONFIG.appUrl}/home" style="color: #667eea;">deity selection page</a><br>
        • Check out our <a href="${EMAIL_CONFIG.appUrl}/guide" style="color: #667eea;">user guide</a><br>
        • Contact <a href="${EMAIL_CONFIG.appUrl}/support" style="color: #667eea;">support</a> if you have questions
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content);
    
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🎉 Your spiritual journey begins now - ${EMAIL_CONFIG.appName}`,
      html: htmlContent,
      text: `Welcome to ${EMAIL_CONFIG.appName}!\n\nYour email has been verified and you now have full access to personalized spiritual guidance.\n\nStart your first conversation: ${EMAIL_CONFIG.appUrl}/home\n\nBlessings on your journey!`
    });
    
    console.log(`[Email] Welcome email sent to ${email}:`, result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetToken) {
  try {
    const resetUrl = `${EMAIL_CONFIG.appUrl}/reset-password?token=${resetToken}`;
    
    const content = `
      <div class="greeting">Password Reset Request</div>
      
      <div class="message">
        Hello ${name},<br><br>
        We received a request to reset your password for your ${EMAIL_CONFIG.appName} account.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="cta-button">
          🔐 Reset My Password
        </a>
      </div>
      
      <div class="message">
        If you didn't request this password reset, please ignore this email. Your account remains secure.
      </div>
      
      <div class="divider"></div>
      
      <div class="message" style="font-size: 0.95rem; color: #666;">
        <strong>Can't click the button?</strong> Copy and paste this link:<br>
        <div class="verification-code">${resetUrl}</div>
      </div>
      
      <div class="message" style="font-size: 0.9rem; color: #888;">
        This reset link will expire in 1 hour for your security.
      </div>
    `;
    
    const htmlContent = generateEmailTemplate(content);
    
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `🔐 Reset your ${EMAIL_CONFIG.appName} password`,
      html: htmlContent,
      text: `Password reset requested for ${EMAIL_CONFIG.appName}\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, please ignore this email.`
    });
    
    console.log(`[Email] Password reset email sent to ${email}:`, result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test email service connection
 */
async function testEmailService() {
  try {
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: 'rohithneelam87@gmail.com',
      replyTo: EMAIL_CONFIG.replyTo,
      subject: '✅ Email Service Test - Spirit AI',
      html: generateEmailTemplate(`
        <div class="greeting">Email Service Test Successful! 🎉</div>
        <div class="message">
          Your Resend email service is working perfectly. The system is ready to send:
          <ul class="feature-list">
            <li>Email verification messages</li>
            <li>Welcome emails</li>
            <li>Password reset notifications</li>
          </ul>
        </div>
        <div class="message">
          <strong>Test completed at:</strong> ${new Date().toISOString()}
        </div>
      `),
      text: 'Email service test successful! Your Resend integration is working.'
    });
    
    console.log('[Email] Test email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('[Email] Test email failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailService,
  EMAIL_CONFIG
};