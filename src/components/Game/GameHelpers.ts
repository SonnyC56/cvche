import { LevelToggles, GameState, Level3TimedEvents } from '../../types';
import { drawItem, getSpawnY, getSafeSpawnY } from './GameLoop';
import { createParticles } from './ParticleEffects';
import { getParticleColorFromStreak } from '../../utils/colorUtils';
import { FrameAnimatorManager } from '../../utils/GifAnimator';

// Declare global window properties
declare global {
  interface Window {
    waterBottleRef?: React.MutableRefObject<HTMLImageElement | null>;
    plasticBagRef?: React.MutableRefObject<HTMLImageElement | null>;
    assetLoaderRef?: React.MutableRefObject<any>; // Reference to the AssetLoader instance
  }
}

/**
 * Update level toggles based on audio time position
 */
export const updateLevelToggles = (
  audioTime: number,
  currentLevelId: number,
  levelTogglesRef: React.MutableRefObject<LevelToggles>
) => {
  // Level 1 toggles logic
  if (currentLevelId === 1) {
    if (audioTime < 15) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: false,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false
      };
    }
    else if (audioTime >= 10 && audioTime < 11) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: false,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 11 && audioTime < 26) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: false,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 26 && audioTime < 62) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: false,
        showOilSplats: true,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 62 && audioTime < 80) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: true,
        showOilSplats: true,
        showHooks: false,
        showVisualizer: false,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 80 && audioTime < 105) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: false,
        showBottles: true,
        showOilSplats: true,
        showHooks: false,
        showVisualizer: true,
        showBubbles: false,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 105 && audioTime < 234) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showOilSplats: true,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 234 && audioTime < 265) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showOilSplats: false,
        showHooks: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: true,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 265 && audioTime < 300) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showOilSplats: true,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: true,
        showRubberDuckies: false,
      };
    }
    else if (audioTime >= 300 && audioTime < 330) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showOilSplats: true,
        showHooks: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
      };
    }
    else if (audioTime >= 330 && audioTime < 390) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
      };
    }
    else if (audioTime >= 390 && audioTime < 410) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: true,
        showOilSplats: true,
        showHooks: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
      };
    }
    else if (audioTime >= 410) {
      levelTogglesRef.current = {
        showFlora: true,
        showBags: true,
        showBottles: false,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
      };
    }
  }
  // Level 2 toggles logic - match the narrative timing
  else if (currentLevelId === 2) {
    if (audioTime < 28) {
      levelTogglesRef.current = {
        showFlora: false,
        showBags: false,
        showBottles: false,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
        // Level 2 specific obstacle toggles
        showBuses: false,
        showBats: false,
        showChickens: false,
        showPills: false,
        showVitaminC: false,
        showTumeric: false,
        showGinger: false,
        // Add color shift overlay toggle
        showColorShiftOverlay: false,
        overlayColor: ''
      };
    }
    else if (audioTime >= 32 && audioTime < 49) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: false,
        showBats: false,
        showChickens: false,
        showColorShiftOverlay: false,
        showPills: false,
        showVitaminC: true,
        showTumeric: false,
        showGinger: false,
      };
    }
    else if (audioTime >= 49 && audioTime < 83) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showBats: false,
        showChickens: false,
        showColorShiftOverlay: false,
        showPills: false,
        showVitaminC: true,
        showTumeric: true,
        showGinger: false,
      };
    }
    else if (audioTime >= 83 && audioTime < 93) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showBats: false,
        showColorShiftOverlay: false,
        showPills: false,
        showVitaminC: true,
        showTumeric: true,
        showGinger: false,
      };
    }
    else if (audioTime >= 93 && audioTime < 130) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showBats: true,
        showColorShiftOverlay: false,
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: false,
      };
    }
    else if (audioTime >= 130 && audioTime < 173) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: false,
        showChickens: true,
        showChickens3: true,
        showChickens4: true,
        showChickens5: false,
        showChickens6: false,
        showChickens7: false,
        showBats: true,
        showColorShiftOverlay: false,
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: false,
      };
    }
    else if (audioTime >= 173 && audioTime < 190) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showChickens3: true,
        showChickens4: true,
        showChickens5: true,
        showChickens6: true,
        showChickens7: false,     
        showBats: true,
        showColorShiftOverlay: false,
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: true,
      };
    }
    else if (audioTime >= 190 && audioTime < 232) {
      // Add a color shift overlay at the 190-second mark
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showChickens3: true,
        showChickens4: true,
        showChickens5: true,
        showChickens6: true,
        showChickens7: false,     
        showBats: true,
        showColorShiftOverlay: true,
        overlayColor: 'rgba(0, 247, 210, 0.32)', // cyan-ish overlay with 20% opacity
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: true,
       };
    }
    else if (audioTime >= 232 && audioTime < 252) {
      // Add a color shift overlay at the 190-second mark
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showChickens3: true,
        showChickens4: true,
        showChickens5: true,
        showChickens6: true,
        showChickens7: false,   
        showBats: true,
        showColorShiftOverlay: true,
        overlayColor: 'rgba(210, 0, 247, 0.32)', // Purple-ish overlay with 20% opacity
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: true,
      };
    }
    else if (audioTime >= 252 && audioTime < 286) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: false,
        showChickens: true,
        showChickens3: true,
        showChickens4: true,
        showChickens5: true,
        showChickens6: true,
        showChickens7: true,   
        showBats: true,
        showColorShiftOverlay: true,
        overlayColor: 'rgba(0, 247, 210, 0.32)', // cyan-ish overlay with 20% opacity
        showVisualizer: true,
        showBackgroundPattern: true,
        showPills: false,
        showVitaminC: false,
        showTumeric: false,
        showGinger: false,
      };
    }
    else if (audioTime >= 286 && audioTime < 301) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showChickens3: true,
        showChickens4: true,
        showChickens5: true,
        showChickens6: true,
        showChickens7: true,   
        showBats: true,
        showColorShiftOverlay: true,
        overlayColor: 'rgba(210, 0, 247, 0.32)', // Purple-ish overlay with 20% opacity
        showVisualizer: true,
        showBackgroundPattern: true,
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: true,
      };
    }
    else if (audioTime >= 301) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBuses: true,
        showChickens: true,
        showBats: true,
        showColorShiftOverlay: true,
        overlayColor: 'rgba(0, 247, 210, 0.32)', // cyan-ish overlay with 20% opacity
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
        showPills: true,
        showVitaminC: true,
        showTumeric: true,
        showGinger: true,
      };
    }
  }
  // Level 3 toggles logic
  else if (currentLevelId === 3) {
    if (audioTime < 3) {
      levelTogglesRef.current = {
        showFlora: false,
        showBags: false,
        showBottles: false,
        showOilSplats: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: false,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
        // Level 3 specific toggles
        showClouds: false,
        showMushrooms: false,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 3 && audioTime < 30) {
      // Cloud video rises
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 30 && audioTime < 71) {
      // First clouds float by
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 71 && audioTime < 90) {
      // The first mushrooms come
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: true,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 90 && audioTime < 125) {
      // Less Clouds
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: true,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 125 && audioTime < 150) {
      // Now just Mushrooms
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: false,
        showMushrooms: true,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 150 && audioTime < 165) {
      // Clouds return
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 165 && audioTime < 185) {
      // Clouds are now darker - storm is brewing
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: true
      };
    }
    else if (audioTime >= 185 && audioTime < 210) {
      // THE CAVE - with storm clouds and lightning
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: true
      };
    }
    else if (audioTime >= 210 && audioTime < 230) {
      // Here come the Black Headed Gulls
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showGulls: true,
        showEagles: false,
        showTrippyObjects: false,
        showStormEffects: true
      };
    }
    else if (audioTime >= 230 && audioTime < 270) {
      // Add Bald Eagles
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: true,
        showMushrooms: false,
        showGulls: false,
        showEagles: true,
        showTrippyObjects: false,
        showStormEffects: true
      };
    }
    else if (audioTime >= 270 && audioTime < 304) {
      // Exit the cave - mushrooms return
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: false,
        showMushrooms: true,
        showEagles: true,
        showTrippyObjects: false,
        showStormEffects: false
      };
    }
    else if (audioTime >= 304 && audioTime < 330) {
      // Trippy section beginning - no clouds, trippy objects start appearing
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: false,
        showMushrooms: true,
        showEagles: false,
        showTrippyObjects: true,
        showStormEffects: false
      };
    }
    else if (audioTime >= 330) {
      // Trippy section in full effect - no clouds, maximum trippy effect
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showClouds: false,
        showMushrooms: true,
        showEagles: false,
        showTrippyObjects: true,
        showStormEffects: false
      };
    }
  }
};

