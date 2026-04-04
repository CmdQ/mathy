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

  it('increases fall speed with level', () => {
    const sm = makeScoreManager();
    const speed1 = sm.getFallSpeed();
    for (let i = 0; i < 7; i++) sm.addCorrect();
    const speed2 = sm.getFallSpeed();
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
    for (let i = 0; i < 5; i++) sm.addCorrect();
    sm.saveHighScore();

    const saved = userStore.get('SCORER');
    expect(saved?.highScore).toBe(15);
  });

  it('does not overwrite a higher existing high score', () => {
    const userStore = new UserStore();
    const profile = userStore.create('SCORER');
    const sm1 = new ScoreManager(userStore, profile);
    for (let i = 0; i < 10; i++) sm1.addCorrect();
    sm1.saveHighScore();

    const sm2 = new ScoreManager(userStore, userStore.get('SCORER')!);
    for (let i = 0; i < 3; i++) sm2.addCorrect();
    sm2.saveHighScore();

    expect(userStore.get('SCORER')?.highScore).toBe(30);
  });
});

describe('ScoreManager unlock detection', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('returns null when not using single op', () => {
    const userStore = new UserStore();
    const profile = userStore.create('MULTI');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveOps(['+', '−']);
    for (let i = 0; i < 25; i++) sm.addCorrect(); // score = 75
    expect(sm.checkUnlock()).toBeNull();
  });

  it('returns null when below threshold', () => {
    const userStore = new UserStore();
    const profile = userStore.create('LOW');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveOps(['+']);
    for (let i = 0; i < 24; i++) sm.addCorrect(); // score = 72
    expect(sm.checkUnlock()).toBeNull();
  });

  it('unlocks next op when threshold reached on single op', () => {
    const userStore = new UserStore();
    const profile = userStore.create('UNLOCK');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveOps(['+']);
    for (let i = 0; i < 25; i++) sm.addCorrect(); // score = 75
    const result = sm.checkUnlock();
    expect(result).not.toBeNull();
    expect(result!.unlocked).toBe('−');
  });

  it('persists unlock to user profile', () => {
    const userStore = new UserStore();
    const profile = userStore.create('PERSIST');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveOps(['+']);
    for (let i = 0; i < 25; i++) sm.addCorrect();
    sm.checkUnlock();
    const saved = userStore.get('PERSIST');
    expect(saved?.unlockedOps).toContain('−');
  });

  it('only triggers unlock once per game', () => {
    const userStore = new UserStore();
    const profile = userStore.create('ONCE');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveOps(['+']);
    for (let i = 0; i < 25; i++) sm.addCorrect();
    expect(sm.checkUnlock()).not.toBeNull();
    expect(sm.checkUnlock()).toBeNull(); // second call returns null
  });

  it('does not unlock if already unlocked', () => {
    const userStore = new UserStore();
    const profile = userStore.create('ALREADY');
    profile.unlockedOps = ['+', '−'];
    userStore.save(profile);
    const sm = new ScoreManager(userStore, userStore.get('ALREADY')!);
    sm.setActiveOps(['+']);
    for (let i = 0; i < 25; i++) sm.addCorrect();
    expect(sm.checkUnlock()).toBeNull();
  });

  it('saves per-op best score for single-op games', () => {
    const userStore = new UserStore();
    const profile = userStore.create('OPSCORE');
    const sm = new ScoreManager(userStore, profile);
    sm.setActiveOps(['+']);
    for (let i = 0; i < 5; i++) sm.addCorrect(); // score = 15
    sm.saveHighScore();
    const saved = userStore.get('OPSCORE');
    expect(saved?.opBestScores['+']).toBe(15);
  });
});
