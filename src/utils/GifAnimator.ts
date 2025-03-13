// Utility class to handle animation in Canvas

// Frame-by-frame animation class
export class FrameAnimator {
  private frames: HTMLImageElement[] = [];
  private loaded: boolean = false;
  private currentFrame: number = 0;
  private lastFrameTime: number = 0;
  private frameDelay: number = 100; // Default 100ms between frames (10fps)

  constructor(private framePaths: string[], frameDelay?: number) {
    if (frameDelay) this.frameDelay = frameDelay;
  }

  // Load all frames
  async load(): Promise<void> {
    this.frames = [];
    
    // Load all frames in parallel
    const loadPromises = this.framePaths.map(path => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load frame: ${path}`));
        img.src = path;
      });
    });
    
    try {
      this.frames = await Promise.all(loadPromises);
      this.loaded = true;
      console.log(`Loaded ${this.frames.length} animation frames`);
    } catch (error) {
      console.error('Error loading animation frames:', error);
      throw error;
    }
  }

  // Draw the current frame and advance to the next one based on timing
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    if (!this.loaded || this.frames.length === 0) return;
    
    const now = performance.now();
    if (now - this.lastFrameTime > this.frameDelay) {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      this.lastFrameTime = now;
    }
    
    const frame = this.frames[this.currentFrame];
    ctx.drawImage(frame, x, y, width, height);
  }

  // Get the current frame as an image element
  getImage(): HTMLImageElement | null {
    if (!this.loaded || this.frames.length === 0) return null;
    return this.frames[this.currentFrame];
  }

  // Check if the animation is loaded
  isLoaded(): boolean {
    return this.loaded;
  }

  // Get the natural width (using the first frame)
  getNaturalWidth(): number {
    if (!this.loaded || this.frames.length === 0) return 0;
    return this.frames[0].naturalWidth;
  }

  // Get the natural height (using the first frame)
  getNaturalHeight(): number {
    if (!this.loaded || this.frames.length === 0) return 0;
    return this.frames[0].naturalHeight;
  }
  
  // Get the current frame index
  getCurrentFrameIndex(): number {
    return this.currentFrame;
  }
}

// Helper class that manages all frame-by-frame animations
export class FrameAnimatorManager {
  private static instance: FrameAnimatorManager;
  private frameAnimators: Map<string, FrameAnimator> = new Map();

  // Singleton pattern
  private constructor() {}

  static getInstance(): FrameAnimatorManager {
    if (!FrameAnimatorManager.instance) {
      FrameAnimatorManager.instance = new FrameAnimatorManager();
    }
    return FrameAnimatorManager.instance;
  }

  // Get or create a FrameAnimator for a given key and set of frames
  async getAnimator(key: string, framePaths: string[], frameDelay?: number): Promise<FrameAnimator> {
    if (!this.frameAnimators.has(key)) {
      const animator = new FrameAnimator(framePaths, frameDelay);
      await animator.load();
      this.frameAnimators.set(key, animator);
    }
    return this.frameAnimators.get(key)!;
  }
}

// GIF animation handling class (original implementation)
export class GifAnimator {
  private image: HTMLImageElement;
  private loaded: boolean = false;
  private width: number = 0;
  private height: number = 0;

  // Constructor accepts a GIF URL
  constructor(private gifUrl: string) {
    this.image = new Image();
  }

  // Method to load the GIF
  async load(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.image.onload = () => {
        this.width = this.image.naturalWidth;
        this.height = this.image.naturalHeight;
        this.loaded = true;
        console.log(`GIF loaded with dimensions ${this.width}x${this.height}`);
        resolve();
      };
      
      this.image.onerror = (error) => {
        console.error('Error loading GIF:', error);
        reject(new Error('Failed to load GIF'));
      };
      
      // Set the source after the handlers to ensure they're registered
      this.image.src = this.gifUrl;
    });
  }

  // Draw the GIF on a provided canvas context
  // The browser automatically handles GIF animation frames
  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    if (!this.loaded) {
      return;
    }
    ctx.drawImage(this.image, x, y, width, height);
  }

  // Get the current frame as an image element (for compatibility with existing code)
  getImage(): HTMLImageElement | null {
    if (!this.loaded) {
      return null;
    }
    return this.image;
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
  
  // Get the current frame index for debugging (always returns 0 in this implementation)
  getCurrentFrameIndex(): number {
    return 0; // Browser handles GIF animation internally
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
