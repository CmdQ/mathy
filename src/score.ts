import { CONFIG } from './config';
import type { Operation } from './question';
import { UserProfile, UserStore } from './user';

export type UnlockResult =
  | { type: 'level'; unlockedOp: Operation; unlockedLevel: number; message: string }
  | { type: 'op'; unlockedOp: Operation; message: string }
  | { type: 'all-complete'; message: string };

export class ScoreManager {
  score = 0;
  highScore: number;
  level = 1;
  private prevLevel = 1;
  private userStore: UserStore;
  private profile: UserProfile;
  private activeOp: Operation = '+';
  private activeLevel = 1;
  private unlockChecked = false;

  constructor(userStore: UserStore, profile: UserProfile) {
    this.userStore = userStore;
    this.profile = profile;
    this.highScore = profile.highScore;
  }

  setActiveLevel(op: Operation, level: number): void {
    this.activeOp = op;
    this.activeLevel = level;
    this.unlockChecked = false;
  }

  addCorrect(bonus = 0): boolean {
    this.score += CONFIG.CORRECT_POINTS + bonus;
    this.level = Math.floor(this.score / CONFIG.SPEED_INCREMENT_THRESHOLD) + 1;
    const leveledUp = this.level > this.prevLevel;
    this.prevLevel = this.level;
    return leveledUp;
  }

  addWrong(): void {
    this.score = Math.max(0, this.score + CONFIG.WRONG_POINTS);
    this.level = Math.floor(this.score / CONFIG.SPEED_INCREMENT_THRESHOLD) + 1;
    this.prevLevel = this.level;
  }

  checkUnlock(): UnlockResult | null {
    if (this.unlockChecked) return null;
    if (this.score < CONFIG.LEVEL_UNLOCK_THRESHOLD) return null;

    const opOrder = CONFIG.OP_ORDER;

    if (this.activeLevel < CONFIG.LEVELS_PER_OP) {
      // Unlock next level of same op
      const nextLevel = this.activeLevel + 1;
      const current = this.profile.progress[this.activeOp];
      if (current.unlockedLevel >= nextLevel) return null; // already unlocked
      this.unlockChecked = true;
      current.unlockedLevel = nextLevel;
      this.userStore.save(this.profile);
      return { type: 'level', unlockedOp: this.activeOp, unlockedLevel: nextLevel, message: `Level ${nextLevel} Unlocked!` };
    }

    // activeLevel == 10: unlock level 1 of next op
    const idx = opOrder.indexOf(this.activeOp);
    if (idx >= 0 && idx < opOrder.length - 1) {
      const nextOp = opOrder[idx + 1] as Operation;
      if (this.profile.progress[nextOp].unlockedLevel > 0) return null; // already unlocked
      this.unlockChecked = true;
      this.profile.progress[nextOp].unlockedLevel = 1;
      this.userStore.save(this.profile);
      return { type: 'op', unlockedOp: nextOp, message: `${opName(nextOp)} Unlocked!` };
    }

    // Last op, level 10 — check all complete
    const allComplete = opOrder.every(
      (op) => this.profile.progress[op as Operation].unlockedLevel >= CONFIG.LEVELS_PER_OP,
    );
    if (allComplete) {
      // Check if we've already flagged completion (all level 10s already unlocked before this game)
      // This runs when someone achieves threshold on the very last level
      this.unlockChecked = true;
      return { type: 'all-complete', message: 'Speed Mode Unlocked!' };
    }

    return null;
  }

  getFallSpeed(allComplete = false): number {
    if (!allComplete) return CONFIG.BASE_FALL_SPEED;
    return CONFIG.BASE_FALL_SPEED * Math.pow(CONFIG.SPEED_MULTIPLIER, this.level - 1);
  }

  saveHighScore(): void {
    let changed = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.profile.highScore = this.score;
      changed = true;
    }
    // Save per-level best score
    const scores = this.profile.progress[this.activeOp].levelBestScores;
    const idx = this.activeLevel - 1;
    const prev = scores[idx] ?? 0;
    if (this.score > prev) {
      // Extend array if needed
      while (scores.length <= idx) scores.push(0);
      scores[idx] = this.score;
      changed = true;
    }
    if (changed) {
      this.userStore.save(this.profile);
    }
  }

  reset(): void {
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
    this.unlockChecked = false;
  }
}

const OP_NAMES: Record<string, string> = {
  '+': 'Addition',
  '−': 'Subtraction',
  '×': 'Multiplication',
  '÷': 'Division',
};

function opName(op: Operation): string {
  return OP_NAMES[op] ?? op;
}
