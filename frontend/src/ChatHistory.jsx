import React, { useState, useEffect } from 'react';
import './ChatHistory.css';

export default function ChatHistory({ token, onLoadConversation, onClose, currentConversationId }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await res.json();
      setConversations(data.conversations || []);
      setError('');
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadConversation = async (convId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/conversations/${convId}`);
      
      if (!res.ok) {
        throw new Error('Failed to load conversation');
      }

      const conversation = await res.json();
      onLoadConversation(conversation);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation');
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    
    if (!confirm('Delete this conversation?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/conversations/${convId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from list
      setConversations(conversations.filter(c => c._id !== convId));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h2>💬 Chat History</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading conversations...</div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <p>📝 No conversations yet</p>
          <p className="empty-hint">Start chatting with a deity to see your history here</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map(conv => (
            <div
              key={conv._id}
              className={`conversation-item ${conv._id === currentConversationId ? 'active' : ''}`}
              onClick={() => handleLoadConversation(conv._id)}
            >
              <div className="conversation-header">
                <span className="conversation-deity">{conv.persona}</span>
                <span className="conversation-date">{formatDate(conv.updatedAt)}</span>
              </div>
              <div className="conversation-title">{conv.title}</div>
              <div className="conversation-preview">{conv.lastMessage}</div>
              <div className="conversation-footer">
                <span className="message-count">{conv.messageCount} messages</span>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteConversation(conv._id, e)}
                  title="Delete conversation"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
