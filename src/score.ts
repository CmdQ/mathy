import { CONFIG } from './config';

export class ScoreManager {
  score = 0;
  highScore: number;
  level = 1;
  private prevLevel = 1;

  constructor() {
    this.highScore = this.loadHighScore();
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
      try {
        localStorage.setItem('mathy-high-score', String(this.highScore));
      } catch {
        // localStorage may not be available
      }
    }
  }

  reset(): void {
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
  }

  private loadHighScore(): number {
    try {
      return parseInt(localStorage.getItem('mathy-high-score') || '0', 10) || 0;
    } catch {
      return 0;
    }
  }
}
