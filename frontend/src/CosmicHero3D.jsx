import { useEffect } from 'react';
import './CosmicHero3D.css';

const CosmicHero3D = () => {
  useEffect(() => {
    // Listen for ProductScroll layer changes
    const handleLayerChange = (event) => {
      const { index, color, layer } = event.detail;
      console.log(`🌌 Cosmic Hero syncing to layer ${index}: ${layer} (${color})`);
      
      // TODO: Add Three.js scene here
      // Update orb color, camera position, particles, etc.
      // See frontend/COSMIC_HERO_SYNC_EXAMPLE.md for implementation
    };

    window.addEventListener('mythai-layer-change', handleLayerChange);
    
    return () => {
      window.removeEventListener('mythai-layer-change', handleLayerChange);
    };
  }, []);

  return (
    <section className="cosmic-hero-3d">
      {/* Video Background - Universe Loop */}
      <div className="video-background">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-video"
          poster="/cosmic1.jpg"
        >
          <source src="/universe.mp4" type="video/mp4" />
        </video>
        {/* Fallback image if video doesn't load */}
        <img 
          src="/cosmic1.jpg" 
          alt="Cosmic Background" 
          className="hero-fallback-image"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="video-overlay"></div>
      </div>

      <div className="cosmic-hero-content">
        <div className="hero-eyebrow">Welcome to MythAI</div>
        <h1 className="hero-title">
          Converse with <span className="highlight">Divine Wisdom</span>
        </h1>
        <p className="hero-subtitle">
          Experience sacred knowledge through AI-powered conversations with deities from every tradition
        </p>
      </div>
      
      {/* Placeholder for Three.js canvas */}
      <div className="cosmic-orb-placeholder">
        <div className="orb-glow"></div>
      </div>
    </section>
  );
};

export default CosmicHero3D;
