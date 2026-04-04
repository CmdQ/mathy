import { CONFIG } from './config';
import { createQuestion, Operation, Question } from './question';
import { Shape, spawnShapes } from './shape';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { AudioManager } from './audio';
import { ScoreManager } from './score';
import { UserStore, UserProfile } from './user';

type GameState =
  | 'user-select'
  | 'name-entry'
  | 'confirm-delete'
  | 'confirm-delete-final'
  | 'op-select'
  | 'start'
  | 'countdown'
  | 'playing'
  | 'new-question'
  | 'celebration'
  | 'game-over';

export class Game {
  private renderer: Renderer;
  private input: InputHandler;
  private audio = new AudioManager();
  private userStore = new UserStore();
  private scoreManager!: ScoreManager;
  private currentUser: UserProfile | null = null;

  private state: GameState = 'user-select';
  private paused = false;
  private question: Question | null = null;
  private shapes: Shape[] = [];

  private countdownValue = CONFIG.COUNTDOWN_SECONDS;
  private countdownTimer = 0;
  private newQuestionTimer = 0;

  // User input state
  private nameInput = '';
  private deleteMode = false;
  private deleteTarget: UserProfile | null = null;

  // Operation select state
  private selectedOps: Operation[] = ['+'];

  // Celebration state
  private celebrationOp: Operation | null = null;
  private celebrationTimer = 0;

  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new InputHandler(canvas);
    this.input.onTap((x, y) => this.handleTap(x, y));
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(time: number): void {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1); // cap at 100ms
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    if (this.paused) return;

    switch (this.state) {
      case 'countdown':
        this.countdownTimer -= dt;
        if (this.countdownTimer <= 0) {
          this.countdownValue--;
          this.countdownTimer = 1;
          if (this.countdownValue <= 0) {
            this.state = 'playing';
            this.nextQuestion();
          }
        }
        break;

      case 'playing':
        this.updatePlaying(dt);
        break;

      case 'new-question':
        this.newQuestionTimer -= dt;
        if (this.newQuestionTimer <= 0) {
          this.nextQuestion();
          this.state = 'playing';
        }
        break;

      case 'celebration':
        this.celebrationTimer -= dt;
        if (this.celebrationTimer <= 0) {
          this.state = 'playing';
          this.nextQuestion();
        }
        break;
    }

