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

function generateProblem(): { a: number; b: number; op: Operation; answer: number } {
  const ops: Operation[] = ['+', '−', '×', '÷'];
  const op = ops[randInt(0, ops.length - 1)];

  switch (op) {
    case '+': {
      const a = randInt(...CONFIG.ADD_RANGE);
      const b = randInt(...CONFIG.ADD_RANGE);
      return { a, b, op, answer: a + b };
    }
    case '−': {
      const a = randInt(...CONFIG.SUB_RANGE);
      const b = randInt(1, a); // ensure non-negative result
      return { a, b, op, answer: a - b };
    }
    case '×': {
      const a = randInt(...CONFIG.MUL_RANGE);
      const b = randInt(...CONFIG.MUL_RANGE);
      return { a, b, op, answer: a * b };
    }
    case '÷': {
      const b = randInt(...CONFIG.DIV_RANGE);
      const answer = randInt(1, 10);
      const a = b * answer; // ensure clean division
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

export function createQuestion(): Question {
  const { a, b, op, answer } = generateProblem();
  const text = `${a} ${op} ${b}`;
  const wrongs = generateWrongAnswers(answer, CONFIG.WRONG_ANSWER_COUNT);
  const choices = shuffle([answer, ...wrongs]);
  return { text, answer, choices };
}
