# Adding New Game Levels to CVCHE

This document outlines the step-by-step process for adding a new level to the CVCHE game. This guide was created after successfully implementing Level 3.

## Overview

Adding a new level requires modifications to several key files:

1. **Types** - Define new level-specific event types
2. **Asset Loader** - Add code to load level-specific assets
3. **Game State Hook** - Update the game state to handle the new level
4. **Game Helpers** - Implement level-specific gameplay mechanics
5. **Game Loop** - Integrate the new level into the main game loop

## 1. Update Asset Loader

First, modify the `AssetLoader` class in `src/utils/assetLoader.ts` to handle new level assets:

```typescript
// Add level-specific asset properties
// Level 3 specific assets
cloudImage: HTMLImageElement | null = null;
eagleImage: HTMLImageElement | null = null;

// Add collections for the level assets
level3ObstacleImages: HTMLImageElement[] = [];
level3MushroomImages: HTMLImageElement[] = [];
level3TrippyImages: HTMLImageElement[] = [];

// Add a status flag for the level
level3AssetsLoaded = false;

// Implement load function for the new level assets
async loadLevel3Assets(): Promise<void> {
  // Load obstacle images
  const obstaclePromises = [
    this.loadImage('/sprites/level3/obstacles/clouds.png').then(img => {
      this.cloudImage = img;
      this.level3ObstacleImages.push(img);
    }),
    this.loadImage('/sprites/level3/obstacles/eagle.png').then(img => {
      this.eagleImage = img;
      this.level3ObstacleImages.push(img);
    })
  ];
  
  // Load pickup images
  const mushroomPromises = [];
  for (let i = 1; i <= 9; i++) {
    mushroomPromises.push(
      this.loadImage(`/sprites/level3/mushrooms/mushroom (${i}).png`).then(img => {
        this.level3MushroomImages.push(img);
      })
    );
  }
  
  // Load other assets
  const trippyTypes = [
    'baby', 'baby2', 'blueMan', 'gummyWorm', 'kitten', 
    'magicRabbit', 'pomeranian', 'squirtToy', 'woman'
  ];
  
  const trippyPromises = trippyTypes.map(type => {
    const ext = type === 'blueMan' ? 'jpg' : 'png';
    return this.loadImage(`/sprites/level3/trippyPickups/${type}.${ext}`).then(img => {
      this.level3TrippyImages.push(img);
    });
  });
  
  await Promise.all([...obstaclePromises, ...mushroomPromises, ...trippyPromises]);
  this.level3AssetsLoaded = true;
}
```

## 2. Update Game State Hook

Extend the `useGameState` hook in `src/hooks/useGameState.ts`:

```typescript
// Import the new level type
import { GameState, Level, LevelToggles, ActiveTimedText, ActiveColor, CaveState, Bubble, Flora, StreakDisplay, TimedTextEvent, TimedColorEvent, Level2TimedEvents, Level3TimedEvents, Particle } from '../types';
import { getDefaultLevels, createDefaultTimedTextEvents, createLevel2TimedTextEvents, createLevel3TimedTextEvents, createColorEventsByLevel, createLevel2TimedEvents, createLevel3TimedEvents, getInitialLevelToggles } from '../utils/eventData';

// Add reference for level-specific events
const level3TimedEventsRef = useRef<Level3TimedEvents>(createLevel3TimedEvents());

// Add references for level assets
const level3ObstacleImagesRef = useRef<HTMLImageElement[]>([]);
const level3MushroomImagesRef = useRef<HTMLImageElement[]>([]);
const level3TrippyImagesRef = useRef<HTMLImageElement[]>([]);

// Update selectLevel callback to handle the new level
const selectLevel = useCallback(async (level: Level) => {
  // ...existing code...
  
  if (level.id === 3) {
    if (containerRef.current) {
      containerRef.current.style.background = "transparent";
    }
    timedTextEventsRef.current = createLevel3TimedTextEvents();
    const loadLevel3Assets = async () => {
      if (gameStateRef.current.gameStarted) {
        setIsPaused(true);
      }
      const assetLoader = new AssetLoader();
      await assetLoader.loadLevel3Assets();
      level3ObstacleImagesRef.current = assetLoader.level3ObstacleImages;
      level3MushroomImagesRef.current = assetLoader.level3MushroomImages;
      level3TrippyImagesRef.current = assetLoader.level3TrippyImages;
      setLevelEnded(false);
      setHealth(100);
      if (gameStateRef.current.gameStarted) {
        setIsPaused(false);
      }
    };
    // Load level assets
    await loadLevel3Assets();
  }
  
  // ...rest of the function
}, [levels, setIsPaused, setLevelEnded, setHealth]);

// Update return object to include new refs
return {
  // ...existing properties
  level3ObstacleImagesRef,
  level3MushroomImagesRef,
  level3TrippyImagesRef,
  level3TimedEventsRef,
  // ...rest of properties
};
```

