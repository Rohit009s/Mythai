import { useState, useEffect, useRef } from 'react'
import './GlassAuth.css'
import OtpVerification from './OtpVerification'

const RELIGIONS = [
  'hinduism', 'christianity', 'islam', 'buddhism', 'jainism',
  'greek', 'egyptian', 'norse', 'shintoism', 'aztec',
  'mayan', 'chinese', 'korean', 'mesopotamian', 'inca',
  'yoruba', 'dogon', 'zulu', 'asante'
]

const GENDERS = ['male', 'female', 'non-binary', 'prefer_not_to_say', 'other']

// SVG Filter Component for Liquid Glass Effect
const LiquidGlassFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter
        id="liquid-glass"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.001 0.005"
          numOctaves="1"
          seed="17"
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale="5"
          specularConstant="1"
          specularExponent="100"
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="litImage"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="5"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
)

export default function GlassAuth({ onLogin, apiUrl }) {
  const [view, setView] = useState('welcome') // 'welcome', 'login', 'register', 'verify-otp'
  const [step, setStep] = useState(1) // Registration steps: 1-5
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [registrationEmail, setRegistrationEmail] = useState('') // Store email for OTP verification
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: 'prefer_not_to_say',
    nationality: '',
    religion: 'hinduism'
  })

  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  useEffect(() => {
    if (view === 'register' && step === 1) {
      setTimeout(() => emailInputRef.current?.focus(), 300)
    }
  }, [view, step])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo',
      name: 'Demo User',
      age: 25,
      gender: 'prefer_not_to_say',
      email: 'demo@mythai.com',
      religion: 'all'
    }
    onLogin(demoUser, null)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await res.json()

      if (res.ok) {
        onLogin(data.user, data.token)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          email: formData.email,
          password: formData.password,
          nationality: formData.nationality,
          religion: formData.religion
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Registration successful - show OTP verification
        setRegistrationEmail(formData.email)
        setView('verify-otp')
        setSuccess(false) // Don't show success yet, wait for OTP verification
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && !formData.email.includes('@')) {
      setError('Please enter a valid email')
      return
    }
    if (step === 2 && formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (step === 3 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (step === 4 && (!formData.name || !formData.age)) {
      setError('Please fill in all fields')
      return
    }
    
    setError('')
    if (step < 5) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1)
      setError('')
    }
  }

  // Handle OTP verification success
  const handleOtpVerificationSuccess = (data) => {
    setSuccess(true)
    setTimeout(() => {
      setView('login')
      setSuccess(false)
      setRegistrationEmail('')
    }, 3000)
  }

  // Handle OTP resend
  const handleOtpResend = (data) => {
    // Show temporary success message
    setError('')
  }

  return (
    <div className="glass-auth-container">
      <LiquidGlassFilter />
      <GradientBackground />
      
      <div className="glass-auth-logo">
        <div className="logo-icon">
          <img 
            src="/icons/pngegg.png" 
            alt="Spirit AI" 
            className="logo-icon-image"
          />
        </div>
        <h1>SPIRIT AI</h1>
      </div>

      {view === 'welcome' && (
        <WelcomeView 
          onRegister={() => setView('register')}
          onLogin={() => setView('login')}
          onDemo={handleDemoLogin}
        />
      )}

      {view === 'login' && (
        <LoginView
          formData={formData}
          onChange={handleChange}
          onSubmit={handleLogin}
          onBack={() => setView('welcome')}
          onDemo={handleDemoLogin}
          loading={loading}
          error={error}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      )}

      {view === 'register' && (
        <RegisterView
          step={step}
          formData={formData}
          onChange={handleChange}
          onNext={nextStep}
          onPrev={prevStep}
          onSubmit={handleRegisterSubmit}
          onBack={() => setView('welcome')}
          loading={loading}
          error={error}
          success={success}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          emailInputRef={emailInputRef}
          passwordInputRef={passwordInputRef}
        />
      )}

      {view === 'verify-otp' && (
        <div className="glass-card otp-card fade-in">
          <button className="back-link" onClick={() => setView('register')}>
            ← Back to Registration
          </button>
          
          <div className="otp-wrapper">
            <h2 className="card-title">🔐 Verify Your Email</h2>
            <p className="card-subtitle">We've sent a verification code to your email</p>
            
            <OtpVerification
              email={registrationEmail}
              apiUrl={apiUrl}
              onVerificationSuccess={handleOtpVerificationSuccess}
              onResendOtp={handleOtpResend}
            />
          </div>
          
          {success && (
            <div className="success-view">
              <div className="success-icon">🎉</div>
              <h3>Email Verified Successfully!</h3>
              <p>Redirecting to login...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Welcome View Component
function WelcomeView({ onRegister, onLogin, onDemo }) {
  return (
    <div className="glass-card welcome-card fade-in">
      <h2 className="welcome-title">Get started with Us</h2>
      <p className="welcome-subtitle">Connect with Divine Wisdom</p>
      
      <div className="welcome-actions">
        <button className="glass-btn primary-btn" onClick={onRegister}>
          <i className="fi fi-rr-paper-plane"></i> Get Started - Register Now
        </button>
        
        <button className="glass-btn secondary-btn" onClick={onLogin}>
          <i className="fi fi-rr-handshake"></i> Already have an account? Login
        </button>

        <button className="glass-btn demo-btn" onClick={onDemo}>
          <i className="fi fi-rr-following"></i> Try Demo Mode
        </button>
      </div>

      <div className="welcome-features">
        <div className="feature">
          <span className="feature-icon">💬</span>
          <span>Chat with Deities</span>
        </div>
        <div className="feature">
          <span className="feature-icon">📖</span>
          <span>Sacred References</span>
        </div>
        <div className="feature">
          <span className="feature-icon">🔊</span>
          <span>Audio Responses</span>
        </div>
      </div>
    </div>
  )
}

// Login View Component  
function LoginView({ formData, onChange, onSubmit, onBack, onDemo, loading, error, showPassword, setShowPassword }) {
  return (
    <div className="glass-card login-card fade-in">
      <button className="back-link" onClick={onBack}>← Back to Home</button>
      
      <h2 className="card-title"> Welcome Back</h2>
      <p className="card-subtitle">Login to continue your spiritual journey</p>

      <form onSubmit={onSubmit} className="glass-form">
        <div className="glass-input-group">
          <label>Email</label>
          <div className="glass-input-wrap">
            <i className="fi fi-rs-envelope input-icon-left"></i>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div className="glass-input-group">
          <label>Password</label>
          <div className="glass-input-wrap">
            <i className="fi fi-rs-lock input-icon-left"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={onChange}
              placeholder="Enter your password"
              required
              minLength="6"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <i className="fi fi-rs-eye"></i> : <i className="fi fi-rr-eye-crossed"></i>}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="glass-btn submit-btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="divider"><span>OR</span></div>

      <button className="glass-btn demo-btn-small" onClick={onDemo}>
        🎭 Try Demo Mode
      </button>
    </div>
  )
}

// Register View Component
function RegisterView({ step, formData, onChange, onNext, onPrev, onSubmit, onBack, loading, error, success, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, emailInputRef, passwordInputRef }) {
  return (
    <div className="glass-card register-card fade-in">
      {step === 1 && <button className="back-link" onClick={onBack}>← Back to Home</button>}
      {step > 1 && <button className="back-link" onClick={onPrev}>← Back</button>}
      
      <div className="progress-bar">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
        ))}
      </div>

      {success ? (
        <div className="success-view">
          <div className="success-icon">🎉</div>
          <h2>Welcome Aboard!</h2>
          <p>Registration successful! Redirecting to login...</p>
        </div>
      ) : (
        <>
          {step === 1 && <Step1Email formData={formData} onChange={onChange} onNext={onNext} emailInputRef={emailInputRef} />}
          {step === 2 && <Step2Password formData={formData} onChange={onChange} onNext={onNext} showPassword={showPassword} setShowPassword={setShowPassword} passwordInputRef={passwordInputRef} />}
          {step === 3 && <Step3ConfirmPassword formData={formData} onChange={onChange} onNext={onNext} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} />}
          {step === 4 && <Step4PersonalInfo formData={formData} onChange={onChange} onNext={onNext} />}
          {step === 5 && <Step5Final formData={formData} onChange={onChange} onSubmit={onSubmit} loading={loading} />}
          
          {error && <div className="error-message">{error}</div>}
        </>
      )}
    </div>
  )
}

