import { useEffect, useState } from 'react';
import gsap from 'gsap';
import './PageTransition.css';

const PageTransition = ({ isActive, onComplete }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsAnimating(true);
      animateTransition();
    }
  }, [isActive]);

  const animateTransition = () => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        if (onComplete) onComplete();
      }
    });

    // Frame animation
    tl.to('.frame__outer', {
      scaleX: 1,
      scaleY: 1,
      duration: 0.8,
      ease: 'power3.inOut'
    })
    .to('.frame__mask', {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 0.6,
      ease: 'power2.inOut'
    }, '-=0.4')
    .to('.frame__content', {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.3')
    // Logo animation
    .from('.transition__logo-top', {
      y: -50,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.3')
    .from('.transition__logo-bottom', {
      y: 50,
      opacity: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.6')
    // Hold
    .to({}, { duration: 0.5 })
    // Exit animation
    .to('.frame__content', {
      opacity: 0,
      scale: 0.95,
      duration: 0.4,
      ease: 'power2.in'
    })
    .to('.frame__outer', {
      scaleX: 0,
      scaleY: 0,
      duration: 0.6,
      ease: 'power3.inOut'
    }, '-=0.2');
  };

  if (!isActive && !isAnimating) return null;

  return (
    <div className="page-transition">
      <div className="frame">
        <div className="frame__outer"></div>
        <div className="frame__mask">
          <div className="frame__content">
            <div className="transition__inner">
              <div className="transition__logo">
                {/* MythAI Logo - Top Part */}
                <div className="transition__logo-top">
                  <svg viewBox="0 0 200 60" className="logo-svg">
                    <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#5542FF" />
                        <stop offset="100%" stopColor="#B28EF2" />
                      </linearGradient>
                    </defs>
                    <text 
                      x="100" 
                      y="40" 
                      textAnchor="middle" 
                      fill="url(#logoGradient)"
                      fontSize="36"
                      fontWeight="900"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      MYTH
                    </text>
                  </svg>
                </div>
                
                {/* MythAI Logo - Bottom Part */}
                <div className="transition__logo-bottom">
                  <svg viewBox="0 0 200 60" className="logo-svg">
                    <text 
                      x="100" 
                      y="40" 
                      textAnchor="middle" 
                      fill="#EDFF66"
                      fontSize="36"
                      fontWeight="900"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      AI
                    </text>
                  </svg>
                </div>
              </div>
              
              {/* Cosmic particles */}
              <div className="transition__particles">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 3}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageTransition;
