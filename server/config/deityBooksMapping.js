/**
 * Deity to Sacred Books Mapping
 * 
 * Each deity has:
 * - primary: Books they primarily reference (higher weight in search)
 * - secondary: Books they can reference (lower weight in search)
 * 
 * This ensures Krishna primarily quotes Bhagavad Gita, Rama quotes Ramayana, etc.
 */

const DEITY_BOOKS_MAPPING = {
  // Hindu Deities
  
  rama: {
    primary: ['Ramayana'],
    secondary: ['Upanishads', 'Puranas', 'Devi Mahatmyam', 'Bhagavad Gita', 'Mahabharata'],
    religion: 'hindu',
    description: 'Rama primarily references Ramayana, his own story and teachings'
  },
  
  hanuman: {
    primary: ['Ramayana'],
    secondary: ['Upanishads', 'Puranas', 'Devi Mahatmyam', 'Bhagavad Gita', 'Mahabharata'],
    religion: 'hindu',
    description: 'Hanuman primarily references Ramayana, as devoted servant of Rama'
  },
  
  krishna: {
    primary: ['Bhagavad Gita', 'Mahabharata'],
    secondary: ['Upanishads', 'Puranas', 'Ramayana', 'Devi Mahatmyam'],
    religion: 'hindu',
    description: 'Krishna primarily references Bhagavad Gita and Mahabharata'
  },
  
  shiva: {
    primary: ['Puranas', 'Upanishads'],
    secondary: ['Ramayana', 'Bhagavad Gita', 'Devi Mahatmyam', 'Mahabharata'],
    religion: 'hindu',
    description: 'Shiva primarily references Puranas (especially Shiva Purana) and Upanishads'
  },
  
  durga: {
    primary: ['Puranas', 'Devi Mahatmyam'],
    secondary: ['Ramayana', 'Mahabharata', 'Bhagavad Gita', 'Upanishads'],
    religion: 'hindu',
    description: 'Durga primarily references Puranas and Devi Mahatmyam'
  },
  
  lakshmi: {
    primary: ['Puranas', 'Devi Mahatmyam'],
    secondary: ['Ramayana', 'Mahabharata', 'Bhagavad Gita', 'Upanishads'],
    religion: 'hindu',
    description: 'Lakshmi primarily references Puranas and Devi Mahatmyam'
  },
  
  ganesha: {
    primary: ['Mahabharata', 'Puranas', 'Upanishads'],
    secondary: ['Ramayana', 'Bhagavad Gita', 'Devi Mahatmyam'],
    religion: 'hindu',
    description: 'Ganesha primarily references Mahabharata, Puranas, and Upanishads'
  },
  
  ayyappa: {
    primary: ['Puranas', 'Upanishads'],
    secondary: ['Ramayana', 'Mahabharata', 'Bhagavad Gita', 'Devi Mahatmyam'],
    religion: 'hindu',
    description: 'Ayyappa (Kartikeya) primarily references Puranas and Upanishads'
  },
  
  kartikeya: {
    primary: ['Puranas', 'Upanishads'],
    secondary: ['Ramayana', 'Mahabharata', 'Bhagavad Gita', 'Devi Mahatmyam'],
    religion: 'hindu',
    description: 'Kartikeya primarily references Puranas and Upanishads'
  },
  
  parvati: {
    primary: ['Puranas', 'Upanishads', 'Devi Mahatmyam'],
    secondary: ['Mahabharata', 'Bhagavad Gita', 'Ramayana'],
    religion: 'hindu',
    description: 'Parvati primarily references Puranas, Upanishads, and Devi Mahatmyam'
  },
  
  vishnu: {
    primary: ['Puranas', 'Upanishads', 'Mahabharata', 'Bhagavad Gita'],
    secondary: ['Ramayana', 'Devi Mahatmyam'],
    religion: 'hindu',
    description: 'Vishnu primarily references Puranas, Upanishads, Mahabharata, and Bhagavad Gita'
  },
  
  brahma: {
    primary: ['Puranas', 'Upanishads'],
    secondary: ['Ramayana', 'Mahabharata', 'Bhagavad Gita', 'Devi Mahatmyam'],
    religion: 'hindu',
    description: 'Brahma primarily references Puranas and Upanishads'
  },
  
  // Greek Deities
  
  zeus: {
    primary: ['Greek Mythology'],
    secondary: [],
    religion: 'greek',
    description: 'Zeus references Greek mythology texts'
  },
  
  athena: {
    primary: ['Greek Mythology'],
    secondary: [],
    religion: 'greek',
    description: 'Athena references Greek mythology texts'
  },
  
  apollo: {
    primary: ['Greek Mythology'],
    secondary: [],
    religion: 'greek',
    description: 'Apollo references Greek mythology texts'
  },
  
  hera: {
    primary: ['Greek Mythology'],
    secondary: [],
    religion: 'greek',
    description: 'Hera references Greek mythology texts'
  },
  
  poseidon: {
    primary: ['Greek Mythology'],
    secondary: [],
    religion: 'greek',
    description: 'Poseidon references Greek mythology texts'
  },
  
  // Norse Deities
  
  odin: {
    primary: ['Odin Mythology'],
    secondary: ['Poetic Edda', 'Prose Edda'],
    religion: 'norse',
    description: 'Odin references Odin Mythology, Poetic Edda and Prose Edda'
  },
  
  thor: {
    primary: ['Thor Mythology'],
    secondary: ['Poetic Edda', 'Prose Edda'],
    religion: 'norse',
    description: 'Thor references Thor Mythology, Poetic Edda and Prose Edda'
  },
  
  loki: {
    primary: ['Loki Mythology'],
    secondary: ['Poetic Edda', 'Prose Edda'],
    religion: 'norse',
    description: 'Loki references Loki Mythology, Poetic Edda and Prose Edda'
  },
  
  freyja: {
    primary: ['Freyja Mythology'],
    secondary: ['Poetic Edda', 'Prose Edda'],
    religion: 'norse',
    description: 'Freyja references Freyja Mythology, Poetic Edda and Prose Edda'
  },
  
  // Egyptian Deities
  
  ra: {
    primary: ['Egyptian Mythology'],
    secondary: [],
    religion: 'egyptian',
    description: 'Ra references Egyptian mythology texts'
  },
  
  isis: {
    primary: ['Egyptian Mythology'],
    secondary: [],
    religion: 'egyptian',
    description: 'Isis references Egyptian mythology texts'
  },
  
  osiris: {
    primary: ['Egyptian Mythology'],
    secondary: [],
    religion: 'egyptian',
    description: 'Osiris references Egyptian mythology texts'
  },
  
  anubis: {
    primary: ['Egyptian Mythology'],
    secondary: [],
    religion: 'egyptian',
    description: 'Anubis references Egyptian mythology texts'
  },
  
  // Christian
  
  jesus: {
    primary: ['Bible', 'New Testament'],
    secondary: [],
    religion: 'christian',
    description: 'Jesus references Bible and New Testament'
  },
  
  // Islamic
  
  prophet_muhammad: {
    primary: ['Quran'],
    secondary: [],
    religion: 'muslim',
    description: 'Prophet Muhammad references Quran'
  },
  
  // Japanese
  
  amaterasu: {
    primary: ['Japanese Mythology'],
    secondary: [],
    religion: 'shinto',
    description: 'Amaterasu references Japanese mythology'
  },
  
  susanoo: {
    primary: ['Japanese Mythology'],
    secondary: [],
    religion: 'shinto',
    description: 'Susanoo references Japanese mythology'
  },
  
  // Mayan
  
  quetzalcoatl: {
    primary: ['Mayan Mythology'],
    secondary: [],
    religion: 'mayan',
    description: 'Quetzalcoatl references Mayan mythology'
  },
  
  huitzilopochtli: {
    primary: ['Mayan Mythology'],
    secondary: [],
    religion: 'mayan',
    description: 'Huitzilopochtli references Mayan mythology'
  }
};

/**
 * Get books for a deity with priority weights
 * @param {string} deityName - Name of the deity
 * @returns {object} Books with weights
 */
function getDeityBooks(deityName) {
  const deity = DEITY_BOOKS_MAPPING[deityName.toLowerCase()];
  
  if (!deity) {
    // Default: all books with equal weight
    return {
      primary: [],
      secondary: [],
      all: [],
      religion: 'unknown'
    };
  }
  
  return {
    primary: deity.primary,
    secondary: deity.secondary,
    all: [...deity.primary, ...deity.secondary],
    religion: deity.religion,
    description: deity.description
  };
}

/**
 * Build Qdrant filter for deity-specific book search
 * @param {string} deityName - Name of the deity
 * @param {boolean} primaryOnly - Only search primary books
 * @returns {object} Qdrant filter object
 */
function buildDeityFilter(deityName, primaryOnly = false) {
  const books = getDeityBooks(deityName);
  
  if (books.primary.length === 0 && books.secondary.length === 0) {
    // No specific books, filter by religion only
    return books.religion !== 'unknown' ? {
      must: [{ key: 'religion', match: { value: books.religion } }]
    } : null;
  }
  
  const bookList = primaryOnly ? books.primary : books.all;
  
  if (bookList.length === 0) {
    return null;
  }
  
  // Filter by book names
  return {
    should: bookList.map(book => ({
      key: 'book',
      match: { value: book }
    }))
  };
}

/**
 * Get search strategy for deity (PRIMARY ONLY FIRST)
 * @param {string} deityName - Name of the deity
 * @param {number} totalResults - Total results needed
 * @param {boolean} strictPrimary - Only search primary books (default: true)
 * @returns {object} Search strategy
 */
function getSearchStrategy(deityName, totalResults = 5, strictPrimary = true) {
  const books = getDeityBooks(deityName);
  
  if (books.primary.length === 0) {
    // No primary books, search all
    return {
      mode: 'all',
      searches: [
        { filter: buildDeityFilter(deityName, false), limit: totalResults }
      ]
    };
  }
  
  if (strictPrimary) {
    // STRICT MODE: Search PRIMARY books ONLY
    // If not found, generate own text (no secondary search)
    return {
      mode: 'primary_only',
      searches: [
        { 
          filter: buildDeityFilter(deityName, true), 
          limit: totalResults,
          boost: 1.0
        }
      ],
      fallback: 'generate'  // Generate own text if not found
    };
  } else {
    // FLEXIBLE MODE: Search primary first (70%), then secondary (30%)
    const primaryLimit = Math.ceil(totalResults * 0.7);
    const secondaryLimit = totalResults - primaryLimit;
    
    return {
      mode: 'primary_secondary',
      searches: [
        { 
          filter: buildDeityFilter(deityName, true), 
          limit: primaryLimit,
          boost: 1.5
        },
        { 
          filter: buildDeityFilter(deityName, false), 
          limit: secondaryLimit,
          boost: 1.0
        }
      ]
    };
  }
}

/**
 * Normalize book names for matching
 * @param {string} bookName - Book name from database
 * @returns {string} Normalized name
 */
function normalizeBookName(bookName) {
  const normalized = bookName.toLowerCase().trim();
  
  // Handle variations
  const variations = {
    'bhagavad gita': ['bhagavad_gita', 'gita', 'bhagavadgita'],
    'mahabharata': ['mahabharatha', 'mahabharat'],
    'ramayana': ['ramayan'],
    'upanishads': ['upanishad'],
    'puranas': ['purana', 'bhagavata purana', 'shiva purana', 'vishnu purana', 'garuda purana'],
    'devi mahatmyam': ['devi mahatmya', 'devimahathyam', 'durga saptashati'],
    'bible': ['bible (kjv)', 'new testament', 'old testament'],
    'quran': ['qur\'an', 'koran'],
    'greek mythology': ['zeus', 'athena', 'apollo', 'hera', 'poseidon'],
    'norse mythology': ['odin', 'thor', 'loki', 'freyja'],
    'poetic edda': ['edda', 'norse'],
    'prose edda': ['edda', 'norse'],
    'odin mythology': ['odin-norse', 'odin', 'norse'],
    'thor mythology': ['thor-norse', 'thor', 'norse'],
    'loki mythology': ['loki-norse', 'loki', 'norse'],
    'freyja mythology': ['freyja-norse', 'freyja', 'norse'],
    'egyptian mythology': ['ra', 'isis', 'osiris', 'anubis']
  };
  
  for (const [standard, variants] of Object.entries(variations)) {
    if (variants.some(v => normalized.includes(v))) {
      return standard;
    }
  }
  
  return normalized;
}

/**
 * Check if a book is primary for a deity
 * @param {string} deityName - Name of the deity
 * @param {string} bookName - Name of the book
 * @returns {boolean} True if primary
 */
function isPrimaryBook(deityName, bookName) {
  const books = getDeityBooks(deityName);
  const normalized = normalizeBookName(bookName);
  
  return books.primary.some(primary => 
    normalizeBookName(primary) === normalized
  );
}

/**
 * Get all deities that reference a specific book
 * @param {string} bookName - Name of the book
 * @returns {array} List of deities
 */
function getDeitiesForBook(bookName) {
  const normalized = normalizeBookName(bookName);
  const deities = [];
  
  for (const [deity, config] of Object.entries(DEITY_BOOKS_MAPPING)) {
    const allBooks = [...config.primary, ...config.secondary];
    if (allBooks.some(book => normalizeBookName(book) === normalized)) {
      deities.push({
        name: deity,
        isPrimary: config.primary.some(book => normalizeBookName(book) === normalized)
      });
    }
  }
  
  return deities;
}

module.exports = {
  DEITY_BOOKS_MAPPING,
  getDeityBooks,
  buildDeityFilter,
  getSearchStrategy,
  normalizeBookName,
  isPrimaryBook,
  getDeitiesForBook
};
