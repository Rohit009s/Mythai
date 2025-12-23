import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebGLBackground from './WebGLBackground'
import './ChatHistory.css'

const ChatHistory = ({ user, onSelectConversation, apiUrl }) => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/conversations`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        console.error('Failed to fetch conversations')
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEditTitle = (conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const handleSaveTitle = async (conversationId) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ title: editTitle })
      })

      if (response.ok) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, title: editTitle }
              : conv
          )
        )
        setEditingId(null)
        setEditTitle('')
      } else {
        console.error('Failed to update conversation title')
      }
    } catch (error) {
      console.error('Error updating conversation title:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleDeleteConversation = async (conversationId) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${apiUrl}/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers
      })

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      } else {
        console.error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const handleContinueConversation = (conversation) => {
    // Set the selected deity and conversation, then navigate to chat
    onSelectConversation(conversation)
    navigate('/chat')
  }

  const groupConversationsByDate = (conversations) => {
    const groups = {}
    conversations.forEach(conv => {
      const date = formatDate(conv.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(conv)
    })
    return groups
  }

  const groupedConversations = groupConversationsByDate(conversations)

  if (loading) {
    return (
      <div className="history-container">
        <WebGLBackground />
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      <WebGLBackground />
      
      <div className="history-header">
        <h1>
          <img src="/icons/pngegg.png" alt="spiritual icon" className="history-icon" />
          Chat History
        </h1>
        <p>Your spiritual conversations and divine guidance</p>
      </div>

      <div className="history-content">
        {conversations.length === 0 ? (
          <div className="empty-history">
            <div className="empty-icon">💬</div>
            <h3>No conversations yet</h3>
            <p>Start a conversation with a deity to see your chat history here</p>
            <button 
              className="start-chat-btn"
              onClick={() => navigate('/home')}
            >
              Start Your First Chat
            </button>
          </div>
        ) : (
          <div className="conversations-list">
            {Object.entries(groupedConversations).map(([date, convs]) => (
              <div key={date} className="date-group">
                <h3 className="date-header">{date}</h3>
                <div className="conversations-grid">
                  {convs.map(conversation => (
                    <div key={conversation.id} className="conversation-card">
                      <div className="conversation-header">
                        <div className="deity-info">
                          <span className="deity-name">{conversation.deityName}</span>
                          <span className="conversation-time">
                            {formatTime(conversation.createdAt)}
                          </span>
                        </div>
                        <div className="conversation-actions">
                          <button
                            className="edit-btn"
                            onClick={() => handleEditTitle(conversation)}
                            title="Edit title"
                          >
                            ✏️
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteConversation(conversation.id)}
                            title="Delete conversation"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="conversation-title">
                        {editingId === conversation.id ? (
                          <div className="title-edit">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="title-input"
                              autoFocus
                            />
                            <div className="edit-actions">
                              <button
                                className="save-btn"
                                onClick={() => handleSaveTitle(conversation.id)}
                              >
                                ✓
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={handleCancelEdit}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <h4>{conversation.title}</h4>
                        )}
                      </div>

                      <div className="conversation-preview">
                        <p>{conversation.firstMessage}</p>
                      </div>

                      <div className="conversation-stats">
                        <span className="message-count">
                          {conversation.messageCount} messages
                        </span>
                        <span className="duration">
                          {conversation.duration}
                        </span>
                      </div>

                      <button
                        className="continue-btn"
                        onClick={() => handleContinueConversation(conversation)}
                      >
                        Continue Conversation
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatHistory