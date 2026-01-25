import { useState, useEffect } from 'react'
import './Auth.css'
import OtpVerification from './OtpVerification'

export default function Auth({ onLogin, apiUrl }) {
  const [view, setView] = useState('login') // 'login', 'register', 'verify-otp', 'visme-register'
  const [religions, setReligions] = useState([])
  const [registrationEmail, setRegistrationEmail] = useState('') // Store email for OTP verification
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'prefer_not_to_say',
    email: '',
    password: '',
    nationality: '',
    religion: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Debug logging
  console.log('[Auth Debug] Component render - Current view:', view, 'Registration email:', registrationEmail)

  useEffect(() => {
    fetchReligions()
    
    // Load Visme script
    const script = document.createElement('script')
    script.src = 'https://static-bundles.visme.co/forms/vismeforms-embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const fetchReligions = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/auth/religions`)
      const data = await res.json()
      if (data.success) {
        setReligions(data.religions)
        if (data.religions.length > 0) {
          setFormData(prev => ({ ...prev, religion: data.religions[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch religions:', error)
    }
  }

  const handleGuestLogin = () => {
    // Create a guest user without authentication
    const guestUser = {
      id: 'guest',
      name: 'Guest',
      age: 25,
      gender: 'prefer_not_to_say',
      email: 'guest@mythai.com',
      religion: 'all',
      nationality: ''
    }
    onLogin(guestUser, null) // No token for guest
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    console.log('[Auth Debug] Form submission started', { view, formData: { ...formData, password: '***' } })

    try {
      const endpoint = view === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = view === 'login' 
        ? { email: formData.email, password: formData.password }
        : formData

      console.log('[Auth Debug] Making request to:', `${apiUrl}${endpoint}`)
      console.log('[Auth Debug] Payload:', view === 'login' ? { email: payload.email, password: '***' } : payload)

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      console.log('[Auth Debug] Response received:', { status: res.status, data })

      if (res.ok) {
        if (view === 'login') {
          console.log('[Auth Debug] Login successful, calling onLogin')
          onLogin(data.user, data.token)
        } else {
          // Registration successful - send OTP via Supabase Edge Function
          console.log('[Auth Debug] Registration successful, sending OTP via Supabase')
          
          try {
            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Send OTP via Supabase Edge Function
            const otpResponse = await fetch('https://ttpjmshzcicgvjhzkzfs.supabase.co/functions/v1/send-otp-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sb_publishable_MMxMEAhYpZPj0SPcw6A1rA_5tBBKDV9',
              },
              body: JSON.stringify({
                email: formData.email,
                otp: otpCode,
                type: 'verification',
                userName: formData.name
              }),
            });

            const otpData = await otpResponse.json();
            
            if (otpData.success) {
              console.log('[Auth Debug] OTP sent successfully, switching to OTP view')
              console.log('[Auth Debug] Setting registrationEmail to:', formData.email)
              setRegistrationEmail(formData.email)
              setView('verify-otp')
              setMessage(`📧 OTP sent to ${formData.email}! Please check your email for the verification code.`)
              console.log('[Auth Debug] View set to verify-otp, registrationEmail set to:', formData.email)
            } else {
              console.error('[Auth Debug] Failed to send OTP:', otpData.error)
              setError('Registration successful but failed to send verification email. Please try resending.')
              setRegistrationEmail(formData.email)
              setView('verify-otp')
            }
          } catch (otpError) {
            console.error('[Auth Debug] OTP sending error:', otpError)
            setError('Registration successful but failed to send verification email. Please try resending.')
            setRegistrationEmail(formData.email)
            setView('verify-otp')
          }
        }
      } else {
        console.log('[Auth Debug] Request failed:', data.error)
        setError(data.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('[Auth Debug] Network error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      console.log('[Auth Debug] Form submission completed')
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`${apiUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('📧 New verification email sent! Please check your inbox and spam folder.')
      } else {
        setError(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification success
  const handleOtpVerificationSuccess = (data) => {
    setMessage('✅ Email verified successfully! You can now log in.')
    setView('login')
    // Clear the registration email
    setRegistrationEmail('')
  }

  // Handle OTP resend
  const handleOtpResend = (data) => {
    setMessage('📧 New OTP sent! Please check your email.')
    setTimeout(() => setMessage(''), 3000)
  }

  // OTP Verification View
  if (view === 'verify-otp') {
    console.log('[Auth Debug] Rendering OTP verification view with email:', registrationEmail)
    return (
      <div className="auth-container">
        <div className="auth-card">
          <button className="back-to-register" onClick={() => setView('register')}>
            ← Back to Registration
          </button>
          
          <OtpVerification
            email={registrationEmail}
            apiUrl={apiUrl}
            onVerificationSuccess={handleOtpVerificationSuccess}
            onResendOtp={handleOtpResend}
          />
          
          {message && <div className="success">{message}</div>}
        </div>
      </div>
    )
  }

  // Visme Registration View
  if (view === 'visme-register') {
    return (
      <div className="auth-container">
        <div className="visme-container">
          <button className="back-to-login" onClick={() => setView('login')}>
            ← Back to Login
          </button>
          <div 
            className="visme_d" 
            data-title="Webinar Registration Form" 
            data-url="33p4jr34-untitled-project?fullPage=true" 
            data-domain="forms" 
            data-full-page="true" 
            data-min-height="100vh" 
            data-form-id="157444"
          ></div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>SPIRIT AI</h1>
        <p className="subtitle">Connect with Divine Wisdom</p>

        <div className="auth-tabs">
          <button 
            className={view === 'login' ? 'active' : ''} 
            onClick={() => setView('login')}
          >
            Login
          </button>
          <button 
            className={view === 'register' ? 'active' : ''} 
            onClick={() => setView('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {view === 'register' && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age}
                onChange={handleChange}
                min="13"
                required
              />
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                name="nationality"
                placeholder="Nationality (optional)"
                value={formData.nationality}
                onChange={handleChange}
              />
              <select name="religion" value={formData.religion} onChange={handleChange} required>
                {religions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
          />

          {error && (
            <div className="error">
              {error}
              {error.includes('Email not verified') && (
                <button 
                  type="button" 
                  className="resend-btn"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  Resend Verification Email
                </button>
              )}
            </div>
          )}
          {message && <div className="success">{message}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (view === 'login' ? 'Login' : 'Register')}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="guest-btn" onClick={handleGuestLogin}>
          🎭 Continue as Guest
        </button>

        {view === 'login' && (
          <button className="visme-register-btn" onClick={() => setView('visme-register')}>
            📝 Register with Enhanced Form
          </button>
        )}
      </div>
    </div>
  )
}
