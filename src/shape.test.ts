import { describe, it, expect } from 'vitest';
import { Shape, spawnShapes } from './shape';

describe('Shape', () => {
  it('starts above the viewport', () => {
    const shape = new Shape(100, 0, 42, 80);
    expect(shape.y).toBeLessThan(0);
  });

  it('moves downward on update', () => {
    const shape = new Shape(100, 0, 42, 80);
    const startY = shape.y;
    shape.update(0.5);
    expect(shape.y).toBeGreaterThan(startY);
  });

  it('does not move when not alive', () => {
    const shape = new Shape(100, 0, 42, 80);
    shape.alive = false;
    const startY = shape.y;
    shape.update(0.5);
    expect(shape.y).toBe(startY);
  });

  it('stores the answer', () => {
    const shape = new Shape(100, 0, 42, 80);
    expect(shape.answer).toBe(42);
  });

  describe('containsPoint — circle', () => {
    it('detects a point inside', () => {
      const shape = new Shape(100, 100, 1, 80);
      shape.y = 100;
      shape.type = 'circle';
      shape.radius = 40;
      expect(shape.containsPoint(100, 100)).toBe(true);
      expect(shape.containsPoint(130, 100)).toBe(true);
    });

    it('rejects a point outside', () => {
      const shape = new Shape(100, 100, 1, 80);
      shape.y = 100;
      shape.type = 'circle';
      shape.radius = 40;
      expect(shape.containsPoint(200, 200)).toBe(false);
    });
  });

  describe('containsPoint — square', () => {
    it('detects a point inside', () => {
      const shape = new Shape(100, 100, 1, 80);
      shape.y = 100;
      shape.type = 'square';
      shape.radius = 40;
      expect(shape.containsPoint(100, 100)).toBe(true);
      expect(shape.containsPoint(130, 130)).toBe(true);
    });

    it('rejects a point outside', () => {
      const shape = new Shape(100, 100, 1, 80);
      shape.y = 100;
      shape.type = 'square';
      shape.radius = 40;
      expect(shape.containsPoint(200, 200)).toBe(false);
    });
  });

  describe('triggerPop', () => {
    it('sets popAnimation', () => {
      const shape = new Shape(100, 0, 1, 80);
      shape.triggerPop();
      expect(shape.popAnimation).toBe(1);
    });

    it('decays popAnimation over time', () => {
      const shape = new Shape(100, 0, 1, 80);
      shape.triggerPop();
      shape.update(0.1);
      expect(shape.popAnimation).toBeLessThan(1);
    });
  });

  describe('triggerShake', () => {
    it('sets shakeOffset', () => {
      const shape = new Shape(100, 0, 1, 80);
      shape.triggerShake();
      expect(shape.shakeOffset).toBe(12);
    });

    it('decays shakeOffset over time', () => {
      const shape = new Shape(100, 0, 1, 80);
      shape.triggerShake();
      shape.update(0.1);
      expect(Math.abs(shape.shakeOffset)).toBeLessThan(12);
    });
  });
});

describe('spawnShapes', () => {
  it('creates the correct number of shapes', () => {
    const shapes = spawnShapes([1, 2, 3, 4], 800, 80);
    expect(shapes).toHaveLength(4);
  });

  it('assigns the given answers', () => {
    const answers = [10, 20, 30, 40];
    const shapes = spawnShapes(answers, 800, 80);
    const shapeAnswers = shapes.map((s) => s.answer).sort((a, b) => a - b);
    expect(shapeAnswers).toEqual(answers);
  });

  it('positions shapes within canvas width', () => {
    const shapes = spawnShapes([1, 2, 3, 4], 800, 80);
    for (const s of shapes) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(800);
    }
  });
});
