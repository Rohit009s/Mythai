/**
 * Simple OTP email sender utility
 * Matches the structure from your guide
 */

const { transporter } = require('./mailer.js');

/**
 * Send OTP email using simple template
 * Clean, human, not spammy
 */
async function sendOtpEmail(email, name, otp) {
  await transporter.sendMail({
    from: `"Spirit AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FFD700 0%, #DAA520 50%, #B8860B 100%); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Spirit AI</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 16px;">Hello ${name},</p>
          
          <p style="color: #555; line-height: 1.6;">Your verification code is:</p>
          
          <div style="background: #FFFEF7; border: 2px solid #DAA520; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #B8860B; font-family: 'Courier New', monospace; font-size: 32px; letter-spacing: 4px; margin: 0; text-shadow: 0 2px 4px rgba(184,134,11,0.3);">${otp}</h2>
          </div>
          
          <p style="color: #666; font-size: 14px;">This code is valid for 10 minutes.</p>
          
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can ignore this email.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #F4E4BC;">
            <p style="color: #B8860B; font-weight: 600; margin: 0;">— Spirit AI Team</p>
          </div>
        </div>
      </div>
    `
  });
}

module.exports = {
  sendOtpEmail
};