import { CONFIG } from './config';
import { Shape } from './shape';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private particles: Particle[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth * dpr;
    this.height = window.innerHeight * dpr;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  getWidth(): number { return this.width; }
  getHeight(): number { return this.height; }

  clear(): void {
    this.ctx.fillStyle = CONFIG.BG_COLOR;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawQuestion(text: string): void {
    const bannerH = 80;
    this.ctx.fillStyle = CONFIG.QUESTION_BG;
    this.ctx.fillRect(0, 0, this.width, bannerH);

    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = CONFIG.QUESTION_FONT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, this.width / 2, bannerH / 2);
  }

  drawHUD(score: number, highScore: number, level: number): void {
    this.ctx.font = CONFIG.HUD_FONT;
    this.ctx.textBaseline = 'top';

    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.fillText(`Score: ${score}`, 16, 90);

    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#feca57';
    this.ctx.fillText(`Level ${level}`, this.width / 2, 90);

    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = '#aaa';
    this.ctx.fillText(`Best: ${highScore}`, this.width - 16, 90);

    // Pause button (two bars)
    this.drawPauseButton();
  }

  private drawPauseButton(): void {
    const r = this.getPauseButtonRect();
    const barW = 6;
    const barH = 22;
    const gap = 8;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.fillRect(cx - gap / 2 - barW, cy - barH / 2, barW, barH);
    this.ctx.fillRect(cx + gap / 2, cy - barH / 2, barW, barH);
  }

  getPauseButtonRect(): { x: number; y: number; w: number; h: number } {
    return { x: this.width - 56, y: 82, w: 44, h: 36 };
  }

  drawPauseScreen(): void {
    // Full-screen overlay hides everything
    this.ctx.fillStyle = CONFIG.BG_COLOR;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Large pause icon
    const barW = 14;
    const barH = 60;
    const gap = 20;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(cx - gap / 2 - barW, cy - 80 - barH / 2, barW, barH);
    this.ctx.fillRect(cx + gap / 2, cy - 80 - barH / 2, barW, barH);

    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = 'bold 40px system-ui, sans-serif';
    this.ctx.fillText('Paused', cx, cy);

    this.ctx.fillStyle = '#54a0ff';
    this.ctx.font = 'bold 28px system-ui, sans-serif';
    this.ctx.fillText('Tap to Resume', cx, cy + 60);
  }

  drawShapes(shapes: Shape[]): void {
    for (const shape of shapes) {
      shape.draw(this.ctx);
    }
  }

  drawStartScreen(): void {
    this.clear();

    // Title
    this.ctx.fillStyle = '#feca57';
    this.ctx.font = CONFIG.TITLE_FONT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('MATHY', this.width / 2, this.height * 0.35);

    // Subtitle
    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = CONFIG.SUBTITLE_FONT;
    this.ctx.fillText('Tap the right answer!', this.width / 2, this.height * 0.45);

    // Tap to start
    this.ctx.fillStyle = '#54a0ff';
    this.ctx.font = 'bold 28px system-ui, sans-serif';
    this.ctx.fillText('Tap to Start', this.width / 2, this.height * 0.6);
  }

  drawCountdown(count: number): void {
    this.clear();
    this.ctx.fillStyle = '#feca57';
    this.ctx.font = 'bold 96px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(String(count), this.width / 2, this.height / 2);
  }

  drawGameOver(score: number, highScore: number, isNewBest: boolean): void {
    // Overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.font = 'bold 48px system-ui, sans-serif';
    this.ctx.fillText('Game Over', cx, cy - 80);

    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = 'bold 32px system-ui, sans-serif';
    this.ctx.fillText(`Score: ${score}`, cx, cy - 20);

    if (isNewBest) {
      this.ctx.fillStyle = '#feca57';
      this.ctx.font = 'bold 26px system-ui, sans-serif';
      this.ctx.fillText('🎉 New High Score! 🎉', cx, cy + 25);
    } else {
      this.ctx.fillStyle = '#aaa';
      this.ctx.font = '24px system-ui, sans-serif';
      this.ctx.fillText(`Best: ${highScore}`, cx, cy + 25);
    }

    this.ctx.fillStyle = '#54a0ff';
    this.ctx.font = 'bold 28px system-ui, sans-serif';
    this.ctx.fillText('Tap to Play Again', cx, cy + 90);
  }

  // Particle effects
  spawnParticles(x: number, y: number, color: string, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 100 + Math.random() * 200;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.3,
        color,
        size: 3 + Math.random() * 5,
      });
    }
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      p.life -= dt / p.maxLife;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles(): void {
    for (const p of this.particles) {
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }
}
