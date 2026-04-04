export const CONFIG = {
  // Scoring
  CORRECT_POINTS: 3,
  CORRECT_BONUS_MAX: 3,
  WRONG_POINTS: -1,
  MAX_WRONG_PER_QUESTION: 2,
  SPEED_INCREMENT_THRESHOLD: 20,

  // Shape spawning
  MIN_SHAPES: 4,
  MAX_SHAPES: 6,
  SHAPE_MIN_RADIUS: 36,
  SHAPE_MAX_RADIUS: 48,
  SHAPE_PADDING: 20,

  // Speed (pixels per second)
  BASE_FALL_SPEED: 80,
  SPEED_MULTIPLIER: 1.25,

  // Timing
  SPAWN_DELAY_MS: 800,
  COUNTDOWN_SECONDS: 3,
  NEW_QUESTION_DELAY_MS: 600,

  // Level progression
  LEVELS_PER_OP: 10,
  LEVEL_UNLOCK_THRESHOLD: 40,

  // Number of wrong answers
  WRONG_ANSWER_COUNT: 3,
  WRONG_ANSWER_SPREAD: 5,

  // Colors for shapes
  SHAPE_COLORS: [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3',
    '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0',
  ],

  // UI
  BG_COLOR: '#1a1a2e',
  QUESTION_BG: '#16213e',
  TEXT_COLOR: '#eee',
  HUD_FONT_SIZE: 20,
  QUESTION_FONT_SIZE: 36,
  SHAPE_LABEL_FONT_SIZE: 22,
  TITLE_FONT_SIZE: 52,
  SUBTITLE_FONT_SIZE: 24,

  // User profiles
  MAX_USERNAME_LENGTH: 8,
  KEYPAD_ROWS: [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
    ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
    ['V', 'W', 'X', 'Y', 'Z', '1', '2'],
    ['3', '4', '5', '6', '7', '8', '9'],
    ['0', '⌫', 'OK'],
  ] as readonly string[][],

  // Operation order
  OP_ORDER: ['+', '−', '×', '÷'],
  CELEBRATION_DURATION_MS: 2500,
} as const;
