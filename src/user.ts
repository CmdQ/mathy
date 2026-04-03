import type { Operation } from './question';

export interface UserProfile {
  name: string;
  highScore: number;
  unlockedOps: Operation[];
}

const STORAGE_KEY = 'mathy-users';

export class UserStore {
  private profiles: UserProfile[] = [];

  constructor() {
    this.profiles = this.load();
  }

  list(): UserProfile[] {
    return [...this.profiles];
  }

  get(name: string): UserProfile | undefined {
    return this.profiles.find((p) => p.name === name);
  }

  create(name: string): UserProfile {
    const trimmed = name.trim().toUpperCase().slice(0, 8);
    if (!trimmed) throw new Error('Name cannot be empty');
    if (this.profiles.some((p) => p.name === trimmed)) {
      throw new Error('Name already exists');
    }
    const profile: UserProfile = {
      name: trimmed,
      highScore: 0,
      unlockedOps: ['+'],
    };
    this.profiles.push(profile);
    this.persist();
    return profile;
  }

  save(profile: UserProfile): void {
    const idx = this.profiles.findIndex((p) => p.name === profile.name);
    if (idx === -1) throw new Error('Profile not found');
    this.profiles[idx] = { ...profile };
    this.persist();
  }

  delete(name: string): void {
    this.profiles = this.profiles.filter((p) => p.name !== name);
    this.persist();
  }

  private load(): UserProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as UserProfile[];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
    } catch {
      // localStorage may not be available
    }
  }
}
