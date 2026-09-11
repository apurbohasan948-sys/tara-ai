/**
 * GameVoiceInputParser.ts
 * High-performance multilingual voice parser for TARA's Direct-Display Game System.
 *
 * Converts natural speech into structured game actions.
 * Supports:
 * - English
 * - Bangla (বাংলা)
 * - Banglish (Romanized Bengali)
 * - Spoken numbers (1 - 100)
 * - Simple grammatical variations and colloquial expressions
 *
 * ZERO random moves:
 * If an utterance does not match the active game's rules, it returns a structured
 * invalid result with gentle guidance so TARA can politely prompt the user.
 */

import { DirectGameType, ParsedGameAction, ParseResult } from './GameState';

export class GameVoiceInputParser {
  // English number words mapping
  private static readonly EN_NUMBERS: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
  };

  // Bangla script number mapping
  private static readonly BN_SCRIPT_NUMBERS: Record<string, number> = {
    '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4,
    '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9,
    '১০': 10, '১১': 11, '১২': 12, '১৩': 13, '১৪': 14,
    '১৫': 15, '১৬': 16, '১৭': 17, '১৮': 18, '১৯': 19,
    '২০': 20, '২১': 21, '২২': 22, '২৩': 23, '২৪': 24,
    '২৫': 25, '২৬': 26, '২৭': 27, '২৮': 28, '২৯': 29,
    '৩০': 30, '৩১': 31, '৩২': 32, '৩৩': 33, '৩৪': 34,
    '৩৫': 35, '৩৬': 36, '৩৭': 37, '৩৮': 38, '৩৯': 39,
    '৪০': 40, '৪১': 41, '৪২': 42, '৪৩': 43, '৪৪': 44,
    '৪৫': 45, '৪৬': 46, '৪৭': 47, '৪৮': 48, '৪৯': 49,
    '৫০': 50, '৫১': 51, '৫২': 52, '৫৩': 53, '৫৪': 54,
    '৫৫': 55, '৫৬': 56, '৫৭': 57, '৫৮': 58, '৫৯': 59,
    '৬০': 60, '৬১': 61, '৬২': 62, '৬৩': 63, '৬৪': 64,
    '৬৫': 65, '৬৬': 66, '৬৭': 67, '৬৮': 68, '৬৯': 69,
    '৭০': 70, '৭১': 71, '৭২': 72, '৭৩': 73, '৭৪': 74,
    '৭৫': 75, '৭৬': 76, '৭৭': 77, '৭৮': 78, '৭৯': 79,
    '৮০': 80, '৮১': 81, '৮২': 82, '৮৩': 83, '৮৪': 84,
    '৮৫': 85, '৮৬': 86, '৮৭': 87, '৮৮': 88, '৮৯': 89,
    '৯০': 90, '৯১': 91, '৯২': 92, '৯৩': 93, '৯৪': 94,
    '৯৫': 95, '৯৬': 96, '৯৭': 97, '৯৮': 98, '৯৯': 99,
    '১০০': 100,
  };

  // Bangla spoken words mapping
  private static readonly BN_WORD_NUMBERS: Record<string, number> = {
    'শূন্য': 0,
    'এক': 1,
    'দুই': 2,
    'তিন': 3,
    'চার': 4,
    'পাঁচ': 5,
    'ছয়': 6,
    'ছয়': 6,
    'সাত': 7,
    'আট': 8,
    'নয়': 9,
    'নয়': 9,
    'দশ': 10,
    'এগারো': 11,
    'বারো': 12,
    'তেরো': 13,
    'চৌদ্দ': 14,
    'পনেরো': 15,
    'ষোলো': 16,
    'সতেরো': 17,
    'আঠারো': 18,
    'উনিশ': 19,
    'বিশ': 20,
    'কুড়ি': 20,
    'তিরিশ': 30,
    'চল্লিশ': 40,
    'বিয়াল্লিশ': 42,
    'বায়াল্লিশ': 42,
    'পঞ্চাশ': 50,
    'ষাট': 60,
    'সত্তর': 70,
    'আশি': 80,
    'নব্বই': 90,
    'একশত': 100,
    'একশো': 100,
    'শো': 100,
  };

  // Banglish phonetic mapping
  private static readonly BANGLISH_NUMBERS: Record<string, number> = {
    shunno: 0,
    ek: 1,
    dui: 2,
    tin: 3,
    teen: 3,
    char: 4,
    chaar: 4,
    paach: 5,
    panch: 5,
    pach: 5,
    choy: 6,
    saat: 7,
    sat: 7,
    aat: 8,
    at: 8,
    noy: 9,
    dosh: 10,
    egaro: 11,
    baro: 12,
    tero: 13,
    chouddo: 14,
    ponero: 15,
    sholo: 16,
    shotero: 17,
    atharo: 18,
    unish: 19,
    bish: 20,
    kuri: 20,
    tirish: 30,
    chollish: 40,
    biyallish: 42,
    bayallish: 42,
    ponchash: 50,
    shat: 60,
    shottor: 70,
    ashi: 80,
    nobboi: 90,
    eksho: 100,
  };

  /**
   * Main parsing entry point: converts natural speech transcript into a structured game action.
   */
  public static parseInput(rawText: string, activeGame: DirectGameType): ParseResult {
    const text = (rawText || '').trim().toLowerCase();
    const detectedLang = this.detectLanguage(text);

    if (!text) {
      return {
        valid: false,
        action: { type: 'UNKNOWN', raw: '' },
        rawInput: '',
        language: 'en',
        confidence: 0,
        reason: 'Empty speech received',
        guidance: 'Please speak clearly into the microphone.',
      };
    }

    // 1. Check Global Meta Controls (Restart, Exit, Yes, No)
    const metaAction = this.parseMetaCommands(text);
    if (metaAction) {
      return {
        valid: true,
        action: metaAction,
        rawInput: rawText,
        language: detectedLang,
        confidence: 0.95,
      };
    }

    // 2. Dispatch to Game-Specific Parsing Rule
    switch (activeGame) {
      case 'TIC_TAC_TOE':
        return this.parseTicTacToe(text, rawText, detectedLang);

      case 'ROCK_PAPER_SCISSORS':
        return this.parseRockPaperScissors(text, rawText, detectedLang);

      case 'GUESS_NUMBER':
        return this.parseGuessNumber(text, rawText, detectedLang);

      case 'HIGHER_LOWER':
        return this.parseHigherLower(text, rawText, detectedLang);

      case 'MEMORY_MATCH':
        return this.parseMemoryMatch(text, rawText, detectedLang);

      case 'CONNECT_FOUR':
        return this.parseConnectFour(text, rawText, detectedLang);

      case 'PATTERN_MEMORY':
        return this.parsePatternMemory(text, rawText, detectedLang);

      case 'REACTION':
      case 'QUICK_REACTION':
        return this.parseReactionTrigger(text, rawText, detectedLang);

      case 'SIMON_SAYS':
        return this.parseSimonSays(text, rawText, detectedLang);

      case 'DICE_GAME':
        return this.parseDiceGame(text, rawText, detectedLang);

      case 'NONE':
      default:
        return {
          valid: false,
          action: { type: 'UNKNOWN', raw: text },
          rawInput: rawText,
          language: detectedLang,
          confidence: 0.2,
          reason: 'No game is currently running',
          guidance: 'Say "play tic-tac-toe" or choose a game to begin.',
        };
    }
  }

  // ==========================================
  // PARSING RULES FOR INDIVIDUAL GAMES
  // ==========================================

  /**
   * TIC-TAC-TOE: Expects position 1 - 9
   * Examples: "five", "পাঁচ", "৫", "number five", "৫ নম্বর", "paach", "box 3"
   */
  private static parseTicTacToe(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    const num = this.extractFirstNumber(text);

    if (num !== null && num >= 1 && num <= 9) {
      return {
        valid: true,
        action: { type: 'PLACE_MARK', position: num },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.3,
      reason: 'Invalid Tic-Tac-Toe position',
      guidance: 'Say a position number from 1 to 9 (e.g. "five" or "পাঁচ").',
    };
  }

  /**
   * ROCK PAPER SCISSORS
   * Examples: "rock", "paper", "scissors", "পাথর", "কাগজ", "কাঁচি", "pathor", "kagoj", "kachi"
   */
  private static parseRockPaperScissors(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    // Rock keywords
    if (/\b(rock|stone|পাথর|pathor|fist|মুঠি)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'RPS_CHOICE', choice: 'rock' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    // Paper keywords
    if (/\b(paper|sheet|কাগজ|kagoj|kagoz|open hand)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'RPS_CHOICE', choice: 'paper' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    // Scissors keywords
    if (/\b(scissors|scissor|কাঁচি|কাচি|kachi|kaachi|cutter)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'RPS_CHOICE', choice: 'scissors' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.3,
      reason: 'Unrecognized Rock Paper Scissors move',
      guidance: 'Say "rock", "paper", or "scissors" (or "পাথর", "কাগজ", "কাঁচি").',
    };
  }

  /**
   * GUESS THE NUMBER: Expects number between 1 and 100
   * Examples: "42", "বিয়াল্লিশ", "forty two", "biyallish"
   */
  private static parseGuessNumber(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    const num = this.extractFirstNumber(text);

    if (num !== null && num >= 1 && num <= 100) {
      return {
        valid: true,
        action: { type: 'GUESS_NUMBER', value: num },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.2,
      reason: 'Number out of 1-100 range or not understood',
      guidance: 'Say any number between 1 and 100 (e.g. "forty two" or "বিয়াল্লিশ").',
    };
  }

  /**
   * HIGHER / LOWER
   * Examples: "higher", "high", "up", "boro", "upore", "বেশি", "বড়" / "lower", "low", "down", "choto", "niche", "কম", "ছোট"
   */
  private static parseHigherLower(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    if (/\b(higher|high|up|upward|more|greater|বেশি|বড়|boro|upore|beshi|uporer)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'PREDICT_HIGH_LOW', prediction: 'higher' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    if (/\b(lower|low|down|downward|less|smaller|কম|ছোট|choto|niche|kom|nicher)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'PREDICT_HIGH_LOW', prediction: 'lower' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.3,
      reason: 'Expected Higher or Lower',
      guidance: 'Say "higher" (বেশি) or "lower" (কম).',
    };
  }

  /**
   * MEMORY MATCH: Expects card index 1 to 12
   * Examples: "card three", "three", "কার্ড তিন", "৩", "card 7", "সাত"
   */
  private static parseMemoryMatch(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    const num = this.extractFirstNumber(text);

    if (num !== null && num >= 1 && num <= 12) {
      return {
        valid: true,
        action: { type: 'SELECT_CARD', cardIndex: num },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.2,
      reason: 'Card index must be 1 to 12',
      guidance: 'Say a card number from 1 to 12 (e.g. "card three" or "কার্ড তিন").',
    };
  }

  /**
   * CONNECT FOUR: Expects column 1 to 7
   * Examples: "column four", "four", "চার নম্বর কলাম", "৪", "char"
   */
  private static parseConnectFour(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    const num = this.extractFirstNumber(text);

    if (num !== null && num >= 1 && num <= 7) {
      return {
        valid: true,
        action: { type: 'DROP_COLUMN', column: num },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.2,
      reason: 'Column number must be 1 to 7',
      guidance: 'Say a column number from 1 to 7 (e.g. "column four" or "চার নম্বর কলাম").',
    };
  }

  /**
   * PATTERN MEMORY: Expects sequence of digits
   * Examples: "one three five two", "1 3 5 2", "এক তিন পাঁচ দুই", "1, 3, 5, 2"
   */
  private static parsePatternMemory(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    const sequence = this.extractAllNumbers(text);

    if (sequence.length > 0) {
      return {
        valid: true,
        action: { type: 'REPEAT_PATTERN', sequence },
        rawInput: raw,
        language: lang,
        confidence: 0.9,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.2,
      reason: 'No numbers detected in pattern repetition',
      guidance: 'Repeat the pattern numbers in order (e.g. "one three five two" or "এক তিন পাঁচ দুই").',
    };
  }

  /**
   * REACTION GAME: Trigger word
   * Examples: "GO", "NOW", "চল", "এখন", "chol", "ekhon", "hit", "press"
   */
  private static parseReactionTrigger(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    if (/\b(go|now|চল|এখন|chol|ekhon|hit|tap|action|fast|ready)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'REACTION_TRIGGER' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.3,
      reason: 'Reaction trigger word not matched',
      guidance: 'Say "GO" or "NOW" (or "চল" / "এখন") immediately when the signal appears!',
    };
  }

  /**
   * SIMON SAYS: Specific physical or voice actions
   * Examples: "wave", "clap", "thumbs up", "raise hand", "jump", "হাততালি", "হাত নাড়ো"
   */
  private static parseSimonSays(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    if (/\b(wave|হাত নাড়ো|hat naro)\b/i.test(text)) {
      return { valid: true, action: { type: 'SIMON_ACTION', action: 'WAVE' }, rawInput: raw, language: lang, confidence: 0.95 };
    }
    if (/\b(clap|হাততালি|hat tali)\b/i.test(text)) {
      return { valid: true, action: { type: 'SIMON_ACTION', action: 'CLAP' }, rawInput: raw, language: lang, confidence: 0.95 };
    }
    if (/\b(thumbs up|সাবাশ|sabash)\b/i.test(text)) {
      return { valid: true, action: { type: 'SIMON_ACTION', action: 'THUMBS_UP' }, rawInput: raw, language: lang, confidence: 0.95 };
    }
    if (/\b(raise hand|হাত তোলো|hat tolo)\b/i.test(text)) {
      return { valid: true, action: { type: 'SIMON_ACTION', action: 'RAISE_HAND' }, rawInput: raw, language: lang, confidence: 0.95 };
    }
    if (/\b(point up|up|উপরে|upore)\b/i.test(text)) {
      return { valid: true, action: { type: 'SIMON_ACTION', action: 'POINT_UP' }, rawInput: raw, language: lang, confidence: 0.95 };
    }
    if (/\b(jump|লাফাও|lafao)\b/i.test(text)) {
      return { valid: true, action: { type: 'SIMON_ACTION', action: 'JUMP' }, rawInput: raw, language: lang, confidence: 0.95 };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.25,
      reason: 'Action does not match Simon Says command list',
      guidance: 'Say the requested action like "wave", "clap", or "thumbs up".',
    };
  }

  /**
   * DICE GAME: Roll command
   * Examples: "roll", "roll the dice", "ডাইস ফেলো", "ডাইস মারো", "ঘুরাও", "chal"
   */
  private static parseDiceGame(text: string, raw: string, lang: 'en' | 'bn' | 'banglish'): ParseResult {
    if (/\b(roll|dice|roll the dice|throw|ডাইস|ফেলো|মারো|চাল|ঘুরাও|chal|maro|felo)\b/i.test(text)) {
      return {
        valid: true,
        action: { type: 'ROLL_DICE' },
        rawInput: raw,
        language: lang,
        confidence: 0.95,
      };
    }

    return {
      valid: false,
      action: { type: 'UNKNOWN', raw: text },
      rawInput: raw,
      language: lang,
      confidence: 0.3,
      reason: 'Dice roll command not recognized',
      guidance: 'Say "roll" or "roll the dice" (or "ডাইস ফেলো").',
    };
  }

  // ==========================================
  // META CONTROLS (RESTART, EXIT, YES, NO)
  // ==========================================
  private static parseMetaCommands(text: string): ParsedGameAction | null {
    // Restart / Play Again
    if (/\b(restart|play again|again|reset|আবার|আবার খেলব|নতুন খেলা|abar|notun)\b/i.test(text)) {
      return { type: 'RESTART_GAME' };
    }

    // Exit / Quit / Stop
    if (/\b(exit|quit|stop|leave|close|বন্ধ|বাহির|থাক|na thak|bondho)\b/i.test(text)) {
      return { type: 'EXIT_GAME' };
    }

    // Yes / Confirm
    if (/\b(yes|yeah|yep|sure|ok|okay|play|start|let's play|হ্যাঁ|হাঁ|খেলব|চল খেলি|hyan|khelbo|shuru)\b/i.test(text)) {
      return { type: 'CONFIRM_YES' };
    }

    // No / Decline
    if (/\b(no|nope|cancel|না|না খেলব না|থাক|na)\b/i.test(text)) {
      return { type: 'CONFIRM_NO' };
    }

    return null;
  }

  // ==========================================
  // MULTILINGUAL NUMBER EXTRACTION HELPERS
  // ==========================================

  /**
   * Extracts the first valid integer from the utterance.
   */
  public static extractFirstNumber(text: string): number | null {
    const list = this.extractAllNumbers(text);
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Extracts all integers from text across English, Bangla script, and Banglish words.
   */
  public static extractAllNumbers(text: string): number[] {
    const clean = text.replace(/[,.-]/g, ' ').toLowerCase();
    const tokens = clean.split(/\s+/).filter(Boolean);
    const results: number[] = [];

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      // 1. Direct ASCII Arabic digits (e.g. "42", "5")
      const digitMatch = token.match(/^\d+$/);
      if (digitMatch) {
        results.push(parseInt(digitMatch[0], 10));
        i++;
        continue;
      }

      // 2. Bangla script digits or words (e.g. "৪২", "৫", "পাঁচ", "বিয়াল্লিশ")
      if (this.BN_SCRIPT_NUMBERS[token] !== undefined) {
        results.push(this.BN_SCRIPT_NUMBERS[token]);
        i++;
        continue;
      }
      if (this.BN_WORD_NUMBERS[token] !== undefined) {
        results.push(this.BN_WORD_NUMBERS[token]);
        i++;
        continue;
      }

      // 3. Banglish words (e.g. "paach", "biyallish")
      if (this.BANGLISH_NUMBERS[token] !== undefined) {
        results.push(this.BANGLISH_NUMBERS[token]);
        i++;
        continue;
      }

      // 4. English words (handle two-word compounds like "forty two")
      if (this.EN_NUMBERS[token] !== undefined) {
        const val = this.EN_NUMBERS[token];
        // Check compound like "forty two"
        if (val >= 20 && val <= 90 && i + 1 < tokens.length) {
          const nextToken = tokens[i + 1];
          if (this.EN_NUMBERS[nextToken] !== undefined && this.EN_NUMBERS[nextToken] < 10) {
            results.push(val + this.EN_NUMBERS[nextToken]);
            i += 2;
            continue;
          }
        }
        results.push(val);
        i++;
        continue;
      }

      i++;
    }

    return results;
  }

  /**
   * Detects language family of the transcript.
   */
  private static detectLanguage(text: string): 'en' | 'bn' | 'banglish' {
    // Bengali Unicode block range: \u0980-\u09FF
    if (/[\u0980-\u09FF]/.test(text)) {
      return 'bn';
    }
    // Banglish markers
    if (/\b(ek|dui|tin|char|paach|choy|saat|aat|noy|dosh|pathor|kagoj|kachi|boro|choto|upore|niche|khelbo|chol|ekhon)\b/i.test(text)) {
      return 'banglish';
    }
    return 'en';
  }
}
