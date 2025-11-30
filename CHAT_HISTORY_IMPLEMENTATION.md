# Chat History Implementation Plan

## Features to Implement

### 1. Chat History Sidebar ✅
- Show list of previous conversations
- Display conversation title, deity, and last message preview
- Click to resume conversation
- Delete conversation option

### 2. Enhanced Reference Format
Current format needs improvement to show:
```
**Sacred Text Reference:**
"[Exact quote from scripture]"
- Source: [Book Name, Chapter X, Verse Y]

**Meaning:**
[Clear explanation of what this verse means]

**Application:**
[How this applies to your question about trust/dharma/etc.]

**Summary:**
[Brief summary connecting the reference to the conversation]
```

### 3. Conversation Management
- Auto-generate title from first message
- Update conversation timestamp on new messages
- Store user ID with conversations
- Load full conversation history when resuming

## Backend Changes Needed

### 1. Update `server/routes/conversations.js` ✅ DONE
- Added GET `/api/conversations` - List all user conversations
- Added PATCH `/api/conversations/:id/title` - Update title
- Added DELETE `/api/conversations/:id` - Delete conversation
- Added user ID tracking

### 2. Update `server/routes/chat.js`
Need to modify the response format to include structured references:

```javascript
const response = {
  text: mainResponse,
  references: retrieved.length > 0 ? {
    sacredText: {
      quote: extractedQuote,
      source: {
        book: sourceBook,
        chapter: chapterNumber,
        verse: verseNumber
      }
    },
    meaning: meaningExplanation,
    application: howItApplies,
    summary: briefSummary
  } : null
};
```

### 3. Update conversation save logic
```javascript
// Auto-generate title from first message
if (messages.length === 0) {
  const title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
  await db.collection('conversations').updateOne(
    { _id: conversationId },
    { 
      $set: { 
        title,
        persona: basePersona,
        userId: user._id || null,
        updatedAt: new Date()
      }
    }
  );
}
```

## Frontend Changes Needed

### 1. Add Chat History Sidebar Component
```jsx
// frontend/src/ChatHistory.jsx
- Fetch conversations from API
- Display list with titles and previews
- Handle click to load conversation
- Delete button for each conversation
```

### 2. Update App.jsx
```jsx
- Add state for conversation list
- Add function to load conversation
- Add sidebar toggle
- Pass conversation ID when resuming
```

### 3. Enhanced Reference Display
```jsx
// Show references in a card format
<div className="reference-card">
  <div className="sacred-text">
    <h4>📖 Sacred Text</h4>
    <blockquote>{quote}</blockquote>
    <p className="source">{book}, Chapter {chapter}, Verse {verse}</p>
  </div>
  
  <div className="meaning">
    <h4>💡 Meaning</h4>
    <p>{meaning}</p>
  </div>
  
  <div className="application">
    <h4>🎯 Application</h4>
    <p>{application}</p>
  </div>
  
  <div className="summary">
    <h4>📝 Summary</h4>
    <p>{summary}</p>
  </div>
</div>
```

## Implementation Steps

### Phase 1: Backend (Current Session)
1. ✅ Update conversations API with history endpoints
2. ⏳ Modify chat response to include structured references
3. ⏳ Update conversation save logic with titles and metadata

### Phase 2: Frontend (Next)
1. Create ChatHistory component
2. Update App.jsx to show/hide sidebar
3. Add conversation loading logic
4. Style the reference cards

### Phase 3: Testing
1. Test conversation creation and resumption
2. Test reference formatting
3. Test conversation deletion
4. Test with different deities and religions

## Example Flow

1. User asks: "What is trust according to Krishna?"

2. System retrieves from Bhagavad Gita

3. Response format:
```
Krishna's response about trust...

**📖 Sacred Text:**
"Shraddhaavan labhate jnaanam tatparah samyatendriyah"

- Source: Bhagavad Gita, Chapter 4, Verse 39

**💡 Meaning:**
"One who has faith, who is devoted to it, and who has subdued the senses, obtains knowledge."

**🎯 Application:**
In your question about trust, this verse teaches that true trust (shraddha) combined with self-control leads to wisdom. Trust is not blind faith, but a foundation for spiritual growth.

**📝 Summary:**
Trust in the divine path, when paired with discipline and devotion, becomes the gateway to higher knowledge and understanding.
```

4. Conversation is saved with:
   - Title: "What is trust according to Krishna?"
   - Deity: Krishna
   - User ID: (if logged in)
   - Timestamp: Now
   - Messages: Full history

5. User can see this in sidebar and resume later

## Next Steps

Would you like me to:
1. Complete the backend implementation first?
2. Move to frontend chat history sidebar?
3. Focus on enhanced reference formatting?

Let me know which part you'd like to implement first!
