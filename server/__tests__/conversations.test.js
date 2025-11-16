/**
 * Test suite for conversation persistence (without live DB)
 */

// Simulated in-memory conversation store for testing
class MockConversationStore {
  constructor() {
    this.conversations = {};
  }

  async createConversation() {
    const id = `conv-${Date.now()}`;
    this.conversations[id] = { _id: id, messages: [], createdAt: new Date() };
    return id;
  }

  async addMessage(conversationId, message) {
    if (!this.conversations[conversationId]) {
      throw new Error('Conversation not found');
    }
    this.conversations[conversationId].messages.push(message);
  }

  async getConversation(conversationId) {
    return this.conversations[conversationId] || null;
  }
}

describe('Conversation Persistence', () => {
  let store;

  beforeEach(() => {
    store = new MockConversationStore();
  });

  test('should create a conversation', async () => {
    const id = await store.createConversation();
    expect(id).toBeDefined();
    const conv = await store.getConversation(id);
    expect(conv).toBeDefined();
    expect(conv.messages).toHaveLength(0);
  });

  test('should persist user message', async () => {
    const id = await store.createConversation();
    const msg = { sender: 'user', text: 'Hello', timestamp: new Date() };
    await store.addMessage(id, msg);
    const conv = await store.getConversation(id);
    expect(conv.messages).toHaveLength(1);
    expect(conv.messages[0].text).toBe('Hello');
  });

  test('should persist assistant reply with sources', async () => {
    const id = await store.createConversation();
    const userMsg = { sender: 'user', text: 'What is dharma?', timestamp: new Date() };
    await store.addMessage(id, userMsg);
    const replyMsg = {
      sender: 'assistant',
      persona: 'Krishna',
      text: 'Dharma is right action.',
      referencedSources: [{ source_title: 'Bhagavad Gita', snippet_id: 'bg-1' }],
      timestamp: new Date()
    };
    await store.addMessage(id, replyMsg);
    const conv = await store.getConversation(id);
    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[1].referencedSources).toHaveLength(1);
    expect(conv.messages[1].referencedSources[0].source_title).toBe('Bhagavad Gita');
  });

  test('should maintain message order', async () => {
    const id = await store.createConversation();
    for (let i = 0; i < 3; i++) {
      await store.addMessage(id, { sender: i % 2 === 0 ? 'user' : 'assistant', text: `msg-${i}`, timestamp: new Date() });
    }
    const conv = await store.getConversation(id);
    expect(conv.messages.map(m => m.text)).toEqual(['msg-0', 'msg-1', 'msg-2']);
  });
});
