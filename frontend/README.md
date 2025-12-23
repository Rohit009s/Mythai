# MythAI Frontend

Modern React frontend for MythAI - Connect with Divine Wisdom

## Features

- 🔐 **Authentication** - Secure login/register with JWT
- 🕉️ **Deity Selection** - Choose from deities based on your religion
- 💬 **Real-time Chat** - Conversational interface with AI-powered deities
- 🔊 **Audio Support** - Optional text-to-speech responses
- 📖 **Sacred References** - Contextual scripture citations
- 📱 **Responsive Design** - Works on all devices

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
# Create .env file (already created)
VITE_API_URL=http://localhost:3000
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Auth.jsx          # Login/Register
│   │   ├── DeitySelector.jsx # Choose deity
│   │   └── Chat.jsx          # Chat interface
│   ├── App.jsx               # Main app component
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── index.html
└── package.json
```

## Usage

1. **Register** - Create account with email, age, religion
2. **Login** - Access your account
3. **Select Deity** - Choose from available deities
4. **Chat** - Ask questions and receive wisdom
5. **Audio** - Toggle audio responses on/off

## Tech Stack

- React 18
- Vite
- CSS3 (no framework needed)
- Fetch API for backend communication
