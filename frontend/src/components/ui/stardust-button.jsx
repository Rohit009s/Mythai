import React from 'react';

export const StardustButton = ({
  children = "Button",
  onClick,
  className = "",
  variant = "default", // default, call, voice, send, save
  disabled = false,
  icon: Icon,
  ...props
}) => {
  // Color variants for different button types
  const variants = {
    default: {
      '--white': '#e6f3ff',
      '--bg': '#0a1929',
      '--primary': '#81d8ff',
      '--secondary': '#40b4ff',
    },
    call: {
      '--white': '#e6ffe6',
      '--bg': '#0a2910',
      '--primary': '#81ff81',
      '--secondary': '#40ff40',
    },
    voice: {
      '--white': '#ffe6e6',
      '--bg': '#290a0a',
      '--primary': '#ff8181',
      '--secondary': '#ff4040',
    },
    send: {
      '--white': '#fff3e6',
      '--bg': '#29200a',
      '--primary': '#ffd881',
      '--secondary': '#ffb440',
    },
    save: {
      '--white': '#f3e6ff',
      '--bg': '#200a29',
      '--primary': '#d881ff',
      '--secondary': '#b440ff',
    }
  };

  const variantColors = variants[variant] || variants.default;

  const buttonStyle = {
    ...variantColors,
    '--radius': '100px',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 0,
    position: 'relative',
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg)',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    boxShadow: disabled ? 'none' : `
      inset 0 0.3rem 0.9rem rgba(255, 255, 255, 0.3),
      inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
      inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.5),
      0 3rem 3rem rgba(0, 0, 0, 0.3),
      0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)
    `,
  };

  const wrapStyle = {
    fontSize: '16px',
    fontWeight: 500,
    color: `var(--primary)`,
    padding: '12px 24px',
    borderRadius: 'inherit',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const textStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    transition: 'all 0.2s ease',
    transform: 'translateY(1px)',
    maskImage: 'linear-gradient(to bottom, var(--primary) 40%, transparent)',
  };

  const beforeAfterStyles = `
    .stardust-button .wrap::before,
    .stardust-button .wrap::after {
      content: "";
      position: absolute;
      transition: all 0.3s ease;
    }
    
    .stardust-button .wrap::before {
      left: -15%;
      right: -15%;
      bottom: 25%;
      top: -100%;
      border-radius: 50%;
      background-color: var(--secondary);
      opacity: 0.15;
    }
    
    .stardust-button .wrap::after {
      left: 6%;
      right: 6%;
      top: 12%;
      bottom: 40%;
      border-radius: 22px 22px 0 0;
      box-shadow: inset 0 10px 8px -10px var(--primary);
      background: linear-gradient(
        180deg,
        var(--secondary) 0%,
        rgba(0, 0, 0, 0) 50%,
        rgba(0, 0, 0, 0) 100%
      );
      opacity: 0.25;
    }
    
    .stardust-button .wrap .text span:nth-child(2) {
      display: none;
    }
    
    .stardust-button:not(:disabled):hover .wrap .text span:nth-child(1) {
      display: none;
    }
    
    .stardust-button:not(:disabled):hover .wrap .text span:nth-child(2) {
      display: inline-block;
    }
    
    .stardust-button:not(:disabled):hover {
      box-shadow:
        inset 0 0.3rem 0.5rem var(--primary),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
        inset 0 -0.4rem 0.9rem var(--secondary),
        0 3rem 3rem rgba(0, 0, 0, 0.3),
        0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
    }
    
    .stardust-button:not(:disabled):hover .wrap::before {
      transform: translateY(-5%);
      opacity: 0.2;
    }
    
    .stardust-button:not(:disabled):hover .wrap::after {
      opacity: 0.4;
      transform: translateY(5%);
    }
    
    .stardust-button:not(:disabled):hover .wrap .text {
      transform: translateY(-2px);
    }
    
    .stardust-button:not(:disabled):active {
      transform: translateY(2px);
      box-shadow:
        inset 0 0.3rem 0.5rem var(--primary),
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8),
        inset 0 -0.4rem 0.9rem var(--secondary),
        0 2rem 2rem rgba(0, 0, 0, 0.3),
        0 0.5rem 0.5rem -0.3rem rgba(0, 0, 0, 0.8);
    }
  `;

  return (
    <>
      <style>{beforeAfterStyles}</style>
      <button
        className={`stardust-button ${className}`}
        style={buttonStyle}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        <div className="wrap" style={wrapStyle}>
          <div className="text" style={textStyle}>
            <span>✧</span>
            <span>✦</span>
            {Icon && <Icon size={16} />}
            {children}
          </div>
        </div>
      </button>
    </>
  );
};

// Specialized button variants
export const CallStardustButton = (props) => (
  <StardustButton variant="call" {...props} />
);

export const VoiceStardustButton = (props) => (
  <StardustButton variant="voice" {...props} />
);

export const SendStardustButton = (props) => (
  <StardustButton variant="send" {...props} />
);

export const SaveStardustButton = (props) => (
  <StardustButton variant="save" {...props} />
);

// Compact versions for smaller spaces
export const CompactStardustButton = ({ children, ...props }) => {
  const compactStyle = {
    fontSize: '14px',
    padding: '8px 16px',
  };
  
  return (
    <StardustButton 
      {...props}
      className={`compact-stardust ${props.className || ''}`}
    >
      <style>{`
        .compact-stardust .wrap {
          font-size: 14px !important;
          padding: 8px 16px !important;
        }
      `}</style>
      {children}
    </StardustButton>
  );
};