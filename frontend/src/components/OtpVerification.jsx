import React, { useState } from 'react';
import './OtpVerification.css';

const OtpVerification = ({ email, onVerificationSuccess, onResendOtp, apiUrl = 'http://localhost:3000' }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode
        }),
      });

      const data = await response.json();

      if (data.success) {
        onVerificationSuccess(data);
      } else {
        setError(data.message || 'Verification failed');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      // Use Supabase Edge Function for sending OTP
      const response = await fetch('https://ttpjmshzcicgvjhzkzfs.supabase.co/functions/v1/send-otp-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sb_publishable_MMxMEAhYpZPj0SPcw6A1rA_5tBBKDV9',
        },
        body: JSON.stringify({
          email,
          otp: Math.floor(100000 + Math.random() * 900000).toString(), // Generate 6-digit OTP
          type: 'verification'
        }),
      });

      const data = await response.json();

      if (data.success) {
        onResendOtp?.(data);
        // Clear current OTP
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
        setError(''); // Clear any previous errors
        // Show success message briefly
        setError('✅ New verification code sent to your email!');
        setTimeout(() => setError(''), 3000);
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="otp-verification">
      <div className="otp-header">
        <h2>🔐 Verify Your Email</h2>
        <p>We've sent a 6-digit verification code to:</p>
        <strong>{email}</strong>
      </div>

      <form onSubmit={handleSubmit} className="otp-form">
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              disabled={loading}
            />
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          type="submit" 
          className="verify-button"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? '🔄 Verifying...' : '✅ Verify Email'}
        </button>
      </form>

      <div className="otp-footer">
        <p>Didn't receive the code?</p>
        <button 
          type="button"
          onClick={handleResend}
          className="resend-button"
          disabled={resendLoading}
        >
          {resendLoading ? '📤 Sending...' : '📤 Resend Code'}
        </button>
        
        <div className="otp-help">
          <p>• Check your spam folder</p>
          <p>• Code expires in 10 minutes</p>
          <p>• Enter digits only (no spaces)</p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification;