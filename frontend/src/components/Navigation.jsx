import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

const Navigation = ({ user, onLogout }) => {
  const location = useLocation()

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/home" className="brand-link">
          <h2>MythAI</h2>
        </Link>
      </div>
      
      <div className="nav-links">
        <Link 
          to="/home" 
          className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/chat" 
          className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}
        >
          Chat
        </Link>
        <Link 
          to="/history" 
          className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
        >
          History
        </Link>
        <Link 
          to="/settings" 
          className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
        >
          Settings
        </Link>
      </div>

      <div className="nav-user">
        <span className="user-name">Welcome, {user?.name || 'User'}</span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navigation