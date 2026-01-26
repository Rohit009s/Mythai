import { useState, useEffect, useRef } from 'react'
import WebGLBackground from './WebGLBackground'
import ConversationMemory from './ConversationMemory'
import VoiceConversation from './VoiceConversation'
import { LiquidGlassFilter } from './ui/liquid-glass'
import { 
  StardustButton, 
  CallStardustButton, 
  VoiceStardustButton, 
  SendStardustButton,
  CompactStardustButton 
} from './ui/stardust-button'
import { MessageCircle, Phone, Mic, Volume2, Send, Brain } from 'lucide-react'
import './Chat.css'

export default function Chat({ user, deity, onLogout, apiUrl, existingConversationId = null }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [conversationId, setConversationId] = useState(existingConversationId)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [speechRecognition, setSpeechRecognition] = useState(null)
  const [showVoiceCall, setShowVoiceCall] = useState(false)
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

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        setIsRecording(true)
        console.log('Speech recognition started')
      }
      
      recognition.onresult = (event) => {
        let transcript = ''
        let isFinal = false
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
          if (event.results[i].isFinal) {
            isFinal = true
          }
        }
        
        setInput(transcript)
        
        // Auto-send when speech is final and we have content
        if (isFinal && transcript.trim()) {
          setTimeout(() => {
            // Use the transcript directly since state might not be updated yet
            sendVoiceMessage(transcript.trim())
            setInput('') // Clear input after sending
          }, 100)
        }
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        console.log('Speech recognition ended')
      }
      
      recognition.onerror = (event) => {
        setIsRecording(false)
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access to use voice input.')
        }
      }
      
      setSpeechRecognition(recognition)
    } else {
      console.warn('Speech recognition not supported in this browser')
    }
  }, [])

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

  const startVoiceRecording = () => {
    if (speechRecognition && !isRecording) {
      setInput('') // Clear existing input
      speechRecognition.start()
    }
  }

  const stopVoiceRecording = () => {
    if (speechRecognition && isRecording) {
      speechRecognition.stop()
    }
  }

  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording()
    } else {
      startVoiceRecording()
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    }

    const currentInput = input.trim()
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
      
      console.log('[Chat] Sending message:', {
        conversationId,
        persona: deity.id,
        text: currentInput,
        audio: audioEnabled
      })
      
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          persona: deity.id,
          text: currentInput,
          audio: audioEnabled
        })
      })

      console.log('[Chat] Response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[Chat] Server error:', errorText)
        throw new Error(`Server error: ${res.status} - ${errorText}`)
      }

      const data = await res.json()
      console.log('[Chat] Response data:', data)

      if (data.reply && data.reply.text) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply.text,
          reference: data.reply.reference,
          audioUrl: data.reply.audioUrl,
          timestamp: data.reply.timestamp || new Date().toISOString()
        }])
      } else {
        console.error('[Chat] Invalid response format:', data)
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: 'Sorry, I received an invalid response. Please try again.',
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('[Chat] Error:', error)
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Sorry, I encountered an error: ${error.message}. Please check your connection and try again.`,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const sendVoiceMessage = async (voiceText) => {
    if (!voiceText.trim() || loading) return

    const userMessage = {
      sender: 'user',
      text: voiceText.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      console.log('[Chat] Sending voice message:', {
        conversationId,
        persona: deity.id,
        text: voiceText,
        audio: audioEnabled
      })
      
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          conversationId,
          persona: deity.id,
          text: voiceText,
          audio: audioEnabled
        })
      })

      console.log('[Chat] Voice response status:', res.status)
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('[Chat] Voice server error:', errorText)
        throw new Error(`Server error: ${res.status} - ${errorText}`)
      }

      const data = await res.json()
      console.log('[Chat] Voice response data:', data)

      if (data.reply && data.reply.text) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply.text,
          reference: data.reply.reference,
          audioUrl: data.reply.audioUrl,
          timestamp: data.reply.timestamp || new Date().toISOString()
        }])
      } else {
        console.error('[Chat] Invalid voice response format:', data)
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: 'Sorry, I received an invalid response to your voice message. Please try again.',
          timestamp: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('[Chat] Voice error:', error)
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Sorry, I cannot process your voice message: ${error.message}. Please check your connection and try again.`,
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
              <CompactStardustButton 
                onClick={() => setInput("I'm feeling lost and need guidance")} 
                className="starter-btn"
              >
                💭 I need guidance
              </CompactStardustButton>
              <CompactStardustButton 
                onClick={() => setInput("What wisdom can you share with me today?")} 
                className="starter-btn"
              >
                ✨ Share wisdom
              </CompactStardustButton>
              <CompactStardustButton 
                onClick={() => setInput("How can I find inner peace?")} 
                className="starter-btn"
              >
                🧘 Find peace
              </CompactStardustButton>
              <CallStardustButton 
                onClick={() => setShowVoiceCall(true)} 
                className="starter-btn voice-call-starter"
                icon={Phone}
              >
                Start Voice Call
              </CallStardustButton>
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
            placeholder={isRecording ? 'Listening... Speak now!' : `Ask ${deity.name} for guidance...`}
            rows="1"
            disabled={loading}
          />
          <div className="chat-controls">
            <CompactStardustButton
              className={`memory-toggle ${showMemory ? 'active' : ''}`}
              onClick={() => setShowMemory(!showMemory)}
              title="View conversation memory"
              disabled={!conversationId}
              icon={Brain}
            >
              Memory
            </CompactStardustButton>
            <VoiceStardustButton
              className={`voice-toggle ${isRecording ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              title={
                !speechRecognition 
                  ? 'Voice input not supported in this browser' 
                  : isRecording 
                    ? 'Stop recording (Click or speak to finish)' 
                    : 'Start voice input'
              }
              disabled={loading || !speechRecognition}
              icon={Mic}
            >
              {isRecording ? 'Stop' : 'Voice'}
            </VoiceStardustButton>
            <CallStardustButton
              className="voice-call-toggle"
              onClick={() => setShowVoiceCall(true)}
              title={`Start real-time voice call with ${deity.name}`}
              icon={Phone}
            >
              Call
            </CallStardustButton>
            <CompactStardustButton
              className={`audio-toggle ${audioEnabled ? 'active' : ''}`}
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? 'Audio enabled' : 'Audio disabled'}
              icon={Volume2}
            >
              {audioEnabled ? 'Audio On' : 'Audio Off'}
            </CompactStardustButton>
            <SendStardustButton
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              icon={Send}
            >
              Send
            </SendStardustButton>
          </div>
        </div>
      </div>
      
      {/* 🧠 Conversation Memory Panel */}
      <ConversationMemory 
        conversationId={conversationId}
        isVisible={showMemory}
        onClose={() => setShowMemory(false)}
      />

      {/* 📞 Voice Call Modal */}
      {showVoiceCall && (
        <div className="voice-call-modal">
          <div className="voice-call-overlay" onClick={() => setShowVoiceCall(false)} />
          <div className="voice-call-container">
            <button 
              className="voice-call-close"
              onClick={() => setShowVoiceCall(false)}
              title="Close voice call"
            >
              ✕
            </button>
            <VoiceConversation
              user={user}
              deity={deity}
              conversationId={conversationId}
              apiUrl={apiUrl}
            />
          </div>
        </div>
      )}
    </div>
  )
}
