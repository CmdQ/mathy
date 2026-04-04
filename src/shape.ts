import { CONFIG } from './config';

export type ShapeType = 'circle' | 'square' | 'triangle' | 'hexagon';

const SHAPE_TYPES: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon'];

export class Shape {
  x: number;
  y: number;
  radius: number;
  answer: number;
  type: ShapeType;
  color: string;
  speed: number;
  drawScale: number;
  alive = true;
  // Animation state
  scale = 1;
  opacity = 1;
  shakeOffset = 0;
  popAnimation = 0;

  constructor(x: number, y: number, answer: number, speed: number, uiScale = 1) {
    this.x = x;
    this.y = y - 60; // start above viewport
    this.answer = answer;
    this.speed = speed;
    this.drawScale = uiScale;
    this.radius = (CONFIG.SHAPE_MIN_RADIUS +
      Math.random() * (CONFIG.SHAPE_MAX_RADIUS - CONFIG.SHAPE_MIN_RADIUS)) * uiScale;
    this.type = SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)];
    this.color = CONFIG.SHAPE_COLORS[Math.floor(Math.random() * CONFIG.SHAPE_COLORS.length)];
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.y += this.speed * dt;

    // Decay animations
    if (this.popAnimation > 0) {
      this.popAnimation -= dt * 4;
      this.scale = 1 + this.popAnimation * 0.3;
    }
    if (this.shakeOffset !== 0) {
      this.shakeOffset *= 0.9;
      if (Math.abs(this.shakeOffset) < 0.5) this.shakeOffset = 0;
    }
  }

  containsPoint(px: number, py: number): boolean {
    const dx = px - (this.x + this.shakeOffset);
    const dy = py - this.y;
    const r = this.radius * this.scale;

    switch (this.type) {
      case 'circle':
        return dx * dx + dy * dy <= r * r;
      case 'square':
        return Math.abs(dx) <= r && Math.abs(dy) <= r;
      case 'triangle': {
        // Equilateral triangle pointing up
        const h = r * Math.sqrt(3);
        const topY = -r;
        const botY = r * 0.7;
        if (dy < topY || dy > botY) return false;
        const halfWidth = ((dy - topY) / h) * r * 1.2;
        return Math.abs(dx) <= halfWidth;
      }
      case 'hexagon': {
        // Approximate: check inscribed circle
        return dx * dx + dy * dy <= r * r;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;
    ctx.save();
    ctx.translate(this.x + this.shakeOffset, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.opacity;

    // Draw shape
    ctx.fillStyle = this.color;
    ctx.beginPath();
    const r = this.radius;

    switch (this.type) {
      case 'circle':
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.2);
        break;
      case 'triangle':
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.9, r * 0.7);
        ctx.lineTo(-r * 0.9, r * 0.7);
        ctx.closePath();
        break;
      case 'hexagon':
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = Math.cos(angle) * r;
          const hy = Math.sin(angle) * r;
          i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        break;
    }
    ctx.fill();

    // Draw shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Draw answer label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(CONFIG.SHAPE_LABEL_FONT_SIZE * this.drawScale)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textY = this.type === 'triangle' ? 6 : 0;
    ctx.fillText(String(this.answer), 0, textY);

    ctx.restore();
  }

  triggerPop(): void {
    this.popAnimation = 1;
  }

  triggerShake(): void {
    this.shakeOffset = 12;
  }
}

export function spawnShapes(
  answers: number[],
  canvasWidth: number,
  speed: number,
  scale = 1,
): Shape[] {
  const count = answers.length;
  const padding = (CONFIG.SHAPE_PADDING + CONFIG.SHAPE_MAX_RADIUS) * scale;
  const usableWidth = canvasWidth - padding * 2;
  const spacing = usableWidth / (count + 1);

  return answers.map((answer, i) => {
    const x = padding + spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.4;
    return new Shape(x, 0, answer, speed, scale);
  });
}
