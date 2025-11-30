# Syncing ProductScroll with Three.js Cosmic Hero

## 🎯 Overview

This guide shows how to sync the ProductScroll layer changes with a Three.js cosmic hero scene (rotating orb, particles, etc.).

## 📝 Example Implementation

### Option 1: Update Existing CosmicHero Component

If you have a Three.js hero component, add this event listener:

```javascript
// In your CosmicHero3D.jsx or similar
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const CosmicHero3D = () => {
  const orbMaterialRef = useRef(null);
  const particlesMaterialRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Your existing Three.js setup...
    
    // Listen for ProductScroll layer changes
    const handleLayerChange = (event) => {
      const { index, color, layer } = event.detail;
      
      console.log(`🌌 Layer changed to: ${layer} (${color})`);
      
      // 1. Update orb color
      if (orbMaterialRef.current) {
        gsap.to(orbMaterialRef.current.color, {
          r: new THREE.Color(color).r,
          g: new THREE.Color(color).g,
          b: new THREE.Color(color).b,
          duration: 1,
          ease: 'power2.out'
        });
      }
      
      // 2. Update particle colors
      if (particlesMaterialRef.current) {
        gsap.to(particlesMaterialRef.current.color, {
          r: new THREE.Color(color).r,
          g: new THREE.Color(color).g,
          b: new THREE.Color(color).b,
          duration: 1,
          ease: 'power2.out'
        });
      }
      
      // 3. Animate camera position
      if (cameraRef.current) {
        gsap.to(cameraRef.current.position, {
          z: 5 + index * 0.3,
          y: index * 0.2,
          duration: 1.5,
          ease: 'power2.inOut'
        });
      }
      
      // 4. Update orb intensity/scale
      if (orbMaterialRef.current) {
        gsap.to(orbMaterialRef.current, {
          emissiveIntensity: 0.5 + index * 0.1,
          duration: 1,
          ease: 'power2.out'
        });
      }
    };

    window.addEventListener('mythai-layer-change', handleLayerChange);
    
    return () => {
      window.removeEventListener('mythai-layer-change', handleLayerChange);
    };
  }, []);

  return (
    <div className="cosmic-hero">
      <canvas ref={canvasRef} />
    </div>
  );
};
```

### Option 2: Vanilla JavaScript (main.js)

If you're using vanilla JS for Three.js:

```javascript
// main.js
import * as THREE from 'three';
import gsap from 'gsap';

// Your Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });

// Create orb
const orbGeometry = new THREE.SphereGeometry(1, 64, 64);
const orbMaterial = new THREE.MeshStandardMaterial({
  color: 0x5542ff,
  emissive: 0x5542ff,
  emissiveIntensity: 0.5,
  metalness: 0.8,
  roughness: 0.2
});
const orb = new THREE.Mesh(orbGeometry, orbMaterial);
scene.add(orb);

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 1800;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
  color: 0x5542ff,
  size: 0.05,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Listen for layer changes
window.addEventListener('mythai-layer-change', (event) => {
  const { index, color, layer } = event.detail;
  
  console.log(`🌌 Cosmic hero syncing to: ${layer}`);
  
  // Animate orb color
  gsap.to(orbMaterial.color, {
    r: new THREE.Color(color).r,
    g: new THREE.Color(color).g,
    b: new THREE.Color(color).b,
    duration: 1,
    ease: 'power2.out'
  });
  
  gsap.to(orbMaterial.emissive, {
    r: new THREE.Color(color).r,
    g: new THREE.Color(color).g,
    b: new THREE.Color(color).b,
    duration: 1,
    ease: 'power2.out'
  });
  
  // Animate particles
  gsap.to(particlesMaterial.color, {
    r: new THREE.Color(color).r,
    g: new THREE.Color(color).g,
    b: new THREE.Color(color).b,
    duration: 1,
    ease: 'power2.out'
  });
  
  // Animate camera
  gsap.to(camera.position, {
    z: 5 + index * 0.3,
    duration: 1.5,
    ease: 'power2.inOut'
  });
  
  // Animate orb rotation speed
  gsap.to(orb.rotation, {
    y: orb.rotation.y + Math.PI * 0.5,
    duration: 1,
    ease: 'power2.out'
  });
  
  // Pulse effect
  gsap.to(orb.scale, {
    x: 1.1,
    y: 1.1,
    z: 1.1,
    duration: 0.3,
    ease: 'power2.out',
    yoyo: true,
    repeat: 1
  });
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  orb.rotation.y += 0.005;
  particles.rotation.y += 0.001;
  
  renderer.render(scene, camera);
}

animate();
```

## 🎨 Advanced Sync Ideas

### 1. Background Color Sync
```javascript
window.addEventListener('mythai-layer-change', (event) => {
  const { color } = event.detail;
  
  // Update scene background
  gsap.to(scene.fog.color, {
    r: new THREE.Color(color).r,
    g: new THREE.Color(color).g,
    b: new THREE.Color(color).b,
    duration: 2,
    ease: 'power2.inOut'
  });
});
```