// Registration Steps
function Step1Email({ formData, onChange, onNext, emailInputRef }) {
  return (
    <div className="step-content">
      <h2 className="step-title">Get started with Us</h2>
      <p className="step-subtitle">Enter your email to begin</p>
      
      <div className="glass-input-group">
        <div className="glass-input-wrap">
          <i className="fi fi-rs-envelope input-icon"></i>
          <input
            ref={emailInputRef}
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="Email"
            required
            onKeyPress={(e) => e.key === 'Enter' && onNext()}
          />
          {formData.email.includes('@') && (
            <button type="button" className="next-btn" onClick={onNext}>→</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Step2Password({ formData, onChange, onNext, showPassword, setShowPassword, passwordInputRef }) {
  return (
    <div className="step-content">
      <h2 className="step-title">Create your password</h2>
      <p className="step-subtitle">Your password must be at least 6 characters long</p>
      
      <div className="glass-input-group">
        <label className="floating-label">Password</label>
        <div className="glass-input-wrap">
          <i className="fi fi-rs-lock input-icon"></i>
          <input
            ref={passwordInputRef}
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Password"
            required
            minLength="6"
            onKeyPress={(e) => e.key === 'Enter' && formData.password.length >= 6 && onNext()}
          />
          <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <i className="fi fi-rs-eye"></i> : <i className="fi fi-rr-eye-crossed"></i>}
          </button>
          {formData.password.length >= 6 && (
            <button type="button" className="next-btn" onClick={onNext}>→</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Step3ConfirmPassword({ formData, onChange, onNext, showConfirmPassword, setShowConfirmPassword }) {
  return (
    <div className="step-content">
      <h2 className="step-title">One Last Step</h2>
      <p className="step-subtitle">Confirm your password to continue</p>
      
      <div className="glass-input-group">
        <label className="floating-label">Confirm Password</label>
        <div className="glass-input-wrap">
          <i className="fi fi-rs-lock input-icon"></i>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={onChange}
            placeholder="Confirm Password"
            required
            minLength="6"
            onKeyPress={(e) => e.key === 'Enter' && formData.confirmPassword.length >= 6 && onNext()}
          />
          <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <i className="fi fi-rs-eye"></i> : <i className="fi fi-rr-eye-crossed"></i>}
          </button>
          {formData.confirmPassword.length >= 6 && (
            <button type="button" className="next-btn" onClick={onNext}>→</button>
          )}
        </div>
      </div>
    </div>
  )
}

function Step4PersonalInfo({ formData, onChange, onNext }) {
  return (
    <div className="step-content">
      <h2 className="step-title">Tell us about yourself</h2>
      <p className="step-subtitle">We'll personalize your experience</p>
      
      <div className="glass-input-group">
        <label>Full Name</label>
        <div className="glass-input-wrap">
          <i className="fi fi-tr-id-card input-icon-left"></i>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            placeholder="Your name"
            required
          />
        </div>
      </div>

      <div className="glass-input-group">
        <label>Age</label>
        <div className="glass-input-wrap">
          <i className="fi fi-tr-age input-icon-left"></i>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={onChange}
            placeholder="Your age"
            min="13"
            required
          />
        </div>
      </div>

      <button type="button" className="glass-btn submit-btn" onClick={onNext}>
        Continue →
      </button>
    </div>
  )
}

function Step5Final({ formData, onChange, onSubmit, loading }) {
  return (
    <div className="step-content">
      <h2 className="step-title">Final Details</h2>
      <p className="step-subtitle">Just a few more things</p>
      
      <form onSubmit={onSubmit}>
        <div className="glass-input-group">
          <label>Gender</label>
          <div className="glass-input-wrap">
            <i className="fi fi-tr-venus-mars input-icon-left"></i>
            <select name="gender" value={formData.gender} onChange={onChange}>
              {GENDERS.map(g => (
                <option key={g} value={g}>{g.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-input-group">
          <label>Nationality (Optional)</label>
          <div className="glass-input-wrap">
            <i className="fi fi-tr-india-map input-icon-left"></i>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={onChange}
              placeholder="Your nationality"
            />
          </div>
        </div>

        <div className="glass-input-group">
          <label>Religion</label>
          <div className="glass-input-wrap">
            <i className="fi fi-sr-person-praying input-icon-left"></i>
            <select name="religion" value={formData.religion} onChange={onChange} required>
              {RELIGIONS.map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="glass-btn submit-btn" disabled={loading}>
          {loading ? 'Creating Account...' : 'Complete Registration 🎉'}
        </button>
      </form>
    </div>
  )
}

// Gradient Background Component
function GradientBackground() {
  return (
    <div className="gradient-background">
      <svg width="100%" height="100%" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#667eea', stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: '#764ba2', stopOpacity: 0.6}} />
          </linearGradient>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#f093fb', stopOpacity: 0.9}} />
            <stop offset="50%" style={{stopColor: '#f5576c', stopOpacity: 0.7}} />
            <stop offset="100%" style={{stopColor: '#4facfe', stopOpacity: 0.6}} />
          </linearGradient>
          <radialGradient id="grad3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor: '#fa709a', stopOpacity: 0.8}} />
            <stop offset="100%" style={{stopColor: '#fee140', stopOpacity: 0.4}} />
          </radialGradient>
          <filter id="blur1"><feGaussianBlur stdDeviation="35"/></filter>
          <filter id="blur2"><feGaussianBlur stdDeviation="25"/></filter>
          <filter id="blur3"><feGaussianBlur stdDeviation="45"/></filter>
        </defs>
        <g className="float-1">
          <ellipse cx="200" cy="500" rx="250" ry="180" fill="url(#grad1)" filter="url(#blur1)" transform="rotate(-30 200 500)"/>
          <rect x="500" y="100" width="300" height="250" rx="80" fill="url(#grad2)" filter="url(#blur2)" transform="rotate(15 650 225)"/>
        </g>
        <g className="float-2">
          <circle cx="650" cy="450" r="150" fill="url(#grad3)" filter="url(#blur3)" opacity="0.7"/>
          <ellipse cx="50" cy="150" rx="180" ry="120" fill="#667eea" filter="url(#blur2)" opacity="0.8"/>
        </g>
      </svg>
    </div>
  )
}