/**
 * Process color transition events
 */
export const processColorEvents = (
  audioTime: number,
  colorEvents: any,
  activeColorTransition: any,
  backgroundColorRef: React.MutableRefObject<string>,
  waveColorRef: React.MutableRefObject<string>
) => {
  // Ensure colorEvents is initialized as an array
  const eventsArray = Array.isArray(colorEvents) ? colorEvents : [];

  // Log warning if colorEvents is not an array
  if (!Array.isArray(colorEvents)) {
    console.error('colorEvents is not an array', colorEvents);
  }

  // Now safely iterate through the events
  eventsArray.forEach(event => {
    if (!event.triggered && audioTime >= event.timestamp) {
      console.log('processing color event (inside for loop): ', event, 'color: ', backgroundColorRef.current);
      event.triggered = true;
      activeColorTransition.backgroundColor = backgroundColorRef.current;
      activeColorTransition.waveColor = waveColorRef.current;
      activeColorTransition.progress = 0;
      activeColorTransition.targetBackgroundColor = event.backgroundColor;
      activeColorTransition.targetWaveColor = event.waveColor;
      activeColorTransition.transitionDuration = event.transitionDuration;
    }
  });
};

/**
 * Process level 2 specific events
 */
export const processLevel2Events = (
  audioTime: number,
  canvas: HTMLCanvasElement,
  level2TimedEvents: any,
  level2ObstacleImages: HTMLImageElement[],
  level2PickupImages: HTMLImageElement[],
  gameState: GameState
) => {
  level2TimedEvents.obstacles.forEach((event: any) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;

      if (!canvas) return;

      let img: HTMLImageElement | null = null;
      let width = 50;
      let height = 50;
      //log level2ObstacleImages
      switch (event.type) {
        case 'bus':
          img = level2ObstacleImages[0] || null;
          width = 200;
          height = 100;
          break;
        case 'bats':
          // Bats use FrameAnimator only - no static image needed
          img = null; // Will be handled by animator
          width = 100;
          height = 100;
          break;
        case 'chicken':
          img = level2ObstacleImages[2] || null;
          width = 100;
          height = 100;
          break;
      }

      // Special handling for bats - they use FrameAnimator instead of static image
      if (event.type === 'bats') {
        console.log(`[DEBUG] Bat event triggered at ${audioTime.toFixed(1)}s`);
        console.log(`[DEBUG] Global assetLoaderRef:`, !!window.assetLoaderRef);
        console.log(`[DEBUG] AssetLoader current:`, !!window.assetLoaderRef?.current);
        // Try to get the bats animator from AssetLoader first
        let batsAnimator = window.assetLoaderRef?.current?.batsAnimator;
        console.log(`[DEBUG] AssetLoader batsAnimator:`, !!batsAnimator, 'Loaded:', batsAnimator?.isLoaded?.());
        
        // If AssetLoader doesn't have it, try getting it directly from FrameAnimatorManager (synchronous)
        if (!batsAnimator || !batsAnimator.isLoaded()) {
          console.log(`[DEBUG] Trying direct access to FrameAnimatorManager...`);
          try {
            // Access the cached animator directly from the FrameAnimatorManager
            const manager = FrameAnimatorManager.getInstance();
            // Since we know the animator should be cached, access it directly
            batsAnimator = manager['frameAnimators']?.get('bats');
            console.log(`[DEBUG] Direct FrameAnimatorManager access:`, !!batsAnimator, 'Loaded:', batsAnimator?.isLoaded?.());
          } catch (error) {
            console.error(`[DEBUG] Failed to get animator from FrameAnimatorManager:`, error);
          }
        }
        
        if (batsAnimator && batsAnimator.isLoaded()) {
          gameState.obstacles.push({
            x: canvas.width,
            y: getSafeSpawnY(canvas, height, gameState.obstacles, 120),
            width,
            height,
            type: 'obstacle',
            speed: 1 + Math.random() * 2,
            rotation: 0, // Don't rotate animated bats
            pickupImage: undefined, // No static image for animated bats
            animator: batsAnimator // Use FrameAnimator for flapping wings
          });
        } else {
          console.warn(`[DEBUG] Bat animator not ready at ${audioTime.toFixed(1)}s - skipping spawn until fixed`);
        }
      } else if (img) {
        // Regular obstacles (bus, chickens) use static images
        const spawnY = event.type === 'chicken' ? 
          getSafeSpawnY(canvas, height, gameState.obstacles, 120) : 
          getSpawnY(canvas, height);
        
        gameState.obstacles.push({
          x: canvas.width,
          y: spawnY,
          width,
          height,
          type: 'obstacle',
          speed: 1 + Math.random() * 2,
          rotation: event.type === 'bus' ? 0 : Math.random() * Math.PI * 2,
          pickupImage: img,
          animator: null // No animator for regular obstacles
        });
      }
    }
  });

  level2TimedEvents.pickups.forEach((event: any) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;

      if (!canvas) return;

      let img: HTMLImageElement | null = null;
      let width = 40;
      let height = 40;

      switch (event.type) {
        case 'vitaminC':
          img = level2PickupImages[0] || null;
          width = 60;
          height = 60;
          break;
        case 'pill':
          img = level2PickupImages[1] || null;
          width = 50;
          height = 70;
          break;
        case 'tumeric':
          img = level2PickupImages[2] || null;
          width = 60;
          height = 60;
          break;
        case 'ginger':
          img = level2PickupImages[3] || null;
          width = 60;
          height = 60;
          break;
      }

      if (img) {
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, height),
          width,
          height,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: img
        });

        gameState.trashStats.totalSpawned++;
      }
    }
  });
};

