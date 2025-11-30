import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ProductScroll.css';

gsap.registerPlugin(ScrollTrigger);

// Deity images by religion - using actual uploaded images
const DEITY_IMAGES = {
  hindu: [
    { name: 'Krishna', emoji: '🦚', image: '/deities/krishna.png' },
    { name: 'Shiva', emoji: '🔱', image: '/deities/shiva.png' },
    { name: 'Vishnu', emoji: '🪷', image: '/deities/vishnu.png' },
    { name: 'Rama', emoji: '🏹', image: '/deities/Rama.jpg' },
    { name: 'Hanuman', emoji: '🐒', image: '/deities/hanuman.png' },
    { name: 'Ganesha', emoji: '🐘', image: '/deities/ganesha.png' },
    { name: 'Lakshmi', emoji: '💰', image: '/deities/lakshmi.png' },
    { name: 'Durga', emoji: '🦁', image: '/deities/durga matha.png' },
    { name: 'Saraswathi', emoji: '📚', image: '/deities/saraswathi.png' },
    { name: 'Ayyappa', emoji: '🕉️', image: '/deities/manikanta or ayappa.png' },
  ],
  norse: [
    { name: 'Thor', emoji: '⚡', image: '/deities/thor.png' },
    { name: 'Odin', emoji: '👁️', image: '/deities/odin.png' },
    { name: 'Loki', emoji: '🔥', image: '/deities/loki.png' },
    { name: 'Freyja', emoji: '💎', image: '/deities/freyja.png' },
  ],
  greek: [
    { name: 'Zeus', emoji: '⚡', image: '/deities/zeus.png' },
    { name: 'Athena', emoji: '🦉', image: '/deities/athena.png' },
    { name: 'Apollo', emoji: '☀️', image: '/deities/apollo.png' },
    { name: 'Hera', emoji: '👑', image: '/deities/hera.png' },
    { name: 'Aphrodite', emoji: '💕', image: '/deities/aphrodite.png' },
  ],
  egyptian: [
    { name: 'Ra', emoji: '☀️', image: '/deities/RA(RE).png' },
    { name: 'Isis', emoji: '🌙', image: '/deities/isis.png' },
    { name: 'Anubis', emoji: '🐺', image: '/deities/anubis.png' },
    { name: 'Osiris', emoji: '👑', image: '/deities/osiris.png' },
    { name: 'Horus', emoji: '🦅', image: '/deities/HORUS.png' },
    { name: 'Bastet', emoji: '🐱', image: '/deities/BASTET (BAST).png' },
    { name: 'Hathor', emoji: '🐄', image: '/deities/HATHOR.png' },
    { name: 'Set', emoji: '🌪️', image: '/deities/SET (SETH).png' },
  ],
  japanese: [
    { name: 'Amaterasu', emoji: '☀️', image: '/deities/AMATERASU.png' },
    { name: 'Susanoo', emoji: '🌊', image: '/deities/SUSANOO.png' },
  ],
  mayan: [
    { name: 'Quetzalcoatl', emoji: '🐍', image: '/deities/kukulhan or quetzalcoatl.png' },
    { name: 'Huitzilopochtli', emoji: '🦅', image: '/deities/HUITZILOPOCHTLI.png' },
  ],
  christian: [
    { name: 'Jesus', emoji: '✝️', image: '/deities/JESUS.png' },
  ],
  muslim: [
    { name: 'Allah', emoji: '☪️', image: '/deities/Allah.png' },
  ],
};

