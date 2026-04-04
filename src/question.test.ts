import { describe, it, expect } from 'vitest';
import { createQuestion } from './question';

describe('createQuestion', () => {
  it('returns a question with text, answer, and choices', () => {
    const q = createQuestion('+', 1);
    expect(q.text).toBeTruthy();
    expect(typeof q.answer).toBe('number');
    expect(Array.isArray(q.choices)).toBe(true);
  });

  it('includes the correct answer in choices', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion('+', 1);
      expect(q.choices).toContain(q.answer);
    }
  });

  it('has exactly 4 choices (1 correct + 3 wrong)', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion('+', 1);
      expect(q.choices).toHaveLength(4);
    }
  });

  it('has all non-negative choices', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('+', 1);
      for (const c of q.choices) {
        expect(c).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('has no duplicate choices', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion('+', 1);
      const unique = new Set(q.choices);
      expect(unique.size).toBe(q.choices.length);
    }
  });

  it('produces a non-negative answer', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('−', 3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('formats question text as "a op b"', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion('+', 5);
      expect(q.text).toMatch(/^\d+ [+−×÷] \d+$/);
    }
  });

  it('generates addition questions with + operator', () => {
    for (let i = 0; i < 30; i++) {
      const q = createQuestion('+', 1);
      expect(q.text).toContain('+');
    }
  });

  it('generates multiplication questions with × operator', () => {
    for (let i = 0; i < 30; i++) {
      const q = createQuestion('×', 3);
      expect(q.text).toContain('×');
    }
  });
});

describe('createQuestion level ranges', () => {
  it('addition level 3 uses operands in 20-29', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('+', 3);
      const parts = q.text.split(' ');
      const a = parseInt(parts[0]);
      const b = parseInt(parts[2]);
      expect(a).toBeGreaterThanOrEqual(20);
      expect(a).toBeLessThanOrEqual(29);
      expect(b).toBeGreaterThanOrEqual(20);
      expect(b).toBeLessThanOrEqual(29);
    }
  });

  it('addition level 10 uses full range 0-99', () => {
    const values = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const q = createQuestion('+', 10);
      const parts = q.text.split(' ');
      values.add(parseInt(parts[0]));
      values.add(parseInt(parts[2]));
    }
    // Should have values from low and high ranges
    expect([...values].some((v) => v < 10)).toBe(true);
    expect([...values].some((v) => v >= 50)).toBe(true);
  });

  it('subtraction produces non-negative results', () => {
    for (let i = 0; i < 200; i++) {
      const q = createQuestion('−', 5);
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('multiplication level 5 always has factor 5', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('×', 5);
      const parts = q.text.split(' ');
      const a = parseInt(parts[0]);
      const b = parseInt(parts[2]);
      expect(a === 5 || b === 5).toBe(true);
    }
  });

  it('multiplication level 10 uses both operands 1-9', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('×', 10);
      const parts = q.text.split(' ');
      const a = parseInt(parts[0]);
      const b = parseInt(parts[2]);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
    }
  });

  it('division level 3 uses divisor 3', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('÷', 3);
      const parts = q.text.split(' ');
      const b = parseInt(parts[2]);
      expect(b).toBe(3);
      // Result should be clean
      expect(q.answer).toBe(Math.floor(q.answer));
    }
  });

  it('division level 10 uses divisor 1-9 and answer 1-9', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion('÷', 10);
      const parts = q.text.split(' ');
      const b = parseInt(parts[2]);
      expect(b).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(q.answer).toBeGreaterThanOrEqual(1);
      expect(q.answer).toBeLessThanOrEqual(9);
    }
  });
});
