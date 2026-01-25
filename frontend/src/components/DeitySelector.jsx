import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as THREE from 'three'
import { GlowCard } from './ui/glow-card'
import './DeitySelector.css'

// Deity data mapped to religions with categories and images
const DEITIES = {
  

  hinduism: [
    
    { id: 'krishna', name: 'Krishna', description: 'Divine teacher of the Bhagavad Gita', category: 'Supreme', image: '/deities/krishna.png' },
    { id: 'shiva', name: 'Shiva', description: 'The transformer, lord of meditation', category: 'Trinity', image: '/deities/shiva.png' },
    { id: 'vishnu', name: 'Vishnu', description: 'The preserver, protector of dharma', category: 'Trinity', image: '/deities/vishnu.png' },
    { id: 'ganesha', name: 'Ganesha', description: 'Remover of obstacles', category: 'Popular', image: '/deities/ganesha.png' },
    { id: 'hanuman', name: 'Hanuman', description: 'Symbol of devotion and strength', category: 'Popular', image: '/deities/hanuman.png' },
    { id: 'rama', name: 'Rama', description: 'Ideal king and warrior', category: 'Avatar', image: '/deities/Rama.jpg' },
    { id: 'lakshmi', name: 'Lakshmi', description: 'Goddess of wealth and prosperity', category: 'Goddess', image: '/deities/lakshmi.png' }
  ],
  greek: [
    { id: 'zeus', name: 'Zeus', description: 'King of the gods', category: 'Olympian', image: '/deities/zeus.png' },
    { id: 'athena', name: 'Athena', description: 'Goddess of wisdom', category: 'Olympian', image: '/deities/athena.png' },
    { id: 'apollo', name: 'Apollo', description: 'God of music and prophecy', category: 'Olympian', image: '/deities/apollo.png' },
    { id: 'poseidon', name: 'Poseidon', description: 'God of the sea', category: 'Olympian', image: '/deities/aphrodite.png' },
    { id: 'hera', name: 'Hera', description: 'Queen of the gods', category: 'Olympian', image: '/deities/hera.png' }
  ],
  norse: [
    { id: 'odin', name: 'Odin', description: 'All-father, god of wisdom', category: 'Aesir', image: '/deities/odin.png' },
    { id: 'thor', name: 'Thor', description: 'God of thunder', category: 'Aesir', image: '/deities/thor.png' },
    { id: 'loki', name: 'Loki', description: 'Trickster god', category: 'Aesir', image: '/deities/loki.png' },
    { id: 'freyja', name: 'Freyja', description: 'Goddess of love', category: 'Vanir', image: '/deities/freyja.png' }
  ],
  egyptian: [
    { id: 'ra', name: 'Ra', description: 'Sun god, creator of life', category: 'Major', image: '/deities/RA(RE).png' },
    { id: 'isis', name: 'Isis', description: 'Goddess of magic', category: 'Major', image: '/deities/isis.png' },
    { id: 'anubis', name: 'Anubis', description: 'God of the afterlife', category: 'Major', image: '/deities/anubis.png' }
  ],
  christianity: [
    { id: 'jesus', name: 'Jesus Christ', description: 'Son of God, teacher of love', category: 'Divine', image: '/deities/JESUS.png' }
  ],
  islam: [
    { id: 'prophet_muhammad', name: 'Prophet Muhammad', description: 'Final messenger of God', category: 'Prophet', image: '/deities/Allah.png' }
  ]
}

// SVG Filter for Liquid Glass
const LiquidGlassFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter
        id="deity-liquid-glass"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        colorInterpolationFilters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.05 0.05"
          numOctaves="1"
          seed="3"
          result="turbulence"
        />
        <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurredNoise"
          scale="50"
          xChannelSelector="R"
          yChannelSelector="B"
          result="displaced"
        />
        <feGaussianBlur in="displaced" stdDeviation="3" result="finalBlur" />
        <feComposite in="finalBlur" in2="finalBlur" operator="over" />
      </filter>
    </defs>
  </svg>
)

