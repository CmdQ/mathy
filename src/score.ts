import { CONFIG } from './config';
import type { Operation } from './question';
import { UserProfile, UserStore } from './user';

export interface UnlockResult {
  unlocked: Operation;
}

export class ScoreManager {
  score = 0;
  highScore: number;
  level = 1;
  private prevLevel = 1;
  private userStore: UserStore;
  private profile: UserProfile;
  private activeOps: Operation[] = ['+'];
  private unlockChecked = false;

  constructor(userStore: UserStore, profile: UserProfile) {
    this.userStore = userStore;
    this.profile = profile;
    this.highScore = profile.highScore;
  }

  setActiveOps(ops: Operation[]): void {
    this.activeOps = ops;
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
    if (this.activeOps.length !== 1) return null;
    if (this.score < CONFIG.UNLOCK_THRESHOLD) return null;

    const currentOp = this.activeOps[0];
    const opOrder = CONFIG.OP_ORDER;
    const idx = opOrder.indexOf(currentOp);
    if (idx === -1 || idx >= opOrder.length - 1) return null;

    const nextOp = opOrder[idx + 1];
    if (this.profile.unlockedOps.includes(nextOp)) return null;

    // Unlock!
    this.unlockChecked = true;
    this.profile.unlockedOps.push(nextOp);
    this.userStore.save(this.profile);
    return { unlocked: nextOp };
  }

  getFallSpeed(): number {
    return CONFIG.BASE_FALL_SPEED * Math.pow(CONFIG.SPEED_MULTIPLIER, this.level - 1);
  }

  saveHighScore(): void {
    let changed = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.profile.highScore = this.score;
      changed = true;
    }
    // Save per-op best score (only for single-op games)
    if (this.activeOps.length === 1) {
      const op = this.activeOps[0];
      const prev = this.profile.opBestScores[op] ?? 0;
      if (this.score > prev) {
        this.profile.opBestScores[op] = this.score;
        changed = true;
      }
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
