import { FrameAnimatorManager, FrameAnimator } from './GifAnimator';

// Define the callback type for progress updates
type ProgressCallback = (loaded: number, total: number) => void;

// Class to handle asset loading with promises
export class AssetLoader {
  // Main game assets
  fishImage: HTMLImageElement | null = null;
  waterBottleImage: HTMLImageElement | null = null;
  plasticBagImage: HTMLImageElement | null = null;
  oilSplatImage: HTMLImageElement | null = null;
  fishHookImage: HTMLImageElement | null = null;
  flipflopImage: HTMLImageElement | null = null;
  toothbrushImage: HTMLImageElement | null = null;
  hotdogImage: HTMLImageElement | null = null;
  rubberDuckyImage: HTMLImageElement | null = null;

  // Level 2 specific assets
  busImage: HTMLImageElement | null = null;
  batsImage: HTMLImageElement | null = null;
  batsFrames: HTMLImageElement[] = [];
  batsAnimator: FrameAnimator | null = null; // Use the correct type
  chickenImage: HTMLImageElement | null = null;
  vitaminCImage: HTMLImageElement | null = null;
  pillImage: HTMLImageElement | null = null;
  gingerImage: HTMLImageElement | null = null;
  tumericImage: HTMLImageElement | null = null;

  // Level 3 specific assets
  cloudImage: HTMLImageElement | null = null;
  eagleImage: HTMLImageElement | null = null;

  // Collections
  floraImages: HTMLImageElement[] = [];
  level2ObstacleImages: HTMLImageElement[] = [];
  level2PickupImages: HTMLImageElement[] = [];
  level3ObstacleImages: HTMLImageElement[] = [];
  level3MushroomImages: HTMLImageElement[] = [];
  level3TrippyImages: HTMLImageElement[] = [];

  // Sound effects
  pickupSound: HTMLAudioElement | null = null;
  hitSound: HTMLAudioElement | null = null;

  // Status flags
  floraLoaded = false;
  level2AssetsLoaded = false;
  level2VideoLoaded = false;
  level3AssetsLoaded = false;

  // Video element for level 2
  level2Video: HTMLVideoElement | null = null;

  constructor() { }

  // Load basic game assets
  async loadBasicAssets(onProgress?: ProgressCallback): Promise<void> {
    console.log('Loading basic game assets...');
    let loadedCount = 0;
    const totalAssets = 11; // 9 images + 2 sounds
    
    const updateProgress = () => {
      loadedCount++;
      onProgress?.(loadedCount, totalAssets);
    };

    const imagePromises = [
      this.loadImage('/sprites/cvcheFish.png').then(img => {
        this.fishImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/waterBottle.webp').then(img => {
        this.waterBottleImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/plasticBag.webp').then(img => {
        this.plasticBagImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/oilSplat.webp').then(img => {
        this.oilSplatImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/fishHook.webp').then(img => {
        this.fishHookImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/flipflop.webp').then(img => {
        this.flipflopImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/toothbrush.webp').then(img => {
        this.toothbrushImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/hotdog.webp').then(img => {
        this.hotdogImage = img;
        updateProgress();
      }),
      this.loadImage('/sprites/rubberDucky.webp').then(img => {
        this.rubberDuckyImage = img;
        updateProgress();
      }),
      this.loadAudio('/sounds/pickup.mp3', 0.3).then(audio => {
        this.pickupSound = audio;
        updateProgress();
      }),
      this.loadAudio('/sounds/hit.mp3', 0.3).then(audio => {
        this.hitSound = audio;
        updateProgress();
      })
    ];

    try {
      await Promise.all(imagePromises);
      console.log('All basic assets loaded successfully');
      onProgress?.(totalAssets, totalAssets); // Ensure 100% is reported
    } catch (error) {
      console.error('Error loading basic assets:', error);
      onProgress?.(totalAssets, totalAssets); // Report completion even on error
      throw error; // Re-throw error
    }
  }

