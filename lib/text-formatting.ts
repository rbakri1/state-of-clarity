/**
 * Text Formatting Utilities
 *
 * Automatically formats user-generated question titles for:
 * - Proper capitalization (sentence case)
 * - Common spelling corrections
 * - Punctuation normalization
 * - Whitespace cleanup
 */

// Common misspellings and their corrections
const SPELLING_CORRECTIONS: Record<string, string> = {
  // Common typos
  "teh": "the",
  "taht": "that",
  "adn": "and",
  "hte": "the",
  "dont": "don't",
  "doesnt": "doesn't",
  "cant": "can't",
  "wont": "won't",
  "shouldnt": "shouldn't",
  "wouldnt": "wouldn't",
  "couldnt": "couldn't",
  "isnt": "isn't",
  "arent": "aren't",
  "wasnt": "wasn't",
  "werent": "weren't",
  "hasnt": "hasn't",
  "havent": "haven't",
  "hadnt": "hadn't",
  "didnt": "didn't",
  "youre": "you're",
  "theyre": "they're",
  "theres": "there's",
  "whats": "what's",
  "hows": "how's",
  "whos": "who's",
  "whens": "when's",
  "wheres": "where's",
  "whys": "why's",
  "thats": "that's",
  "its": "it's", // Handled specially - only when it should be "it is"
  "im": "I'm",
  "ive": "I've",
  "id": "I'd",
  "ill": "I'll",
  "lets": "let's",
  "heres": "here's",
  "theyve": "they've",
  "weve": "we've",
  "youve": "you've",

  // Policy/government related
  "goverment": "government",
  "governmnet": "government",
  "govenment": "government",
  "parliment": "parliament",
  "parlimant": "parliament",
  "legeslation": "legislation",
  "legislaton": "legislation",
  "legilsation": "legislation",
  "regulaton": "regulation",
  "regulaion": "regulation",
  "enviroment": "environment",
  "enviornment": "environment",
  "enviorment": "environment",
  "econimic": "economic",
  "economc": "economic",
  "politcal": "political",
  "politcial": "political",
  "democractic": "democratic",
  "democatic": "democratic",
  "infastructure": "infrastructure",
  "infrastrucure": "infrastructure",
  "healthcare": "health care",
  "healtcare": "health care",
  "healthare": "health care",

  // Common words
  "recieve": "receive",
  "beleive": "believe",
  "acheive": "achieve",
  "wierd": "weird",
  "seperate": "separate",
  "occured": "occurred",
  "occurence": "occurrence",
  "definately": "definitely",
  "definatly": "definitely",
  "accomodate": "accommodate",
  "acommodate": "accommodate",
  "apparantly": "apparently",
  "apparentely": "apparently",
  "necesary": "necessary",
  "neccessary": "necessary",
  "occassion": "occasion",
  "occurrance": "occurrence",
  "untill": "until",
  "tommorow": "tomorrow",
  "tommorrow": "tomorrow",
  "begining": "beginning",
  "beggining": "beginning",
  "goverenance": "governance",
  "governence": "governance",
  "buisness": "business",
  "busness": "business",
  "adress": "address",
  "adresss": "address",
  "calender": "calendar",
  "comittee": "committee",
  "commitee": "committee",
  "concensus": "consensus",
  "contraversy": "controversy",
  "controversey": "controversy",
  "embarass": "embarrass",
  "foriegn": "foreign",
  "fourty": "forty",
  "guage": "gauge",
  "independant": "independent",
  "indispensible": "indispensable",
  "knowlege": "knowledge",
  "liason": "liaison",
  "lisence": "licence",
  "maintainance": "maintenance",
  "millenium": "millennium",
  "miniscule": "minuscule",
  "mispell": "misspell",
  "noticable": "noticeable",
  "persistant": "persistent",
  "posession": "possession",
  "privledge": "privilege",
  "priviledge": "privilege",
  "pronounciation": "pronunciation",
  "publically": "publicly",
  "recomend": "recommend",
  "reccomend": "recommend",
  "refering": "referring",
  "reffering": "referring",
  "relevent": "relevant",
  "restaraunt": "restaurant",
  "rhythym": "rhythm",
  "sucessful": "successful",
  "succesful": "successful",
  "supercede": "supersede",
  "threshhold": "threshold",
  "truely": "truly",
  "wether": "whether",
  "writting": "writing",

  // Question starters
  "wht": "what",
  "waht": "what",
  "wat": "what",
  "hw": "how",
  "hwo": "how",
  "wy": "why",
  "wh": "why",
  "wen": "when",
  "whn": "when",
  "whre": "where",
  "wher": "where",
  "wich": "which",
  "whch": "which",
  "hod": "how do",
  "wha": "what",
};

