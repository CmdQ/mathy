import { CONFIG } from './config';
import type { Operation } from './question';
import { Shape } from './shape';
import type { UserProfile } from './user';

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
    this.ctx.fillText('Tap to Continue', cx, cy + 90);
  }

  // --- User profile screens ---

  drawUserSelect(users: UserProfile[], deleteMode: boolean): void {
    this.clear();
    const cx = this.width / 2;

    // Title
    this.ctx.fillStyle = '#feca57';
    this.ctx.font = CONFIG.TITLE_FONT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('MATHY', cx, 60);

    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = CONFIG.SUBTITLE_FONT;
    this.ctx.fillText('Choose Player', cx, 110);

    // User list
    const startY = 160;
    const rowH = 60;
    const btnW = Math.min(360, this.width * 0.8);

    for (let i = 0; i < users.length; i++) {
      const y = startY + i * rowH;
      const btnX = cx - btnW / 2;

      // User button background
      this.ctx.fillStyle = '#16213e';
      this.ctx.beginPath();
      this.ctx.roundRect(btnX, y, btnW, 48, 10);
      this.ctx.fill();

      // User name
      this.ctx.fillStyle = CONFIG.TEXT_COLOR;
      this.ctx.font = 'bold 22px system-ui, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(users[i].name, btnX + 16, y + 25);

      // High score
      this.ctx.fillStyle = '#aaa';
      this.ctx.font = '18px system-ui, sans-serif';
      this.ctx.textAlign = 'right';
      const scoreX = deleteMode ? btnX + btnW - 52 : btnX + btnW - 16;
      this.ctx.fillText(`Best: ${users[i].highScore}`, scoreX, y + 25);

      // Delete icon (trash) when in delete mode
      if (deleteMode) {
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.font = '22px system-ui, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✕', btnX + btnW - 24, y + 25);
      }
    }

    // "New User" button
    const newY = startY + users.length * rowH + 10;
    this.ctx.fillStyle = '#54a0ff';
    this.ctx.beginPath();
    this.ctx.roundRect(cx - btnW / 2, newY, btnW, 48, 10);
    this.ctx.fill();

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 22px system-ui, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('+ New Player', cx, newY + 25);

    // Delete mode toggle (only if users exist)
    if (users.length > 0) {
      const layout = this.getUserSelectLayout(users.length);
      const tr = layout.deleteToggle;
      this.ctx.fillStyle = deleteMode ? '#ff6b6b' : '#555';
      this.ctx.font = '18px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        deleteMode ? 'Done Deleting' : 'Delete a Player',
        cx,
        tr.y + tr.h / 2,
      );
    }
  }

  getUserSelectLayout(userCount: number): {
    userButtons: { x: number; y: number; w: number; h: number }[];
    newUserButton: { x: number; y: number; w: number; h: number };
    deleteToggle: { x: number; y: number; w: number; h: number };
    deleteIcons: { x: number; y: number; w: number; h: number }[];
  } {
    const cx = this.width / 2;
    const startY = 160;
    const rowH = 60;
    const btnW = Math.min(360, this.width * 0.8);
    const btnX = cx - btnW / 2;

    const userButtons = [];
    const deleteIcons = [];
    for (let i = 0; i < userCount; i++) {
      const y = startY + i * rowH;
      userButtons.push({ x: btnX, y, w: btnW, h: 48 });
      deleteIcons.push({ x: btnX + btnW - 48, y, w: 48, h: 48 });
    }

    const newY = startY + userCount * rowH + 10;
    const toggleY = newY + 55;

    return {
      userButtons,
      newUserButton: { x: btnX, y: newY, w: btnW, h: 48 },
      deleteToggle: { x: btnX, y: toggleY, w: btnW, h: 30 },
      deleteIcons,
    };
  }

  drawNameEntry(currentName: string): void {
    this.clear();
    const cx = this.width / 2;

    // Prompt
    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = CONFIG.SUBTITLE_FONT;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Enter Your Name', cx, 50);

    // Name display
    const displayName = currentName || '_';
    this.ctx.fillStyle = '#feca57';
    this.ctx.font = 'bold 40px system-ui, sans-serif';
    this.ctx.fillText(displayName, cx, 110);

    // Character count
    this.ctx.fillStyle = '#555';
    this.ctx.font = '16px system-ui, sans-serif';
    this.ctx.fillText(`${currentName.length}/${CONFIG.MAX_USERNAME_LENGTH}`, cx, 145);

    // Draw keypad
    const layout = this.getKeypadLayout();
    for (const key of layout) {
      const isSpecial = key.label === '⌫' || key.label === 'OK';
      const isOk = key.label === 'OK';
      const isDisabled = isOk && currentName.length === 0;

      this.ctx.fillStyle = isDisabled ? '#222' : isOk ? '#54a0ff' : '#16213e';
      this.ctx.beginPath();
      this.ctx.roundRect(key.x, key.y, key.w, key.h, 6);
      this.ctx.fill();

      this.ctx.fillStyle = isDisabled ? '#555' : isSpecial ? '#fff' : CONFIG.TEXT_COLOR;
      this.ctx.font = isSpecial ? 'bold 20px system-ui, sans-serif' : '20px system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(key.label, key.x + key.w / 2, key.y + key.h / 2);
    }
  }

  getKeypadLayout(): { label: string; x: number; y: number; w: number; h: number }[] {
    const rows = CONFIG.KEYPAD_ROWS;
    const keyW = 42;
    const keyH = 42;
    const gap = 6;
    const startY = 175;
    const cx = this.width / 2;

    const keys: { label: string; x: number; y: number; w: number; h: number }[] = [];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const widths = row.map((label) => {
        if (label === 'OK') return keyW * 2 + gap;
        if (label === '⌫') return keyW * 1.5;
        return keyW;
      });
      const rowWidth = widths.reduce((sum, w) => sum + w, 0) + (row.length - 1) * gap;
      const startX = cx - rowWidth / 2;
      let x = startX;

      for (let c = 0; c < row.length; c++) {
        const w = widths[c];
        keys.push({ label: row[c], x, y: startY + r * (keyH + gap), w, h: keyH });
        x += w + gap;
      }
    }

    return keys;
  }

  drawDeleteConfirm(userName: string, isFinal: boolean): void {
    this.clear();
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Warning icon
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.font = 'bold 48px system-ui, sans-serif';
    this.ctx.fillText(isFinal ? '⚠️' : '🗑️', cx, cy - 100);

    // Message
    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = 'bold 28px system-ui, sans-serif';
    this.ctx.fillText(
      isFinal ? 'Are you sure?' : `Delete ${userName}?`,
      cx,
      cy - 40,
    );

    this.ctx.fillStyle = '#aaa';
    this.ctx.font = '20px system-ui, sans-serif';
    this.ctx.fillText(
      isFinal
        ? 'This will remove all scores and data.'
        : 'This player\'s data will be lost.',
      cx,
      cy,
    );

    // Yes / No buttons
    const btnW = 140;
    const btnH = 50;
    const gap = 20;

    // No button
    this.ctx.fillStyle = '#16213e';
    this.ctx.beginPath();
    this.ctx.roundRect(cx - btnW - gap / 2, cy + 40, btnW, btnH, 10);
    this.ctx.fill();
    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = 'bold 24px system-ui, sans-serif';
    this.ctx.fillText('Cancel', cx - btnW / 2 - gap / 2, cy + 65);

    // Yes button
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.roundRect(cx + gap / 2, cy + 40, btnW, btnH, 10);
    this.ctx.fill();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText('Delete', cx + btnW / 2 + gap / 2, cy + 65);
  }

  getDeleteConfirmLayout(): {
    cancelBtn: { x: number; y: number; w: number; h: number };
    deleteBtn: { x: number; y: number; w: number; h: number };
  } {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const btnW = 140;
    const btnH = 50;
    const gap = 20;
    return {
      cancelBtn: { x: cx - btnW - gap / 2, y: cy + 40, w: btnW, h: btnH },
      deleteBtn: { x: cx + gap / 2, y: cy + 40, w: btnW, h: btnH },
    };
  }

  // --- Operation select screen ---

  private static readonly OP_LABELS: Record<string, string> = {
    '+': 'Addition',
    '−': 'Subtraction',
    '×': 'Multiplication',
    '÷': 'Division',
  };

  drawOpSelect(
    unlockedOps: Operation[],
    selectedOps: Operation[],
    opBestScores: Partial<Record<Operation, number>>,
  ): void {
    this.clear();
    const cx = this.width / 2;
    const allOps = CONFIG.OP_ORDER as readonly Operation[];

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.fillStyle = CONFIG.TEXT_COLOR;
    this.ctx.font = CONFIG.SUBTITLE_FONT;
    this.ctx.fillText('Choose Operations', cx, 50);

    const layout = this.getOpSelectLayout();
    for (let i = 0; i < allOps.length; i++) {
      const op = allOps[i];
      const btn = layout.opButtons[i];
      const isUnlocked = unlockedOps.includes(op);
      const isSelected = selectedOps.includes(op);

      // Button background
      if (!isUnlocked) {
        this.ctx.fillStyle = '#111';
      } else if (isSelected) {
        this.ctx.fillStyle = '#16213e';
        // Selected border
        this.ctx.strokeStyle = '#54a0ff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 12);
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = '#16213e';
      }
      this.ctx.beginPath();
      this.ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 12);
      this.ctx.fill();

      // Op symbol
      this.ctx.fillStyle = isUnlocked ? '#feca57' : '#555';
      this.ctx.font = 'bold 36px system-ui, sans-serif';
      this.ctx.fillText(op, btn.x + btn.w / 2, btn.y + 30);

      // Label
      this.ctx.fillStyle = isUnlocked ? CONFIG.TEXT_COLOR : '#444';
      this.ctx.font = '16px system-ui, sans-serif';
      this.ctx.fillText(Renderer.OP_LABELS[op] ?? op, btn.x + btn.w / 2, btn.y + 58);

      if (isUnlocked) {
        // Best score
        const best = opBestScores[op] ?? 0;
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '14px system-ui, sans-serif';
        this.ctx.fillText(`Best: ${best}`, btn.x + btn.w / 2, btn.y + 78);

        // Checkmark for selected
        if (isSelected) {
          this.ctx.fillStyle = '#54a0ff';
          this.ctx.font = 'bold 20px system-ui, sans-serif';
          this.ctx.fillText('✓', btn.x + btn.w - 20, btn.y + 16);
        }
      } else {
        // Lock icon and threshold
        this.ctx.fillStyle = '#555';
        this.ctx.font = '20px system-ui, sans-serif';
        this.ctx.fillText('🔒', btn.x + btn.w / 2, btn.y + 78);
        this.ctx.font = '12px system-ui, sans-serif';
        this.ctx.fillText(`Score ${CONFIG.UNLOCK_THRESHOLD} on ${allOps[i - 1]}`, btn.x + btn.w / 2, btn.y + 96);
      }
    }

    // Play button
    const playBtn = layout.playButton;
    const hasSelection = selectedOps.length > 0;
    this.ctx.fillStyle = hasSelection ? '#54a0ff' : '#222';
    this.ctx.beginPath();
    this.ctx.roundRect(playBtn.x, playBtn.y, playBtn.w, playBtn.h, 10);
    this.ctx.fill();

    this.ctx.fillStyle = hasSelection ? '#fff' : '#555';
    this.ctx.font = 'bold 26px system-ui, sans-serif';
    this.ctx.fillText('Play!', cx, playBtn.y + playBtn.h / 2);
  }

  getOpSelectLayout(): {
    opButtons: { x: number; y: number; w: number; h: number }[];
    playButton: { x: number; y: number; w: number; h: number };
  } {
    const cx = this.width / 2;
    const btnW = Math.min(160, this.width * 0.4);
    const btnH = 110;
    const gap = 12;
    const startY = 90;

    const opButtons = [];
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = cx - btnW - gap / 2 + col * (btnW + gap);
      const y = startY + row * (btnH + gap);
      opButtons.push({ x, y, w: btnW, h: btnH });
    }

    const playBtnW = Math.min(300, this.width * 0.7);
    const playY = startY + 2 * (btnH + gap) + 20;

    return {
      opButtons,
      playButton: { x: cx - playBtnW / 2, y: playY, w: playBtnW, h: 50 },
    };
  }

  // --- Celebration overlay ---

  drawCelebration(unlockedOp: Operation, progress: number): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * Math.min(1, progress * 3)})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const scale = Math.min(1, progress * 2);

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Big emoji
    this.ctx.font = '72px system-ui, sans-serif';
    this.ctx.fillText('🎉', 0, -70);

    // Unlock message
    this.ctx.fillStyle = '#feca57';
    this.ctx.font = 'bold 36px system-ui, sans-serif';
    const opName = Renderer.OP_LABELS[unlockedOp] ?? unlockedOp;
    this.ctx.fillText(`${opName}`, 0, -5);

    this.ctx.fillStyle = '#54a0ff';
    this.ctx.font = 'bold 28px system-ui, sans-serif';
    this.ctx.fillText('Unlocked!', 0, 35);

    this.ctx.restore();
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
