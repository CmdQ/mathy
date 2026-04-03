import { CONFIG } from './config';
import { createQuestion, Question } from './question';
import { Shape, spawnShapes } from './shape';
import { Renderer } from './renderer';
import { InputHandler } from './input';
import { AudioManager } from './audio';
import { ScoreManager } from './score';

type GameState = 'start' | 'countdown' | 'playing' | 'new-question' | 'game-over';

export class Game {
  private renderer: Renderer;
  private input: InputHandler;
  private audio = new AudioManager();
  private scoreManager = new ScoreManager();

  private state: GameState = 'start';
  private paused = false;
  private question: Question | null = null;
  private shapes: Shape[] = [];

  private countdownValue = CONFIG.COUNTDOWN_SECONDS;
  private countdownTimer = 0;
  private newQuestionTimer = 0;

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
      case 'start':
        this.renderer.drawStartScreen();
        break;

      case 'countdown':
        this.renderer.drawCountdown(this.countdownValue);
        break;

      case 'playing':
      case 'new-question':
        if (this.paused) {
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
        // Move to next question after delay
        this.state = 'new-question';
        this.newQuestionTimer = CONFIG.NEW_QUESTION_DELAY_MS / 1000;
        // Fade out remaining shapes
        for (const s of this.shapes) {
          if (s !== shape) s.alive = false;
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
    this.question = createQuestion();
    const speed = this.scoreManager.getFallSpeed();
    this.shapes = spawnShapes(this.question.choices, this.renderer.getWidth(), speed);
  }

  private endGame(): void {
    this.state = 'game-over';
    this.scoreManager.saveHighScore();
    this.audio.gameOver();
  }

  private restartGame(): void {
    this.startCountdown();
  }
}
