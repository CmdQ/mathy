import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from './score';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

describe('ScoreManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('starts with score 0 and level 1', () => {
    const sm = new ScoreManager();
    expect(sm.score).toBe(0);
    expect(sm.level).toBe(1);
  });

  it('adds 3 points for correct answer', () => {
    const sm = new ScoreManager();
    sm.addCorrect();
    expect(sm.score).toBe(3);
  });

  it('subtracts 1 point for wrong answer', () => {
    const sm = new ScoreManager();
    sm.addCorrect(); // score = 3
    sm.addWrong();   // score = 2
    expect(sm.score).toBe(2);
  });

  it('does not go below 0', () => {
    const sm = new ScoreManager();
    sm.addWrong();
    expect(sm.score).toBe(0);
  });

  it('levels up at 20 point threshold', () => {
    const sm = new ScoreManager();
    let leveledUp = false;
    // 7 correct = 21 points → level 2
    for (let i = 0; i < 7; i++) {
      if (sm.addCorrect()) leveledUp = true;
    }
    expect(sm.score).toBe(21);
    expect(sm.level).toBe(2);
    expect(leveledUp).toBe(true);
  });

  it('returns false when no level change', () => {
    const sm = new ScoreManager();
    expect(sm.addCorrect()).toBe(false); // score 3, still level 1
  });

  it('increases fall speed with level', () => {
    const sm = new ScoreManager();
    const speed1 = sm.getFallSpeed();
    // Get to level 2
    for (let i = 0; i < 7; i++) sm.addCorrect();
    const speed2 = sm.getFallSpeed();
    expect(speed2).toBeGreaterThan(speed1);
  });

  it('resets score and level', () => {
    const sm = new ScoreManager();
    for (let i = 0; i < 10; i++) sm.addCorrect();
    sm.reset();
    expect(sm.score).toBe(0);
    expect(sm.level).toBe(1);
  });

  it('saves and loads high score', () => {
    const sm1 = new ScoreManager();
    for (let i = 0; i < 5; i++) sm1.addCorrect(); // score = 15
    sm1.saveHighScore();

    const sm2 = new ScoreManager();
    expect(sm2.highScore).toBe(15);
  });

  it('does not overwrite a higher existing high score', () => {
    const sm1 = new ScoreManager();
    for (let i = 0; i < 10; i++) sm1.addCorrect(); // score = 30
    sm1.saveHighScore();

    const sm2 = new ScoreManager();
    for (let i = 0; i < 3; i++) sm2.addCorrect(); // score = 9
    sm2.saveHighScore();

    const sm3 = new ScoreManager();
    expect(sm3.highScore).toBe(30);
  });
});
