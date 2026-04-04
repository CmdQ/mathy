import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from './score';
import { UserStore } from './user';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

function makeScoreManager(): ScoreManager {
  const userStore = new UserStore();
  const profile = userStore.create('TEST');
  return new ScoreManager(userStore, profile);
}

describe('ScoreManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('starts with score 0 and level 1', () => {
    const sm = makeScoreManager();
    expect(sm.score).toBe(0);
    expect(sm.level).toBe(1);
  });

  it('adds 3 points for correct answer', () => {
    const sm = makeScoreManager();
    sm.addCorrect();
    expect(sm.score).toBe(3);
  });

  it('adds bonus points when provided', () => {
    const sm = makeScoreManager();
    sm.addCorrect(2); // 3 base + 2 bonus = 5
    expect(sm.score).toBe(5);
  });

  it('subtracts 1 point for wrong answer', () => {
    const sm = makeScoreManager();
    sm.addCorrect(); // score = 3
    sm.addWrong();   // score = 2
    expect(sm.score).toBe(2);
  });

  it('does not go below 0', () => {
    const sm = makeScoreManager();
    sm.addWrong();
    expect(sm.score).toBe(0);
  });

  it('levels up at 20 point threshold', () => {
    const sm = makeScoreManager();
    let leveledUp = false;
    for (let i = 0; i < 7; i++) {
      if (sm.addCorrect()) leveledUp = true;
    }
    expect(sm.score).toBe(21);
    expect(sm.level).toBe(2);
    expect(leveledUp).toBe(true);
  });

  it('returns false when no level change', () => {
    const sm = makeScoreManager();
    expect(sm.addCorrect()).toBe(false);
  });

  it('returns flat base fall speed when not all complete', () => {
    const sm = makeScoreManager();
    sm.setActiveLevel('+', 1);
    for (let i = 0; i < 7; i++) sm.addCorrect();
    const speed = sm.getFallSpeed(false);
    expect(speed).toBe(80); // BASE_FALL_SPEED
  });

  it('increases fall speed with level when all complete', () => {
    const sm = makeScoreManager();
    sm.setActiveLevel('+', 1);
    const speed1 = sm.getFallSpeed(true);
    for (let i = 0; i < 7; i++) sm.addCorrect();
    const speed2 = sm.getFallSpeed(true);
    expect(speed2).toBeGreaterThan(speed1);
  });

  it('resets score and level', () => {
    const sm = makeScoreManager();
    for (let i = 0; i < 10; i++) sm.addCorrect();
    sm.reset();
    expect(sm.score).toBe(0);
    expect(sm.level).toBe(1);
  });

  it('saves high score to user profile', () => {
    const userStore = new UserStore();
    const profile = userStore.create('SCORER');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveLevel('+', 1);
    for (let i = 0; i < 5; i++) sm.addCorrect();
    sm.saveHighScore();

    const saved = userStore.get('SCORER');
    expect(saved?.highScore).toBe(15);
  });

  it('does not overwrite a higher existing high score', () => {
    const userStore = new UserStore();
    const profile = userStore.create('SCORER');
    const sm1 = new ScoreManager(userStore, profile);
    sm1.setActiveLevel('+', 1);
    for (let i = 0; i < 10; i++) sm1.addCorrect();
    sm1.saveHighScore();

    const sm2 = new ScoreManager(userStore, userStore.get('SCORER')!);
    sm2.setActiveLevel('+', 1);
    for (let i = 0; i < 3; i++) sm2.addCorrect();
    sm2.saveHighScore();

    expect(userStore.get('SCORER')?.highScore).toBe(30);
  });
});

describe('ScoreManager level unlock detection', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns null when below threshold', () => {
    const userStore = new UserStore();
    const profile = userStore.create('LOW');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveLevel('+', 1);
    for (let i = 0; i < 13; i++) sm.addCorrect(); // score = 39
    expect(sm.checkUnlock()).toBeNull();
  });

  it('unlocks next level when threshold reached', () => {
    const userStore = new UserStore();
    const profile = userStore.create('UNLOCK');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveLevel('+', 1);
    // Score needs to reach 40 (LEVEL_UNLOCK_THRESHOLD)
    for (let i = 0; i < 14; i++) sm.addCorrect(); // score = 42
    const result = sm.checkUnlock();
    expect(result).not.toBeNull();
    expect(result!.type).toBe('level');
    if (result!.type === 'level') {
      expect(result!.unlockedLevel).toBe(2);
    }
    expect(result!.message).toBe('Level 2 Unlocked!');
  });

  it('persists level unlock to user profile', () => {
    const userStore = new UserStore();
    const profile = userStore.create('PERSIST');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveLevel('+', 1);
    for (let i = 0; i < 14; i++) sm.addCorrect();
    sm.checkUnlock();
    const saved = userStore.get('PERSIST');
    expect(saved?.progress['+'].unlockedLevel).toBe(2);
  });

  it('unlocks next op after completing level 10', () => {
    const userStore = new UserStore();
    const profile = userStore.create('OPUNLOCK');
    // Give them all 10 levels of addition
    profile.progress['+'].unlockedLevel = 10;
    userStore.save(profile);

    const sm = new ScoreManager(userStore, userStore.get('OPUNLOCK')!);
    sm.setActiveLevel('+', 10);
    for (let i = 0; i < 14; i++) sm.addCorrect(); // score = 42
    const result = sm.checkUnlock();
    expect(result).not.toBeNull();
    expect(result!.type).toBe('op');
    if (result!.type === 'op') {
      expect(result!.unlockedOp).toBe('−');
    }
    expect(result!.message).toBe('Subtraction Unlocked!');
  });

  it('only triggers unlock once per game', () => {
    const userStore = new UserStore();
    const profile = userStore.create('ONCE');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveLevel('+', 1);
    for (let i = 0; i < 14; i++) sm.addCorrect();
    expect(sm.checkUnlock()).not.toBeNull();
    expect(sm.checkUnlock()).toBeNull(); // second call returns null
  });

  it('does not unlock if next level already unlocked', () => {
    const userStore = new UserStore();
    const profile = userStore.create('ALREADY');
    profile.progress['+'].unlockedLevel = 5;
    userStore.save(profile);
    const sm = new ScoreManager(userStore, userStore.get('ALREADY')!);
    sm.setActiveLevel('+', 3); // playing level 3, but 4 already unlocked
    for (let i = 0; i < 14; i++) sm.addCorrect();
    expect(sm.checkUnlock()).toBeNull();
  });

  it('saves per-level best score', () => {
    const userStore = new UserStore();
    const profile = userStore.create('OPSCORE');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveLevel('+', 1);
    for (let i = 0; i < 5; i++) sm.addCorrect(); // score = 15
    sm.saveHighScore();
    const saved = userStore.get('OPSCORE');
    expect(saved?.progress['+'].levelBestScores[0]).toBe(15);
  });
});
