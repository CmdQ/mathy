export const CONFIG = {
  // Scoring
  CORRECT_POINTS: 3,
  WRONG_POINTS: -1,
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

  // Question generation ranges per operation
  ADD_RANGE: [1, 50] as const,
  SUB_RANGE: [1, 50] as const,
  MUL_RANGE: [2, 12] as const,
  DIV_RANGE: [2, 12] as const,

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
  HUD_FONT: 'bold 20px system-ui, sans-serif',
  QUESTION_FONT: 'bold 36px system-ui, sans-serif',
  SHAPE_LABEL_FONT: 'bold 22px system-ui, sans-serif',
  TITLE_FONT: 'bold 52px system-ui, sans-serif',
  SUBTITLE_FONT: '24px system-ui, sans-serif',

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

  // Operation unlocks
  OP_ORDER: ['+', '−', '×', '÷'] as readonly string[],
  UNLOCK_THRESHOLD: 75,
  CELEBRATION_DURATION_MS: 2500,
} as const;
