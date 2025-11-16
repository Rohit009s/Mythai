// Mock Qdrant and OpenAI for offline testing
const mockEmbedText = async (text) => new Array(1536).fill(Math.random());
const mockSearch = async (collectionName, vector, topK) => [
  {
    id: 'bg-2-47',
    score: 0.95,
    payload: {
      id: 'bg-2-47',
      source_title: 'Bhagavad Gita',
      book: 'Bhagavad Gita',
      chapter: '2',
      verse: '47',
      translator: 'A.B. Translator',
      license: 'public-domain',
      text: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.'
    }
  }
];

const mockChatCompletion = async (messages) => ({
  choices: [{
    message: {
      content: 'The Gita teaches that you have the right to perform duty without attachment to results. (Source: Bhagavad Gita, 2.47)'
    }
  }]
});

module.exports = {
  mockEmbedText,
  mockSearch,
  mockChatCompletion
};
