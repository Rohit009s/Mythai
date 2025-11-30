# Setup Cosmic Background Images

## Quick Setup

I've created a divine cosmic background animation for your MythAI app. Here's how to complete the setup:

### Step 1: Download Cosmic Images

Based on the images you shared, save them to `frontend/public/` with these names:

1. Save the purple/cyan cosmic sphere as: `frontend/public/cosmic1.jpg`
2. Save the orange/blue cosmic burst as: `frontend/public/cosmic2.jpg`
3. Save the golden star cluster as: `frontend/public/cosmic3.jpg`
4. Save the rainbow cosmic explosion as: `frontend/public/cosmic4.jpg`
5. Save the orange/blue cosmic rays as: `frontend/public/cosmic5.jpg`

### Step 2: That's It!

The cosmic background is already integrated into your app. It will:

✨ **Smoothly fade** between images every 8 seconds
✨ **Slowly zoom** in and out for a meditative effect
✨ **Twinkle** with subtle star particles
✨ **Create** a divine, cosmic atmosphere

### Animation Features

- **Transition Time:** 3 seconds (smooth fade)
- **Display Time:** 8 seconds per image
- **Zoom Animation:** 20 seconds (slow, gentle)
- **Effect:** Divine, meditative, cosmic power

### Files Created

1. `frontend/src/CosmicBackground.jsx` - React component
2. `frontend/src/CosmicBackground.css` - Smooth animations
3. Updated `frontend/src/App.jsx` - Integrated component
4. Updated `frontend/src/App.css` - Background styling

### Test It

```bash
cd frontend
npm run dev
```

Visit http://localhost:5173 and you'll see the beautiful cosmic background flowing smoothly!

### Customization

Want to adjust the timing? Edit `frontend/src/CosmicBackground.jsx`:

```javascript
// Change image every X seconds
const interval = setInterval(() => {
  setCurrentImage((prev) => (prev + 1) % cosmicImages.length);
}, 8000); // Change this number (in milliseconds)
```

Want slower zoom? Edit `frontend/src/CosmicBackground.css`:

```css
.cosmic-layer.active {
  animation: slowZoom 20s ease-in-out infinite alternate;
  /* Change 20s to 30s or 40s for even slower */
}
```

## Result

Your app will have a stunning, divine cosmic background that:
- Flows smoothly like the universe itself
- Creates a meditative, spiritual atmosphere
- Enhances the divine connection with the deities
- Looks absolutely breathtaking! 🌌✨
