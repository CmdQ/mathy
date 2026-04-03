import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('UserStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('starts with empty list', () => {
    const store = new UserStore();
    expect(store.list()).toEqual([]);
  });

  it('creates a new user', () => {
    const store = new UserStore();
    const profile = store.create('Alice');
    expect(profile.name).toBe('ALICE');
    expect(profile.highScore).toBe(0);
    expect(profile.unlockedOps).toEqual(['+']);
  });

  it('lists created users', () => {
    const store = new UserStore();
    store.create('Alice');
    store.create('Bob');
    const names = store.list().map((p) => p.name);
    expect(names).toEqual(['ALICE', 'BOB']);
  });

  it('gets a user by name', () => {
    const store = new UserStore();
    store.create('Alice');
    expect(store.get('ALICE')?.name).toBe('ALICE');
  });

  it('returns undefined for unknown user', () => {
    const store = new UserStore();
    expect(store.get('NOBODY')).toBeUndefined();
  });

  it('prevents duplicate names', () => {
    const store = new UserStore();
    store.create('Alice');
    expect(() => store.create('alice')).toThrow('Name already exists');
  });

  it('prevents empty names', () => {
    const store = new UserStore();
    expect(() => store.create('   ')).toThrow('Name cannot be empty');
  });

  it('truncates names to 8 characters', () => {
    const store = new UserStore();
    const profile = store.create('ABCDEFGHIJK');
    expect(profile.name).toBe('ABCDEFGH');
  });

  it('saves profile updates', () => {
    const store = new UserStore();
    store.create('Alice');
    const profile = store.get('ALICE')!;
    profile.highScore = 99;
    store.save(profile);
    expect(store.get('ALICE')?.highScore).toBe(99);
  });

  it('deletes a user', () => {
    const store = new UserStore();
    store.create('Alice');
    store.create('Bob');
    store.delete('ALICE');
    expect(store.list()).toHaveLength(1);
    expect(store.get('ALICE')).toBeUndefined();
  });

  it('persists across instances', () => {
    const store1 = new UserStore();
    store1.create('Alice');
    store1.create('Bob');

    const store2 = new UserStore();
    expect(store2.list()).toHaveLength(2);
    expect(store2.get('ALICE')?.name).toBe('ALICE');
  });

  it('survives corrupted localStorage', () => {
    localStorageMock.setItem('mathy-users', 'not-json');
    const store = new UserStore();
    expect(store.list()).toEqual([]);
  });
});
