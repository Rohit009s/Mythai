import React, { useState } from 'react';
import OtpVerification from './OtpVerification';
import './AuthTest.css';

const AuthTest = () => {
  const [step, setStep] = useState('register'); // register, verify-otp, success
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    password: '',
    religion: 'hinduism'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setEmail(formData.email);
        setStep('verify-otp');
        setMessage('Registration successful! Check your email for the verification code.');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = (data) => {
    setStep('success');
    setMessage(data.message);
  };

  const handleResendOtp = (data) => {
    setMessage('New verification code sent! Check your email.');
    setTimeout(() => setMessage(''), 3000);
  };

  const resetForm = () => {
    setStep('register');
    setFormData({
      name: '',
      age: '',
      email: '',
      password: '',
      religion: 'hinduism'
    });
    setEmail('');
    setError('');
    setMessage('');
  };

  return (
    <div className="auth-test">
      <div className="auth-container">
        {step === 'register' && (
          <div className="register-form">
            <h2>🙏 Test OTP Registration</h2>
            <p>Register to test the new OTP email verification system</p>

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="13"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  minLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label>Religion</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  required
                >
                  <option value="hinduism">Hinduism</option>
                  <option value="christianity">Christianity</option>
                  <option value="islam">Islam</option>
                  <option value="buddhism">Buddhism</option>
                  <option value="sikhism">Sikhism</option>
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}
              {message && <div className="success-message">{message}</div>}

              <button type="submit" disabled={loading}>
                {loading ? '🔄 Registering...' : '📧 Register & Send OTP'}
              </button>
            </form>
          </div>
        )}

        {step === 'verify-otp' && (
          <OtpVerification
            email={email}
            onVerificationSuccess={handleVerificationSuccess}
            onResendOtp={handleResendOtp}
          />
        )}

        {step === 'success' && (
          <div className="success-screen">
            <h2>🎉 Email Verified!</h2>
            <p>{message}</p>
            <div className="success-actions">
              <button onClick={resetForm} className="test-again-btn">
                🔄 Test Again
              </button>
              <a href="/login" className="login-btn">
                🚀 Go to Login
              </a>
            </div>
          </div>
        )}

        {message && step !== 'register' && (
          <div className="floating-message">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthTest;