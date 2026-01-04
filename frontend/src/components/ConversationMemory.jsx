import React, { useState, useEffect } from 'react';
import './ConversationMemory.css';

const ConversationMemory = ({ conversationId, isVisible, onClose }) => {
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible && conversationId) {
      fetchMemoryData();
    }
  }, [isVisible, conversationId]);

  const fetchMemoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [contextResponse, statsResponse] = await Promise.all([
        fetch(`/api/memory/context/${conversationId}`),
        fetch(`/api/memory/stats/${conversationId}`)
      ]);

      if (contextResponse.ok && statsResponse.ok) {
        const contextData = await contextResponse.json();
        const statsData = await statsResponse.json();
        
        setMemoryData({
          context: contextData.context,
          stats: statsData.stats
        });
      } else {
        throw new Error('Failed to fetch memory data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    try {
      const response = await fetch(`/api/memory/summarize/${conversationId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh memory data to show new summary
          fetchMemoryData();
        }
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="memory-overlay">
      <div className="memory-panel">
        <div className="memory-header">
          <h3>🧠 Conversation Memory</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="memory-content">
          {loading && (
            <div className="memory-loading">
              <div className="spinner"></div>
              <p>Loading memory insights...</p>
            </div>
          )}
          
          {error && (
            <div className="memory-error">
              <p>Error: {error}</p>
              <button onClick={fetchMemoryData}>Retry</button>
            </div>
          )}
          
          {memoryData && (
            <div className="memory-sections">
              {/* Conversation Summary */}
              <div className="memory-section">
                <h4>📝 Conversation Summary</h4>
                {memoryData.context.summary ? (
                  <div className="summary-box">
                    <p>{memoryData.context.summary}</p>
                  </div>
                ) : (
                  <div className="no-summary">
                    <p>No summary generated yet</p>
                    <button onClick={generateSummary} className="generate-btn">
                      Generate Summary
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Context */}
              <div className="memory-section">
                <h4>💭 Recent Messages</h4>
                <div className="recent-messages">
                  {memoryData.context.recentMessages.slice(-4).map((msg, idx) => (
                    <div key={idx} className={`message-preview ${msg.role}`}>
                      <span className="role">{msg.role === 'user' ? '👤' : '🕉️'}</span>
                      <span className="text">
                        {msg.text.length > 80 ? msg.text.substring(0, 80) + '...' : msg.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div className="memory-section">
                <h4>📊 Conversation Stats</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total Messages</span>
                    <span className="stat-value">{memoryData.stats.totalMessages}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Duration</span>
                    <span className="stat-value">
                      {memoryData.stats.durationMinutes < 60 
                        ? `${memoryData.stats.durationMinutes}m`
                        : `${Math.floor(memoryData.stats.durationMinutes / 60)}h ${memoryData.stats.durationMinutes % 60}m`
                      }
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Deity</span>
                    <span className="stat-value">{memoryData.stats.persona}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Has Audio</span>
                    <span className="stat-value">{memoryData.stats.hasAudio ? '🔊' : '📝'}</span>
                  </div>
                </div>
              </div>

              {/* Memory Features */}
              <div className="memory-section">
                <h4>🎯 Memory Features</h4>
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">⚡</span>
                    <span>Smart context from last {memoryData.context.recentMessages.length} messages</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📚</span>
                    <span>Conversation summary for efficient memory</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🎭</span>
                    <span>Persona consistency maintained</span>
                  </div>
                  {memoryData.context.hasMemories && (
                    <div className="feature-item">
                      <span className="feature-icon">🧠</span>
                      <span>Personal memories stored</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationMemory;