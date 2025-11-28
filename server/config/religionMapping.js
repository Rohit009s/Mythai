/**
 * Religion to Deities to Sacred Texts Mapping
 * Defines which deities and texts are available for each religion
 */

const RELIGION_MAPPING = {
  hindu: {
    name: 'Hinduism',
    primary_books: [
      'Bhagavad Gita',
      'Mahabharata',
      'Ramayana',
      'Shiva Purana',
      'Vishnu Purana',
      'Devi Bhagavata Purana',
      'Vedas',
      'Upanishads'
    ],
    deities: {
      krishna: {
        name: 'Krishna',
        books: ['Bhagavad Gita', 'Mahabharata'],
        deity_group: 'krishna',
        gender: 'male',
        description: 'Divine Teacher, Supreme Being'
      },
      shiva: {
        name: 'Shiva',
        books: ['Shiva Purana', 'Vedas'],
        deity_group: 'shiva',
        gender: 'male',
        description: 'The Transformer, Lord of Destruction and Creation'
      },
      vishnu: {
        name: 'Vishnu',
        books: ['Vishnu Purana', 'Bhagavad Gita'],
        deity_group: 'vishnu',
        gender: 'male',
        description: 'The Preserver, Sustainer of Universe'
      },
      rama: {
        name: 'Rama',
        books: ['Ramayana'],
        deity_group: 'rama',
        gender: 'male',
        description: 'Noble Prince, Avatar of Vishnu'
      },
      hanuman: {
        name: 'Hanuman',
        books: ['Ramayana'],
        deity_group: 'hanuman',
        gender: 'male',
        description: 'Devoted Warrior, Symbol of Strength'
      },
      ganesha: {
        name: 'Ganesha',
        books: ['Vedas', 'Upanishads'],
        deity_group: 'ganesha',
        gender: 'male',
        description: 'Remover of Obstacles, Lord of Beginnings'
      },
      lakshmi: {
        name: 'Lakshmi',
        books: ['Vishnu Purana', 'Devi Bhagavata Purana'],
        deity_group: 'lakshmi',
        gender: 'female',
        description: 'Goddess of Prosperity and Fortune'
      },
      saraswati: {
        name: 'Saraswati',
        books: ['Vedas', 'Devi Bhagavata Purana'],
        deity_group: 'saraswati',
        gender: 'female',
        description: 'Goddess of Knowledge and Arts'
      },
      durga: {
        name: 'Durga',
        books: ['Devi Bhagavata Purana'],
        deity_group: 'durga',
        gender: 'female',
        description: 'Fierce Protector, Warrior Goddess'
      },
      parvati: {
        name: 'Parvati',
        books: ['Shiva Purana', 'Devi Bhagavata Purana'],
        deity_group: 'parvati',
        gender: 'female',
        description: 'Divine Mother, Consort of Shiva'
      }
    }
  },

  christian: {
    name: 'Christianity',
    primary_books: ['Bible', 'New Testament', 'Old Testament'],
    deities: {
      jesus: {
        name: 'Jesus',
        books: ['Bible', 'New Testament'],
        deity_group: 'jesus',
        gender: 'male',
        description: 'The Messiah, Son of God'
      },
      mary: {
        name: 'Mary',
        books: ['Bible', 'New Testament'],
        deity_group: 'mary',
        gender: 'female',
        description: 'Mother of Jesus, Holy Virgin'
      }
    }
  },

  greek: {
    name: 'Greek Mythology',
    primary_books: ['Iliad', 'Odyssey', 'Theogony', 'Greek Myths'],
    deities: {
      zeus: {
        name: 'Zeus',
        books: ['Iliad', 'Odyssey', 'Theogony'],
        deity_group: 'zeus',
        gender: 'male',
        description: 'King of Gods, God of Sky and Thunder'
      },
      athena: {
        name: 'Athena',
        books: ['Iliad', 'Odyssey', 'Greek Myths'],
        deity_group: 'athena',
        gender: 'female',
        description: 'Goddess of Wisdom and War Strategy'
      },
      apollo: {
        name: 'Apollo',
        books: ['Iliad', 'Greek Myths'],
        deity_group: 'apollo',
        gender: 'male',
        description: 'God of Arts, Music, and Prophecy'
      },
      poseidon: {
        name: 'Poseidon',
        books: ['Odyssey', 'Greek Myths'],
        deity_group: 'poseidon',
        gender: 'male',
        description: 'God of the Sea and Earthquakes'
      },
      hera: {
        name: 'Hera',
        books: ['Iliad', 'Greek Myths'],
        deity_group: 'hera',
        gender: 'female',
        description: 'Queen of Gods, Goddess of Marriage'
      }
    }
  },

  norse: {
    name: 'Norse Mythology',
    primary_books: ['Poetic Edda', 'Prose Edda', 'Norse Sagas'],
    deities: {
      odin: {
        name: 'Odin',
        books: ['Poetic Edda', 'Prose Edda'],
        deity_group: 'odin',
        gender: 'male',
        description: 'All-Father, God of Wisdom and War'
      },
      thor: {
        name: 'Thor',
        books: ['Poetic Edda', 'Prose Edda'],
        deity_group: 'thor',
        gender: 'male',
        description: 'God of Thunder and Strength'
      },
      loki: {
        name: 'Loki',
        books: ['Poetic Edda', 'Prose Edda'],
        deity_group: 'loki',
        gender: 'male',
        description: 'Trickster God, Shape-shifter'
      },
      freyja: {
        name: 'Freyja',
        books: ['Poetic Edda', 'Prose Edda'],
        deity_group: 'freyja',
        gender: 'female',
        description: 'Goddess of Love, Beauty, and War'
      }
    }
  },

  muslim: {
    name: 'Islam',
    primary_books: ['Quran', 'Hadith'],
    deities: {
      prophet_muhammad: {
        name: 'Prophet Muhammad',
        books: ['Quran', 'Hadith'],
        deity_group: 'prophet_muhammad',
        gender: 'male',
        description: 'The Final Prophet, Messenger of Allah'
      }
    }
  },

  buddhism: {
    name: 'Buddhism',
    primary_books: ['Dhammapada', 'Tripitaka', 'Sutras'],
    deities: {
      buddha: {
        name: 'Buddha',
        books: ['Dhammapada', 'Tripitaka'],
        deity_group: 'buddha',
        gender: 'male',
        description: 'The Enlightened One, Teacher of Dharma'
      }
    }
  },

  egyptian: {
    name: 'Egyptian Mythology',
    primary_books: ['Book of the Dead', 'Pyramid Texts', 'Egyptian Myths'],
    deities: {
      ra: {
        name: 'Ra',
        books: ['Book of the Dead', 'Egyptian Myths'],
        deity_group: 'ra',
        gender: 'male',
        description: 'Sun God, Creator Deity'
      },
      isis: {
        name: 'Isis',
        books: ['Book of the Dead', 'Egyptian Myths'],
        deity_group: 'isis',
        gender: 'female',
        description: 'Goddess of Magic and Healing'
      },
      anubis: {
        name: 'Anubis',
        books: ['Book of the Dead', 'Egyptian Myths'],
        deity_group: 'anubis',
        gender: 'male',
        description: 'God of Death and Mummification'
      }
    }
  },

  shinto: {
    name: 'Shintoism',
    primary_books: ['Kojiki', 'Nihon Shoki'],
    deities: {
      amaterasu: {
        name: 'Amaterasu',
        books: ['Kojiki', 'Nihon Shoki'],
        deity_group: 'amaterasu',
        gender: 'female',
        description: 'Sun Goddess, Supreme Deity'
      },
      susanoo: {
        name: 'Susanoo',
        books: ['Kojiki', 'Nihon Shoki'],
        deity_group: 'susanoo',
        gender: 'male',
        description: 'Storm God, Brother of Amaterasu'
      }
    }
  },

  aztec: {
    name: 'Aztec Mythology',
    primary_books: ['Codex Borgia', 'Aztec Myths'],
    deities: {
      quetzalcoatl: {
        name: 'Quetzalcoatl',
        books: ['Codex Borgia', 'Aztec Myths'],
        deity_group: 'quetzalcoatl',
        gender: 'male',
        description: 'Feathered Serpent, God of Wind and Learning'
      },
      huitzilopochtli: {
        name: 'Huitzilopochtli',
        books: ['Aztec Myths'],
        deity_group: 'huitzilopochtli',
        gender: 'male',
        description: 'God of War and Sun'
      }
    }
  }
};

