
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


  constructor() {}

  // Load basic game assets
  async loadBasicAssets(): Promise<void> {
    const assetPromises = [
      this.loadImage('/sprites/cvcheFish.webp').then(img => this.fishImage = img),
      this.loadImage('/sprites/waterBottle.webp').then(img => this.waterBottleImage = img),
      this.loadImage('/sprites/plasticBag.webp').then(img => this.plasticBagImage = img),
      this.loadImage('/sprites/oilSplat.webp').then(img => this.oilSplatImage = img),
      this.loadImage('/sprites/fishHook.webp').then(img => this.fishHookImage = img),
      this.loadImage('/sprites/flipflop.webp').then(img => this.flipflopImage = img),
      this.loadImage('/sprites/toothbrush.webp').then(img => this.toothbrushImage = img),
      this.loadImage('/sprites/hotdog.webp').then(img => this.hotdogImage = img),
      this.loadImage('/sprites/rubberDucky.webp').then(img => this.rubberDuckyImage = img),
      this.loadAudio('/sounds/pickup.mp3', 0.3).then(audio => this.pickupSound = audio),
      this.loadAudio('/sounds/hit.mp3', 0.3).then(audio => this.hitSound = audio)
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
    const obstaclePromises = [
      this.loadImage('/sprites/level2/obstacles/bus.webp').then(img =>  {
        this.busImage = img;
        this.level2ObstacleImages.push(img);
      }),
      this.loadImage('/sprites/level2/obstacles/bats.webp').then(img => {
        this.batsImage = img;
        this.level2ObstacleImages.push(img);
      }),
      this.loadImage('/sprites/level2/obstacles/chicken.webp').then(img => {
        this.chickenImage = img;
        this.level2ObstacleImages.push(img);
      })
    ];

    const pickupPromises = [
      this.loadImage('/sprites/level2/pickups/vitaminC.webp').then(img => {
        this.vitaminCImage = img;
        this.level2PickupImages.push(img);
      }),
      this.loadImage('/sprites/level2/pickups/pill.webp').then(img => {
        this.pillImage = img;
        this.level2PickupImages.push(img);
      }),
      this.loadImage('/sprites/level2/pickups/tumeric.webp').then(img => {
        this.tumericImage = img;
        this.level2PickupImages.push(img);
      }),
      this.loadImage('/sprites/level2/pickups/ginger.webp').then(img => {
        this.gingerImage = img;
        this.level2PickupImages.push(img);
      })
    ];

    const videoPromise = this.preloadVideo('/videos/level2background.mp4');

    await Promise.all([...obstaclePromises, ...pickupPromises, videoPromise]);
    this.level2AssetsLoaded = true;
  }
  
  // Load level 3 specific assets
  async loadLevel3Assets(): Promise<void> {
    // Load obstacle images
    const obstaclePromises = [
      this.loadImage('/sprites/level3/obstacles/clouds.webp').then(img => {
        this.cloudImage = img;
        this.level3ObstacleImages.push(img);
      }),
      this.loadImage('/sprites/level3/obstacles/eagle.webp').then(img => {
        this.eagleImage = img;
        this.level3ObstacleImages.push(img);
      })
    ];
    
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
      const ext = type === 'blueMan' ? 'jpg' : 'png'; // blueMan is jpg, others are png
      return this.loadImage(`/sprites/level3/trippyPickups/${type}.${ext}`).then(img => {
        this.level3TrippyImages.push(img);
      });
    });
    
    await Promise.all([...obstaclePromises, ...mushroomPromises, ...trippyPromises]);
    this.level3AssetsLoaded = true;
  }

  // Helper method to load an image
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
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
    });
  }

  // Preload video for level 2
  private preloadVideo(src: string): Promise<void> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = src;
      video.muted = true;
      video.playsInline = true; // Important for iOS
      video.preload = 'auto';
      video.onloadeddata = () => {
        this.level2VideoLoaded = true;
        resolve();
      };
      video.load();
    });
  }
}