const LAYERS = [
  {
    id: 0,
    caption: '01 · Oracle Layer',
    title: 'Divine Q&A',
    infoTitle: 'Divine Q&A · Oracle Layer',
    description: 'Ask any deity across pantheons and receive canon-aware, cross-referenced answers grounded in scriptures and mythic lore.',
    cta: 'Enter Oracle Realm',
    backgroundImage: '/cosmic1.jpg',
    color: '#5542FF',
  },
  {
    id: 1,
    caption: '02 · Scripture Layer',
    title: 'Canon Engine',
    infoTitle: 'Canon Engine · Scripture Layer',
    description: 'A retrieval layer tuned on sacred texts, letting MythAI trace every response back to sources you can inspect and trust.',
    cta: 'Browse Scriptures',
    backgroundImage: '/cosmic2.jpg',
    color: '#7B61FF',
  },
  {
    id: 2,
    caption: '03 · Memory Layer',
    title: 'Karma Graph',
    infoTitle: 'Karma Graph · Memory Layer',
    description: 'An evolving graph of your questions, insights, and rituals — powering personalized guidance across all gods and traditions.',
    cta: 'View Your Karma Graph',
    backgroundImage: '/cosmic3.jpg',
    color: '#9B80FF',
  },
  {
    id: 3,
    caption: '04 · Ritual Layer',
    title: 'Ritual Studio',
    infoTitle: 'Ritual Studio · Ritual Layer',
    description: 'Generate daily mantras, meditations, and micro-rituals curated by your chosen deity archetypes.',
    cta: 'Design a Ritual',
    backgroundImage: '/cosmic4.jpg',
    color: '#BB9FFF',
  },
  {
    id: 4,
    caption: '05 · Experience Layer',
    title: 'Mythic Hub',
    infoTitle: 'Mythic Hub · Experience Layer',
    description: 'A cosmic home screen where all gods, stories, and rituals converge into a single living interface.',
    cta: 'Open Mythic Hub',
    backgroundImage: '/cosmic5.jpg',
    color: '#DBBEFF',
  },
];

