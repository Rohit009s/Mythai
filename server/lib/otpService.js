/**
 * OTP (One-Time Password) Service
 * Handles OTP generation, validation, and email sending
 * Secure 6-digit codes with 10-minute expiry
 */

const crypto = require('crypto');
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
 * Generate beautiful OTP email template
 */
function generateOtpEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${EMAIL_CONFIG.appName} - Verification Code</title>
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
            <div class="tagline">Verification Code</div>
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
 * Send OTP verification email
 */
async function sendOtpEmail(email, name, otp) {
  try {
    // 🚨 DEVELOPMENT: Display OTP in terminal for easy testing
    console.log('\n' + '='.repeat(60));
    console.log('🔐 OTP VERIFICATION CODE (DEVELOPMENT)');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`);
    console.log('='.repeat(60) + '\n');
    
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
    
    const htmlContent = generateOtpEmailTemplate(content);
    
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🔐 Your ${EMAIL_CONFIG.appName} verification code: ${otp}`,
      html: htmlContent,
      text: `Your ${EMAIL_CONFIG.appName} verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    });
    
    console.log(`[OTP] ✅ Verification code sent to ${email}:`, result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('[OTP] ❌ Failed to send verification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send OTP for password reset
 */
async function sendPasswordResetOtp(email, name, otp) {
  try {
    // 🚨 DEVELOPMENT: Display Password Reset OTP in terminal
    console.log('\n' + '='.repeat(60));
    console.log('🔐 PASSWORD RESET OTP (DEVELOPMENT)');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔢 Reset Code: ${otp}`);
    console.log(`⏰ Expires: ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString()}`);
    console.log('='.repeat(60) + '\n');
    
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
    
    const htmlContent = generateOtpEmailTemplate(content);
    
    const result = await resend.emails.send({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to: email,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🔐 Password reset code for ${EMAIL_CONFIG.appName}: ${otp}`,
      html: htmlContent,
      text: `Your ${EMAIL_CONFIG.appName} password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    });
    
    console.log(`[OTP] ✅ Password reset code sent to ${email}:`, result.data?.id);
    return { success: true, messageId: result.data?.id };
    
  } catch (error) {
    console.error('[OTP] ❌ Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  isOtpExpired,
  sendOtpEmail,
  sendPasswordResetOtp
};