/**
 * Process level 3 specific events
 */
export const processLevel3Events = (
  audioTime: number,
  canvas: HTMLCanvasElement,
  level3TimedEvents: Level3TimedEvents,
  level3ObstacleImages: HTMLImageElement[],
  level3MushroomImages: HTMLImageElement[],
  level3TrippyImages: HTMLImageElement[],
  gameState: GameState
) => {
  // Process obstacles (eagles and gulls)
  level3TimedEvents.obstacles.forEach((event) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;

      if (!canvas) return;
      if (event.type === 'eagle') {
        const eagleImg = level3ObstacleImages.find(img => img.src.includes('eagle'));
        if (eagleImg) {
          // Generate a random size factor between 0.8 and 1.3
          const sizeFactor = 0.8 + (Math.random() * 0.5);
          const baseWidth = 100;
          const baseHeight = 80;

          gameState.obstacles.push({
            x: canvas.width,
            y: getSpawnY(canvas, baseHeight * sizeFactor),
            width: baseWidth * sizeFactor,
            height: baseHeight * sizeFactor,
            type: 'obstacle',
            speed: 2 + Math.random() * 2.5, // Eagles are faster
            rotation: 0,
            pickupImage: eagleImg
          });
        }
      }
      else if (event.type === 'gull') {
        const gullImg = level3ObstacleImages.find(img => img.src.includes('black-headed-gull'));
        if (gullImg) {
          // Generate a random size factor between 0.8 and 1.3
          const sizeFactor = 0.8 + (Math.random() * 0.5);
          const baseWidth = 90;
          const baseHeight = 70;

          gameState.obstacles.push({
            x: canvas.width,
            y: getSpawnY(canvas, baseHeight * sizeFactor),
            width: baseWidth * sizeFactor,
            height: baseHeight * sizeFactor,
            type: 'obstacle',
            speed: 2.2 + Math.random() * 2, // Gulls are also fast
            rotation: 0,
            pickupImage: gullImg
          });
        }
      }
      if (event.type === 'cloud') {
        const cloudImg = level3ObstacleImages.find(img => img.src.includes('clouds'));
        if (cloudImg) {
          // Check if this is during the storm (between 165-210 seconds)
          const isStormPeriod = audioTime >= 165 && audioTime < 270;

          // For rising clouds at beginning
          if (audioTime < 10) {
            gameState.obstacles.push({
              x: canvas.width * Math.random(), // Random x position
              y: canvas.height + 50, // Start off-screen at bottom
              width: 120,
              height: 80,
              type: 'obstacle',
              speed: -0.5 - Math.random(), // Negative speed means moving upward
              rotation: 0,
              pickupImage: cloudImg,
              baseY: canvas.height + 50, // Store initial Y for animations
              stormEffect: isStormPeriod // Flag for dark storm clouds
            });
          }
          else {
            gameState.obstacles.push({
              x: canvas.width,
              y: getSpawnY(canvas, 80),
              width: 120 + Math.random() * 80, // Variable size
              height: 80 + Math.random() * 40,
              type: 'obstacle',
              speed: 0.5 + Math.random() * 1.5, // Slow moving
              rotation: 0,
              pickupImage: cloudImg,
              stormEffect: isStormPeriod // Flag for dark storm clouds
            });
          }
        }
      }
    }
  });

  // Process pickups (mushrooms)
  level3TimedEvents.pickups.forEach((event) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;

      if (!canvas) return;

      if (event.type === 'mushroom' && level3MushroomImages.length > 0) {
        // Select mushroom variant if specified, otherwise random
        let index = 0;
        if (event.variant) {
          index = parseInt(event.variant, 10) - 1;
          if (isNaN(index) || index < 0 || index >= level3MushroomImages.length) {
            index = Math.floor(Math.random() * level3MushroomImages.length);
          }
        } else {
          index = Math.floor(Math.random() * level3MushroomImages.length);
        }

        const mushroomImg = level3MushroomImages[index];
        if (mushroomImg) {
          gameState.pickups.push({
            x: canvas.width,
            y: getSpawnY(canvas, 60),
            width: 60,
            height: 60,
            type: 'trash',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: mushroomImg
          });
          gameState.trashStats.totalSpawned++;
        }
      }
      if (event.type === 'trippy' && level3TrippyImages.length > 0) {
        // Select specific trippy object if variant specified
        let trippyImg;
        if (event.variant) {
          const variant = event.variant; // Assign to const to make TypeScript happy
          trippyImg = level3TrippyImages.find(img => img.src.includes(variant));
        }

        // Fallback to random if not found or not specified
        if (!trippyImg) {
          trippyImg = level3TrippyImages[Math.floor(Math.random() * level3TrippyImages.length)];
        }

        if (trippyImg) {
          // In the trippy section, objects can be anywhere in the screen
          // They also change size and move in random patterns
          const size = 50 + Math.random() * 100; // Random size for trippy effect
          const speed = 0.5 + Math.random() * 2;

          gameState.pickups.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 100) + 50, // Anywhere on screen
            width: size,
            height: size,
            type: 'trash',
            speed: speed,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: trippyImg
          });
        }
      }
    }
  });
};

