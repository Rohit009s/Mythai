import React, { useState } from 'react';
import './HomePage.css';
import CosmicHero3D from './CosmicHero3D';
import ScrollSections from './ScrollSections';

const DEITY_COLLECTIONS = {
  hindu: {
    name: 'Hindu Deities',
    color: '#FF6B35',
    deities: [
      { id: 'krishna', name: 'Krishna', title: 'Divine Teacher', image: '/deities/krishna.png', emoji: '🦚', rarity: 'Legendary' },
      { id: 'shiva', name: 'Shiva', title: 'The Transformer', image: '/deities/shiva.png', emoji: '🔱', rarity: 'Legendary' },
      { id: 'vishnu', name: 'Vishnu', title: 'The Preserver', image: '/deities/vishnu.png', emoji: '🪷', rarity: 'Legendary' },
      { id: 'rama', name: 'Rama', title: 'Noble Prince', image: '/deities/Rama.jpg', emoji: '🏹', rarity: 'Epic' },
      { id: 'hanuman', name: 'Hanuman', title: 'Devoted Warrior', image: '/deities/hanuman.png', emoji: '🐒', rarity: 'Epic' },
      { id: 'ganesha', name: 'Ganesha', title: 'Remover of Obstacles', image: '/deities/ganesha.png', emoji: '🐘', rarity: 'Epic' },
      { id: 'lakshmi', name: 'Lakshmi', title: 'Goddess of Prosperity', image: '/deities/lakshmi.png', emoji: '💰', rarity: 'Rare' },
      { id: 'durga', name: 'Durga', title: 'Fierce Protector', image: '/deities/durga matha.png', emoji: '⚔️', rarity: 'Epic' },
      { id: 'saraswathi', name: 'Saraswathi', title: 'Goddess of Knowledge', image: '/deities/saraswathi.png', emoji: '📚', rarity: 'Epic' },
      { id: 'ayyappa', name: 'Ayyappa', title: 'Lord of Dharma', image: '/deities/manikanta or ayappa.png', emoji: '🕉️', rarity: 'Epic' },
    ]
  },
  greek: {
    name: 'Greek Pantheon',
    color: '#4ECDC4',
    deities: [
      { id: 'zeus', name: 'Zeus', title: 'King of Gods', image: '/deities/zeus.png', emoji: '⚡', rarity: 'Legendary' },
      { id: 'athena', name: 'Athena', title: 'Goddess of Wisdom', image: '/deities/athena.png', emoji: '🦉', rarity: 'Epic' },
      { id: 'apollo', name: 'Apollo', title: 'God of Arts', image: '/deities/apollo.png', emoji: '☀️', rarity: 'Epic' },
      { id: 'hera', name: 'Hera', title: 'Queen of Gods', image: '/deities/hera.png', emoji: '👑', rarity: 'Legendary' },
      { id: 'aphrodite', name: 'Aphrodite', title: 'Goddess of Love', image: '/deities/aphrodite.png', emoji: '💕', rarity: 'Epic' },
    ]
  },
  norse: {
    name: 'Norse Legends',
    color: '#95E1D3',
    deities: [
      { id: 'odin', name: 'Odin', title: 'All-Father', image: '/deities/odin.png', emoji: '👁️', rarity: 'Legendary' },
      { id: 'thor', name: 'Thor', title: 'God of Thunder', image: '/deities/thor.png', emoji: '⚡', rarity: 'Legendary' },
      { id: 'loki', name: 'Loki', title: 'Trickster God', image: '/deities/loki.png', emoji: '🔥', rarity: 'Epic' },
      { id: 'freyja', name: 'Freyja', title: 'Goddess of Love', image: '/deities/freyja.png', emoji: '💎', rarity: 'Epic' },
    ]
  },
  egyptian: {
    name: 'Egyptian Gods',
    color: '#F38181',
    deities: [
      { id: 'ra', name: 'Ra', title: 'Sun God', image: '/deities/RA(RE).png', emoji: '☀️', rarity: 'Legendary' },
      { id: 'isis', name: 'Isis', title: 'Goddess of Magic', image: '/deities/isis.png', emoji: '🌙', rarity: 'Epic' },
      { id: 'anubis', name: 'Anubis', title: 'God of Death', image: '/deities/anubis.png', emoji: '🐺', rarity: 'Epic' },
      { id: 'osiris', name: 'Osiris', title: 'God of Afterlife', image: '/deities/osiris.png', emoji: '👑', rarity: 'Legendary' },
      { id: 'horus', name: 'Horus', title: 'Sky God', image: '/deities/HORUS.png', emoji: '🦅', rarity: 'Epic' },
    ]
  },
  abrahamic: {
    name: 'Abrahamic Traditions',
    color: '#AA96DA',
    deities: [
      { id: 'jesus', name: 'Jesus', title: 'The Messiah', image: '/deities/JESUS.png', emoji: '✝️', rarity: 'Legendary' },
      { id: 'allah', name: 'Allah', title: 'The One God', image: '/deities/Allah.png', emoji: '☪️', rarity: 'Legendary' },
    ]
  }
};

