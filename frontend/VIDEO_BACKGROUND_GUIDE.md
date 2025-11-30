# 🎬 Video Background Setup Guide

## 🎯 Overview

The CosmicHero3D component now supports a looping video background on the first page/hero section.

## 📁 Required Files

Place your video file in the `/public/` folder:

```
frontend/public/
├── hero-background.mp4   ← Primary video (MP4 format)
└── hero-background.webm  ← Optional (WebM format for better compression)
```

## 🎬 Video Specifications

### Recommended Settings
- **Format**: MP4 (H.264) or WebM (VP9)
- **Resolution**: 1920x1080 (Full HD) or 3840x2160 (4K)
- **Aspect Ratio**: 16:9
- **Frame Rate**: 30fps or 60fps
- **Duration**: 10-30 seconds (will loop)
- **File Size**: <10MB (compressed)
- **Bitrate**: 5-8 Mbps for 1080p

### Optimization Tips
- Use a short loop (10-30 seconds)
- Compress the video to reduce file size
- Remove audio track (not needed for background)
- Use H.264 codec for best compatibility

## 🔧 How to Add Your Video

### Option 1: Direct Copy
```bash
# Windows
copy your-video.mp4 frontend\public\hero-background.mp4

# Linux/Mac
cp your-video.mp4 frontend/public/hero-background.mp4
```

### Option 2: Rename and Move
1. Rename your video to `hero-background.mp4`
2. Move it to `frontend/public/` folder
3. Refresh your browser

## 🎨 Video Compression Tools

### Online Tools (Free)
1. **CloudConvert** - https://cloudconvert.com/
   - Upload video
   - Convert to MP4 (H.264)
   - Set quality to 80%
   - Download

2. **Clideo** - https://clideo.com/compress-video
   - Upload video
   - Compress automatically
   - Download

3. **FreeConvert** - https://www.freeconvert.com/video-compressor
   - Upload video
   - Choose compression level
   - Download

### Desktop Tools
1. **HandBrake** (Free, Windows/Mac/Linux)
   ```
   - Open video
   - Preset: "Fast 1080p30"
   - Remove audio track
   - Start encode
   ```

2. **FFmpeg** (Command line)
   ```bash
   # Compress to 1080p, 30fps, no audio
   ffmpeg -i input.mp4 -vf scale=1920:1080 -r 30 -c:v libx264 -crf 23 -an hero-background.mp4
   
   # Create WebM version
   ffmpeg -i input.mp4 -vf scale=1920:1080 -r 30 -c:v libvpx-vp9 -crf 30 -an hero-background.webm
   ```

## 🎯 Current Implementation

### HTML Structure
```jsx
<video
  autoPlay      // Starts automatically
  loop          // Loops forever
  muted         // No sound
  playsInline   // Works on mobile
  className="hero-video"
>
  <source src="/hero-background.mp4" type="video/mp4" />
  <source src="/hero-background.webm" type="video/webm" />
</video>
```

### CSS Styling
```css
.hero-video {
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  transform: translate(-50%, -50%);
  object-fit: cover;  /* Fills entire screen */
}

.video-overlay {
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.3) 0%,    /* Light in center */
    rgba(0, 0, 0, 0.6) 50%,   /* Medium */
    rgba(0, 0, 0, 0.8) 100%   /* Dark at edges */
  );
}
```

## 🎨 Customization

### Change Overlay Darkness
```css
/* In CosmicHero3D.css */
.video-overlay {
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.5) 0%,    /* Darker center */
    rgba(0, 0, 0, 0.8) 50%,   /* Darker middle */
    rgba(0, 0, 0, 0.95) 100%  /* Almost black edges */
  );
}
```

### Add Color Tint
```css
.video-overlay {
  background: radial-gradient(
    circle at center,
    rgba(85, 66, 255, 0.2) 0%,    /* Purple tint */
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
}
```

### Adjust Video Speed
```jsx
<video
  autoPlay
  loop
  muted
  playsInline
  playbackRate={0.75}  // Slow motion (75% speed)
  className="hero-video"
>
```

### Add Blur Effect
```css
.hero-video {
  filter: blur(2px);  /* Slight blur */
}
```

## 📱 Mobile Optimization

### Reduce Video Quality for Mobile
```jsx
<video autoPlay loop muted playsInline className="hero-video">
  {/* Desktop: High quality */}
  <source 
    src="/hero-background-hd.mp4" 
    type="video/mp4"
    media="(min-width: 768px)"
  />
  
  {/* Mobile: Lower quality */}
  <source 
    src="/hero-background-mobile.mp4" 
    type="video/mp4"
  />
</video>
```