/**
 * Spawn items on beat detection
 */
export const spawnItemsOnBeat = (
  canvas: HTMLCanvasElement,
  levelToggles: LevelToggles,
  gameState: GameState,
  currentLevelId: number,
  audioProgress: number,
  waterBottleImage: HTMLImageElement | null,
  plasticBagImage: HTMLImageElement | null,
  oilSplatImage: HTMLImageElement | null,
  fishHookImage: HTMLImageElement | null,
  flipflopImage: HTMLImageElement | null,
  toothbrushImage: HTMLImageElement | null,
  hotdogImage: HTMLImageElement | null,
  rubberDuckyImage: HTMLImageElement | null,
  level2PickupImages: HTMLImageElement[],
  level2ObstacleImages: HTMLImageElement[],
  level3ObstacleImages: HTMLImageElement[] = [],
  level3MushroomImages: HTMLImageElement[] = [],
  level3TrippyImages: HTMLImageElement[] = [],
  audioTime: number
) => {


  //console.log(`[DEBUG] Images loaded - waterBottle: ${!!waterBottleImage}, plasticBag: ${!!plasticBagImage}, obstacle: ${!!oilSplatImage}, fishHook: ${!!fishHookImage}`);

  if (currentLevelId === 1) {
    // Level 1 spawning logic remains unchanged

    // Spawn water bottles
    if (levelToggles.showBottles && waterBottleImage) {
      const spawnChance = 0.075 + (audioProgress / 200);
      const roll = Math.random();
      console.log(`[DEBUG] Water bottle spawn check - chance: ${spawnChance.toFixed(3)}, roll: ${roll.toFixed(3)}, willSpawn: ${roll < spawnChance}`);

      if (roll < spawnChance) {
        console.log('[DEBUG] 🍶 Spawning water bottle');
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 30,
          height: 50,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: waterBottleImage
        });
        gameState.trashStats.totalSpawned++;
      }
    } else if (levelToggles.showBottles) {
      console.log('[DEBUG] ❌ Cannot spawn water bottle - image is null');
    }

    // Spawn plastic bags
    if (levelToggles.showBags && plasticBagImage) {
      const spawnChance = 0.075 + (audioProgress / 200);
      const roll = Math.random();
      console.log(`[DEBUG] Plastic bag spawn check - chance: ${spawnChance.toFixed(3)}, roll: ${roll.toFixed(3)}, willSpawn: ${roll < spawnChance}`);

      if (roll < spawnChance) {
        console.log('[DEBUG] 👜 Spawning plastic bag');
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 30,
          height: 50,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: plasticBagImage
        });
        gameState.trashStats.totalSpawned++;
      }
    } else if (levelToggles.showBags) {
      console.log('[DEBUG] ❌ Cannot spawn plastic bag - image is null');
    }

    // Spawn obstacles
    if (levelToggles.showOilSplats && oilSplatImage) {
      const spawnChance = 0.075 + (audioProgress / 200);
      const roll = Math.random();
      console.log(`[DEBUG] Obstacle spawn check - chance: ${spawnChance.toFixed(3)}, roll: ${roll.toFixed(3)}, willSpawn: ${roll < spawnChance}`);

      if (roll < spawnChance) {
        console.log('[DEBUG] 🪨 Spawning obstacle');
        gameState.obstacles.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 50,
          height: 50,
          type: 'obstacle',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: oilSplatImage
        });
      }
    } else if (levelToggles.showOilSplats) {
      console.log('[DEBUG] ❌ Cannot spawn obstacle - image is null');
    }

    // Spawn fish hooks
    if (levelToggles.showHooks && fishHookImage) {
      const roll = Math.random();
      console.log(`[DEBUG] Fishhook spawn check - chance: 0.5, roll: ${roll.toFixed(3)}, willSpawn: ${roll < 0.5}`);

      if (roll < 0.5) {
        console.log('[DEBUG] 🪝 Spawning fishhook');
        const fishhookY = canvas.height * (0.1 + Math.random() * 0.4);
        gameState.obstacles.push({
          x: canvas.width,
          y: fishhookY,
          width: 50,
          height: 150,
          type: 'fishhook',
          speed: 1 + Math.random() * 2,
          pickupImage: fishHookImage
        });
      }
    } else if (levelToggles.showHooks) {
      console.log('[DEBUG] ❌ Cannot spawn fishhook - image is null');
    }

    // Spawn special trash items (flipflops, toothbrushes, hotdogs, rubber duckies)
    if (levelToggles.showFlipFlops) {
      spawnSpecialTrashItem(
        canvas,
        gameState,
        currentLevelId,
        'flipflop',
        0.03,
        flipflopImage,
        level2PickupImages,
        30,
        50
      );
    }

    if (levelToggles.showToothbrushes) {
      spawnSpecialTrashItem(
        canvas,
        gameState,
        currentLevelId,
        'toothbrush',
        0.03,
        toothbrushImage,
        level2PickupImages,
        10,
        40
      );
    }

    if (levelToggles.showHotdogs) {
      spawnSpecialTrashItem(
        canvas,
        gameState,
        currentLevelId,
        'hotdog',
        0.03,
        hotdogImage,
        level2PickupImages,
        50,
        25
      );
    }

    if (levelToggles.showRubberDuckies) {
      spawnSpecialTrashItem(
        canvas,
        gameState,
        currentLevelId,
        'rubberducky',
        0.03,
        rubberDuckyImage,
        level2PickupImages,
        50,
        50
      );
    }
  } else if (currentLevelId === 2) {
    // Level 2 spawning logic limited to:
    // • Pickups: vitaminC, tumeric, ginger
    // • Obstacles: buses, bats, chickens

    // Spawn vitaminC pickup from index 0
    if (levelToggles.showVitaminC && level2PickupImages.length > 0 && level2PickupImages[0]) {
      if (Math.random() < 0.075 + (audioProgress / 200)) {
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 60,
          height: 60,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: level2PickupImages[0]
        });
        gameState.trashStats.totalSpawned++;
      }
    }

    // Spawn ginger pickup from index 3
    if (levelToggles.showGinger && level2PickupImages.length > 3 && level2PickupImages[3]) {
      if (Math.random() < 0.075 + (audioProgress / 200)) {
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 60,
          height: 60,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: level2PickupImages[3]
        });
        gameState.trashStats.totalSpawned++;
      }
    }

    // Spawn tumeric pickup from index 2
    if (levelToggles.showTumeric && level2PickupImages.length > 2 && level2PickupImages[2]) {
      if (Math.random() < 0.05 + (audioProgress / 200)) {
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 60,
          height: 60,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: level2PickupImages[2]
        });
        gameState.trashStats.totalSpawned++;
      }
    }
    //pills
    if (levelToggles.showPills && level2PickupImages.length > 1 && level2PickupImages[1]) {
      if (Math.random() < 0.05 + (audioProgress / 200)) {
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, 50),
          width: 50,
          height: 70,
          type: 'trash',
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: level2PickupImages[1]
        });
        gameState.trashStats.totalSpawned++;
      }
    }

    // Spawn obstacles: only buses, bats, and chickens
    if (level2ObstacleImages.length > 0) {
      const baseProbability = 0.075 + (audioProgress / 1000);

      // Bus obstacle (index 0)
      if (levelToggles.showBuses && level2ObstacleImages.length > 0 && level2ObstacleImages[0]) {
        if (Math.random() < baseProbability) {
          gameState.obstacles.push({
            x: canvas.width,
            y: getSpawnY(canvas, 60),
            width: 200,
            height: 100,
            type: 'obstacle',
            speed: 1 + Math.random() * 2,
            rotation: 0, // Buses don't rotate
            pickupImage: level2ObstacleImages[0]
          });
        }
      }

      // Build the available indices pool starting with index 2
      const availableIndices = [2];

      if (levelToggles.showChickens3) {
        availableIndices.push(3);
      }
      if (levelToggles.showChickens4) {
        availableIndices.push(4);
      }
      if (levelToggles.showChickens5) {
        availableIndices.push(5);
      }
      if (levelToggles.showChickens6) {
        availableIndices.push(6);
      }
      if (levelToggles.showChickens7) {
        availableIndices.push(7);
      }

      // Randomly select an index from the available pool
      const chickenImageIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];

      console.log(chickenImageIndex);


      // Chicken obstacle (index 2-7)
      if (levelToggles.showChickens && level2ObstacleImages.length > 2 && level2ObstacleImages[chickenImageIndex]) {
        if (Math.random() < baseProbability) {
          gameState.obstacles.push({
            x: canvas.width,
            y: getSafeSpawnY(canvas, 100, gameState.obstacles, 120),
            width: 100,
            height: 100,
            type: 'obstacle',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: level2ObstacleImages[chickenImageIndex]
          });
        }
      }

      // Bats obstacle - use FrameAnimator only
      if (levelToggles.showBats) {
        // Try to get the bats animator - first from AssetLoader, then from FrameAnimatorManager
        let batsAnimator = window.assetLoaderRef?.current?.batsAnimator;
        
        // If AssetLoader doesn't have it, try FrameAnimatorManager directly
        if (!batsAnimator || !batsAnimator.isLoaded()) {
          try {
            const manager = FrameAnimatorManager.getInstance();
            batsAnimator = manager['frameAnimators']?.get('bats');
          } catch (error) {
            console.error(`[DEBUG] Beat-based: Failed to get animator from FrameAnimatorManager:`, error);
          }
        }

        if (Math.random() < baseProbability) {
          console.log(`[DEBUG] Beat-based bat spawn - Animator available:`, !!batsAnimator, 'Loaded:', batsAnimator?.isLoaded?.());
          
          if (batsAnimator && batsAnimator.isLoaded()) {
            // Use animated bat
            gameState.obstacles.push({
              x: canvas.width,
              y: getSafeSpawnY(canvas, 100, gameState.obstacles, 120),
              width: 100,
              height: 100,
              type: 'obstacle',
              speed: 1 + Math.random() * 2,
              rotation: 0, // Don't rotate animated bats
              pickupImage: undefined, // No static image for animated bats
              animator: batsAnimator // Use FrameAnimator for flapping wings
            });
          } else {
            console.log(`[DEBUG] Beat-based bat animator not ready - skipping spawn`);
          }
        }
      }
    }
  } else if (currentLevelId === 3) {
    // Level 3 spawning logic
    console.log(`[DEBUG] Level 3 spawning logic - audioProgress: ${audioProgress}, levelToggles:`, levelToggles, 'level3MushroomImages:', level3MushroomImages, 'level3ObstacleImages:', level3ObstacleImages);
    // Spawn mushrooms on beat when the toggle is active
    if (levelToggles.showMushrooms && level3MushroomImages?.length > 0) {
      const spawnChance = 0.1 + (audioProgress / 150); // Higher chance than level 1/2 items

      if (Math.random() < spawnChance) {
        // Select a random mushroom image
        const mushroomIndex = Math.floor(Math.random() * level3MushroomImages.length);
        const mushroomImg = level3MushroomImages[mushroomIndex];

        if (mushroomImg) {
          gameState.pickups.push({
            x: canvas.width,
            y: getSpawnY(canvas, 60),
            width: 60,
            height: 60,
            type: 'trash',
            speed: 1 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: mushroomImg
          });
          gameState.trashStats.totalSpawned++;
        }
      }
    }

    // Spawn trippy objects during the trippy section (after timestamp 304)
    if (levelToggles.showTrippyObjects && level3TrippyImages?.length > 0) {
      // Higher chance during the trippy section
      const spawnChance = 0.15 + (audioProgress / 100);

      if (Math.random() < spawnChance) {
        const trippyIndex = Math.floor(Math.random() * level3TrippyImages.length);
        const trippyImg = level3TrippyImages[trippyIndex];

        if (trippyImg) {
          // Random size for trippy effect
          const size = 50 + Math.random() * 100;

          // Add warping property to trippy pickups (with reduced intensity)
          gameState.pickups.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 100) + 50, // Anywhere on screen
            width: size,
            height: size,
            type: 'trash',
            speed: 0.5 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
            pickupImage: trippyImg,
            // Add custom properties for warping effect with reduced intensity
            warpFactor: 0.05 + Math.random() * 0.01, // Much smaller factor (max 30% size change)
            warpSpeed: 0.05 + Math.random() * 0.01, // Slower warping
            warpOffset: Math.random() * Math.PI * 2
          });
          gameState.trashStats.totalSpawned++;
        }
      }
    }

    //spawn clouds if showClouds is true
    if (levelToggles.showClouds && level3ObstacleImages?.length > 0) {
      const spawnChance = 0.05 + (audioProgress / 350);
      const isStormPeriod = audioTime >= 165 && audioTime < 270;

      if (Math.random() < spawnChance) {
        const cloudImg = level3ObstacleImages.find(img => img.src.includes('clouds'));
        console.log('spawning cloud - cloudImg', cloudImg);
        if (cloudImg) {
          gameState.obstacles.push({
            x: canvas.width,
            y: getSpawnY(canvas, 80),
            width: 80 + Math.random() * 80,
            height: 40 + Math.random() * 40,
            type: 'obstacle',
            speed: 0.5 + Math.random() * 1.5,
            rotation: 0,
            pickupImage: cloudImg,
            stormEffect: isStormPeriod // Flag for dark storm clouds
          });
        }
      }
    }

    //spawn eagles if showEagles is true
    if (levelToggles.showEagles && level3ObstacleImages?.length > 0) {
      const spawnChance = 0.1;

      if (Math.random() < spawnChance) {
        const eagleImg = level3ObstacleImages.find(img => img.src.includes('eagle'));

        if (eagleImg) {
          // Generate a random size factor between 0.8 and 1.3
          const sizeFactor = 0.8 + (Math.random() * 0.5);
          const baseWidth = 100;
          const baseHeight = 80;

          gameState.obstacles.push({
            x: canvas.width,
            y: getSpawnY(canvas, baseHeight * sizeFactor),
            width: baseWidth * sizeFactor,
            height: baseHeight * sizeFactor,
            type: 'obstacle',
            speed: 1 + Math.random() * 2,
            rotation: 0,
            pickupImage: eagleImg
          });
        }
      }
    }

    //spawn gulls if showGulls is true
    if (levelToggles.showGulls && level3ObstacleImages?.length > 0) {
      const spawnChance = 0.1;

      if (Math.random() < spawnChance) {
        const gullImg = level3ObstacleImages.find(img => img.src.includes('black-headed-gull'));

        if (gullImg) {
          // Generate a random size factor between 0.8 and 1.3
          const sizeFactor = 0.8 + (Math.random() * 0.5);
          const baseWidth = 90;
          const baseHeight = 70;

          gameState.obstacles.push({
            x: canvas.width,
            y: getSpawnY(canvas, baseHeight * sizeFactor),
            width: baseWidth * sizeFactor,
            height: baseHeight * sizeFactor,
            type: 'obstacle',
            speed: 1.5 + Math.random() * 2,
            rotation: 0,
            pickupImage: gullImg
          });
        }
      }
    }
  }
};

