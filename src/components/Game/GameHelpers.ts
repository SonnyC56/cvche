import { LevelToggles, GameState } from '../../types';
import { drawItem, getSpawnY } from './GameLoop';
import { createParticles } from './ParticleEffects';
import { getParticleColorFromStreak } from '../../utils/colorUtils';

// Declare global window properties
declare global {
  interface Window {
    waterBottleRef?: React.MutableRefObject<HTMLImageElement | null>;
    plasticBagRef?: React.MutableRefObject<HTMLImageElement | null>;
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
        showObstacles: false,
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
        showObstacles: false,
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
        showObstacles: false,
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
        showObstacles: true,
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
        showObstacles: true,
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
        showObstacles: true,
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
        showObstacles: true,
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
        showObstacles: false,
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
        showObstacles: true,
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
        showObstacles: true,
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
        showObstacles: false,
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
        showObstacles: true,
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
        showObstacles: false,
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
        showObstacles: false,
        showHooks: false,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: false,
        showFlipFlops: false,
        showToothbrushes: false,
        showHotdogs: false,
        showRubberDuckies: false,
        // Level 2 specific obstacle toggles
        showBuses: false,
        showBats: false,
        showChickens: false
      };
    }
    else if (audioTime >= 28 && audioTime < 36) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBottles: true,
        showBags: false,
        showObstacles: false,
        showBuses: false,
        showBats: false,
        showChickens: false
      };
    }
    else if (audioTime >= 36 && audioTime < 49) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBottles: true,
        showBags: true,
        showObstacles: false,
        showBuses: false,
        showBats: false,
        showChickens: false
      };
    }
    else if (audioTime >= 49 && audioTime < 83) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBottles: true,
        showBags: true,
        showObstacles: true,
        showBuses: true,
        showBats: false,
        showChickens: false
      };
    }
    else if (audioTime >= 83 && audioTime < 120) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBottles: true,
        showBags: true,
        showObstacles: true,
        showBuses: true,
        showChickens: true,
        showBats: false
      };
    }
    else if (audioTime >= 120 && audioTime < 173) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBottles: true,
        showBags: true,
        showObstacles: true,
        showBuses: true,
        showChickens: true,
        showBats: true
      };
    }
    else if (audioTime >= 173 && audioTime < 252) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showBottles: true,
        showBags: true,
        showObstacles: true,
        showBuses: true,
        showChickens: true,
        showBats: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true
      };
    }
    else if (audioTime >= 252 && audioTime < 301) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showFlora: true,
        showBottles: true,
        showBags: true,
        showObstacles: true,
        showBuses: true,
        showChickens: true,
        showBats: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
      };
    }
    else if (audioTime >= 301) {
      levelTogglesRef.current = {
        ...levelTogglesRef.current,
        showFlora: true,
        showBottles: true,
        showBags: true,
        showObstacles: true,
        showBuses: true,
        showChickens: true,
        showBats: true,
        showFlipFlops: true,
        showToothbrushes: true,
        showHotdogs: true,
        showRubberDuckies: true,
        showVisualizer: true,
        showBubbles: true,
        showBackgroundPattern: true,
      };
    }
  }
};

/**
 * Process color transition events
 */