export default function HomePage({ onSelectDeity, userReligion }) {
  const [selectedCollection, setSelectedCollection] = useState('hindu');
  const [hoveredDeity, setHoveredDeity] = useState(null);

  // Filter collections based on user's religion
  const availableCollections = userReligion && userReligion !== 'all'
    ? { [userReligion]: DEITY_COLLECTIONS[userReligion] }
    : DEITY_COLLECTIONS;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Legendary': return '#FFD700';
      case 'Epic': return '#9B59B6';
      case 'Rare': return '#3498DB';
      default: return '#95A5A6';
    }
  };

  return (
    <div className="home-page">
      {/* 3D Cosmic Hero */}
      <CosmicHero3D />
      
      {/* Scroll-driven Story Sections */}
      <ScrollSections />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="gradient-text">WELCOME TO</span>
            <br />
            <span className="main-title">DIVINE WISDOM</span>
          </h1>
          <p className="hero-subtitle">
            Connect with ancient deities and receive guidance from sacred wisdom.
            <br />
            Choose your divine companion and begin your spiritual journey.
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">55+</div>
              <div className="stat-label">Deities</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">9</div>
              <div className="stat-label">Traditions</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">28K+</div>
              <div className="stat-label">Sacred Texts</div>
            </div>
          </div>
        </div>
        <div className="hero-decoration">
          <div className="floating-card">
            <div className="card-glow"></div>
            <div className="card-content">
              <div className="card-icon">🕉️</div>
              <div className="card-title">Start Your Journey</div>
            </div>
          </div>
        </div>
      </section>

      {/* Collection Tabs */}
      <section className="collections-section">
        <h2 className="section-title">
          <span className="title-icon">✨</span>
          DIVINE COLLECTIONS
          <span className="title-icon">✨</span>
        </h2>
        
        <div className="collection-tabs">
          {Object.entries(availableCollections).map(([key, collection]) => (
            <button
              key={key}
              className={`collection-tab ${selectedCollection === key ? 'active' : ''}`}
              onClick={() => setSelectedCollection(key)}
              style={{
                '--collection-color': collection.color
              }}
            >
              {collection.name}
            </button>
          ))}
        </div>

        {/* Deity Grid */}
        <div className="deity-grid">
          {availableCollections[selectedCollection]?.deities.map((deity) => (
            <div
              key={deity.id}
              className={`deity-card ${hoveredDeity === deity.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredDeity(deity.id)}
              onMouseLeave={() => setHoveredDeity(null)}
              onClick={() => onSelectDeity(deity.id)}
            >
              <div className="card-glow-effect"></div>
              
              <div className="deity-rarity" style={{ color: getRarityColor(deity.rarity) }}>
                ⭐ {deity.rarity}
              </div>

              <div className="deity-image">
                <div className="image-bg"></div>
                {deity.image && deity.image.startsWith('/deities/') ? (
                  <img 
                    src={deity.image} 
                    alt={deity.name}
                    className="deity-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <span className="deity-emoji" style={{ display: deity.image?.startsWith('/deities/') ? 'none' : 'block' }}>
                  {deity.emoji || deity.image}
                </span>
              </div>

              <div className="deity-info">
                <h3 className="deity-name">{deity.name}</h3>
                <p className="deity-title">{deity.title}</p>
              </div>

              <button className="select-btn">
                <span>Connect</span>
                <span className="btn-arrow">→</span>
              </button>

              <div className="card-shine"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">WHY CHOOSE DIVINE WISDOM</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📖</div>
            <h3>Sacred Texts</h3>
            <p>Access 28,482 embedded sacred texts from multiple religious traditions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Guidance</h3>
            <p>Receive wisdom tailored to your questions and spiritual journey</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Multilingual Support</h3>
            <p>Communicate in English, Hindi, Telugu, and Tamil</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Chat History</h3>
            <p>Continue your conversations and track your spiritual growth</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Begin Your Journey?</h2>
          <p>Select a deity above and start receiving divine wisdom today</p>
          <div className="cta-decoration">
            <span className="decoration-line"></span>
            <span className="decoration-icon">🙏</span>
            <span className="decoration-line"></span>
          </div>
        </div>
      </section>
    </div>
  );
}