export const spawnSpecialTrashItem = (
  canvas: HTMLCanvasElement,
  gameState: GameState,
  currentLevelId: number,
  type: 'flipflop' | 'toothbrush' | 'hotdog' | 'rubberducky',
  probability: number,
  image: HTMLImageElement | null,
  level2PickupImages: HTMLImageElement[],
  width: number,
  height: number
) => {
  if (currentLevelId === 2) {
    if (level2PickupImages.length > 0) {
      if (Math.random() < probability) {
        const randomPickup = level2PickupImages[Math.floor(Math.random() * level2PickupImages.length)];
        gameState.pickups.push({
          x: canvas.width,
          y: getSpawnY(canvas, height),
          width,
          height,
          type,
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2,
          pickupImage: randomPickup
        });
        gameState.trashStats.totalSpawned++;
      }
    }
  }
  else if (image) {
    if (Math.random() < probability) {
      gameState.pickups.push({
        x: canvas.width,
        y: getSpawnY(canvas, height),
        width,
        height,
        type,
        speed: 1 + Math.random() * 2,
        rotation: Math.random() * Math.PI * 2,
        pickupImage: image
      });
      gameState.trashStats.totalSpawned++;
    }
  }
};
/**
 * Update and check collisions for trash items
 */
export const updateAndCheckTrashCollisions = (
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  factor: number,
  speedMultiplier: number,
  pulse: number,
  getMultiplierFromStreak: (streak: number) => number,
  setHealth: (callback: (prev: number) => number) => void,
  pickupSound: HTMLAudioElement | null
) => {
  for (let i = gameState.pickups.length - 1; i >= 0; i--) {
    const item = gameState.pickups[i];

    // Update position
    item.x -= item.speed * speedMultiplier * factor;

    // Apply warping effect for trippy items in level 3
    if (item.warpFactor && item.warpSpeed) {
      // Calculate a warping scale based on time
      const time = Date.now() / 1000; // Convert to seconds
      const warpOffset = item.warpOffset || 0;
      const warpScale = 1 + item.warpFactor * Math.sin((time * item.warpSpeed) + warpOffset);

      // Apply the warping scale to the item's dimensions
      item.width = item.width * warpScale;
      item.height = item.height * warpScale;
    }

    // Remove if off screen
    if (item.x + item.width * pulse < 0) {
      gameState.trashStats.missed++;
      gameState.pickups.splice(i, 1);
      continue;
    }

    // Check collision with player
    const effectiveWidth = item.width * pulse;
    const effectiveHeight = item.height * pulse;

    if (
      gameState.player.x < item.x + effectiveWidth &&
      gameState.player.x + gameState.player.width > item.x &&
      gameState.player.y < item.y + effectiveHeight &&
      gameState.player.y + gameState.player.height > item.y
    ) {
      const streak = gameState.streak + 1;
      const multiplier = getMultiplierFromStreak(streak);
      const points = 10 * multiplier;

      gameState.streak = streak;
      gameState.multiplier = multiplier;
      gameState.highestStreak = Math.max(gameState.highestStreak, streak);
      gameState.score += points;
      gameState.trashStats.collected++;

      const popupX = item.x + effectiveWidth / 2;
      const popupY = item.y + effectiveHeight / 2;
      const scoreText = multiplier > 1 ? `+${points} (${multiplier}x)` : `+${points}`;

      gameState.scorePopups.push({
        x: popupX,
        y: popupY,
        text: scoreText,
        opacity: 1,
        lifetime: 100
      });

      if (streak % 5 === 0 && ctx.canvas) {
        gameState.scorePopups.push({
          x: ctx.canvas.width / 2,
          y: ctx.canvas.height / 2,
          text: `${streak} STREAK! ${multiplier}x MULTIPLIER!`,
          opacity: 1,
          lifetime: 120
        });
      }

      if (item.pickupImage &&
        (item.pickupImage === window.waterBottleRef?.current ||
          item.pickupImage === window.plasticBagRef?.current)) {
        // Reduced particle count from 20 to 8
        createParticles(gameState.particles, item.x, item.y, '#FFC0CB', 8, 'heart');
        createParticles(gameState.particles, item.x, item.y, '#1489CF', 8, 'heart');
      } else {
        // Reduced particle count from 20 to 8
        createParticles(gameState.particles, item.x, item.y, getParticleColorFromStreak(streak), 8);
      }

      // Optimized removal using swap-and-pop
      gameState.pickups[i] = gameState.pickups[gameState.pickups.length - 1];
      gameState.pickups.pop();

      setHealth(prev => Math.min(100, prev + 1));

      // Check if sound is properly initialized before playing
      if (pickupSound && pickupSound.readyState >= 2) {
        pickupSound.play().catch(error => {
          console.warn("Error playing pickup sound:", error);
        });
      }

      continue;
    } else {
      drawItem(ctx, item, pulse);
    }
  }
};