// Words that should always be lowercase (unless at start)
const LOWERCASE_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by",
  "of", "in", "with", "as", "into", "from", "about", "over", "under"
]);

// Words/acronyms that should stay uppercase
const UPPERCASE_WORDS = new Set([
  "US", "USA", "UK", "EU", "UN", "NATO", "WHO", "GDP", "AI", "API", "CEO", "CFO",
  "CTO", "FBI", "CIA", "NSA", "IRS", "EPA", "FDA", "FCC", "SEC", "DOJ", "DOD",
  "NASA", "OSHA", "FEMA", "HHS", "HUD", "DOE", "DOT", "USDA", "VA", "SBA",
  "NIH", "CDC", "SSA", "USCIS", "ICE", "CBP", "TSA", "ATF", "DEA", "SCOTUS",
  "POTUS", "GOP", "DNC", "RNC", "PAC", "NGO", "IMF", "WTO", "NAFTA", "USMCA",
  "OPEC", "BRICS", "ASEAN", "APEC", "G7", "G20", "COVID", "HIV", "AIDS", "STEM",
  "LGBTQ", "BLM", "MLK", "JFK", "FDR", "LBJ", "DNA", "RNA", "PCR", "MRI", "CT",
  "ER", "ICU", "PPE", "PPP", "SBA", "PPO", "HMO", "ACA", "HIPAA", "FERPA",
  "FOIA", "NEPA", "ADA", "OIRA", "OMB", "CBO", "GAO", "OPM", "GSA"
]);

/**
 * Apply spelling corrections to text
 */
function applySpellingCorrections(text: string): string {
  // Split into words while preserving punctuation and spaces
  const words = text.split(/\b/);

  return words.map(word => {
    const lowerWord = word.toLowerCase();

    // Check if this word needs correction
    if (SPELLING_CORRECTIONS[lowerWord]) {
      const correction = SPELLING_CORRECTIONS[lowerWord];

      // Preserve original capitalization pattern
      if (word === word.toUpperCase() && word.length > 1) {
        return correction.toUpperCase();
      } else if (word[0] === word[0].toUpperCase()) {
        return correction.charAt(0).toUpperCase() + correction.slice(1);
      }
      return correction;
    }

    return word;
  }).join("");
}

/**
 * Apply proper capitalization to text
 * - First letter of sentence is capitalized
 * - Preserves acronyms
 * - Handles "I" properly
 */
function applyCapitalization(text: string): string {
  if (!text) return text;

  // Split into words while preserving spaces and punctuation
  const words = text.split(/(\s+)/);
  let isStartOfSentence = true;

  return words.map((word, index) => {
    // Skip whitespace
    if (/^\s+$/.test(word)) {
      return word;
    }

    // Skip empty strings
    if (!word) return word;

    // Extract leading/trailing punctuation
    const leadingPunct = word.match(/^[^\w]*/)?.[0] || "";
    const trailingPunct = word.match(/[^\w]*$/)?.[0] || "";
    const coreWord = word.slice(leadingPunct.length, trailingPunct.length ? word.length - trailingPunct.length : undefined);

    if (!coreWord) return word;

    // Check if it's an acronym that should stay uppercase
    if (UPPERCASE_WORDS.has(coreWord.toUpperCase())) {
      const result = leadingPunct + coreWord.toUpperCase() + trailingPunct;
      isStartOfSentence = /[.!?]$/.test(trailingPunct);
      return result;
    }

    // Handle "I" - always capitalize when standalone
    if (coreWord.toLowerCase() === "i") {
      const result = leadingPunct + "I" + trailingPunct;
      isStartOfSentence = /[.!?]$/.test(trailingPunct);
      return result;
    }

    let processedWord: string;

    if (isStartOfSentence) {
      // Capitalize first letter of sentence
      processedWord = coreWord.charAt(0).toUpperCase() + coreWord.slice(1).toLowerCase();
    } else if (LOWERCASE_WORDS.has(coreWord.toLowerCase())) {
      // Keep small words lowercase
      processedWord = coreWord.toLowerCase();
    } else {
      // Keep word as-is or lowercase (preserve intentional caps)
      processedWord = coreWord.toLowerCase();
    }

    // Check if this ends a sentence
    isStartOfSentence = /[.!?]$/.test(trailingPunct);

    return leadingPunct + processedWord + trailingPunct;
  }).join("");
}

