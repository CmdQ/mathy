# 🧮 Mathy

A touch-first math game for ages 8–12. Solve falling math problems by tapping the right answer before it hits the bottom!

## How to Play

1. Tap **Start** to begin
2. A math question appears at the top of the screen
3. Colorful shapes fall from above — each labeled with an answer
4. **Tap the correct shape** before it falls off the bottom
5. Hit the **‖ pause button** anytime — the question hides so no peeking!

## Scoring

| Action | Points |
|---|---|
| Correct answer | +3 |
| Wrong answer | −1 |
| Missed the right answer | Game over |

Every **20 points** the shapes fall faster. Try to beat your high score!

## Math Operations

All four operations are included, with age-appropriate number ranges:

- **Addition & Subtraction** — numbers 1–50
- **Multiplication & Division** — factors 2–12, clean results only

Wrong answer choices are always plausible (close to the real answer) so you can't just guess.

## Tech Stack

- **TypeScript** + **HTML5 Canvas** — no framework, lightweight custom game loop
- **Vite** — dev server and production bundler
- **Web Audio API** — synthesized sound effects (no audio files)
- **PointerEvent API** — unified touch and mouse input

## Getting Started

```bash
npm install
npm run dev
```

Then open **http://localhost:5173/** in a browser (works with touch or mouse).

```bash
npm run build      # Production build → dist/
npx tsc --noEmit   # Type-check only
```

## Roadmap

See [backlog.md](backlog.md) for planned features.