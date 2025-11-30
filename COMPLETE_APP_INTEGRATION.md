# Complete App.jsx Integration Guide

## Step 1: Add Imports at the Top

```javascript
import React, { useState, useRef, useEffect } from 'react'
import './App.css'
import AuthPage from './AuthPage'
import HomePage from './HomePage'
import ChatHistory from './ChatHistory'
import ReferenceCard from './ReferenceCard'
```

## Step 2: Add New State Variables

Add these after existing state declarations:

```javascript
const [showHomePage, setShowHomePage] = useState(true)
const [showHistory, setShowHistory] = useState(false)
```

## Step 3: Add Load Conversation Function

Add this function before the return statement:

```javascript
const loadConversation = (conversation) => {
  setConversationId(conversation._id)
  setPersona(conversation.persona)
  
  // Convert conversation messages to display format
  const formattedMessages = conversation.messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    text: msg.text,
    persona: msg.persona,
    reference: msg.reference,
    timestamp: msg.timestamp
  }))
  
  setMessages(formattedMessages)
  setShowHistory(false)
  setShowHomePage(false)
}

const handleSelectDeity = (deityId) => {
  setPersona(deityId)
  setShowHomePage(false)
  setMessages([])
  setConversationId('')
}
```

## Step 4: Update Return Statement

Replace the entire return statement with:

```javascript
return (
  <div className="app">
    {/* Show Auth Page if not authenticated */}
    {!isAuthenticated && <AuthPage onLogin={handleLogin} />}

    {/* Show Home Page for deity selection */}
    {isAuthenticated && showHomePage && (
      <HomePage 
        onSelectDeity={handleSelectDeity}
        userReligion={user?.religion}
      />
    )}

    {/* Main Chat Interface */}
    {isAuthenticated && !showHomePage && (
      <>
        {/* Chat History Sidebar */}
        {showHistory && token && (
          <ChatHistory
            token={token}
            onLoadConversation={loadConversation}
            onClose={() => setShowHistory(false)}
            currentConversationId={conversationId}
          />
        )}

        {/* Main Content */}
        <div className="main-content">
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
                <button 
                  className="home-btn" 
                  onClick={() => setShowHomePage(true)}
                  title="Back to Home"
                >
                  🏠 Home
                </button>
                {token && (
                  <button 
                    className="history-btn" 
                    onClick={() => setShowHistory(!showHistory)}
                    title="Chat History"
                  >
                    📚 History
                  </button>
                )}
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
                <div className="language-selector">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      className={`language-btn ${language === lang.code ? 'active' : ''}`}
                      onClick={() => setLanguage(lang.code)}
                    >
                      <span className="flag">{lang.flag}</span>
                      <span className="lang-name">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button className="new-chat-btn" onClick={newChat}>
                ✨ New Chat
              </button>
            </aside>

            {/* Chat Area */}
            <main className="chat-area">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h2>Start a Conversation</h2>
                    <p>Ask {selectedDeity?.name || 'your deity'} anything about life, spirituality, or wisdom</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      {msg.role === 'assistant' && (
                        <div className="message-avatar">
                          {selectedDeity?.name?.charAt(0) || '🕉️'}
                        </div>
                      )}
                      <div className="message-bubble">
                        <div className="message-content">{msg.text}</div>
                        
                        {/* Enhanced Reference Display */}
                        {msg.role === 'assistant' && msg.reference && (
                          <ReferenceCard reference={msg.reference} />
                        )}
                        
                        {msg.role === 'assistant' && msg.audio && (
                          <button
                            className="play-audio-btn"
                            onClick={() => playAudio(msg.audio)}
                            disabled={playingAudio === msg.audio}
                          >
                            {playingAudio === msg.audio ? '⏸️ Playing...' : '🔊 Play Audio'}
                          </button>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="message-avatar user-avatar">
                          👤
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="input-area">
                <textarea
                  className="message-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask ${selectedDeity?.name || 'your deity'} anything...`}
                  rows="3"
                  disabled={loading}
                />
                <button
                  className="send-btn"
                  onClick={send}
                  disabled={loading || !text.trim()}
                >
                  {loading ? '⏳ Thinking...' : '📤 Send'}
                </button>
              </div>
            </main>
          </div>
        </div>
      </>
    )}
  </div>
)
```

## Step 5: Update App.css

Add these new styles:

```css
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-btn,
.history-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 15px;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.home-btn:hover,
.history-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.message.assistant {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.message.user {
  display: flex;
  gap: 15px;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.user-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-bubble {
  flex: 1;
  max-width: 70%;
}

.message.assistant .message-bubble {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 18px 18px 18px 4px;
  padding: 15px 20px;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 18px 18px 4px 18px;
  padding: 15px 20px;
  color: white;
}

.message-content {
  line-height: 1.6;
  word-wrap: break-word;
}

.message.user .message-content {
  color: white;
}

.play-audio-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.play-audio-btn:hover:not(:disabled) {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.play-audio-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

## Summary

This integration adds:
1. ✅ **HomePage** - Beautiful deity selection page
2. ✅ **ChatHistory** - Sidebar with conversation history
3. ✅ **ReferenceCard** - Enhanced sacred text references
4. ✅ **Complete Flow** - Home → Select Deity → Chat → History

The user flow is now:
1. Login/Register
2. See HomePage with deity cards
3. Select a deity
4. Start chatting
5. View enhanced references
6. Access chat history
7. Return to home to change deity

---

**Status**: Ready for Implementation
**Next**: Apply these changes to App.jsx and App.css