/**
 * Update and check collisions for obstacles
 */
export const updateAndCheckObstacleCollisions = (
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  audioTime: number,
  songDuration: number,
  factor: number,
  speedMultiplier: number,
  setScore: (value: number) => void,
  setHealth: (callback: (prev: number) => number) => void,
  hitSound: HTMLAudioElement | null,
  setLevelEnded: (value: boolean) => void,
  gameLoopRef: React.MutableRefObject<boolean>,
  animationFrameIdRef: React.MutableRefObject<number | null>
) => {
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const item = gameState.obstacles[i];

    item.x -= item.speed * speedMultiplier * factor;

    if (audioTime >= songDuration * 0.5 && item.baseY !== undefined) {
      const bobbingOffset = Math.sin(Date.now() / 200) * 10;
      item.y = item.baseY + bobbingOffset;
    }

    if (item.x + item.width < 0) {
      gameState.obstacles.splice(i, 1);
      continue;
    }

    if (item.type === 'fishhook') {
      const hookLeft = item.x;
      const hookRight = item.x + item.width;
      const hookTop = item.y + item.height / 2;
      const hookBottom = item.y + item.height;
      const player = gameState.player;

      if (
        player.x < hookRight &&
        player.x + player.width > hookLeft &&
        player.y < hookBottom &&
        player.y + player.height > hookTop
      ) {
        handleObstacleCollision(
          gameState,
          item,
          setScore,
          setHealth,
          hitSound,
          setLevelEnded,
          gameLoopRef,
          animationFrameIdRef
        );

        // Optimized removal using swap-and-pop
        gameState.obstacles[i] = gameState.obstacles[gameState.obstacles.length - 1];
        gameState.obstacles.pop();
        continue;
      } else {
        drawItem(ctx, item, 1);
      }
    } else {
      if (
        gameState.player.x < item.x + item.width &&
        gameState.player.x + gameState.player.width > item.x &&
        gameState.player.y < item.y + item.height &&
        gameState.player.y + gameState.player.height > item.y
      ) {
        handleObstacleCollision(
          gameState,
          item,
          setScore,
          setHealth,
          hitSound,
          setLevelEnded,
          gameLoopRef,
          animationFrameIdRef
        );

        // Optimized removal using swap-and-pop
        gameState.obstacles[i] = gameState.obstacles[gameState.obstacles.length - 1];
        gameState.obstacles.pop();
        continue;
      } else {
        drawItem(ctx, item, 1);
      }
    }
  }
};

