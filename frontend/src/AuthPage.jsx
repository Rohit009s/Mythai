import { useState, useEffect } from 'react';
import './AuthPage.css';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    age: '',
    gender: 'prefer_not_to_say',
    email: '',
    password: '',
    confirmPassword: '',
    nationality: '',
    religion: 'hindu'
  });

  const religions = [
    { id: 'hindu', name: 'Hinduism' },
    { id: 'muslim', name: 'Islam' },
    { id: 'christian', name: 'Christianity' },
    { id: 'buddhism', name: 'Buddhism' },
    { id: 'greek', name: 'Greek Mythology' },
    { id: 'norse', name: 'Norse Mythology' },
    { id: 'egyptian', name: 'Egyptian Mythology' },
    { id: 'shinto', name: 'Shintoism' },
    { id: 'aztec', name: 'Aztec Mythology' }
  ];

  const genders = [
    { id: 'male', name: 'Male' },
    { id: 'female', name: 'Female' },
    { id: 'non-binary', name: 'Non-binary' },
    { id: 'prefer_not_to_say', name: 'Prefer not to say' },
    { id: 'other', name: 'Other' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLogin(data.token, data.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (registerData.age < 13) {
      setError('You must be at least 13 years old');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerData.name,
          age: parseInt(registerData.age),
          gender: registerData.gender,
          email: registerData.email,
          password: registerData.password,
          nationality: registerData.nationality,
          religion: registerData.religion
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! Please check your email to verify your account. (In demo mode, email verification is skipped - you can login now)');
      
      // Auto-switch to login after 3 seconds
      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // Guest mode - no authentication
    onLogin(null, {
      name: 'Guest',
      religion: 'all',
      age: 25
    });
  };

  // Load Unicorn Studio script
  useEffect(() => {
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.36/dist/unicornStudio.umd.js';
      script.onload = () => {
        if (!window.UnicornStudio.isInitialized) {
          window.UnicornStudio.init();
          window.UnicornStudio.isInitialized = true;
        }
      };
      (document.head || document.body).appendChild(script);
    }
  }, []);

  return (
    <div className="auth-page">
      {/* Unicorn Studio Animation Backgrounds - Dual Layer */}
      <div className="unicorn-background">
        {/* Login Animation */}
        <div 
          className={`unicorn-layer ${isLogin ? 'active' : ''}`}
          data-us-project="gz8kKmsEaxnJTHVKWz8e" 
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        ></div>
        
        {/* Registration Animation */}
        <div 
          className={`unicorn-layer ${!isLogin ? 'active' : ''}`}
          data-us-project="Dc986gSgwNDzhULkcgaz" 
          style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
        ></div>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <h1>🕉️ MythAI</h1>
          <p>Speak with Divine Wisdom</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
              setSuccess('');
            }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
              setSuccess('');
            }}
          >
            Register
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  value={registerData.age}
                  onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                  required
                  min="13"
                  placeholder="18"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                value={registerData.gender}
                onChange={(e) => setRegisterData({ ...registerData, gender: e.target.value })}
              >
                {genders.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  minLength="6"
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Nationality (Optional)</label>
              <input
                type="text"
                value={registerData.nationality}
                onChange={(e) => setRegisterData({ ...registerData, nationality: e.target.value })}
                placeholder="e.g., Indian, American"
              />
            </div>

            <div className="form-group">
              <label>Religious Tradition *</label>
              <select
                value={registerData.religion}
                onChange={(e) => setRegisterData({ ...registerData, religion: e.target.value })}
                required
              >
                {religions.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button onClick={handleGuestLogin} className="guest-button">
          Continue as Guest
        </button>

        <p className="auth-note">
          Guest mode allows you to try the system without registration. 
          You'll have access to all deities but won't have personalized features.
        </p>
      </div>
    </div>
  );
}