  // Load flora images
  async loadFloraAssets(onProgress?: ProgressCallback): Promise<void> {
    console.log('Loading flora assets...');
    const floraFileNames = ['1 (1).webp', ...Array.from({ length: 20 }, (_, i) => `1 (${i + 16}).webp`)];
    const totalAssets = floraFileNames.length;
    let loadedCount = 0;
    
    const updateProgress = () => {
      loadedCount++;
      onProgress?.(loadedCount, totalAssets);
    };
    
    const floraPromises = floraFileNames.map(fileName =>
      this.loadImage(`/sprites/flora/${fileName}`).then(img => {
        this.floraImages.push(img);
        updateProgress();
      })
    );

    try {
      await Promise.all(floraPromises);
      this.floraLoaded = true;
      console.log('All flora assets loaded successfully');
      onProgress?.(totalAssets, totalAssets); // Ensure 100% is reported
    } catch (error) {
      console.error('Error loading flora assets:', error);
      onProgress?.(totalAssets, totalAssets); // Report completion even on error
      throw error; // Re-throw error
    }
  }

  // Load level 2 specific assets with progress reporting
  async loadLevel2Assets(onProgress?: ProgressCallback): Promise<void> {
    console.log('Loading level 2 assets...');
    let loadedCount = 0;
    // Total assets: bus(1) + bats_static(1) + bats_animator(1) + chicken2(1) + chicken3-7(5) + pickups(4) + video(1) = 14
    const totalAssets = 14;

    const updateProgress = () => {
      loadedCount++;
      onProgress?.(loadedCount, totalAssets);
    };

    // --- Create all individual promises ---

    const busPromise = this.loadImage('/sprites/level2/obstacles/bus.webp').then(img => {
      this.busImage = img;
      this.level2ObstacleImages[0] = img; // Assign to specific index
      updateProgress(); // Track progress
    });

    const batsImagePromise = this.loadImage('/sprites/level2/obstacles/bats.png').then(img => {
      this.batsImage = img;
      this.level2ObstacleImages[1] = img; // Assign to specific index
      updateProgress(); // Track progress
    });

    const batsFramePaths: string[] = Array.from({ length: 13 }, (_, i) => `/sprites/level2/obstacles/bats_frames-${i}.png`);
    const batsAnimatorPromise = FrameAnimatorManager.getInstance()
      .getAnimator('bats', batsFramePaths, 70) // Treat animator init as one asset load
      .then(animator => {
        this.batsAnimator = animator;
        console.log("Bats frame animator initialized");
        updateProgress(); // Track progress
      });

    const chicken2Promise = this.loadImage('/sprites/level2/obstacles/chicken_2.webp').then(img => {
      this.chickenImage = img;
      this.level2ObstacleImages[2] = img; // Assign to specific index
      updateProgress(); // Track progress
    });

    const chickenPromises: Promise<void>[] = [];
    for (let i = 3; i <= 7; i++) {
      const index = i; // Capture index for closure
      const promise = this.loadImage(`/sprites/level2/obstacles/chicken_${index}.webp`).then(img => {
        this.level2ObstacleImages[index] = img; // Assign to specific index
        updateProgress(); // Track progress
      });
      chickenPromises.push(promise);
    }

    const vitaminCPromise = this.loadImage('/sprites/level2/pickups/vitaminC.webp').then(img => {
      this.vitaminCImage = img;
      this.level2PickupImages.push(img);
      updateProgress(); // Track progress
    });

    const pillPromise = this.loadImage('/sprites/level2/pickups/pill.webp').then(img => {
      this.pillImage = img;
      this.level2PickupImages.push(img);
      updateProgress(); // Track progress
    });

    const tumericPromise = this.loadImage('/sprites/level2/pickups/tumeric.webp').then(img => {
      this.tumericImage = img;
      this.level2PickupImages.push(img);
      updateProgress(); // Track progress
    });

    const gingerPromise = this.loadImage('/sprites/level2/pickups/ginger.webp').then(img => {
      this.gingerImage = img;
      this.level2PickupImages.push(img);
      updateProgress(); // Track progress
    });

    const videoPromise = this.preloadVideo('/videos/level2background-compressed.mp4').then(() => {
      updateProgress(); // Track progress
    });

    // --- Group all promises ---
    const allPromises = [
      busPromise,
      batsImagePromise,
      batsAnimatorPromise,
      chicken2Promise,
      ...chickenPromises,
      vitaminCPromise,
      pillPromise,
      tumericPromise,
      gingerPromise,
      videoPromise
    ];

    console.log(`Waiting for ${totalAssets} level 2 assets to load...`);
    try {
      await Promise.all(allPromises);
      console.log('All level 2 assets loaded successfully');
      this.level2AssetsLoaded = true;
      onProgress?.(totalAssets, totalAssets); // Ensure 100% is reported
    } catch (error) {
      console.error('Error loading level 2 assets:', error);
      // Optionally report completion even on error, or handle differently
      onProgress?.(totalAssets, totalAssets);
      throw error; // Re-throw error after reporting progress
    }
  }