/**
 * Handle collision with an obstacle
 */
export const handleObstacleCollision = (
  gameState: GameState,
  item: any,
  setScore: (value: number) => void,
  setHealth: (callback: (prev: number) => number) => void,
  hitSound: HTMLAudioElement | null,
  setLevelEnded: (value: boolean) => void,
  gameLoopRef: React.MutableRefObject<boolean>,
  animationFrameIdRef: React.MutableRefObject<number | null>
) => {
  gameState.score = Math.max(0, gameState.score - 20);
  setScore(gameState.score);

  gameState.streak = 0;
  gameState.multiplier = 1;

  const popupX = item.x + item.width / 2;
  const popupY = item.y + item.height / 2;
  gameState.scorePopups.push({
    x: popupX,
    y: popupY,
    text: "-20",
    opacity: 1,
    lifetime: 100
  });

  const particleColor = '#000000';
  // Reduced particle count from 20 to 8
  createParticles(gameState.particles, item.x, item.y, particleColor, 8);

  // Check if sound is properly initialized before playing
  if (hitSound && hitSound.readyState >= 2) {
    hitSound.play().catch(error => {
      console.warn("Error playing hit sound:", error);
    });
  }

  gameState.player.spinRotation = item.type === 'fishhook' ? Math.PI * 4 : -Math.PI * 4;
  gameState.player.hitTime = Date.now();
  gameState.player.hitType = item.type;

  setHealth(prev => {
    const newHealth = prev - 10;
    if (newHealth <= 0) {
      setLevelEnded(true);
      gameLoopRef.current = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return newHealth;
  });
};