export default function DeitySelector({ user, onSelect, onLogout, apiUrl }) {
  const [deities, setDeities] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showSettings, setShowSettings] = useState(false)
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const animationRef = useRef(null)
  const navigate = useNavigate()

  // Function to determine glow color based on deity category/religion
  const getDeityGlowColor = (category) => {
    const colorMap = {
      'Supreme': 'gold',
      'Trinity': 'purple',
      'Popular': 'blue',
      'Avatar': 'cyan',
      'Goddess': 'purple',
      'Olympian': 'blue',
      'Aesir': 'cyan',
      'Vanir': 'green',
      'Major': 'orange',
      'Divine': 'gold',
      'Prophet': 'green'
    }
    return colorMap[category] || 'blue'
  }

  const handleDeitySelect = (deity) => {
    onSelect(deity) // Set the selected deity in parent component
    navigate('/chat') // Navigate to chat page
  }

  const handleVoiceSelect = (deity) => {
    onSelect(deity) // Set the selected deity in parent component
    navigate('/voice') // Navigate to voice conversation page
  }

  useEffect(() => {
    // Get deities for user's religion
    let userDeities = []
    let religionCategories = []
    
    if (user.religion === 'all') {
      // Show all deities grouped by religion
      userDeities = Object.values(DEITIES).flat()
      religionCategories = ['all', ...Object.keys(DEITIES)]
    } else {
      userDeities = DEITIES[user.religion] || []
      religionCategories = ['all']
    }
    
    setDeities(userDeities)
    setCategories(religionCategories)
  }, [user.religion])

  // Create star field background
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    camera.position.z = 50

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Create stars
    const starCount = 3000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200

      const color = new THREE.Color()
      color.setHSL(Math.random() * 0.2 + 0.5, 0.5, 0.8)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = Math.random() * 1.5 + 0.5
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(time * 0.1 + position.y) * 0.5;
          pos.y += cos(time * 0.08 + position.x) * 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float time;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float twinkle = sin(time * 3.0 + gl_FragCoord.x * 0.1) * 0.3 + 0.7;
          float opacity = (1.0 - smoothstep(0.0, 0.5, dist)) * twinkle;
          gl_FragColor = vec4(vColor, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const stars = new THREE.Points(geometry, material)
    scene.add(stars)
    starsRef.current.push(stars)

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      const time = Date.now() * 0.001

      stars.material.uniforms.time.value = time
      stars.rotation.y = time * 0.02

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  // Filter deities by religion category
  const filteredDeities = selectedCategory === 'all' 
    ? deities 
    : DEITIES[selectedCategory] || []
  
  // Group deities by religion for display
  const groupedDeities = {}
  filteredDeities.forEach(deity => {
    const religion = Object.keys(DEITIES).find(rel => 
      DEITIES[rel].some(d => d.id === deity.id)
    )
    if (religion) {
      if (!groupedDeities[religion]) {
        groupedDeities[religion] = []
      }
      groupedDeities[religion].push(deity)
    }
  })

  return (
    <div className="deity-selector-space">
      {/* Fixed Video Background */}
      <div className="video-background-fixed">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="background-video"
        >
          <source src="/videos/homevideo-bg.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>
      </div>
      
      <canvas ref={canvasRef} className="deity-canvas" />
      <LiquidGlassFilter />

      <div className="deity-header-glass">
        <div className="header-content">
          <h1 className="deity-title">
            Welcome, {user.name} 
            <img src="/icons/pngegg.png" alt="spiritual icon" className="welcome-icon" />
          </h1>
          <p className="deity-subtitle">Choose your divine guide for spiritual conversations</p>
        </div>
      </div>

      {categories.length > 2 && (
        <div className="category-filter-glass">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn-glass ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div className="deity-content-wrapper">
        {filteredDeities.length === 0 ? (
          <div className="no-deities-glass">
            <p>No deities available</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedDeities).map(([religion, religionDeities]) => (
              <div key={religion} className="religion-section">
                <h2 className="religion-section-title">
                  {religion.charAt(0).toUpperCase() + religion.slice(1)} Deities
                </h2>
                <div className="deity-grid-bazaar">
                  {religionDeities.map(deity => (
                    <GlowCard
                      key={deity.id}
                      glowColor={getDeityGlowColor(deity.category)}
                      customSize={true}
                      enableLiquidGlass={true}
                      intensity={1.2}
                      className="deity-card-enhanced"
                    >
                      <div className="deity-image-wrapper-bazaar">
                        <img 
                          src={deity.image} 
                          alt={deity.name}
                          className="deity-image-bazaar"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <div className="deity-image-overlay"></div>
                        <div className="deity-hover-effect"></div>
                      </div>
                      <div className="deity-info-bazaar">
                        <h3 className="deity-name-bazaar">{deity.name}</h3>
                        <p className="deity-desc-bazaar">{deity.description}</p>
                        <div className="deity-footer-bazaar">
                          <span className="deity-category-badge">{deity.category}</span>
                          <div className="deity-action-buttons">
                            <button 
                              className="deity-action-btn text-mode"
                              onClick={() => handleDeitySelect(deity)}
                              title="Text Conversation"
                            >
                              💬 Chat
                            </button>
                            <button 
                              className="deity-action-btn voice-mode"
                              onClick={() => handleVoiceSelect(deity)}
                              title="Voice Conversation"
                            >
                              🎤 Voice
                            </button>
                          </div>
                        </div>
                      </div>
                    </GlowCard>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-settings"
              onClick={() => setShowSettings(false)}
            >
              ×
            </button>
            <h3>Settings</h3>
            <div className="settings-content">
              <button onClick={() => navigate('/settings')}>
                🔧 Full Settings
              </button>
              <button onClick={() => navigate('/history')}>
                📚 Chat History
              </button>
              <button onClick={onLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
