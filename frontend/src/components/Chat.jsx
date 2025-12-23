import { useState, useEffect, useRef } from 'react'
import WebGLBackground from './WebGLBackground'
import './Chat.css'

// SVG Filter for Liquid Glass Effect
const LiquidGlassFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter
        id="chat-liquid-glass"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.05 0.05"
          numOctaves="1"
          seed="1"
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise"
          scale="70"
          xChannelSelector="R"
          yChannelSelector="B"
          result="displaced"
        />
        <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
        <feComposite in="finalBlur" in2="finalBlur" operator="over" />
      </filter>
    </defs>
  </svg>
)

export default function Chat({ user, deity, onLogout, apiUrl, existingConversationId = null }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [conversationId, setConversationId] = useState(existingConversationId)
  const [conversationLoading, setConversationLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (existingConversationId) {
      // Load existing conversation
      loadExistingConversation(existingConversationId)
    } else {
      // Create a new conversation when deity changes
      createConversation()
    }
  }, [deity, existingConversationId])

  const loadExistingConversation = async (convId) => {
    setConversationLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/conversations/${convId}`, {
        headers
      })

      if (response.ok) {
        const conversation = await response.json()
        setConversationId(convId)
        
        // Load existing messages
        if (conversation.messages && conversation.messages.length > 0) {
          const formattedMessages = conversation.messages.map(msg => ({
            sender: msg.sender,
            text: msg.text,
            reference: msg.reference,
            audioUrl: msg.audioUrl,
            timestamp: msg.timestamp
          }))
          setMessages(formattedMessages)
        }
        
        console.log(`[Chat] Loaded existing conversation with ${conversation.messages?.length || 0} messages`)
      } else {
        console.error('Failed to load conversation, creating new one')
        createConversation()
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      createConversation()
    } finally {
      setConversationLoading(false)
    }
  }

  const createConversation = async () => {
    // Don't create new conversation if we already have one
    if (conversationId) return
    
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          persona: deity.id,
          title: `Conversation with ${deity.name}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.conversationId)
        console.log(`[Chat] Created new conversation: ${data.conversationId}`)
      } else {
        // Fallback to generated ID if API fails
        const fallbackId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setConversationId(fallbackId)
        console.log(`[Chat] Using fallback conversation ID: ${fallbackId}`)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      // Fallback to generated ID
      const fallbackId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setConversationId(fallbackId)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      // Add auth header only if token exists (not guest)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          persona: deity.id,
          text: input,
          audio: audioEnabled
        })
      })

      const data = await res.json()

      if (res.ok && data.reply) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply.text,
          reference: data.reply.reference,
          audioUrl: data.reply.audioUrl,
          timestamp: data.reply.timestamp
        }])
      } else {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: 'Network error. Please check your connection.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="chat-container">
      <WebGLBackground />
      <LiquidGlassFilter />

      <div className="chat-info">
        <h2>
          <img src="/icons/pngegg.png" alt="spiritual icon" className="deity-icon" />
          {deity.name}
        </h2>
        <p>{deity.description}</p>
      </div>

      <div className="chat-messages">
        {conversationLoading ? (
          <div className="conversation-loading">
            <div className="loading-spinner"></div>
            <p>Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <img src="/icons/pngegg.png" alt="spiritual icon" className="spiritual-icon" />
            </div>
            <h3>Welcome to your spiritual conversation</h3>
            <p>Ask {deity.name} for guidance, wisdom, or share what's on your mind</p>
            <div className="conversation-starters">
              <button onClick={() => setInput("I'm feeling lost and need guidance")} className="starter-btn">
                💭 I need guidance
              </button>
              <button onClick={() => setInput("What wisdom can you share with me today?")} className="starter-btn">
                ✨ Share wisdom
              </button>
              <button onClick={() => setInput("How can I find inner peace?")} className="starter-btn">
                🧘 Find peace
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'user' ? user.name[0].toUpperCase() : deity.name[0]}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.text}</div>
                
                {msg.reference && msg.reference.source && (
                  <div className="message-citation">
                    <span className="citation-text">— {msg.reference.source}</span>
                  </div>
                )}

                {msg.audioUrl && (
                  <div className="message-audio">
                    <audio controls src={msg.audioUrl} />
                  </div>
                )}

                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="message assistant">
            <div className="message-avatar">{deity.name[0]}</div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask ${deity.name} for guidance...`}
            rows="1"
            disabled={loading}
          />
          <div className="chat-controls">
            <button
              className={`audio-toggle ${audioEnabled ? 'active' : ''}`}
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Audio enabled' : 'Audio disabled'}
            >
              {audioEnabled ? '🔊' : '🔇'}
            </button>
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
