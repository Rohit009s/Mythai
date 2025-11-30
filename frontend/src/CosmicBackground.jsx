import React, { useEffect, useState } from 'react';
import './CosmicBackground.css';

const CosmicBackground = () => {
  const [currentImage, setCurrentImage] = useState(0);

  // Array of cosmic/divine power images
  const cosmicImages = [
    '/cosmic1.jpg',
    '/cosmic2.jpg',
    '/cosmic3.jpg',
    '/cosmic4.jpg',
    '/cosmic5.jpg'
  ];

  useEffect(() => {
    // Change image every 8 seconds for slow, smooth transition
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % cosmicImages.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cosmic-background">
      {cosmicImages.map((image, index) => (
        <div
          key={index}
          className={`cosmic-layer ${index === currentImage ? 'active' : ''} ${
            index === (currentImage - 1 + cosmicImages.length) % cosmicImages.length ? 'previous' : ''
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}
      <div className="cosmic-overlay" />
    </div>
  );
};

export default CosmicBackground;
