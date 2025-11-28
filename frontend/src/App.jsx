import React, { useState, useRef, useEffect } from 'react'
import './App.css'
import AuthPage from './AuthPage'

const DEITIES = {
  hindu: [
    { id: 'krishna', name: 'Krishna', desc: 'Divine Teacher', voice: 'Calm Male (Indian)' },
    { id: 'shiva', name: 'Shiva', desc: 'The Transformer', voice: 'Deep Male (Indian)' },
    { id: 'vishnu', name: 'Vishnu', desc: 'The Preserver', voice: 'Balanced Male (Indian)' },
    { id: 'rama', name: 'Rama', desc: 'Noble Prince', voice: 'Calm Male (Indian)' },
    { id: 'hanuman', name: 'Hanuman', desc: 'Devoted Warrior', voice: 'Energetic Male (Indian)' },
    { id: 'ganesha', name: 'Ganesha', desc: 'Remover of Obstacles', voice: 'Wise Male (Indian)' },
    { id: 'lakshmi', name: 'Lakshmi', desc: 'Goddess of Prosperity', voice: 'Gentle Female (Indian)' },
    { id: 'saraswati', name: 'Saraswati', desc: 'Goddess of Knowledge', voice: 'Wise Female (Indian)' },
    { id: 'durga', name: 'Durga', desc: 'Fierce Protector', voice: 'Powerful Female (Indian)' },
  ],
  muslim: [
    { id: 'prophet_muhammad', name: 'Prophet Muhammad', desc: 'The Final Prophet', voice: 'Wise Male (Arabic)' },
  ],
  christian: [
    { id: 'jesus', name: 'Jesus', desc: 'The Messiah', voice: 'Gentle Male (US)' },
    { id: 'mary', name: 'Mary', desc: 'Holy Mother', voice: 'Gentle Female (US)' },
  ],
  buddhism: [
    { id: 'buddha', name: 'Buddha', desc: 'The Enlightened One', voice: 'Calm Male (Indian)' },
  ],
  greek: [
    { id: 'zeus', name: 'Zeus', desc: 'King of Gods', voice: 'Authoritative Male (Australian)' },
    { id: 'athena', name: 'Athena', desc: 'Goddess of Wisdom', voice: 'Wise Female (US)' },
    { id: 'apollo', name: 'Apollo', desc: 'God of Arts', voice: 'Bright Male (US)' },
    { id: 'poseidon', name: 'Poseidon', desc: 'God of the Sea', voice: 'Deep Male (UK)' },
    { id: 'hera', name: 'Hera', desc: 'Queen of Gods', voice: 'Regal Female (Australian)' },
  ],
  norse: [
    { id: 'odin', name: 'Odin', desc: 'All-Father', voice: 'Ancient Male (UK)' },
    { id: 'thor', name: 'Thor', desc: 'God of Thunder', voice: 'Bold Male (Australian)' },
    { id: 'loki', name: 'Loki', desc: 'Trickster God', voice: 'Quick Male (UK)' },
    { id: 'freyja', name: 'Freyja', desc: 'Goddess of Love', voice: 'Elegant Female (UK)' },
  ],
  egyptian: [
    { id: 'ra', name: 'Ra', desc: 'Sun God', voice: 'Powerful Male (UK)' },
    { id: 'isis', name: 'Isis', desc: 'Goddess of Magic', voice: 'Mystical Female (UK)' },
    { id: 'anubis', name: 'Anubis', desc: 'God of Death', voice: 'Deep Male (UK)' },
  ],
  shinto: [
    { id: 'amaterasu', name: 'Amaterasu', desc: 'Sun Goddess', voice: 'Bright Female (Japanese)' },
    { id: 'susanoo', name: 'Susanoo', desc: 'Storm God', voice: 'Bold Male (Japanese)' },
  ],
  aztec: [
    { id: 'quetzalcoatl', name: 'Quetzalcoatl', desc: 'Feathered Serpent', voice: 'Wise Male (Spanish)' },
    { id: 'huitzilopochtli', name: 'Huitzilopochtli', desc: 'God of War', voice: 'Powerful Male (Spanish)' },
  ],
  all: [
    { id: 'krishna', name: 'Krishna', desc: 'Divine Teacher', voice: 'Calm Male (Indian)' },
    { id: 'zeus', name: 'Zeus', desc: 'King of Gods', voice: 'Authoritative Male (Australian)' },
    { id: 'odin', name: 'Odin', desc: 'All-Father', voice: 'Ancient Male (UK)' },
    { id: 'jesus', name: 'Jesus', desc: 'The Messiah', voice: 'Gentle Male (US)' },
    { id: 'buddha', name: 'Buddha', desc: 'The Enlightened One', voice: 'Calm Male (Indian)' },
  ]
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
]

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [conversationId, setConversationId] = useState('')
  const [persona, setPersona] = useState('krishna')
  const [language, setLanguage] = useState('en')
  const [text, setText] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('hindu')
  const [playingAudio, setPlayingAudio] = useState(null)
  const audioRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Get available categories based on user's religion
  const getAvailableCategories = () => {
    if (!user || user.religion === 'all') {
      return Object.keys(DEITIES)
    }
    // Only show user's religion category
    return [user.religion]
  }

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setIsAuthenticated(true)
      // Set initial category based on user's religion
      if (userData.religion && userData.religion !== 'all') {
        setSelectedCategory(userData.religion)
        // Set first deity from user's religion
        if (DEITIES[userData.religion] && DEITIES[userData.religion].length > 0) {
          setPersona(DEITIES[userData.religion][0].id)
        }
      }
    }
  }, [])

  const handleLogin = (authToken, userData) => {
    setToken(authToken)
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    setMessages([])
    setConversationId('')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />
  }

  async function createConversation() {
    try {
      const res = await fetch('http://localhost:3000/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })
      const data = await res.json()
      setConversationId(data.conversationId)
      return data.conversationId
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  async function send() {
    if (!text.trim()) return

    setLoading(true)
    try {
      let convId = conversationId
      if (!convId) {
        convId = await createConversation()
      }

      const userMessage = { role: 'user', text, timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, userMessage])
      setText('')

      const body = {
        conversationId: convId || '',
        persona: language !== 'en' ? `${persona}_${language}` : persona,
        text,
        audio: true
      }

      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      const assistantMessage = {
        role: 'assistant',
        text: data.reply.text,
        audio: data.reply.audioUrl,
        timestamp: data.reply.timestamp,
        persona
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'error',
        text: 'Failed to send message. Please check if the backend is running.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  function playAudio(audioUrl, messageIndex) {
    if (playingAudio === messageIndex) {
      audioRef.current?.pause()
      setPlayingAudio(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.play()
        setPlayingAudio(messageIndex)
      }
    }
  }

  function handleAudioEnded() {
    setPlayingAudio(null)
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function newChat() {
    setMessages([])
    setConversationId('')
  }

  const selectedDeity = Object.values(DEITIES)
    .flat()
    .find(d => d.id === persona)

  return (
    <div className="app">
      <audio ref={audioRef} onEnded={handleAudioEnded} />

      {/* Status Indicator */}
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span>MCP + Intent AI Active</span>
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div>
            <h1 className="title">🕉️ MythAI</h1>
            <p className="subtitle">Speak with Divine Wisdom</p>
          </div>
          <div className="user-info">
            <span className="user-name">👤 {user?.name || 'Guest'}</span>
            {user?.religion && user.religion !== 'all' && (
              <span className="user-religion">{user.religion}</span>
            )}
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Choose Your Deity</h3>

            <div className="category-tabs">
              {getAvailableCategories().map(cat => (
                <button
                  key={cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="deity-list">
              {DEITIES[selectedCategory].map(deity => (
                <button
                  key={deity.id}
                  className={`deity-card ${persona === deity.id ? 'selected' : ''}`}
                  onClick={() => setPersona(deity.id)}
                >
                  <div className="deity-name">{deity.name}</div>
                  <div className="deity-desc">{deity.desc}</div>
                  <div className="deity-voice">{deity.voice}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Language</h3>
            <div className="language-grid">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  className={`language-btn ${language === lang.code ? 'active' : ''}`}
                  onClick={() => setLanguage(lang.code)}
                >
                  <span className="flag">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="new-chat-btn" onClick={newChat}>
            ✨ New Conversation
          </button>
        </aside>

        {/* Chat Area */}
        <main className="chat-container">
          {/* Current Deity Info */}
          <div className="current-deity">
            <div className="deity-info">
              <h2>{selectedDeity?.name}</h2>
              <p>{selectedDeity?.desc}</p>
              <span className="voice-badge">{selectedDeity?.voice}</span>
            </div>
          </div>

          {/* Messages */}
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome-message">
                <h2>🙏 Welcome to MythAI</h2>
                <p>Ask {selectedDeity?.name} anything about wisdom, life, or spirituality.</p>
                <div className="features-grid">
                  <div className="feature-card">
                    <span className="feature-icon">😢</span>
                    <span className="feature-text">Emotional Support</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🙏</span>
                    <span className="feature-text">Spiritual Guidance</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">📚</span>
                    <span className="feature-text">Sacred Knowledge</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">💬</span>
                    <span className="feature-text">Friendly Chat</span>
                  </div>
                </div>
                <p className="hint">✨ Powered by MCP + Intent-Based AI</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.role === 'user' && (
                  <div className="message-content user-message">
                    <div className="message-text">{msg.text}</div>
                    <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="message-content assistant-message">
                    <div className="message-header">
                      <span className="deity-badge">{selectedDeity?.name}</span>
                      {msg.intent && (
                        <span className={`intent-badge ${msg.intent.toLowerCase()}`}>
                          {msg.intent === 'EMOTION_SUPPORT' && '😢'}
                          {msg.intent === 'SPIRITUAL_QUESTION' && '🙏'}
                          {msg.intent === 'KNOWLEDGE_FACT' && '📚'}
                          {msg.intent === 'NORMAL_CHAT' && '💬'}
                          {msg.intent}
                        </span>
                      )}
                      {msg.audio && (
                        <button
                          className={`audio-btn ${playingAudio === idx ? 'playing' : ''}`}
                          onClick={() => playAudio(msg.audio, idx)}
                          title="Play audio"
                        >
                          {playingAudio === idx ? '⏸️ Pause' : '🔊 Listen'}
                        </button>
                      )}
                    </div>
                    <div className="message-text" dangerouslySetInnerHTML={{ 
                      __html: msg.text.replace(/\n/g, '<br/>').replace(/📖/g, '<br/>📖')
                    }} />
                    <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                  </div>
                )}

                {msg.role === 'error' && (
                  <div className="message-content error-message">
                    <div className="message-text">❌ {msg.text}</div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="message-content assistant-message">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <textarea
              className="message-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${selectedDeity?.name} a question...`}
              rows={3}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={send}
              disabled={loading || !text.trim()}
            >
              {loading ? '⏳' : '📤'} Send
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
