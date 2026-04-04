// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import 'jest-canvas-mock';
import { Renderer } from './renderer';

function setWindowSize(w: number, h: number, dpr = 1): void {
  Object.defineProperty(window, 'innerWidth', { value: w, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: h, writable: true, configurable: true });
  Object.defineProperty(window, 'devicePixelRatio', { value: dpr, writable: true, configurable: true });
}

function withinBounds(
  rect: { x: number; y: number; w: number; h: number },
  canvasW: number,
  canvasH: number,
): void {
  expect(rect.w).toBeGreaterThan(0);
  expect(rect.h).toBeGreaterThan(0);
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.w).toBeLessThanOrEqual(canvasW);
  expect(rect.y + rect.h).toBeLessThanOrEqual(canvasH);
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

describe('Renderer layout methods', () => {
  let renderer: Renderer;
  const W = 800;
  const H = 600;

  beforeEach(() => {
    setWindowSize(W, H, 1);
    const canvas = document.createElement('canvas');
    renderer = new Renderer(canvas);
    renderer.resize();
  });

  describe('getBackButtonRect', () => {
    it('returns a rect with positive dimensions within canvas bounds', () => {
      const rect = renderer.getBackButtonRect();
      withinBounds(rect, W, H);
    });
  });

  describe('getPauseButtonRect', () => {
    it('returns a rect within the question banner area', () => {
      const rect = renderer.getPauseButtonRect();
      const bannerH = 80; // s(80) with dpr=1
      expect(rect.w).toBeGreaterThan(0);
      expect(rect.h).toBeGreaterThan(0);
      expect(rect.y + rect.h).toBeLessThanOrEqual(bannerH);
    });
  });

  describe('getUserSelectLayout', () => {
    it('returns correct number of user buttons, newUser button, and deleteToggle', () => {
      const layout = renderer.getUserSelectLayout(3);
      expect(layout.userButtons).toHaveLength(3);
      expect(layout.deleteIcons).toHaveLength(3);
      withinBounds(layout.newUserButton, W, H);
      withinBounds(layout.deleteToggle, W, H);
    });

    it('all user buttons are within bounds', () => {
      const layout = renderer.getUserSelectLayout(4);
      for (const btn of layout.userButtons) {
        withinBounds(btn, W, H);
      }
    });

    it('works with zero users', () => {
      const layout = renderer.getUserSelectLayout(0);
      expect(layout.userButtons).toHaveLength(0);
      expect(layout.deleteIcons).toHaveLength(0);
      withinBounds(layout.newUserButton, W, H);
    });
  });

  describe('getKeypadLayout', () => {
    it('returns keys that do not overlap each other', () => {
      const keys = renderer.getKeypadLayout();
      expect(keys.length).toBeGreaterThan(0);

      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          expect(rectsOverlap(keys[i], keys[j])).toBe(false);
        }
      }
    });

    it('all keys are within canvas bounds', () => {
      const keys = renderer.getKeypadLayout();
      for (const key of keys) {
        withinBounds(key, W, H);
      }
    });

    it('includes all letters, digits, backspace, and OK', () => {
      const keys = renderer.getKeypadLayout();
      const labels = keys.map((k) => k.label);
      expect(labels).toContain('A');
      expect(labels).toContain('Z');
      expect(labels).toContain('0');
      expect(labels).toContain('9');
      expect(labels).toContain('⌫');
      expect(labels).toContain('OK');
    });
  });

  describe('getDeleteConfirmLayout', () => {
    it('cancel and delete buttons do not overlap', () => {
      const layout = renderer.getDeleteConfirmLayout();
      expect(rectsOverlap(layout.cancelBtn, layout.deleteBtn)).toBe(false);
    });

    it('both buttons are within canvas bounds', () => {
      const layout = renderer.getDeleteConfirmLayout();
      withinBounds(layout.cancelBtn, W, H);
      withinBounds(layout.deleteBtn, W, H);
    });
  });

  describe('getOpPickerLayout', () => {
    it('returns 4 op buttons within bounds', () => {
      const layout = renderer.getOpPickerLayout();
      expect(layout.opButtons).toHaveLength(4);
      for (const btn of layout.opButtons) {
        withinBounds(btn, W, H);
      }
    });

    it('op buttons do not overlap each other', () => {
      const layout = renderer.getOpPickerLayout();
      for (let i = 0; i < layout.opButtons.length; i++) {
        for (let j = i + 1; j < layout.opButtons.length; j++) {
          expect(rectsOverlap(layout.opButtons[i], layout.opButtons[j])).toBe(false);
        }
      }
    });
  });

  describe('getLevelPickerLayout', () => {
    it('returns 10 level buttons within bounds', () => {
      const layout = renderer.getLevelPickerLayout();
      expect(layout.levelButtons).toHaveLength(10);
      for (const btn of layout.levelButtons) {
        withinBounds(btn, W, H);
      }
    });

    it('level buttons do not overlap each other', () => {
      const layout = renderer.getLevelPickerLayout();
      for (let i = 0; i < layout.levelButtons.length; i++) {
        for (let j = i + 1; j < layout.levelButtons.length; j++) {
          expect(rectsOverlap(layout.levelButtons[i], layout.levelButtons[j])).toBe(false);
        }
      }
    });
  });

  describe('getPauseQuitRect', () => {
    it('returns a rect within canvas bounds', () => {
      const rect = renderer.getPauseQuitRect();
      withinBounds(rect, W, H);
    });
  });

  describe('with different screen sizes', () => {
    it('layouts adapt to a small mobile screen', () => {
      setWindowSize(375, 667, 2);
      const canvas = document.createElement('canvas');
      const r = new Renderer(canvas);
      r.resize();

      const cw = 375 * 2;
      const ch = 667 * 2;

      withinBounds(r.getBackButtonRect(), cw, ch);
      withinBounds(r.getPauseQuitRect(), cw, ch);

      const opLayout = r.getOpPickerLayout();
      for (const btn of opLayout.opButtons) {
        withinBounds(btn, cw, ch);
      }
    });
  });
});