export const processColorEvents = (
  audioTime: number,
  colorEvents: any[],
  activeColorTransition: any,
  backgroundColorRef: React.MutableRefObject<string>,
  waveColorRef: React.MutableRefObject<string>
) => {
  colorEvents.forEach(event => {
    if (!event.triggered && audioTime >= event.timestamp) {
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

      switch (event.type) {
        case 'bats':
          img = level2ObstacleImages[0] || null;
          width = 100;
          height = 100;
          break;
        case 'bus':
          img = level2ObstacleImages[1] || null;
          width = 200;
          height = 100;
          break;
        case 'chicken':
          img = level2ObstacleImages[2] || null;
          width = 100;
          height = 100;
          break;
      }

      if (img) {
        gameState.obstacles.push({
          x: canvas.width,
          y: getSpawnY(canvas, height),
          width,
          height,
          type: 'obstacle',
          speed: 1 + Math.random() * 2,
          rotation: event.type === 'bus' ? 0 : Math.random() * Math.PI * 2,
          pickupImage: img
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
        case 'bus':
          img = level2ObstacleImages[0] || null;
          width = 100;
          height = 60;
          break;
        case 'bats':
          img = level2ObstacleImages[1] || null;
          width = 60;
          height = 60;
          break;
        case 'chicken':
          img = level2ObstacleImages[2] || null;
          width = 60;
          height = 60;
          break;

      }

      if (img) {
        gameState.trashList.push({
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
  obstacleImage: HTMLImageElement | null,
  fishHookImage: HTMLImageElement | null,
  flipflopImage: HTMLImageElement | null,
  toothbrushImage: HTMLImageElement | null,
  hotdogImage: HTMLImageElement | null,
  rubberDuckyImage: HTMLImageElement | null,
  level2PickupImages: HTMLImageElement[],
  level2ObstacleImages: HTMLImageElement[]
) => {
  console.log(`[DEBUG] spawnItemsOnBeat called - Level: ${currentLevelId}, LevelToggles:`,
    JSON.stringify({
      showBottles: levelToggles.showBottles,
      showBags: levelToggles.showBags,
      showObstacles: levelToggles.showObstacles,
      showHooks: levelToggles.showHooks
    })
  );

  console.log(`[DEBUG] Images loaded - waterBottle: ${!!waterBottleImage}, plasticBag: ${!!plasticBagImage}, obstacle: ${!!obstacleImage}, fishHook: ${!!fishHookImage}`);

  if (currentLevelId === 1) {
    // Level 1 spawning logic remains unchanged

    // Spawn water bottles
    if (levelToggles.showBottles && waterBottleImage) {
      const spawnChance = 0.075 + (audioProgress / 200);
      const roll = Math.random();
      console.log(`[DEBUG] Water bottle spawn check - chance: ${spawnChance.toFixed(3)}, roll: ${roll.toFixed(3)}, willSpawn: ${roll < spawnChance}`);

      if (roll < spawnChance) {
        console.log('[DEBUG] 🍶 Spawning water bottle');
        gameState.trashList.push({
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
        gameState.trashList.push({
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
    if (levelToggles.showObstacles && obstacleImage) {
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
          pickupImage: obstacleImage
        });
      }
    } else if (levelToggles.showObstacles) {
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
    if (levelToggles.showBottles && level2PickupImages.length > 0 && level2PickupImages[0]) {
      if (Math.random() < 0.075 + (audioProgress / 200)) {
        gameState.trashList.push({
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
    if (levelToggles.showBags && level2PickupImages.length > 3 && level2PickupImages[3]) {
      if (Math.random() < 0.075 + (audioProgress / 200)) {
        gameState.trashList.push({
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
    if (level2PickupImages.length > 2 && level2PickupImages[2]) {
      if (Math.random() < 0.05 + (audioProgress / 200)) {
        gameState.trashList.push({
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

    // Spawn obstacles: only buses, bats, and chickens
    if (levelToggles.showObstacles && level2ObstacleImages.length > 0) {
      const baseProbability = 0.075 + (audioProgress / 200);
      let availableObstacles: { img: HTMLImageElement, type: string, width: number, height: number }[] = [];

      // Bus obstacle (index 0)
      if (levelToggles.showBuses && level2ObstacleImages.length > 0 && level2ObstacleImages[0]) {
        availableObstacles.push({
          img: level2ObstacleImages[0],
          type: 'bus',
          width: 100,
          height: 60
        });
      }

      // Chicken obstacle (index 2)
      if (levelToggles.showChickens && level2ObstacleImages.length > 2 && level2ObstacleImages[2]) {
        availableObstacles.push({
          img: level2ObstacleImages[2],
          type: 'chicken',
          width: 60,
          height: 60
        });
      }

      // Bats obstacle (index 1)
      if (levelToggles.showBats && level2ObstacleImages.length > 1 && level2ObstacleImages[1]) {
        if (audioProgress > 301 / 420) {
          for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.6) {
              gameState.obstacles.push({
                x: canvas.width + (Math.random() * 100),
                y: getSpawnY(canvas, 100),
                width: 60,
                height: 60,
                type: 'obstacle',
                speed: 2 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                pickupImage: level2ObstacleImages[1]
              });
            }
          }
        } else {
          availableObstacles.push({
            img: level2ObstacleImages[1],
            type: 'bats',
            width: 60,
            height: 60
          });
        }
      }

      if (availableObstacles.length > 0 && Math.random() < baseProbability) {
        const selectedObstacle = availableObstacles[Math.floor(Math.random() * availableObstacles.length)];
        gameState.obstacles.push({
          x: canvas.width,
          y: getSpawnY(canvas, selectedObstacle.height),
          width: selectedObstacle.width,
          height: selectedObstacle.height,
          type: 'obstacle',
          speed: 1 + Math.random() * 2,
          rotation: selectedObstacle.type === 'bus' ? 0 : Math.random() * Math.PI * 2,
          pickupImage: selectedObstacle.img
        });
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
        gameState.trashList.push({
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
      gameState.trashList.push({
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
  for (let i = gameState.trashList.length - 1; i >= 0; i--) {
    const item = gameState.trashList[i];

    // Update position
    item.x -= item.speed * speedMultiplier * factor;

    // Remove if off screen
    if (item.x + item.width * pulse < 0) {
      gameState.trashStats.missed++;
      gameState.trashList.splice(i, 1);
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
        createParticles(gameState.particles, item.x, item.y, '#FFC0CB', 20, 'heart');
        createParticles(gameState.particles, item.x, item.y, '#1489CF', 20, 'heart');
      } else {
        createParticles(gameState.particles, item.x, item.y, getParticleColorFromStreak(streak), 20);
      }

      gameState.trashList.splice(i, 1);

      setHealth(prev => Math.min(100, prev + 1));

      pickupSound?.play().catch(console.error);

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

        gameState.obstacles.splice(i, 1);
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

        gameState.obstacles.splice(i, 1);
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
  createParticles(gameState.particles, item.x, item.y, particleColor, 20);

  hitSound?.play().catch(console.error);

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
