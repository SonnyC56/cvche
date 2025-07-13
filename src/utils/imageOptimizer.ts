// Image Optimization Utility
// Downsizes images to max 512x512 while maintaining aspect ratio

export interface OptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  excludePatterns: string[];
}

const DEFAULT_CONFIG: OptimizationConfig = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  excludePatterns: ['cvcheFish.png'] // Keep fish crisp
};

export const shouldOptimizeImage = (src: string, config: OptimizationConfig = DEFAULT_CONFIG): boolean => {
  // Check if image should be excluded from optimization
  return !config.excludePatterns.some(pattern => src.includes(pattern));
};

export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = 512,
  maxHeight: number = 512
): { width: number; height: number } => {
  // Calculate scaling factor to maintain aspect ratio
  const scaleX = maxWidth / originalWidth;
  const scaleY = maxHeight / originalHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

  return {
    width: Math.floor(originalWidth * scale),
    height: Math.floor(originalHeight * scale)
  };
};

export const optimizeImage = (
  image: HTMLImageElement,
  config: OptimizationConfig = DEFAULT_CONFIG
): HTMLCanvasElement => {
  const { width, height } = calculateOptimalDimensions(
    image.naturalWidth,
    image.naturalHeight,
    config.maxWidth,
    config.maxHeight
  );

  // Create canvas for optimization
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = width;
  canvas.height = height;
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw optimized image
  ctx.drawImage(image, 0, 0, width, height);
  
  return canvas;
};

export const loadOptimizedImage = (src: string, config?: OptimizationConfig): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Set up CORS and optimization attributes
    img.crossOrigin = 'anonymous';
    img.loading = 'eager';
    img.decoding = 'async';
    
    img.onload = () => {
      // Check if this image should be optimized
      if (!shouldOptimizeImage(src, config)) {
        console.log(`[ImageOptimizer] Skipping optimization for: ${src.split('/').pop()}`);
        resolve(img);
        return;
      }
      
      const originalSize = img.naturalWidth * img.naturalHeight;
      const targetSize = 512 * 512;
      
      // Only optimize if image is larger than target
      if (originalSize <= targetSize) {
        console.log(`[ImageOptimizer] Image already optimal: ${src.split('/').pop()} (${img.naturalWidth}x${img.naturalHeight})`);
        resolve(img);
        return;
      }
      
      try {
        console.log(`[ImageOptimizer] Optimizing: ${src.split('/').pop()} from ${img.naturalWidth}x${img.naturalHeight}`);
        
        const optimizedCanvas = optimizeImage(img, config);
        const optimizedImg = new Image();
        
        // Convert canvas to optimized image
        optimizedCanvas.toBlob((blob) => {
          if (!blob) {
            console.warn(`[ImageOptimizer] Failed to optimize: ${src.split('/').pop()}, using original`);
            resolve(img);
            return;
          }
          
          const optimizedUrl = URL.createObjectURL(blob);
          optimizedImg.onload = () => {
            console.log(`[ImageOptimizer] Optimized: ${src.split('/').pop()} to ${optimizedImg.naturalWidth}x${optimizedImg.naturalHeight}`);
            
            // Clean up original URL if it was a blob
            if (src.startsWith('blob:')) {
              URL.revokeObjectURL(src);
            }
            
            resolve(optimizedImg);
          };
          
          optimizedImg.onerror = () => {
            console.warn(`[ImageOptimizer] Failed to load optimized image: ${src.split('/').pop()}, using original`);
            URL.revokeObjectURL(optimizedUrl);
            resolve(img);
          };
          
          optimizedImg.src = optimizedUrl;
        }, 'image/webp', config?.quality || 0.85);
        
      } catch (error) {
        console.error(`[ImageOptimizer] Error optimizing image: ${src.split('/').pop()}`, error);
        resolve(img);
      }
    };
    
    img.onerror = (e) => {
      console.error(`[ImageOptimizer] Failed to load image: ${src}`, e);
      reject(new Error(`Failed to load image: ${src}`));
    };
    
    img.src = src;
  });
};

// Utility to check current image memory usage
export const getImageMemoryUsage = (images: HTMLImageElement[]): number => {
  return images.reduce((total, img) => {
    const pixels = img.naturalWidth * img.naturalHeight;
    const bytes = pixels * 4; // RGBA
    return total + bytes;
  }, 0);
};

// Utility to estimate memory savings
export const estimateMemorySavings = (
  originalWidth: number,
  originalHeight: number,
  config: OptimizationConfig = DEFAULT_CONFIG
): { originalBytes: number; optimizedBytes: number; savings: number } => {
  const originalBytes = originalWidth * originalHeight * 4;
  
  const { width, height } = calculateOptimalDimensions(
    originalWidth,
    originalHeight,
    config.maxWidth,
    config.maxHeight
  );
  
  const optimizedBytes = width * height * 4;
  const savings = originalBytes - optimizedBytes;
  
  return {
    originalBytes,
    optimizedBytes,
    savings
  };
};