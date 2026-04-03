export type InputCallback = (x: number, y: number) => void;

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private callback: InputCallback | null = null;
  private boundHandler: (e: PointerEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.boundHandler = this.handlePointer.bind(this);
    canvas.addEventListener('pointerdown', this.boundHandler);
    // Prevent default touch behaviors
    canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onTap(callback: InputCallback): void {
    this.callback = callback;
  }

  private handlePointer(e: PointerEvent): void {
    if (!this.callback) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    this.callback(x, y);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.boundHandler);
  }
}
