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
    return this.profiles.map((p) => ({ ...p, unlockedOps: [...p.unlockedOps] }));
  }

  get(name: string): UserProfile | undefined {
    const p = this.profiles.find((p) => p.name === name);
    if (!p) return undefined;
    return { ...p, unlockedOps: [...p.unlockedOps] };
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
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.map((p: unknown) => this.sanitize(p)).filter((p): p is UserProfile => p !== null);
    } catch {
      return [];
    }
  }

  private sanitize(raw: unknown): UserProfile | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const name = typeof obj.name === 'string' ? obj.name.trim().toUpperCase().slice(0, 8) : '';
    if (!name) return null;
    const validOps: Operation[] = ['+', '−', '×', '÷'];
    const unlockedOps = Array.isArray(obj.unlockedOps)
      ? (obj.unlockedOps as unknown[]).filter((op): op is Operation => validOps.includes(op as Operation))
      : ['+' as Operation];
    return {
      name,
      highScore: typeof obj.highScore === 'number' && isFinite(obj.highScore) ? Math.max(0, obj.highScore) : 0,
      unlockedOps: unlockedOps.length > 0 ? unlockedOps : ['+'],
    };
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
    } catch {
      // localStorage may not be available
    }
  }
}
