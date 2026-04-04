// jest-canvas-mock expects a global `jest` object; provide vitest's `vi` as a stand-in.
// This file is loaded as a vitest setupFile so it runs before any test imports.
import { vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = vi;