const ProductScroll = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userReligion, setUserReligion] = useState('hindu'); // Default
  const [deityImages, setDeityImages] = useState([]);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const menuItemsRef = useRef([]);
  const infosRef = useRef([]);
  const scrollTriggerRef = useRef(null);
  const backgroundRef = useRef(null);

  // Get user's religion from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const religion = user.religion || 'hindu';
    setUserReligion(religion.toLowerCase());
    setDeityImages(DEITY_IMAGES[religion.toLowerCase()] || DEITY_IMAGES.hindu);
  }, []);

  // Enhanced setActive function with cosmic syncing
  const setActive = (index) => {
    const clampedIndex = Math.max(0, Math.min(index, LAYERS.length - 1));
    if (clampedIndex === activeIndex) return;
    
    setActiveIndex(clampedIndex);

    // Update CSS accent color for cosmic sync
    const layer = LAYERS[clampedIndex];
    document.documentElement.style.setProperty('--product-accent', layer.color);

    // Update background image
    if (backgroundRef.current) {
      gsap.to(backgroundRef.current, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          backgroundRef.current.style.backgroundImage = `url(${layer.backgroundImage})`;
          gsap.to(backgroundRef.current, {
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out'
          });
        }
      });
    }

    // Dispatch custom event for CosmicHero3D sync
    window.dispatchEvent(new CustomEvent('mythai-layer-change', { 
      detail: { 
        index: clampedIndex, 
        color: layer.color, 
        layer: layer.title,
        backgroundImage: layer.backgroundImage
      } 
    }));
  };

  // Handle menu item clicks
  const handleMenuClick = (index) => {
    setActive(index);
    
    // Smoothly scroll to that layer position
    if (scrollTriggerRef.current) {
      const st = scrollTriggerRef.current;
      const progress = index / (LAYERS.length - 1);
      const scrollPos = st.start + (st.end - st.start) * progress;
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Pin the section during scroll with enhanced scrubbing
    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => `+=${window.innerHeight * (LAYERS.length - 0.5)}`,
      pin: true,
      pinSpacing: true,
      scrub: true,
      anticipatePin: 1,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (LAYERS.length - 1));
        setActive(idx);
      },
    });

    scrollTriggerRef.current = st;

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Enhanced card stacking animation with before/after states
  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      if (!card) return;

      // Remove all state classes
      card.classList.remove('is-active', 'is-before', 'is-after');

      if (index === activeIndex) {
        // Active card - front and center
        card.classList.add('is-active');
        gsap.to(card, {
          opacity: 1,
          scale: 1,
          z: 0,
          rotationY: 0,
          duration: 0.6,
          ease: 'power2.out',
        });
      } else if (index === activeIndex - 1) {
        // Card just before - slightly behind
        card.classList.add('is-before');
        gsap.to(card, {
          opacity: 0.4,
          scale: 0.92,
          z: -80,
          rotationY: 5,
          duration: 0.6,
          ease: 'power2.out',
        });
      } else if (index === activeIndex + 1) {
        // Card just after - slightly ahead
        card.classList.add('is-after');
        gsap.to(card, {
          opacity: 0.2,
          scale: 0.88,
          z: 80,
          rotationY: -5,
          duration: 0.6,
          ease: 'power2.out',
        });
      } else if (index < activeIndex - 1) {
        // Cards further behind - stack deeper
        card.classList.add('is-after');
        gsap.to(card, {
          opacity: 0.1,
          scale: 0.85,
          z: -150,
          rotationY: 10,
          duration: 0.6,
          ease: 'power2.out',
        });
      } else {
        // Cards further ahead - hidden
        card.classList.add('is-before');
        gsap.to(card, {
          opacity: 0,
          scale: 0.8,
          z: 150,
          rotationY: -10,
          duration: 0.6,
          ease: 'power2.out',
        });
      }
    });

    // Update menu items active state
    menuItemsRef.current.forEach((item, i) => {
      if (item) {
        item.classList.toggle('is-active', i === activeIndex);
      }
    });

    // Update info panels active state
    infosRef.current.forEach((info, i) => {
      if (info) {
        info.classList.toggle('is-active', i === activeIndex);
      }
    });
  }, [activeIndex]);

  return (
    <section ref={sectionRef} className="product-scroll">
      {/* Dynamic Background */}
      <div 
        ref={backgroundRef}
        className="product-scroll__background"
        style={{ backgroundImage: `url(${LAYERS[0].backgroundImage})` }}
      />
      
      <div className="product-scroll__inner">
        {/* LEFT: VERTICAL MENU */}
        <aside className="product-scroll__menu">
          <p className="menu-label">Scroll to explore layers</p>
          <ul className="menu-list">
            {LAYERS.map((layer, index) => (
              <li
                key={layer.id}
                ref={(el) => (menuItemsRef.current[index] = el)}
                className={`menu-item ${activeIndex === layer.id ? 'is-active' : ''}`}
                data-index={layer.id}
                onClick={() => handleMenuClick(index)}
                style={{ cursor: 'pointer' }}
              >
                <span className="menu-caption">{layer.caption}</span>
                <span className="menu-title">{layer.title}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* CENTER: CARD STACK WITH DEITY IMAGES */}
        <div className="product-scroll__cards">
          <div className="card-stack">
            {LAYERS.map((layer, index) => {
              const deity = deityImages[index % deityImages.length];
              return (
                <article
                  key={layer.id}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className={`layer-card ${activeIndex === layer.id ? 'is-active' : ''}`}
                  data-index={layer.id}
                >
                  <div className="layer-card__frame">
                    <div className="layer-card__inner">
                      {/* Deity Image */}
                      <div className="deity-showcase">
                        {deity?.image && (
                          <img 
                            src={deity.image} 
                            alt={deity.name}
                            className="deity-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                        )}
                        <div className="deity-emoji" style={{ display: deity?.image ? 'none' : 'block' }}>
                          {deity?.emoji || '✨'}
                        </div>
                        <div className="deity-name">{deity?.name || 'Divine Being'}</div>
                        <div className="deity-layer">{layer.title}</div>
                      </div>
                    </div>
                    <div className="layer-card__border"></div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* RIGHT: INFO TEXT */}
        <aside className="product-scroll__info">
          {LAYERS.map((layer, index) => (
            <div
              key={layer.id}
              ref={(el) => (infosRef.current[index] = el)}
              className={`layer-info ${activeIndex === layer.id ? 'is-active' : ''}`}
              data-index={layer.id}
            >
              <h3 className="layer-info__title">{layer.infoTitle}</h3>
              <p className="layer-info__body">{layer.description}</p>
              <button className="layer-info__btn">{layer.cta}</button>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
};

export default ProductScroll;
