// Supabase Edge Function for Spirit AI OTP Email Sending
// Deploy this to: https://ttpjmshzcicgvjhzkzfs.supabase.co
// Function name: send-otp-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPRequest {
  email: string;
  otp: string;
  type: 'verification' | 'password_reset';
  userName?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { email, otp, type, userName }: OTPRequest = await req.json()

    // Validate required fields
    if (!email || !otp || !type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, otp, type' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid email format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare email content based on type
    let subject: string
    let htmlContent: string
    let textContent: string

    if (type === 'verification') {
      subject = '🕉️ Spirit AI - Verify Your Email Address'
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Spirit AI Email Verification</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🕉️ Welcome to Spirit AI</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Connect with Divine Wisdom</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                ${userName ? `Hello ${userName},` : 'Hello,'}<br><br>
                Welcome to Spirit AI! To complete your registration and start your spiritual journey, please verify your email address using the OTP code below:
              </p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 16px;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Valid for 10 minutes</p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-top: 25px;">
                Enter this code in the Spirit AI app to verify your email and unlock:
              </p>
              
              <ul style="color: #666; line-height: 1.8; margin: 20px 0;">
                <li>🎭 <strong>60+ Authentic Deity Personas</strong> - Krishna, Shiva, Hanuman, and more</li>
                <li>📚 <strong>Sacred Text Integration</strong> - Bhagavad Gita, Bible, Quran references</li>
                <li>🧠 <strong>Intelligent Conversations</strong> - Context-aware spiritual guidance</li>
                <li>🌍 <strong>Multi-Language Support</strong> - English, Hindi, Telugu, Tamil</li>
              </ul>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                If you didn't create a Spirit AI account, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>🕉️ Built with devotion for spiritual seekers worldwide 🕉️</p>
              <p>© 2026 Spirit AI. All rights reserved.</p>
              <p style="margin-top: 15px; font-size: 12px; color: #999;">
                Have questions or need support? Simply reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      textContent = `
🕉️ Spirit AI - Email Verification

${userName ? `Hello ${userName},` : 'Hello,'}

Welcome to Spirit AI! Please verify your email address with this OTP code:

Verification Code: ${otp}

This code is valid for 10 minutes.

Enter this code in the Spirit AI app to unlock:
• 60+ Authentic Deity Personas
• Sacred Text Integration  
• Intelligent Conversations
• Multi-Language Support

If you didn't create a Spirit AI account, please ignore this email.

For any questions or support, simply reply to this email.

🕉️ Built with devotion for spiritual seekers worldwide 🕉️
© 2026 Spirit AI. All rights reserved.
      `
    } else if (type === 'admin_notification') {
      // Admin notification for new user registration
      subject = '🚨 Spirit AI - New User Registration'
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New User Registration - Spirit AI</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .user-info { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New User Registration!</h1>
            </div>
            <div class="content">
              <p>Hello Rohit,</p>
              <p>A new user has registered on Spirit AI:</p>
              
              <div class="user-info">
                <strong>👤 User Details:</strong><br>
                Name: ${req.body.newUserName || 'Not provided'}<br>
                Email: ${req.body.userEmail || email}<br>
                Registration Time: ${new Date().toLocaleString()}<br>
                Status: Pending Email Verification
              </div>
              
              <p>The user will receive an OTP for email verification. You'll get another notification once they verify their email.</p>
              
              <p>Best regards,<br>Spirit AI System</p>
            </div>
          </div>
        </body>
        </html>
      `
      textContent = `
🎉 Spirit AI - New User Registration

Hello Rohit,

A new user has registered on Spirit AI:

👤 User Details:
Name: ${req.body.newUserName || 'Not provided'}
Email: ${req.body.userEmail || email}
Registration Time: ${new Date().toLocaleString()}
Status: Pending Email Verification

The user will receive an OTP for email verification. You'll get another notification once they verify their email.

Best regards,
Spirit AI System
      `
    } else if (type === 'user_verified') {
      // Admin notification for user verification
      subject = '✅ Spirit AI - User Email Verified'
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>User Verified - Spirit AI</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px 0; }
            .user-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ User Email Verified!</h1>
            </div>
            <div class="content">
              <p>Hello Rohit,</p>
              <p>A user has successfully verified their email on Spirit AI:</p>
              
              <div class="user-info">
                <strong>👤 Verified User:</strong><br>
                Name: ${req.body.verifiedUserName || 'Not provided'}<br>
                Email: ${req.body.userEmail || email}<br>
                Verification Time: ${new Date().toLocaleString()}<br>
                Status: ✅ Verified & Active
              </div>
              
              <p>The user can now log in and start using Spirit AI. You can reach out to them at their email address if needed.</p>
              
              <p>Best regards,<br>Spirit AI System</p>
            </div>
          </div>
        </body>
        </html>
      `
      textContent = `
✅ Spirit AI - User Email Verified

Hello Rohit,

A user has successfully verified their email on Spirit AI:

👤 Verified User:
Name: ${req.body.verifiedUserName || 'Not provided'}
Email: ${req.body.userEmail || email}
Verification Time: ${new Date().toLocaleString()}
Status: ✅ Verified & Active

The user can now log in and start using Spirit AI. You can reach out to them at their email address if needed.

Best regards,
Spirit AI System
      `
    } else {
      // Password reset
      subject = '🔐 Spirit AI - Password Reset Code'
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Spirit AI Password Reset</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
            .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .otp-box { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
            .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Spirit AI Account Security</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                ${userName ? `Hello ${userName},` : 'Hello,'}<br><br>
                We received a request to reset your Spirit AI account password. Use the code below to proceed:
              </p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 16px;">Password Reset Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Valid for 10 minutes</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-top: 25px;">
                After resetting your password, you'll continue to have access to all Spirit AI features including your conversation history and preferences.
              </p>
            </div>
            <div class="footer">
              <p>🕉️ Built with devotion for spiritual seekers worldwide 🕉️</p>
              <p>© 2026 Spirit AI. All rights reserved.</p>
              <p style="margin-top: 15px; font-size: 12px; color: #999;">
                Have questions or need support? Simply reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
      textContent = `
🔐 Spirit AI - Password Reset

${userName ? `Hello ${userName},` : 'Hello,'}

We received a request to reset your Spirit AI account password.

Password Reset Code: ${otp}

This code is valid for 10 minutes.

⚠️ Security Notice: If you didn't request this password reset, please ignore this email.

For any questions or support, simply reply to this email.

🕉️ Built with devotion for spiritual seekers worldwide 🕉️
© 2026 Spirit AI. All rights reserved.
      `
    }

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer re_MPCYHh42_DktcwbLwEnMrGeUfpTviKarn`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Spirit AI <onboarding@resend.dev>',
        to: [email],
        subject: subject,
        html: htmlContent,
        text: textContent,
        reply_to: 'rohithneelam87@gmail.com'
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      console.error('Resend API Error:', errorData)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send email',
          details: errorData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const resendData = await resendResponse.json()
    console.log('Email sent successfully:', resendData)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type === 'verification' ? 'Verification' : 'Password reset'} email sent successfully`,
        emailId: resendData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})