# How to Download Cosmic Background Images

## What You Need

5 cosmic/space background images named:
- `cosmic1.jpg`
- `cosmic2.jpg`
- `cosmic3.jpg`
- `cosmic4.jpg`
- `cosmic5.jpg`

## Where to Download Free Cosmic Images

### Option 1: Unsplash (Recommended - Free, High Quality)
1. Go to https://unsplash.com
2. Search for these terms:
   - "cosmic nebula"
   - "space galaxy"
   - "purple nebula"
   - "deep space"
   - "cosmic background"
3. Download 5 different images
4. Rename them to cosmic1.jpg, cosmic2.jpg, etc.

### Option 2: Pexels (Free, No Attribution Required)
1. Go to https://www.pexels.com
2. Search for:
   - "space background"
   - "galaxy"
   - "nebula"
   - "cosmic"
3. Download 5 images and rename

### Option 3: Pixabay (Free)
1. Go to https://pixabay.com
2. Search "cosmic space" or "galaxy background"
3. Download 5 images

## Recommended Image Specifications

- **Resolution**: 1920x1080 or higher
- **Format**: JPG (smaller file size)
- **Colors**: Purple, blue, dark themes to match your app
- **Style**: Nebula, galaxy, deep space themes

## Suggested Search Terms for Each Layer

1. **cosmic1.jpg** (Oracle Layer - #5542FF): "purple nebula" or "deep space purple"
2. **cosmic2.jpg** (Scripture Layer - #7B61FF): "blue galaxy" or "cosmic blue"
3. **cosmic3.jpg** (Memory Layer - #9B80FF): "violet space" or "purple galaxy"
4. **cosmic4.jpg** (Ritual Layer - #BB9FFF): "pink nebula" or "cosmic purple pink"
5. **cosmic5.jpg** (Experience Layer - #DBBEFF): "bright nebula" or "colorful galaxy"

## Installation Steps

1. Download 5 cosmic images from any source above
2. Rename them to: `cosmic1.jpg`, `cosmic2.jpg`, `cosmic3.jpg`, `cosmic4.jpg`, `cosmic5.jpg`
3. Place them in: `frontend/public/` folder
4. The app will automatically use them!

## After Adding Images

Once you've added the images, update ProductScroll.jsx to use them:

```javascript
const LAYERS = [
  {
    id: 0,
    caption: '01 · Oracle Layer',
    title: 'Divine Q&A',
    infoTitle: 'Divine Q&A · Oracle Layer',
    description: '...',
    cta: 'Enter Oracle Realm',
    backgroundImage: '/cosmic1.jpg',  // Will use the image
    color: '#5542FF',
  },
  // ... repeat for cosmic2.jpg through cosmic5.jpg
];
```

And update the background rendering:

```javascript
// Change from:
backgroundRef.current.style.background = layer.backgroundGradient;

// To:
backgroundRef.current.style.backgroundImage = `url(${layer.backgroundImage})`;
```

## Current Status

✅ **Gradients are working** - Your app currently uses beautiful cosmic gradients as fallback
❌ **Images not added yet** - You need to manually download and add the 5 cosmic images

## Quick Links

- Unsplash Cosmic: https://unsplash.com/s/photos/cosmic-nebula
- Pexels Space: https://www.pexels.com/search/space%20background/
- Pixabay Galaxy: https://pixabay.com/images/search/galaxy/

## Note

The current gradient backgrounds look great! Only add images if you want actual space photos instead of gradients.