/**
 * Get deities available for a religion
 */
function getDeitiesForReligion(religion) {
  const religionData = RELIGION_MAPPING[religion];
  if (!religionData) return [];
  
  return Object.keys(religionData.deities).map(key => ({
    id: key,
    ...religionData.deities[key]
  }));
}

/**
 * Get books for a specific deity
 */
function getBooksForDeity(religion, deityId) {
  const religionData = RELIGION_MAPPING[religion];
  if (!religionData || !religionData.deities[deityId]) return [];
  
  return religionData.deities[deityId].books;
}

/**
 * Get deity group for filtering
 */
function getDeityGroup(religion, deityId) {
  const religionData = RELIGION_MAPPING[religion];
  if (!religionData || !religionData.deities[deityId]) return null;
  
  return religionData.deities[deityId].deity_group;
}

/**
 * Validate if deity belongs to religion
 */
function isDeityValidForReligion(religion, deityId) {
  const religionData = RELIGION_MAPPING[religion];
  if (!religionData) return false;
  
  return !!religionData.deities[deityId];
}

/**
 * Get all supported religions
 */
function getAllReligions() {
  return Object.keys(RELIGION_MAPPING).map(key => ({
    id: key,
    name: RELIGION_MAPPING[key].name
  }));
}

/**
 * Check if user can access a deity based on their religion
 * Users can only chat with deities from their own religion
 * But they can ask questions about other religions (answered by their own deities)
 */
function canUserAccessDeity(userReligion, deityId) {
  // Guest users (religion: 'all') can access all deities
  if (userReligion === 'all') {
    return true;
  }

  // Check if deity belongs to user's religion
  const religionData = RELIGION_MAPPING[userReligion];
  if (!religionData) {
    return false;
  }

  return !!religionData.deities[deityId];
}

/**
 * Get religion of a deity
 */
function getDeityReligion(deityId) {
  for (const [religion, data] of Object.entries(RELIGION_MAPPING)) {
    if (data.deities[deityId]) {
      return religion;
    }
  }
  return null;
}

module.exports = {
  RELIGION_MAPPING,
  getDeitiesForReligion,
  getBooksForDeity,
  getDeityGroup,
  isDeityValidForReligion,
  getAllReligions,
  canUserAccessDeity,
  getDeityReligion
};
