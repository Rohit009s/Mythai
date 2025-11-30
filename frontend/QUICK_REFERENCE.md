# ProductScroll - Quick Reference Card

## 🚀 Quick Start

```jsx
import ProductScroll from './ProductScroll';

function App() {
  return <ProductScroll />;
}
```

## 🎨 Customize Layers

```javascript
// In ProductScroll.jsx
const LAYERS = [
  {
    id: 0,
    caption: '01 · Your Caption',
    title: 'Your Title',
    infoTitle: 'Full Title',
    description: 'Your description...',
    cta: 'Button Text',
    video: '/your-image.jpg',
    color: '#5542FF',
  },
];
```

## 🔗 Listen for Changes

```javascript
useEffect(() => {
  const handleLayerChange = (event) => {
    const { index, color, layer } = event.detail;
    console.log(`Layer ${index}: ${layer} (${color})`);
  };

  window.addEventListener('mythai-layer-change', handleLayerChange);
  return () => window.removeEventListener('mythai-layer-change', handleLayerChange);
}, []);
```

## 🎬 Card States

```javascript
Active:  opacity: 1,   scale: 1,    z: 0
Before:  opacity: 0.4, scale: 0.92, z: -80px
After:   opacity: 0.2, scale: 0.88, z: 80px
Hidden:  opacity: 0,   scale: 0.8,  z: ±150px
```

## 🎨 Layer Colors

```javascript
Layer 1: #5542FF  // Deep Purple
Layer 2: #7B61FF  // Purple
Layer 3: #9B80FF  // Light Purple
Layer 4: #BB9FFF  // Lighter Purple
Layer 5: #DBBEFF  // Lightest Purple
```

## 🎯 CSS Variables

```css
--product-accent: #5542ff; /* Dynamic per layer */
--product-glow: rgba(85, 66, 255, 0.3);
```

## 🔧 Adjust Animations

```javascript
// In ProductScroll.jsx useEffect
duration: 0.6, // Animation speed
ease: 'power2.out', // Easing function
```

## 📱 Responsive Breakpoints

```css
Desktop:  > 1024px  (3-column grid)
Tablet:   768-1024px (stacked + horizontal menu)
Mobile:   < 768px   (single column)
```

## 🎮 User Interactions

- **Scroll**: Scrub through layers
- **Click Menu**: Jump to layer
- **Hover Menu**: Preview animation
- **Click Button**: Ripple effect

## 🐛 Common Issues

### Cards not animating?
```bash
npm install gsap
```

### Menu clicks not working?
Check refs are set and scrollTriggerRef.current exists

### Colors not syncing?
Verify CSS variable in :root and layer colors in LAYERS array

## 📚 Documentation

- `PRODUCT_SCROLL_ENHANCED.md` - Technical details
- `PRODUCT_SCROLL_USAGE.md` - User guide
- `COSMIC_HERO_SYNC_EXAMPLE.md` - Three.js integration
- `BEFORE_AFTER_COMPARISON.md` - What changed
- `GSAP_SCROLL_INTEGRATION_COMPLETE.md` - Summary

## 🎉 Features

✅ 3D card stacking
✅ Cosmic color sync
✅ Interactive menu
✅ Custom events
✅ Smooth 60fps
✅ Responsive design
✅ Production ready

## 🚀 Next Steps

1. Replace images with videos
2. Sync with Three.js hero
3. Add sound effects
4. Implement keyboard nav
5. Add touch gestures

---

**Need more?** Check the full documentation files!