## 3. Update Game Helpers

Extend the `GameHelpers.ts` file to handle level-specific gameplay mechanics:

```typescript
// Update the import
import { LevelToggles, GameState, Level3TimedEvents } from '../../types';

// Add level-specific toggles in updateLevelToggles function
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
  // Add more timing-based toggles...
}

// Add a function to process level-specific events
export const processLevel3Events = (
  audioTime: number,
  canvas: HTMLCanvasElement,
  level3TimedEvents: Level3TimedEvents,
  level3ObstacleImages: HTMLImageElement[],
  level3MushroomImages: HTMLImageElement[],
  level3TrippyImages: HTMLImageElement[],
  gameState: GameState
) => {
  // Process obstacles
  level3TimedEvents.obstacles.forEach((event) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;
      // Spawn an obstacle
      // ...
    }
  });

  // Process pickups
  level3TimedEvents.pickups.forEach((event) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;
      // Spawn a pickup
      // ...
    }
  });

  // Process visual effects
  level3TimedEvents.visuals.forEach((event) => {
    if (!event.triggered && audioTime >= event.timestamp) {
      event.triggered = true;
      // Create a visual effect
      // ...
    }
  });
};
```

## 4. Update Game Loop

Extend the `GameLoop.ts` file to integrate the new level:

```typescript
// Update import to include new level type
import { GameState, LevelToggles, ActiveTimedText, TimedTextEvent, TimedColorEvent, Level2TimedEvents, Level3TimedEvents, ActiveColor, Bubble, StreakDisplay, Level, CaveState } from '../../types';
import { processColorEvents, processLevel2Events, processLevel3Events, spawnItemsOnBeat, updateAndCheckObstacleCollisions, updateAndCheckTrashCollisions, updateLevelToggles } from './GameHelpers';

// Add the new level assets to the function parameters
level3ObstacleImagesRef: React.MutableRefObject<HTMLImageElement[]>,
level3MushroomImagesRef: React.MutableRefObject<HTMLImageElement[]>,
level3TrippyImagesRef: React.MutableRefObject<HTMLImageElement[]>,

// Add the level events ref to the function parameters
level3TimedEventsRef: React.MutableRefObject<Level3TimedEvents>,

// Add conditional processing based on level ID
if (currentLevelRef.current.id === 2) {
  processLevel2Events(
    audioTime, 
    canvasRef.current, 
    level2TimedEventsRef.current, 
    level2ObstacleImagesRef.current,
    level2PickupImagesRef.current,
    gameStateRef.current
  );
} else if (currentLevelRef.current.id === 3) {
  processLevel3Events(
    audioTime,
    canvasRef.current,
    level3TimedEventsRef.current,
    level3ObstacleImagesRef.current,
    level3MushroomImagesRef.current,
    level3TrippyImagesRef.current,
    gameStateRef.current
  );
}

// Update the gameLoop requestAnimationFrame call to include the new parameters
animationFrameIdRef.current = requestAnimationFrame(() => gameLoop(
  // ...existing parameters
  level3ObstacleImagesRef,
  level3MushroomImagesRef,
  level3TrippyImagesRef,
  // ...existing parameters
  level3TimedEventsRef,
  // ...remaining parameters
));
```

## 5. Update Event Data (if needed)

If your level needs custom event handling, update `src/utils/eventData.ts` to include functions to create level-specific timed events:

```typescript
export const createLevel3TimedTextEvents = (): TimedTextEvent[] => {
  return [
    { text: "HAVE YOU EVER HAD A FEELING YOU COULD FLY", timestamp: 6, triggered: false, lifetime: 250 },
    { text: "GET FLUFFY WITH FLUFFY", timestamp: 30, triggered: false, lifetime: 250 },
    // Other text events for the level
  ];
};

export const createLevel3TimedEvents = (): Level3TimedEvents => {
  return {
    obstacles: [
      // Eagles, clouds, etc.
      { type: 'eagle', timestamp: 210, triggered: false },
            // Cloud and trippy effects
      { type: 'cloud', timestamp: 3, triggered: false },
    ],
    pickups: [
      // Mushrooms
      { type: 'mushroom', timestamp: 71, triggered: false },
      //trippy
          { type: 'trippy', timestamp: 71, triggered: false },
    ],

  };
};
```

## 6. Testing Your Level

To test the new level:

1. Ensure all asset files are in the correct directories
2. Verify that the level-specific event processing is working
3. Check that transitions between levels work correctly
4. Test gameplay mechanics specific to your level

## Common Issues and Solutions

- **Missing assets**: Double-check that all asset paths are correct and files exist
- **Timing issues**: Verify that timestamps align with the music
- **Type errors**: Ensure all new types are properly defined and imported
- **Asset loading failures**: Log loading progress and check browser console for errors

## Final Tips

- Keep level-specific code encapsulated to make maintenance easier
- Follow the existing patterns when adding new features
- Test thoroughly after each significant change