    this.renderer.updateParticles(dt);
  }

  private updatePlaying(dt: number): void {
    for (const shape of this.shapes) {
      shape.update(dt);
    }

    // Check if correct answer fell off screen
    const h = this.renderer.getHeight();
    const correctShape = this.shapes.find(
      (s) => s.alive && s.answer === this.question?.answer
    );
    if (correctShape && correctShape.y > h + correctShape.radius) {
      // Missed the correct answer — game over
      this.endGame();
      return;
    }

    // Remove shapes that fell off (wrong answers)
    this.shapes = this.shapes.filter(
      (s) => s.y < h + s.radius + 50 || s.answer === this.question?.answer
    );
  }

  private render(): void {
    switch (this.state) {
      case 'user-select':
        this.renderer.drawUserSelect(this.userStore.list(), this.deleteMode);
        break;

      case 'name-entry':
        this.renderer.drawNameEntry(this.nameInput);
        break;

      case 'confirm-delete':
        this.renderer.drawDeleteConfirm(this.deleteTarget?.name ?? '', false);
        break;

      case 'confirm-delete-final':
        this.renderer.drawDeleteConfirm(this.deleteTarget?.name ?? '', true);
        break;

      case 'op-select':
        this.renderer.drawOpSelect(
          this.currentUser?.unlockedOps ?? ['+'],
          this.selectedOps,
          this.currentUser?.opBestScores ?? {},
        );
        break;

      case 'start':
        this.renderer.drawStartScreen();
        break;

      case 'countdown':
        this.renderer.drawCountdown(this.countdownValue);
        break;

      case 'playing':
      case 'new-question':
      case 'celebration':
        if (this.paused && this.state !== 'celebration') {
          this.renderer.drawPauseScreen();
        } else {
          this.renderer.clear();
          if (this.question) {
            this.renderer.drawQuestion(this.question.text);
          }
          this.renderer.drawHUD(
            this.scoreManager.score,
            this.scoreManager.highScore,
            this.scoreManager.level,
          );
          this.renderer.drawShapes(this.shapes);
          this.renderer.drawParticles();
          if (this.state === 'celebration' && this.celebrationOp) {
            const duration = CONFIG.CELEBRATION_DURATION_MS / 1000;
            const progress = 1 - this.celebrationTimer / duration;
            this.renderer.drawCelebration(this.celebrationOp, progress);
          }
        }
        break;

      case 'game-over':
        this.renderer.clear();
        if (this.question) {
          this.renderer.drawQuestion(this.question.text);
        }
        this.renderer.drawHUD(
          this.scoreManager.score,
          this.scoreManager.highScore,
          this.scoreManager.level,
        );
        this.renderer.drawShapes(this.shapes);
        this.renderer.drawParticles();
        this.renderer.drawGameOver(
          this.scoreManager.score,
          this.scoreManager.highScore,
          this.scoreManager.score >= this.scoreManager.highScore && this.scoreManager.score > 0,
        );
        break;
    }
  }

  private handleTap(x: number, y: number): void {
    switch (this.state) {
      case 'user-select':
        this.handleUserSelectTap(x, y);
        break;

      case 'name-entry':
        this.handleNameEntryTap(x, y);
        break;

      case 'confirm-delete':
      case 'confirm-delete-final':
        this.handleDeleteConfirmTap(x, y);
        break;

      case 'op-select':
        this.handleOpSelectTap(x, y);
        break;

      case 'start':
        this.startCountdown();
        break;

      case 'playing':
      case 'new-question':
        if (this.paused) {
          this.paused = false;
          this.lastTime = performance.now();
        } else {
          const pr = this.renderer.getPauseButtonRect();
          if (x >= pr.x && x <= pr.x + pr.w && y >= pr.y && y <= pr.y + pr.h) {
            this.paused = true;
          } else if (this.state === 'playing') {
            this.handlePlayTap(x, y);
          }
        }
        break;

      case 'game-over':
        this.restartGame();
        break;
    }
  }

  private handleUserSelectTap(x: number, y: number): void {
    const users = this.userStore.list();
    const layout = this.renderer.getUserSelectLayout(users.length);

    // Check delete toggle
    if (users.length > 0 && this.hitTest(x, y, layout.deleteToggle)) {
      this.deleteMode = !this.deleteMode;
      return;
    }

    // Check user buttons
    for (let i = 0; i < users.length; i++) {
      if (this.hitTest(x, y, layout.userButtons[i])) {
        if (this.deleteMode && this.hitTest(x, y, layout.deleteIcons[i])) {
          this.deleteTarget = users[i];
          this.state = 'confirm-delete';
        } else if (!this.deleteMode) {
          this.selectUser(users[i]);
        }
        return;
      }
    }

    // Check "New User" button
    if (this.hitTest(x, y, layout.newUserButton)) {
      this.nameInput = '';
      this.deleteMode = false;
      this.state = 'name-entry';
    }
  }

  private handleNameEntryTap(x: number, y: number): void {
    const keys = this.renderer.getKeypadLayout();
    for (const key of keys) {
      if (x >= key.x && x <= key.x + key.w && y >= key.y && y <= key.y + key.h) {
        if (key.label === '⌫') {
          this.nameInput = this.nameInput.slice(0, -1);
        } else if (key.label === 'OK') {
          if (this.nameInput.length > 0) {
            this.finishNameEntry();
          }
        } else if (this.nameInput.length < CONFIG.MAX_USERNAME_LENGTH) {
          this.nameInput += key.label;
        }
        return;
      }
    }
  }

  private finishNameEntry(): void {
    const name = this.nameInput.trim().toUpperCase();
    if (!name) return;

    const existing = this.userStore.get(name);
    if (existing) {
      this.selectUser(existing);
    } else {
      try {
        const profile = this.userStore.create(name);
        this.selectUser(profile);
      } catch {
        // Name conflict after normalization — just go back
        this.state = 'user-select';
      }
    }
  }

  private handleDeleteConfirmTap(x: number, y: number): void {
    const layout = this.renderer.getDeleteConfirmLayout();

    if (this.hitTest(x, y, layout.cancelBtn)) {
      this.deleteTarget = null;
      this.state = 'user-select';
    } else if (this.hitTest(x, y, layout.deleteBtn)) {
      if (this.state === 'confirm-delete') {
        this.state = 'confirm-delete-final';
      } else {
        // Final confirmation — delete the user
        if (this.deleteTarget) {
          this.userStore.delete(this.deleteTarget.name);
          this.deleteTarget = null;
        }
        this.deleteMode = false;
        this.state = 'user-select';
      }
    }
  }

  private selectUser(profile: UserProfile): void {
    this.currentUser = profile;
    this.scoreManager = new ScoreManager(this.userStore, profile);
    this.selectedOps = profile.unlockedOps.length > 0 ? [profile.unlockedOps[0]] : ['+'];
    this.state = 'op-select';
  }

  private hitTest(
    x: number,
    y: number,
    rect: { x: number; y: number; w: number; h: number },
  ): boolean {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  private handleOpSelectTap(x: number, y: number): void {
    if (!this.currentUser) return;
    const layout = this.renderer.getOpSelectLayout();
    const allOps = CONFIG.OP_ORDER as readonly Operation[];

    // Check op buttons
    for (let i = 0; i < allOps.length; i++) {
      if (this.hitTest(x, y, layout.opButtons[i])) {
        const op = allOps[i];
        if (!this.currentUser.unlockedOps.includes(op)) return; // locked

        const idx = this.selectedOps.indexOf(op);
        if (idx >= 0) {
          // Deselect (but keep at least one)
          if (this.selectedOps.length > 1) {
            this.selectedOps.splice(idx, 1);
          }
        } else {
          this.selectedOps.push(op);
        }
        return;
      }
    }

    // Check play button
    if (this.hitTest(x, y, layout.playButton) && this.selectedOps.length > 0) {
      this.scoreManager.setActiveOps(this.selectedOps);
      this.state = 'start';
    }
  }

  private startCountdown(): void {
    this.state = 'countdown';
    this.countdownValue = CONFIG.COUNTDOWN_SECONDS;
    this.countdownTimer = 1;
    this.scoreManager.reset();
  }

  private handlePlayTap(x: number, y: number): void {
    if (!this.question) return;

    for (const shape of this.shapes) {
      if (!shape.alive) continue;
      if (!shape.containsPoint(x, y)) continue;

      if (shape.answer === this.question.answer) {
        // Correct!
        shape.triggerPop();
        this.renderer.spawnParticles(shape.x, shape.y, shape.color);
        const leveledUp = this.scoreManager.addCorrect();
        this.audio.correct();
        if (leveledUp) {
          this.audio.levelUp();
        }

        // Check for operation unlock
        const unlock = this.scoreManager.checkUnlock();
        if (unlock) {
          // Refresh current user data
          this.currentUser = this.userStore.get(this.currentUser!.name) ?? this.currentUser;
          this.celebrationOp = unlock.unlocked;
          this.celebrationTimer = CONFIG.CELEBRATION_DURATION_MS / 1000;
          this.state = 'celebration';
          this.audio.levelUp();
          // Big particle burst
          this.renderer.spawnParticles(this.renderer.getWidth() / 2, this.renderer.getHeight() / 2, '#feca57', 30);
          // Fade out shapes
          for (const s of this.shapes) s.alive = false;
        } else {
          // Move to next question after delay
          this.state = 'new-question';
          this.newQuestionTimer = CONFIG.NEW_QUESTION_DELAY_MS / 1000;
          // Fade out remaining shapes
          for (const s of this.shapes) {
            if (s !== shape) s.alive = false;
          }
        }
      } else {
        // Wrong!
        shape.triggerShake();
        this.scoreManager.addWrong();
        this.audio.wrong();
      }
      return; // only process first hit
    }
  }

  private nextQuestion(): void {
    this.question = createQuestion(this.selectedOps);
    const speed = this.scoreManager.getFallSpeed();
    this.shapes = spawnShapes(this.question.choices, this.renderer.getWidth(), speed);
  }

  private endGame(): void {
    this.state = 'game-over';
    this.scoreManager.saveHighScore();
    this.audio.gameOver();
  }

  private restartGame(): void {
    if (this.currentUser) {
      // Refresh user data (may have new unlocks)
      this.currentUser = this.userStore.get(this.currentUser.name) ?? this.currentUser;
      this.scoreManager = new ScoreManager(this.userStore, this.currentUser);
      this.selectedOps = this.currentUser.unlockedOps.length > 0 ? [this.currentUser.unlockedOps[0]] : ['+'];
      this.state = 'op-select';
    } else {
      this.state = 'user-select';
    }
    this.deleteMode = false;
  }
}
