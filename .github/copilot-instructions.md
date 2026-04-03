# Copilot Instructions

## Project Overview

Mathy is a touch-first math learning game (ages 8–12) built with TypeScript and HTML5 Canvas. A math question appears at the top, and colorful shapes with answers fall from above. The player taps the correct answer before it falls off-screen. Target platforms: Windows tablets now, iOS later (via PWA/Capacitor).

## Build & Run

```bash
npm run dev        # Start Vite dev server with hot reload
npm run build      # TypeScript check + production build (output: dist/)
npx tsc --noEmit   # Type-check only (no output)
```

## Architecture

Plain game loop using `requestAnimationFrame` with delta-time — no framework. All modules are in `src/`:

- **main.ts** — Entry point, creates canvas and starts game
- **game.ts** — Game class: state machine (start → countdown → playing → game-over), orchestrates update/render cycle
- **question.ts** — Generates math problems (+, −, ×, ÷) with plausible wrong answers
- **shape.ts** — Shape class: falling geometric shapes (circle, square, triangle, hexagon) with hit-testing and animations
- **renderer.ts** — All Canvas drawing: question banner, shapes, HUD, screens, particle effects
- **input.ts** — PointerEvent-based input (unified touch/mouse), translates to canvas coordinates
- **audio.ts** — Web Audio API synthesized sounds (no audio files)
- **score.ts** — Score tracking (+3/−1), speed escalation, localStorage high score
- **config.ts** — All game constants (speeds, ranges, colors, fonts)

## Key Conventions

- **Touch-first**: Use `PointerEvent` API, never raw mouse/touch events. Prevent default touch behaviors (scroll, zoom).
- **Canvas coordinates**: All positions use canvas pixel space (adjusted for `devicePixelRatio`). Input handler converts screen→canvas coords.
- **Frame-rate independent**: All movement uses `dt` (delta-time in seconds). Never use fixed frame increments.
- **No audio files**: All sounds are synthesized via Web Audio API oscillators.
- **Game constants**: Tweak gameplay in `config.ts` — don't hardcode values in game logic.

## Game Rules

- Correct answer: +3 points
- Wrong answer: −1 point
- Every 20-point increment increases fall speed (×1.25 multiplier)
- Missing the correct answer (falls off screen) = game over
- High score persisted in localStorage (`mathy-high-score`)
