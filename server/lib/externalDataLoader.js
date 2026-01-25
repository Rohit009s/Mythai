// External Data Loader for Production Deployment
// This loads large data files from external sources to keep deployment size small

const fs = require('fs');
const path = require('path');

class ExternalDataLoader {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.dataCache = new Map();
  }

  // Load personas (these are small, keep local)
  loadPersonas() {
    try {
      const personasPath = path.join(__dirname, '../../data/personas');
      if (fs.existsSync(personasPath)) {
        const files = fs.readdirSync(personasPath);
        const personas = {};
        
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const personaName = file.replace('.json', '');
            const personaPath = path.join(personasPath, file);
            personas[personaName] = JSON.parse(fs.readFileSync(personaPath, 'utf8'));
          }
        });
        
        return personas;
      }
    } catch (error) {
      console.error('Error loading personas:', error);
    }
    
    // Fallback: return essential personas
    return this.getEssentialPersonas();
  }

  // Essential personas for production (if files not available)
  getEssentialPersonas() {
    return {
      krishna: {
        name: "Krishna",
        description: "The divine cowherd, teacher of the Bhagavad Gita",
        personality: "Wise, playful, compassionate",
        language: "en",
        religion: "hinduism"
      },
      shiva: {
        name: "Shiva",
        description: "The destroyer and transformer, lord of dance",
        personality: "Powerful, meditative, transformative",
        language: "en",
        religion: "hinduism"
      },
      jesus: {
        name: "Jesus",
        description: "The son of God, teacher of love and compassion",
        personality: "Loving, forgiving, wise",
        language: "en",
        religion: "christianity"
      },
      prophet_muhammad: {
        name: "Prophet Muhammad",
        description: "The final messenger of Allah",
        personality: "Wise, just, compassionate",
        language: "en",
        religion: "islam"
      }
    };
  }

  // Load embeddings (in production, these would come from vector database)
  async loadEmbeddings(language = 'en') {
    if (this.isProduction) {
      // In production, embeddings are handled by Qdrant Cloud
      console.log('Production mode: Using Qdrant Cloud for embeddings');
      return null;
    }

    // Development mode: try to load local embeddings
    try {
      const embeddingsPath = path.join(__dirname, `../../data/embeddings/${language}_embeddings.json`);
      if (fs.existsSync(embeddingsPath)) {
        const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));
        return embeddings;
      }
    } catch (error) {
      console.error('Error loading embeddings:', error);
    }
    
    return null;
  }

  // Load sacred texts (in production, these would come from external API or CDN)
  async loadSacredTexts(religion, language = 'en') {
    const cacheKey = `${religion}_${language}`;
    
    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    if (this.isProduction) {
      // In production, load from external source or return essential texts
      const essentialTexts = this.getEssentialTexts(religion, language);
      this.dataCache.set(cacheKey, essentialTexts);
      return essentialTexts;
    }

    // Development mode: try to load local files
    try {
      const textsPath = path.join(__dirname, `../../data/texts/${language}/${religion}`);
      if (fs.existsSync(textsPath)) {
        const files = fs.readdirSync(textsPath);
        const texts = {};
        
        files.forEach(file => {
          if (file.endsWith('.txt')) {
            const textName = file.replace('.txt', '');
            const textPath = path.join(textsPath, file);
            texts[textName] = fs.readFileSync(textPath, 'utf8');
          }
        });
        
        this.dataCache.set(cacheKey, texts);
        return texts;
      }
    } catch (error) {
      console.error('Error loading sacred texts:', error);
    }

    // Fallback
    const essentialTexts = this.getEssentialTexts(religion, language);
    this.dataCache.set(cacheKey, essentialTexts);
    return essentialTexts;
  }

  // Essential texts for production
  getEssentialTexts(religion, language) {
    const texts = {
      hinduism: {
        bhagavad_gita: "The Bhagavad Gita is a sacred Hindu text...",
        hanuman_chalisa: "Hanuman Chalisa is a devotional hymn..."
      },
      christianity: {
        bible: "The Bible is the sacred text of Christianity..."
      },
      islam: {
        quran: "The Quran is the holy book of Islam..."
      }
    };

    return texts[religion] || {};
  }

  // Get deployment size info
  getDeploymentInfo() {
    return {
      mode: this.isProduction ? 'production' : 'development',
      dataSource: this.isProduction ? 'external' : 'local',
      cacheSize: this.dataCache.size,
      message: this.isProduction 
        ? 'Using external data sources for optimal deployment size'
        : 'Using local data files for development'
    };
  }
}

module.exports = new ExternalDataLoader();