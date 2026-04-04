import { describe, it, expect } from 'vitest';
import { createQuestion } from './question';

describe('createQuestion', () => {
  it('returns a question with text, answer, and choices', () => {
    const q = createQuestion();
    expect(q.text).toBeTruthy();
    expect(typeof q.answer).toBe('number');
    expect(Array.isArray(q.choices)).toBe(true);
  });

  it('includes the correct answer in choices', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion();
      expect(q.choices).toContain(q.answer);
    }
  });

  it('has exactly 4 choices (1 correct + 3 wrong)', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion();
      expect(q.choices).toHaveLength(4);
    }
  });

  it('has all non-negative choices', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion();
      for (const c of q.choices) {
        expect(c).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('has no duplicate choices', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion();
      const unique = new Set(q.choices);
      expect(unique.size).toBe(q.choices.length);
    }
  });

  it('produces a non-negative answer', () => {
    for (let i = 0; i < 100; i++) {
      const q = createQuestion();
      expect(q.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('formats question text as "a op b"', () => {
    for (let i = 0; i < 50; i++) {
      const q = createQuestion();
      expect(q.text).toMatch(/^\d+ [+−×÷] \d+$/);
    }
  });

  it('only generates addition when filtered to +', () => {
    for (let i = 0; i < 30; i++) {
      const q = createQuestion(['+']);
      expect(q.text).toContain('+');
    }
  });

  it('only generates multiplication when filtered to ×', () => {
    for (let i = 0; i < 30; i++) {
      const q = createQuestion(['×']);
      expect(q.text).toContain('×');
    }
  });

  it('generates from multiple allowed ops', () => {
    const ops = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const q = createQuestion(['+', '−']);
      const match = q.text.match(/[+−]/);
      if (match) ops.add(match[0]);
    }
    expect(ops.size).toBe(2);
  });
});
