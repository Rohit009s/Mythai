import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import GlassAuth from './components/GlassAuth'
import HeroWithHomePage from './components/HeroWithHomePage'
import DeitySelector from './components/DeitySelector'
import Chat from './components/Chat'
import Settings from './components/Settings'
import ChatHistory from './components/ChatHistory'
import Navigation from './components/Navigation'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function App() {
  const [user, setUser] = useState(null)
  const [selectedDeity, setSelectedDeity] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [showHero, setShowHero] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token')
    if (token) {
      fetchProfile(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (userData, token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      // Demo mode - no token
      localStorage.removeItem('token')
    }
    setUser(userData)
    setShowHero(true) // Show hero after login
  }

  const handleHeroContinue = () => {
    setShowHero(false) // Move to home page after hero
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setSelectedDeity(null)
    setSelectedConversation(null)
    setShowHero(false)
  }

  const handleDeitySelect = (deity) => {
    setSelectedDeity(deity)
    setSelectedConversation(null) // Clear conversation when selecting new deity
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const handleSelectConversation = (conversation) => {
    // Set both the deity and the conversation for continuation
    const deity = { id: conversation.deityId, name: conversation.deityName }
    setSelectedDeity(deity)
    setSelectedConversation(conversation)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        {!user ? (
          <Routes>
            <Route path="/login" element={<GlassAuth onLogin={handleLogin} apiUrl={API_URL} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : showHero ? (
          <Routes>
            <Route path="/hero" element={<HeroWithHomePage onContinue={handleHeroContinue} />} />
            <Route path="*" element={<Navigate to="/hero" replace />} />
          </Routes>
        ) : (
          <>
            <Navigation user={user} onLogout={handleLogout} />
            <Routes>
              <Route 
                path="/home" 
                element={
                  <DeitySelector 
                    user={user} 
                    onSelect={handleDeitySelect}
                    onLogout={handleLogout}
                    apiUrl={API_URL}
                  />
                } 
              />
              <Route 
                path="/chat" 
                element={
                  selectedDeity ? (
                    <Chat 
                      user={user}
                      deity={selectedDeity}
                      existingConversationId={selectedConversation?.id}
                      onBack={() => {
                        setSelectedDeity(null)
                        setSelectedConversation(null)
                      }}
                      onLogout={handleLogout}
                      apiUrl={API_URL}
                    />
                  ) : (
                    <Navigate to="/home" replace />
                  )
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ChatHistory 
                    user={user}
                    onSelectConversation={handleSelectConversation}
                    apiUrl={API_URL}
                  />
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <Settings 
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    onLogout={handleLogout}
                    apiUrl={API_URL}
                  />
                } 
              />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </>
        )}
      </div>
    </Router>
  )
}

export default App
