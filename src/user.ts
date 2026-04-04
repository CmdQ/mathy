import type { Operation } from './question';

export interface OpProgress {
  unlockedLevel: number; // 0 = op locked, 1-10 = highest unlocked level
  levelBestScores: number[]; // index 0 = level 1 best score, etc.
}

export interface UserProfile {
  name: string;
  highScore: number;
  progress: Record<Operation, OpProgress>;
}

function defaultProgress(): Record<Operation, OpProgress> {
  return {
    '+': { unlockedLevel: 1, levelBestScores: [] },
    '−': { unlockedLevel: 0, levelBestScores: [] },
    '×': { unlockedLevel: 0, levelBestScores: [] },
    '÷': { unlockedLevel: 0, levelBestScores: [] },
  };
}

const STORAGE_KEY = 'mathy-users';

export class UserStore {
  private profiles: UserProfile[] = [];

  constructor() {
    this.profiles = this.load();
  }

  list(): UserProfile[] {
    return this.profiles.map((p) => ({
      ...p,
      progress: cloneProgress(p.progress),
    }));
  }

  get(name: string): UserProfile | undefined {
    const p = this.profiles.find((p) => p.name === name);
    if (!p) return undefined;
    return { ...p, progress: cloneProgress(p.progress) };
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
      progress: defaultProgress(),
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
    let progress: Record<Operation, OpProgress>;

    // Migration from old unlockedOps format
    if (Array.isArray(obj.unlockedOps)) {
      progress = defaultProgress();
      const unlockedOps = (obj.unlockedOps as unknown[]).filter(
        (op): op is Operation => validOps.includes(op as Operation),
      );
      for (const op of unlockedOps) {
        progress[op] = { unlockedLevel: 10, levelBestScores: [] };
      }
      // Addition always gets at least 1
      if (progress['+'].unlockedLevel === 0) {
        progress['+'].unlockedLevel = 1;
      }
    } else if (obj.progress && typeof obj.progress === 'object') {
      progress = defaultProgress();
      const rawProgress = obj.progress as Record<string, unknown>;
      for (const op of validOps) {
        const entry = rawProgress[op];
        if (entry && typeof entry === 'object') {
          const e = entry as Record<string, unknown>;
          const ul = typeof e.unlockedLevel === 'number' && isFinite(e.unlockedLevel)
            ? Math.max(0, Math.min(10, Math.floor(e.unlockedLevel)))
            : 0;
          const scores = Array.isArray(e.levelBestScores)
            ? (e.levelBestScores as unknown[]).map((v) =>
                typeof v === 'number' && isFinite(v) ? Math.max(0, v) : 0,
              ).slice(0, 10)
            : [];
          progress[op] = { unlockedLevel: ul, levelBestScores: scores };
        }
      }
      // Addition always gets at least 1
      if (progress['+'].unlockedLevel === 0) {
        progress['+'].unlockedLevel = 1;
      }
    } else {
      progress = defaultProgress();
    }

    return {
      name,
      highScore: typeof obj.highScore === 'number' && isFinite(obj.highScore) ? Math.max(0, obj.highScore) : 0,
      progress,
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

function cloneProgress(p: Record<Operation, OpProgress>): Record<Operation, OpProgress> {
  const result = {} as Record<Operation, OpProgress>;
  for (const op of ['+', '−', '×', '÷'] as Operation[]) {
    result[op] = { unlockedLevel: p[op].unlockedLevel, levelBestScores: [...p[op].levelBestScores] };
  }
  return result;
}
