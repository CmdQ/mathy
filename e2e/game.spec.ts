import { test, expect } from '@playwright/test';

test.describe('Mathy game', () => {
  test('page loads with a visible canvas and no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    const canvas = page.locator('canvas#game');
    await expect(canvas).toBeVisible();

    // Canvas should have non-zero dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    expect(consoleErrors).toHaveLength(0);
  });

  test('start screen renders content on canvas', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('canvas#game');
    await expect(canvas).toBeVisible();

    // Allow a frame to render
    await page.waitForTimeout(500);

    // Verify the canvas has non-transparent pixels (something was drawn)
    const hasContent = await page.evaluate(() => {
      const c = document.getElementById('game') as HTMLCanvasElement;
      const ctx = c.getContext('2d');
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      // Check if any pixel is not pure black/transparent
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) return true;
      }
      return false;
    });
    expect(hasContent).toBe(true);
  });

  test('can interact with the canvas without crashing', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    const canvas = page.locator('canvas#game');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(300);

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Click center of canvas (the "New Player" area on initial screen)
    const cx = box!.x + box!.width / 2;
    // New Player button is below center, roughly 60-70% down
    const newPlayerY = box!.y + box!.height * 0.35;
    await page.mouse.click(cx, newPlayerY);
    await page.waitForTimeout(300);

    // Click a few times in the keypad area to simulate typing
    const keypadY = box!.y + box!.height * 0.45;
    await page.mouse.click(cx - 50, keypadY);
    await page.waitForTimeout(100);
    await page.mouse.click(cx, keypadY);
    await page.waitForTimeout(100);
    await page.mouse.click(cx + 50, keypadY);
    await page.waitForTimeout(100);

    // Page should still be alive — no crash
    const canvasStillVisible = await canvas.isVisible();
    expect(canvasStillVisible).toBe(true);

    expect(consoleErrors).toHaveLength(0);
  });
});
