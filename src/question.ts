import { CONFIG } from './config';

export type Operation = '+' | '−' | '×' | '÷';

export interface Question {
  text: string;
  answer: number;
  choices: number[];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLevelRange(level: number): [number, number] {
  if (level === 10) return [0, 99];
  return [(level - 1) * 10, level * 10 - 1];
}

function generateProblem(op: Operation, level: number): { a: number; b: number; op: Operation; answer: number } {
  switch (op) {
    case '+': {
      const [lo, hi] = getLevelRange(level);
      const a = randInt(lo, hi);
      const b = randInt(lo, hi);
      return { a, b, op, answer: a + b };
    }
    case '−': {
      const [lo, hi] = getLevelRange(level);
      const a = randInt(lo, hi);
      const b = randInt(lo, a < lo ? lo : Math.min(a, hi));
      return { a, b, op, answer: a - b };
    }
    case '×': {
      if (level <= 9) {
        const fixed = level;
        const other = randInt(1, 9);
        // Randomly swap for variety
        if (Math.random() < 0.5) {
          return { a: fixed, b: other, op, answer: fixed * other };
        }
        return { a: other, b: fixed, op, answer: other * fixed };
      }
      // Level 10: mixed review
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      return { a, b, op, answer: a * b };
    }
    case '÷': {
      if (level <= 9) {
        const divisor = level;
        const answer = randInt(1, 9);
        const dividend = divisor * answer;
        return { a: dividend, b: divisor, op, answer };
      }
      // Level 10: mixed review
      const b = randInt(1, 9);
      const answer = randInt(1, 9);
      const a = b * answer;
      return { a, b, op, answer };
    }
  }
}

function generateWrongAnswers(correct: number, count: number): number[] {
  const wrongs = new Set<number>();
  const spread = CONFIG.WRONG_ANSWER_SPREAD;

  while (wrongs.size < count) {
    let wrong: number;
    if (Math.random() < 0.5) {
      // Near the correct answer
      wrong = correct + randInt(-spread, spread);
    } else {
      // A bit farther away
      wrong = correct + randInt(-spread * 3, spread * 3);
    }
    if (wrong !== correct && wrong >= 0) {
      wrongs.add(wrong);
    }
  }
  return Array.from(wrongs);
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuestion(op: Operation, level: number): Question {
  const { a, b, op: usedOp, answer } = generateProblem(op, level);
  const text = `${a} ${usedOp} ${b}`;
  const wrongs = generateWrongAnswers(answer, CONFIG.WRONG_ANSWER_COUNT);
  const choices = shuffle([answer, ...wrongs]);
  return { text, answer, choices };
}
