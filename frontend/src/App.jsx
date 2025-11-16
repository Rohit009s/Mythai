import React, { useState } from 'react'

export default function App(){
  const [conversationId, setConversationId] = useState('');
  const [persona, setPersona] = useState('krishna');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  async function createConversation(){
    const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type':'application/json'}, body: '{}' });
    const data = await res.json();
    setConversationId(data.conversationId);
  }

  async function send(){
    if(!conversationId) await createConversation();
    const body = { conversationId: conversationId || '', persona, text, audio: false };
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    setMessages(prev => [...prev, { role: 'user', text }, { role: 'assistant', text: data.reply.text }]);
    setText('');
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>MythAI Demo</h1>
      <div style={{ marginBottom: 10 }}>
        <label>Persona: </label>
        <select value={persona} onChange={e=>setPersona(e.target.value)}>
          <option value="krishna">Krishna</option>
          <option value="shiva">Shiva</option>
          <option value="lakshmi">Lakshmi</option>
        </select>
        <button onClick={createConversation} style={{ marginLeft: 10 }}>New Conversation</button>
        <div>Conversation ID: {conversationId}</div>
      </div>

      <div>
        <textarea rows={4} cols={80} value={text} onChange={e=>setText(e.target.value)} placeholder="Ask a question..." />
      </div>
      <div>
        <button onClick={send}>Send</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Messages</h3>
        {messages.map((m, i) => (<div key={i} style={{ marginBottom: 8 }}><strong>{m.role}:</strong> {m.text}</div>))}
      </div>
    </div>
  )
}