### 2. Particle Speed Sync
```javascript
let particleSpeed = 0.001;

window.addEventListener('mythai-layer-change', (event) => {
  const { index } = event.detail;
  
  // Increase speed with each layer
  particleSpeed = 0.001 + (index * 0.0005);
});

function animate() {
  particles.rotation.y += particleSpeed;
  // ...
}
```

### 3. Orb Shape Morph
```javascript
window.addEventListener('mythai-layer-change', (event) => {
  const { index } = event.detail;
  
  // Morph orb shape based on layer
  const shapes = [
    { radius: 1, detail: 64 },      // Sphere
    { radius: 1.2, detail: 32 },    // Low-poly
    { radius: 0.8, detail: 128 },   // Smooth
    { radius: 1, detail: 16 },      // Geometric
    { radius: 1.5, detail: 64 }     // Large
  ];
  
  const shape = shapes[index];
  
  gsap.to(orb.scale, {
    x: shape.radius,
    y: shape.radius,
    z: shape.radius,
    duration: 1,
    ease: 'elastic.out(1, 0.5)'
  });
});
```

### 4. Energy Ring Sync
```javascript
// Create energy ring
const ringGeometry = new THREE.TorusGeometry(2, 0.05, 16, 100);
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x5542ff,
  transparent: true,
  opacity: 0.6
});
const ring = new THREE.Mesh(ringGeometry, ringMaterial);
scene.add(ring);

window.addEventListener('mythai-layer-change', (event) => {
  const { index, color } = event.detail;
  
  // Update ring color
  gsap.to(ringMaterial.color, {
    r: new THREE.Color(color).r,
    g: new THREE.Color(color).g,
    b: new THREE.Color(color).b,
    duration: 1
  });
  
  // Spin ring faster
  gsap.to(ring.rotation, {
    z: ring.rotation.z + Math.PI * (index + 1),
    duration: 2,
    ease: 'power2.out'
  });
});
```

### 5. Cosmic Background Sync
```javascript
// In CosmicBackground.jsx
useEffect(() => {
  const handleLayerChange = (event) => {
    const { index, color } = event.detail;
    
    // Update background flow speed
    setFlowSpeed(0.5 + index * 0.2);
    
    // Update background tint
    document.documentElement.style.setProperty('--cosmic-tint', color);
  };

  window.addEventListener('mythai-layer-change', handleLayerChange);
  
  return () => {
    window.removeEventListener('mythai-layer-change', handleLayerChange);
  };
}, []);
```

## 🎬 Complete Example

Here's a full working example combining everything:

```javascript
// CosmicHeroSynced.jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

const CosmicHeroSynced = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const orbRef = useRef(null);
  const particlesRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 5;
    
    // Create orb
    const orbGeometry = new THREE.SphereGeometry(1, 64, 64);
    const orbMaterial = new THREE.MeshStandardMaterial({
      color: 0x5542ff,
      emissive: 0x5542ff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orb);
    
    // Add lights
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    // Store refs
    sceneRef.current = scene;
    orbRef.current = orb;
    cameraRef.current = camera;
    
    // Animation loop
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      orb.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();
    
    // Layer change handler
    const handleLayerChange = (event) => {
      const { index, color } = event.detail;
      
      // Animate orb
      gsap.to(orbMaterial.color, {
        r: new THREE.Color(color).r,
        g: new THREE.Color(color).g,
        b: new THREE.Color(color).b,
        duration: 1
      });
      
      gsap.to(orbMaterial.emissive, {
        r: new THREE.Color(color).r,
        g: new THREE.Color(color).g,
        b: new THREE.Color(color).b,
        duration: 1
      });
      
      // Camera movement
      gsap.to(camera.position, {
        z: 5 + index * 0.3,
        duration: 1.5,
        ease: 'power2.inOut'
      });
      
      // Pulse effect
      gsap.to(orb.scale, {
        x: 1.1, y: 1.1, z: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1
      });
    };
    
    window.addEventListener('mythai-layer-change', handleLayerChange);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mythai-layer-change', handleLayerChange);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="cosmic-hero-canvas" />;
};

export default CosmicHeroSynced;
```

## 🎉 Result

Now your Three.js cosmic hero will:
- ✅ Change colors based on active layer
- ✅ Animate camera position smoothly
- ✅ Pulse and react to layer changes
- ✅ Sync particle effects
- ✅ Create a cohesive cosmic experience

## 🚀 Next Steps

1. Add more complex animations
2. Sync sound effects with layer changes
3. Add touch/drag interactions
4. Create layer-specific 3D models
5. Implement WebGL shaders for advanced effects

---

**Pro Tip**: Test the sync by scrolling through ProductScroll and watching your Three.js scene react in real-time!
