// Object Pool implementation for performance optimization
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    initialSize: number = 50,
    maxSize: number = 1000
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  // Get an object from the pool
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  // Return an object to the pool
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  // Get current pool size
  size(): number {
    return this.pool.length;
  }

  // Clear the pool
  clear(): void {
    this.pool.length = 0;
  }
}

// Pre-calculated trigonometric values for performance
export class TrigCache {
  private sinCache: Map<number, number> = new Map();
  private cosCache: Map<number, number> = new Map();

  constructor() {
    this.preCalculate();
  }

  private preCalculate(): void {
    // Pre-calculate common angles
    for (let i = 0; i <= 360; i++) {
      const rad = (i * Math.PI) / 180;
      this.sinCache.set(i, Math.sin(rad));
      this.cosCache.set(i, Math.cos(rad));
    }
  }

  sin(radians: number): number {
    const degrees = Math.round((radians * 180) / Math.PI) % 360;
    const cached = this.sinCache.get(degrees);
    if (cached !== undefined) return cached;
    
    // Cache miss - calculate and store
    const value = Math.sin(radians);
    this.sinCache.set(degrees, value);
    return value;
  }

  cos(radians: number): number {
    const degrees = Math.round((radians * 180) / Math.PI) % 360;
    const cached = this.cosCache.get(degrees);
    if (cached !== undefined) return cached;
    
    // Cache miss - calculate and store
    const value = Math.cos(radians);
    this.cosCache.set(degrees, value);
    return value;
  }
}

// Gradient cache for performance
export class GradientCache {
  private cache: Map<string, CanvasGradient> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  getRadialGradient(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
    stops: Array<[number, string]>
  ): CanvasGradient {
    const key = `radial:${x0},${y0},${r0},${x1},${y1},${r1},${stops.join(',')}`;
    
    let gradient = this.cache.get(key);
    if (!gradient) {
      gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
      for (const [offset, color] of stops) {
        gradient.addColorStop(offset, color);
      }
      
      // Evict oldest if cache is full
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      
      this.cache.set(key, gradient);
    }
    
    return gradient;
  }

  getLinearGradient(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    stops: Array<[number, string]>
  ): CanvasGradient {
    const key = `linear:${x0},${y0},${x1},${y1},${stops.join(',')}`;
    
    let gradient = this.cache.get(key);
    if (!gradient) {
      gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      for (const [offset, color] of stops) {
        gradient.addColorStop(offset, color);
      }
      
      // Evict oldest if cache is full
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      
      this.cache.set(key, gradient);
    }
    
    return gradient;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Color parsing cache
export class ColorCache {
  private cache: Map<string, { r: number; g: number; b: number; a: number }> = new Map();

  parseColor(color: string): { r: number; g: number; b: number; a: number } {
    const cached = this.cache.get(color);
    if (cached) return cached;

    let r = 0, g = 0, b = 0, a = 1;

    if (color.startsWith('#')) {
      // Hex color
      const hex = color.slice(1);
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length >= 6) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        if (hex.length === 8) {
          a = parseInt(hex.slice(6, 8), 16) / 255;
        }
      }
    } else if (color.startsWith('rgba')) {
      const match = color.match(/rgba?\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map(s => s.trim());
        r = parseInt(parts[0]);
        g = parseInt(parts[1]);
        b = parseInt(parts[2]);
        a = parts.length > 3 ? parseFloat(parts[3]) : 1;
      }
    } else if (color.startsWith('rgb')) {
      const match = color.match(/rgb\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',').map(s => s.trim());
        r = parseInt(parts[0]);
        g = parseInt(parts[1]);
        b = parseInt(parts[2]);
      }
    }

    const result = { r, g, b, a };
    this.cache.set(color, result);
    return result;
  }

  toRGBA(r: number, g: number, b: number, a: number): string {
    return `rgba(${r},${g},${b},${a})`;
  }

  clear(): void {
    this.cache.clear();
  }
}