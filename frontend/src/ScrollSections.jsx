import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollSections.css';
import ProductScroll from './ProductScroll';

gsap.registerPlugin(ScrollTrigger);

const ScrollSections = () => {
  useEffect(() => {
    // Animate each section on scroll
    const sections = document.querySelectorAll('.scroll-section');
    
    sections.forEach((section) => {
      gsap.from(section.querySelector('.section-content'), {
        opacity: 0,
        y: 60,
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          end: 'top 25%',
          scrub: 1,
          toggleActions: 'play none none reverse',
        },
      });
    });

    // Parallax effect for section backgrounds
    sections.forEach((section, index) => {
      if (index % 2 === 0) {
        gsap.to(section, {
          backgroundPosition: '50% 100%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="scroll-sections-container">
      {/* Product Scroll: Sticky Layers */}
      <ProductScroll />
      
      {/* Section 1: Mythic Realms */}
      <section className="scroll-section section-realms">
        <div className="section-content">
          <div className="section-header">
            <span className="section-eyebrow">EXPLORE THE COSMOS</span>
            <h2 className="section-title">Mythic Realms</h2>
            <p className="section-subtitle">
              Move through cosmic layers of intelligence — from oracle responses to
              narrative worlds and daily rituals.
            </p>
          </div>

          <div className="realm-cards">
            <div className="realm-card">
              <div className="realm-icon">🔮</div>
              <h3>Oracle Engine</h3>
              <p>
                Ask any deity. Get canon-aware, context-rich answers sourced from
                scriptures and mythic texts.
              </p>
              <div className="realm-features">
                <span>✓ Real-time responses</span>
                <span>✓ Sacred text grounding</span>
                <span>✓ Multi-language support</span>
              </div>
            </div>

            <div className="realm-card">
              <div className="realm-icon">📜</div>
              <h3>Chronicle Library</h3>
              <p>
                Explore branching storylines and timelines across pantheons — all
                stitched by AI.
              </p>
              <div className="realm-features">
                <span>✓ Interactive narratives</span>
                <span>✓ Cross-pantheon stories</span>
                <span>✓ Personalized journeys</span>
              </div>
            </div>

            <div className="realm-card">
              <div className="realm-icon">🧘</div>
              <h3>Ritual Studio</h3>
              <p>
                Generate meditations, affirmations, and daily rituals curated by
                your chosen divine archetype.
              </p>
              <div className="realm-features">
                <span>✓ Daily guidance</span>
                <span>✓ Custom rituals</span>
                <span>✓ Spiritual practices</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Cosmic Data Stream */}
      <section className="scroll-section section-cosmos">
        <div className="section-content">
          <div className="section-header centered">
            <span className="section-eyebrow">THE LIVING KNOWLEDGE GRAPH</span>
            <h2 className="section-title">Cosmic Data Stream</h2>
            <p className="section-subtitle">
              Every question, every insight, every moment in MythAI feeds a shared
              mythic graph — a living knowledge cosmos that grows with each conversation.
            </p>
          </div>

          <div className="cosmos-stats">
            <div className="stat-box">
              <div className="stat-number">55+</div>
              <div className="stat-label">Divine Personas</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">28K+</div>
              <div className="stat-label">Sacred Text Embeddings</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">∞</div>
              <div className="stat-label">Possible Conversations</div>
            </div>
          </div>

          <div className="tech-stack">
            <div className="tech-badge">RAG Architecture</div>
            <div className="tech-badge">Vector Embeddings</div>
            <div className="tech-badge">LLM Orchestration</div>
            <div className="tech-badge">Multi-language NLP</div>
          </div>
        </div>
      </section>

      {/* Section 3: Integrated Apps */}
      <section className="scroll-section section-apps">
        <div className="section-content">
          <div className="section-header">
            <span className="section-eyebrow">EVERYWHERE YOU ARE</span>
            <h2 className="section-title">Integrated Experience</h2>
            <p className="section-subtitle">
              Access divine wisdom across all your platforms and devices.
            </p>
          </div>

          <div className="app-grid">
            <div className="app-card">
              <div className="app-icon">📱</div>
              <h4>Mobile App</h4>
              <p>iOS & Android native apps for on-the-go spiritual guidance</p>
            </div>
            <div className="app-card">
              <div className="app-icon">💬</div>
              <h4>Discord Bot</h4>
              <p>Bring deities into your community servers</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🌐</div>
              <h4>Chrome Extension</h4>
              <p>Quick access to divine wisdom while browsing</p>
            </div>
            <div className="app-card">
              <div className="app-icon">🎮</div>
              <h4>API Access</h4>
              <p>Build your own mythic experiences</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Vision */}
      <section className="scroll-section section-vision">
        <div className="section-content">
          <div className="section-header centered">
            <span className="section-eyebrow">OUR MISSION</span>
            <h2 className="section-title">Bridging Ancient Wisdom & Modern AI</h2>
            <p className="section-subtitle large">
              MythAI transforms sacred stories into living, interactive companions —
              not static pages in forgotten books. We're building the first
              mythic-native intelligence layer for humanity.
            </p>
          </div>

          <div className="vision-pillars">
            <div className="pillar">
              <div className="pillar-number">01</div>
              <h4>Preserve Heritage</h4>
              <p>Keep ancient wisdom alive and accessible for future generations</p>
            </div>
            <div className="pillar">
              <div className="pillar-number">02</div>
              <h4>Democratize Access</h4>
              <p>Make spiritual guidance available to everyone, everywhere</p>
            </div>
            <div className="pillar">
              <div className="pillar-number">03</div>
              <h4>Foster Understanding</h4>
              <p>Build bridges between different faiths and philosophies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Final CTA */}
      <section className="scroll-section section-cta">
        <div className="section-content centered">
          <h2 className="cta-title">Build the Next Divine Interface</h2>
          <p className="cta-subtitle">
            Join us in crafting the first mythic-native intelligence layer for humanity.
            <br />
            The gods are waiting.
          </p>
          <div className="cta-actions">
            <button className="cta-btn primary">Begin Your Journey</button>
            <button className="cta-btn secondary">Contact the Founders</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollSections;
