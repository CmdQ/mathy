import { CONFIG } from './config';
import { UserProfile, UserStore } from './user';

export class ScoreManager {
  score = 0;
  highScore: number;
  level = 1;
  private prevLevel = 1;
  private userStore: UserStore;
  private profile: UserProfile;

  constructor(userStore: UserStore, profile: UserProfile) {
    this.userStore = userStore;
    this.profile = profile;
    this.highScore = profile.highScore;
  }

  addCorrect(): boolean {
    this.score += CONFIG.CORRECT_POINTS;
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

  getFallSpeed(): number {
    return CONFIG.BASE_FALL_SPEED * Math.pow(CONFIG.SPEED_MULTIPLIER, this.level - 1);
  }

  saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.profile.highScore = this.score;
      this.userStore.save(this.profile);
    }
  }

  reset(): void {
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
  }
}