/**
 * Clean up whitespace in text
 * - Removes extra spaces
 * - Trims leading/trailing whitespace
 * - Normalizes space after punctuation
 */
function cleanWhitespace(text: string): string {
  return text
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    // Ensure space after punctuation (but not before)
    .replace(/\s*([.!?,;:])\s*/g, "$1 ")
    // Remove space before closing punctuation
    .replace(/\s+([.!?,;:])/g, "$1")
    // Trim
    .trim();
}

/**
 * Ensure the question ends with a question mark (if it's a question)
 */
function ensureQuestionMark(text: string): string {
  if (!text) return text;

  // Question words that indicate the text is a question
  const questionStarters = [
    "what", "why", "how", "when", "where", "who", "which", "whose", "whom",
    "can", "could", "would", "should", "will", "do", "does", "did", "is", "are",
    "was", "were", "has", "have", "had", "may", "might", "must"
  ];

  const trimmed = text.trim();
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^\w]/g, "");

  // Check if it starts with a question word
  const looksLikeQuestion = questionStarters.some(q => firstWord === q);

  // If it ends with a period and looks like a question, replace with question mark
  if (looksLikeQuestion && trimmed.endsWith(".")) {
    return trimmed.slice(0, -1) + "?";
  }

  // If it looks like a question and has no ending punctuation, add question mark
  if (looksLikeQuestion && !/[.!?]$/.test(trimmed)) {
    return trimmed + "?";
  }

  // If it doesn't look like a question and has no ending punctuation, leave as-is
  // (the user might be typing a statement or search query)

  return trimmed;
}

/**
 * Format a user-generated question title
 *
 * Applies:
 * 1. Whitespace cleanup
 * 2. Spelling corrections
 * 3. Proper capitalization
 * 4. Question mark normalization
 *
 * @param text - The raw user input
 * @returns The formatted text
 */
export function formatQuestionTitle(text: string): string {
  if (!text || typeof text !== "string") {
    return text;
  }

  let formatted = text;

  // Step 1: Clean whitespace first
  formatted = cleanWhitespace(formatted);

  // Step 2: Apply spelling corrections
  formatted = applySpellingCorrections(formatted);

  // Step 3: Apply capitalization
  formatted = applyCapitalization(formatted);

  // Step 4: Ensure proper ending punctuation
  formatted = ensureQuestionMark(formatted);

  return formatted;
}

/**
 * Check if text would be changed by formatting
 * Useful for showing preview or confirmation
 */
export function wouldFormatChange(text: string): boolean {
  if (!text) return false;
  return formatQuestionTitle(text) !== text.trim();
}

/**
 * Get a diff-like description of what formatting would change
 * Useful for showing the user what corrections were made
 */
export function getFormattingChanges(original: string): {
  hasChanges: boolean;
  formatted: string;
  changes: string[];
} {
  const formatted = formatQuestionTitle(original);
  const changes: string[] = [];

  if (formatted === original.trim()) {
    return { hasChanges: false, formatted, changes: [] };
  }

  // Detect what changed
  const originalTrimmed = original.trim();

  // Check for spelling changes
  const originalWords = originalTrimmed.toLowerCase().split(/\s+/);
  const formattedWords = formatted.toLowerCase().split(/\s+/);

  originalWords.forEach((word, i) => {
    const cleanWord = word.replace(/[^\w]/g, "");
    if (SPELLING_CORRECTIONS[cleanWord] && formattedWords[i]) {
      const cleanFormatted = formattedWords[i].replace(/[^\w]/g, "");
      if (cleanWord !== cleanFormatted) {
        changes.push(`Corrected "${cleanWord}" to "${cleanFormatted}"`);
      }
    }
  });

  // Check for capitalization changes
  if (originalTrimmed[0] !== originalTrimmed[0].toUpperCase() && formatted[0] === formatted[0].toUpperCase()) {
    changes.push("Capitalized first letter");
  }

  // Check for punctuation changes
  if (!originalTrimmed.endsWith("?") && formatted.endsWith("?")) {
    changes.push("Added question mark");
  }

  // Check for whitespace changes
  if (/\s{2,}/.test(originalTrimmed)) {
    changes.push("Removed extra spaces");
  }

  return { hasChanges: true, formatted, changes };
}
