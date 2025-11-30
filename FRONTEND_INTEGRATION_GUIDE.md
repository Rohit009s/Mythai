# Frontend Integration Guide

## Files Created ✅

1. `frontend/src/ChatHistory.jsx` - Chat history sidebar component
2. `frontend/src/ChatHistory.css` - Sidebar styling
3. `frontend/src/ReferenceCard.jsx` - Enhanced reference display component
4. `frontend/src/ReferenceCard.css` - Reference card styling

## Changes Needed in App.jsx

### 1. Add Imports
```javascript
import ChatHistory from './ChatHistory'
import ReferenceCard from './ReferenceCard'
```

### 2. Add State Variables
```javascript
const [showHistory, setShowHistory] = useState(false)
```

### 3. Add Load Conversation Function
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
  setShowHistory(false) // Close sidebar after loading
}
```

### 4. Update Message Display to Show References
In the message rendering section, add:
```javascript
{msg.role === 'assistant' && msg.reference && (
  <ReferenceCard reference={msg.reference} />
)}
```

### 5. Add History Toggle Button
In the header section:
```javascript
{token && (
  <button 
    className="history-btn" 
    onClick={() => setShowHistory(!showHistory)}
    title="Chat History"
  >
    📚 History
  </button>
)}
```

### 6. Add Chat History Sidebar
Before the main container:
```javascript
{showHistory && token && (
  <ChatHistory
    token={token}
    onLoadConversation={loadConversation}
    onClose={() => setShowHistory(false)}
    currentConversationId={conversationId}
  />
)}
```

## Complete App.jsx Structure

```javascript
export default function App() {
  // ... existing state ...
  const [showHistory, setShowHistory] = useState(false)

  // ... existing functions ...

  const loadConversation = (conversation) => {
    setConversationId(conversation._id)
    setPersona(conversation.persona)
    
    const formattedMessages = conversation.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      text: msg.text,
      persona: msg.persona,
      reference: msg.reference,
      timestamp: msg.timestamp
    }))
    
    setMessages(formattedMessages)
    setShowHistory(false)
  }

  return (
    <div className="app">
      {/* Chat History Sidebar */}
      {showHistory && token && (
        <ChatHistory
          token={token}
          onLoadConversation={loadConversation}
          onClose={() => setShowHistory(false)}
          currentConversationId={conversationId}
        />
      )}

      {/* Main App Content */}
      <div className="main-content">
        <header className="header">
          <div className="header-content">
            <div>
              <h1 className="title">🕉️ MythAI</h1>
              <p className="subtitle">Speak with Divine Wisdom</p>
            </div>
            <div className="user-info">
              {token && (
                <button 
                  className="history-btn" 
                  onClick={() => setShowHistory(!showHistory)}
                >
                  📚 History
                </button>
              )}
              <span className="user-name">👤 {user?.name || 'Guest'}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.text}
              </div>
              {/* Enhanced Reference Display */}
              {msg.role === 'assistant' && msg.reference && (
                <ReferenceCard reference={msg.reference} />
              )}
            </div>
          ))}
        </div>

        {/* Rest of the app... */}
      </div>
    </div>
  )
}
```

## CSS Updates Needed in App.css

### 1. Add History Button Style
```css
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
}

.history-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

### 2. Update App Layout for Sidebar
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
```

### 3. Update Message Styling
```css
.message.assistant {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 18px 18px 4px 18px;
  padding: 15px 20px;
  max-width: 80%;
  align-self: flex-start;
}

.message-content {
  line-height: 1.6;
  color: #2d3748;
}
```

## Testing Checklist

### Backend Testing
- [ ] Start backend: `node server/index.js`
- [ ] Test conversation list API
- [ ] Test conversation load API
- [ ] Test enhanced references in chat

### Frontend Testing
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Login as user
- [ ] Send a message
- [ ] Check if reference appears
- [ ] Click history button
- [ ] See conversation in sidebar
- [ ] Click conversation to load
- [ ] Delete conversation
- [ ] Create new conversation

## Example User Flow

1. **User logs in** → Sees main chat interface
2. **User asks Krishna**: "What is dharma?"
3. **System responds** with:
   - Main answer
   - Enhanced reference card showing:
     - Sacred text quote
     - Source (Bhagavad Gita, Chapter 3, Verse 35)
     - Meaning
     - Application
     - Summary
4. **User clicks "History"** → Sidebar opens
5. **User sees conversation** titled "What is dharma?"
6. **User continues chatting** → Conversation updates
7. **User clicks history again** → Loads previous conversation
8. **User can delete** old conversations

## Next Steps

1. Update App.jsx with the changes above
2. Update App.css with new styles
3. Test the complete flow
4. Fix any styling issues
5. Test on mobile devices

---

**Status**: Components Created - Ready for Integration
**Files Ready**: ChatHistory.jsx, ChatHistory.css, ReferenceCard.jsx, ReferenceCard.css
**Next**: Update App.jsx and App.css
