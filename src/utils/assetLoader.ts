import { FrameAnimatorManager } from './GifAnimator';

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
  batsAnimator: any = null; // Will store the frame animator instead of GIF animator
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
  async loadBasicAssets(): Promise<void> {
    const assetPromises = [
      await this.loadImage('/sprites/cvcheFish.webp').then(img => this.fishImage = img),
      await this.loadImage('/sprites/waterBottle.webp').then(img => this.waterBottleImage = img),
      await this.loadImage('/sprites/plasticBag.webp').then(img => this.plasticBagImage = img),
      await this.loadImage('/sprites/oilSplat.webp').then(img => this.oilSplatImage = img),
      await this.loadImage('/sprites/fishHook.webp').then(img => this.fishHookImage = img),
      await this.loadImage('/sprites/flipflop.webp').then(img => this.flipflopImage = img),
      await this.loadImage('/sprites/toothbrush.webp').then(img => this.toothbrushImage = img),
      await this.loadImage('/sprites/hotdog.webp').then(img => this.hotdogImage = img),
      await this.loadImage('/sprites/rubberDucky.webp').then(img => this.rubberDuckyImage = img),
      await this.loadAudio('/sounds/pickup.mp3', 0.3).then(audio => this.pickupSound = audio),
      await this.loadAudio('/sounds/hit.mp3', 0.3).then(audio => this.hitSound = audio)
    ];

    await Promise.all(assetPromises);
  }

  // Load flora images
  async loadFloraAssets(): Promise<void> {
    const floraFileNames = ['1 (1).webp', ...Array.from({ length: 20 }, (_, i) => `1 (${i + 16}).webp`)];
    const floraPromises = floraFileNames.map(fileName =>
      this.loadImage(`/sprites/flora/${fileName}`).then(img => this.floraImages.push(img))
    );

    await Promise.all(floraPromises);
    this.floraLoaded = true;
  }

  // Load level 2 specific assets
  async loadLevel2Assets(): Promise<void> {
    console.log('Loading level 2 assets...');
    // Load each obstacle image independently with separate promises
    const busPromise = this.loadImage('/sprites/level2/obstacles/bus.webp').then(img => {
      this.busImage = img;
      // Add to array in a specific order to ensure consistent indexing
      this.level2ObstacleImages[0] = img;
    });
    
    // Load static bat image
    const batsImagePromise = this.loadImage('/sprites/level2/obstacles/bats.png').then(img => {
      this.batsImage = img;
      // Add to array at index 1
      this.level2ObstacleImages[1] = img;
    });
    
    // Setup the frame animator with individual bat frames (0-12)
    const batsFramePaths: string[] = [];
    for (let i = 0; i <= 12; i++) {
      batsFramePaths.push(`/sprites/level2/obstacles/bats_frames-${i}.png`);
    }
    
    const batsAnimatorPromise = FrameAnimatorManager.getInstance()
      .getAnimator('bats', batsFramePaths, 70) // ~14fps animation
      .then(animator => {
        this.batsAnimator = animator;
        console.log("Bats frame animator initialized");
      });
    
    // Load chicken image
    const chickenPromise = this.loadImage('/sprites/level2/obstacles/chicken.webp').then(img => {
      this.chickenImage = img;
      // Add to array at index 2
      this.level2ObstacleImages[2] = img;
    });

    // Group obstacle promises
    const obstaclePromises = [busPromise, batsImagePromise, batsAnimatorPromise, chickenPromise];

    // Pickup promises in parallel
    const vitaminCPromise = this.loadImage('/sprites/level2/pickups/vitaminC.webp').then(img => {
      this.vitaminCImage = img;
      this.level2PickupImages.push(img);
    });
    
    const pillPromise = this.loadImage('/sprites/level2/pickups/pill.webp').then(img => {
      this.pillImage = img;
      this.level2PickupImages.push(img);
    });
    
    const tumericPromise = this.loadImage('/sprites/level2/pickups/tumeric.webp').then(img => {
      this.tumericImage = img;
      this.level2PickupImages.push(img);
    });
    
    const gingerPromise = this.loadImage('/sprites/level2/pickups/ginger.webp').then(img => {
      this.gingerImage = img;
      this.level2PickupImages.push(img);
    });
    
    const pickupPromises = [vitaminCPromise, pillPromise, tumericPromise, gingerPromise];

    // Preload the video
    const videoPromise = this.preloadVideo('/videos/level2background-compressed.mp4');

    console.log('Waiting for all level 2 assets to load...');
    try {
      // Wait for all assets to load
      await Promise.all([
        ...obstaclePromises, 
        ...pickupPromises, 
        videoPromise
      ]);
      
      console.log('All level 2 assets loaded successfully');
      this.level2AssetsLoaded = true;
    } catch (error) {
      console.error('Error loading level 2 assets:', error);
      throw error;
    }
  }

  // Load level 3 specific assets
  async loadLevel3Assets(): Promise<void> {
    console.log('Loading level 3 assets...');
    // Load obstacle images
    const cloudPromise = this.loadImage('/sprites/level3/obstacles/clouds.webp').then(img => {
      this.cloudImage = img;
      this.level3ObstacleImages.push(img);
    });
      
    const eaglePromise = this.loadImage('/sprites/level3/obstacles/eagle.webp').then(img => {
      this.eagleImage = img;
      this.level3ObstacleImages.push(img);
    });
      
    const gullPromise = this.loadImage('/sprites/level3/obstacles/black-headed-gull.webp').then(img => {
      this.level3ObstacleImages.push(img);
    });

    const obstaclePromises = [cloudPromise, eaglePromise, gullPromise];
    
    // Load mushroom images
    const mushroomPromises = [];
    for (let i = 1; i <= 9; i++) {
      mushroomPromises.push(
        this.loadImage(`/sprites/level3/mushrooms/mushroom (${i}).webp`).then(img => {
          this.level3MushroomImages.push(img);
        })
      );
    }

    // Load trippy images
    const trippyTypes = [
      'baby', 'baby2', 'blueMan', 'gummyWorm', 'kitten',
      'magicRabbit', 'pomeranian', 'squirtToy', 'woman'
    ];

    const trippyPromises = trippyTypes.map(type => {
      const ext = type === 'blueMan' ? 'jpg' : 'webp';
      return this.loadImage(`/sprites/level3/trippyPickups/${type}.${ext}`).then(img => {
        this.level3TrippyImages.push(img);
      });
    });
    
    try {
      await Promise.all([...obstaclePromises, ...mushroomPromises, ...trippyPromises]);
      console.log('All level 3 assets loaded successfully');
      this.level3AssetsLoaded = true;
    } catch (error) {
      console.error('Error loading level 3 assets:', error);
      throw error;
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
