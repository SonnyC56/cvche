// Utility class to handle GIF animation in Canvas
export class GifAnimator {
  private frames: HTMLCanvasElement[] = [];
  private frameDelays: number[] = [];
  private currentFrameIndex: number = 0;
  private lastFrameTime: number = 0;
  private width: number = 0;
  private height: number = 0;
  private loaded: boolean = false;

  // Constructor accepts a GIF URL
  constructor(private gifUrl: string) {}

  // Method to load and parse the GIF
  async load(): Promise<void> {
    try {
      // Create a temporary image element to load the GIF
      const img = document.createElement('img');
      img.src = this.gifUrl;
      
      // Wait for the image to load
      await new Promise<void>((resolve) => {
        img.onload = () => {
          this.width = img.naturalWidth;
          this.height = img.naturalHeight;
          resolve();
        };
      });

      // Create a single frame as fallback
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = this.width;
      fallbackCanvas.height = this.height;
      const fallbackCtx = fallbackCanvas.getContext('2d');
      if (fallbackCtx) {
        fallbackCtx.drawImage(img, 0, 0);
        this.frames.push(fallbackCanvas);
        this.frameDelays.push(100); // Default 100ms delay
      }

      // For simplicity, we'll assume 10 frames of animation at 100ms each
      // In a production system, you'd want to parse the actual GIF frames and delays
      for (let i = 0; i < 9; i++) {
        this.frameDelays.push(100);
      }

      // Mark as loaded
      this.loaded = true;
    } catch (error) {
      console.error('Error loading GIF:', error);
    }
  }

  // Draw the current frame on a provided canvas context
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    if (!this.loaded || this.frames.length === 0) {
      return;
    }

    // Update the current frame based on time
    const now = performance.now();
    if (now - this.lastFrameTime > this.frameDelays[this.currentFrameIndex]) {
      this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
      this.lastFrameTime = now;
    }

    // Draw the current frame
    ctx.drawImage(this.frames[this.currentFrameIndex], x, y, width, height);
  }

  // Get the current frame as an image element (for compatibility with existing code)
  getImage(): HTMLCanvasElement | null {
    if (!this.loaded || this.frames.length === 0) {
      return null;
    }
    return this.frames[this.currentFrameIndex];
  }

  // Check if the GIF is loaded
  isLoaded(): boolean {
    return this.loaded;
  }

  // Get the natural width of the GIF
  getNaturalWidth(): number {
    return this.width;
  }

  // Get the natural height of the GIF
  getNaturalHeight(): number {
    return this.height;
  }
}

// Helper class that manages all GIF animations in the game
export class GifManager {
  private static instance: GifManager;
  private gifAnimators: Map<string, GifAnimator> = new Map();

  // Singleton pattern
  private constructor() {}

  static getInstance(): GifManager {
    if (!GifManager.instance) {
      GifManager.instance = new GifManager();
    }
    return GifManager.instance;
  }

  // Get or create a GifAnimator for a given URL
  async getAnimator(gifUrl: string): Promise<GifAnimator> {
    // Check if we already have an animator for this GIF
    if (!this.gifAnimators.has(gifUrl)) {
      const animator = new GifAnimator(gifUrl);
      await animator.load();
      this.gifAnimators.set(gifUrl, animator);
    }
    return this.gifAnimators.get(gifUrl)!;
  }
}