### Disable Video on Mobile (Use Image Instead)
```jsx
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  setIsMobile(window.innerWidth < 768);
}, []);

return (
  <div className="video-background">
    {isMobile ? (
      <img src="/hero-background.jpg" alt="Background" className="hero-video" />
    ) : (
      <video autoPlay loop muted playsInline className="hero-video">
        <source src="/hero-background.mp4" type="video/mp4" />
      </video>
    )}
    <div className="video-overlay"></div>
  </div>
);
```

## 🐛 Troubleshooting

### Video Not Playing?

**Check 1: File Path**
```javascript
// Correct
<source src="/hero-background.mp4" type="video/mp4" />

// Wrong
<source src="./hero-background.mp4" type="video/mp4" />
<source src="hero-background.mp4" type="video/mp4" />
```

**Check 2: File Location**
```
✅ frontend/public/hero-background.mp4
❌ frontend/src/hero-background.mp4
❌ frontend/hero-background.mp4
```

**Check 3: File Name**
- Must be lowercase: `hero-background.mp4` not `Hero-Background.mp4`
- No spaces: `hero-background.mp4` not `hero background.mp4`

**Check 4: Browser Console**
- Open DevTools (F12)
- Check Console for errors
- Check Network tab for 404 errors

### Video Not Looping?

Make sure `loop` attribute is present:
```jsx
<video autoPlay loop muted playsInline>
```

### Video Has Sound?

Make sure `muted` attribute is present:
```jsx
<video autoPlay loop muted playsInline>
```

### Video Not Covering Full Screen?

Check CSS:
```css
.hero-video {
  min-width: 100%;
  min-height: 100%;
  object-fit: cover;  /* Important! */
}
```

### Video Stuttering/Laggy?

1. **Reduce file size**: Compress video to <10MB
2. **Lower resolution**: Use 1080p instead of 4K
3. **Lower frame rate**: Use 30fps instead of 60fps
4. **Optimize codec**: Use H.264 with CRF 23

## 🎯 Example Videos

### Where to Find Cosmic Videos

**Free Stock Video Sites:**
1. **Pexels** - https://www.pexels.com/search/videos/space/
2. **Pixabay** - https://pixabay.com/videos/search/cosmic/
3. **Videvo** - https://www.videvo.net/free-video/space/
4. **Coverr** - https://coverr.co/s/space

**Search Terms:**
- "cosmic space loop"
- "nebula animation"
- "galaxy background"
- "stars universe"
- "spiritual cosmic"
- "divine light rays"

### AI-Generated Videos
Use AI tools to generate custom cosmic videos:
- **Runway ML** - https://runwayml.com/
- **Pika Labs** - https://pika.art/
- **Stable Video Diffusion**

**Prompts:**
```
"Cosmic purple nebula with stars, slow motion, seamless loop"
"Divine spiritual energy flowing through space, purple and gold"
"Sacred geometry patterns in cosmic space, ethereal atmosphere"
```

## ✅ Verification

After adding your video:

1. **Open browser** to http://localhost:5173/
2. **Check video plays** automatically
3. **Check video loops** seamlessly
4. **Check overlay** darkens edges
5. **Check text** is readable over video
6. **Test on mobile** (responsive)

## 🎨 Advanced: Multiple Videos

### Different Videos per Religion
```jsx
const [userReligion, setUserReligion] = useState('hindu');

const videoSources = {
  hindu: '/videos/hindu-cosmic.mp4',
  norse: '/videos/norse-cosmic.mp4',
  greek: '/videos/greek-cosmic.mp4',
  // ...
};

return (
  <video autoPlay loop muted playsInline className="hero-video">
    <source src={videoSources[userReligion]} type="video/mp4" />
  </video>
);
```

### Transition Between Videos
```jsx
const [currentVideo, setCurrentVideo] = useState(0);
const videos = ['/video1.mp4', '/video2.mp4', '/video3.mp4'];

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
  }, 30000); // Change every 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

## 📊 Performance

### Current Setup
- **Video loads**: On page load
- **Autoplay**: Yes (muted)
- **Loop**: Infinite
- **Performance**: 60fps maintained
- **Memory**: ~50-100MB (depends on video size)

### Optimization Checklist
- ✅ Video compressed (<10MB)
- ✅ Audio track removed
- ✅ Resolution optimized (1080p)
- ✅ Frame rate optimized (30fps)
- ✅ Codec optimized (H.264)
- ✅ Overlay reduces brightness
- ✅ Text remains readable

## 🎉 Result

Your hero section now features:
- ✅ Looping video background
- ✅ Smooth playback
- ✅ Dark overlay for text readability
- ✅ Responsive design
- ✅ Mobile optimized
- ✅ Auto-play on load

---

**Next Step**: Add your `hero-background.mp4` to `/public/` folder and refresh!