  // Load level 3 specific assets with progress reporting
  async loadLevel3Assets(onProgress?: ProgressCallback): Promise<void> {
    console.log('Loading level 3 assets...');
    let loadedCount = 0;
    // Total assets: obstacles(3) + mushrooms(9) + trippy(9) = 21
    const totalAssets = 21;

    const updateProgress = () => {
      loadedCount++;
      onProgress?.(loadedCount, totalAssets);
    };

    // --- Create all individual promises ---

    const cloudPromise = this.loadImage('/sprites/level3/obstacles/clouds.webp').then(img => {
      this.cloudImage = img;
      this.level3ObstacleImages.push(img);
      updateProgress();
    });

    const eaglePromise = this.loadImage('/sprites/level3/obstacles/eagle.webp').then(img => {
      this.eagleImage = img;
      this.level3ObstacleImages.push(img);
      updateProgress();
    });

    const gullPromise = this.loadImage('/sprites/level3/obstacles/black-headed-gull.webp').then(img => {
      this.level3ObstacleImages.push(img);
      updateProgress();
    });

    const mushroomPromises: Promise<void>[] = [];
    for (let i = 1; i <= 9; i++) {
      const promise = this.loadImage(`/sprites/level3/mushrooms/mushroom (${i}).webp`).then(img => {
        this.level3MushroomImages.push(img);
        updateProgress();
      });
      mushroomPromises.push(promise);
    }

    const trippyTypes = [
      'baby', 'baby2', 'blueMan', 'gummyWorm', 'kitten',
      'magicRabbit', 'pomeranian', 'squirtToy', 'woman'
    ];
    const trippyPromises: Promise<void>[] = trippyTypes.map(type => {
      const ext = 'webp';
      return this.loadImage(`/sprites/level3/trippyPickups/${type}.${ext}`).then(img => {
        this.level3TrippyImages.push(img);
        updateProgress();
      });
    });

    // --- Group all promises ---
    const allPromises = [
      cloudPromise,
      eaglePromise,
      gullPromise,
      ...mushroomPromises,
      ...trippyPromises
    ];

    console.log(`Waiting for ${totalAssets} level 3 assets to load...`);
    try {
      await Promise.all(allPromises);
      console.log('All level 3 assets loaded successfully');
      this.level3AssetsLoaded = true;
      onProgress?.(totalAssets, totalAssets); // Ensure 100% is reported
    } catch (error) {
      console.error('Error loading level 3 assets:', error);
      onProgress?.(totalAssets, totalAssets); // Report completion even on error
      throw error; // Re-throw error
    }
  }

  // Helper method to load an image
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error(`Failed to load image: ${src}`, e);
        reject(new Error(`Failed to load image: ${src}`));
      };
      img.src = src;
    });
  }

  // Helper method to load audio
  private loadAudio(src: string, volume: number = 1.0): Promise<HTMLAudioElement> {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
      audio.load();
      
      // Add a timeout to prevent hanging if audio loading is slow
      setTimeout(() => {
        if (!audio.readyState) {
          console.warn(`Audio loading taking too long: ${src}, resolving anyway`);
          resolve(audio);
        }
      }, 5000);
    });
  }

  // Preload video for level 2
  private preloadVideo(src: string): Promise<void> {
    console.log(`Preloading video: ${src}`);
    return new Promise((resolve) => {
      // Create a new video element if we don't already have one
      if (!this.level2Video) {
        this.level2Video = document.createElement('video');
      }
      
      const video = this.level2Video;
      video.muted = true;
      video.playsInline = true; // Important for iOS
      video.preload = 'auto';
      
      // Set up event listeners
      const onLoaded = () => {
        console.log(`Video preloaded: ${src}`);
        this.level2VideoLoaded = true;
        video.removeEventListener('loadeddata', onLoaded);
        resolve();
      };
      
      video.addEventListener('loadeddata', onLoaded);
      
      // Handle errors
      video.addEventListener('error', () => {
        console.warn(`Error loading video: ${src}, resolving anyway`);
        resolve();
      }, { once: true });
      
      // Set source and begin loading
      video.src = src;
      video.load();
      
      // Add a timeout to prevent hanging on video loading
      setTimeout(() => {
        if (!this.level2VideoLoaded) {
          console.warn(`Video loading taking too long: ${src}, resolving anyway`);
          resolve();
        }
      }, 8000);
    });
  }
}
