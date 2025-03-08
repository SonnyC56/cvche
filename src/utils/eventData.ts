import { TimedTextEvent, TimedColorEvent, Level2TimedEvents, Level3TimedEvents, Level, LevelToggles } from '../types';

// Default timed text events for level 1
export const createDefaultTimedTextEvents = (): TimedTextEvent[] => [
  { timestamp: 9.35, text: "WELCOME TO CVCHE", triggered: false },
  { timestamp: 11, text: "Save the Reef. Collect The Plastic.", triggered: false },
  { timestamp: 26, text: "Don't Get Sticky!", triggered: false },
  { timestamp: 102, text: "COME ON FLUFFY!", triggered: false },
  { timestamp: 105, text: "PUFF. PUFF. GET FLUFFY!", triggered: false },
  { timestamp: 200, text: "Dance Dance Evolution!", triggered: false },
  { timestamp: 234, text: "Don't Get Hooked!", triggered: false },
  { timestamp: 258, text: "Getting Fluffy!", triggered: false },
  { timestamp: 282, text: "GET FLUFFY - STAY FLUFFY", triggered: false },
  { timestamp: 325, text: "GO BABY GO!", triggered: false },
  { timestamp: 355, text: "ALMOST THERE!", triggered: false },
  { timestamp: 387, text: "YOU ARE AMAZING!", triggered: false },
  { timestamp: 405, text: "FLUFFY LOVES YOU", triggered: false },
  { timestamp: 420, text: "AMAZING JOB FLUFFY! STAY TUNED FOR MORE ADVENTURES! ", triggered: false },
  { timestamp: 431, text: "THE END", triggered: false },
];

// Level 2 timed text events
export const createLevel2TimedTextEvents = (): TimedTextEvent[] => [
  { timestamp: 6, text: "It's 1981. Endless Love by Diana Ross and Lionel Richie is song of the year.", triggered: false, color: "#FDF200", lifetime: 400 },
  { timestamp: 10, text: "But still the world feels unstable.", triggered: false, color: "#FDF200" , lifetime: 400},
  { timestamp: 14, text: "Tina's son Danny was killed in a tragic bus accident.", triggered: false, color: "#FDF200", lifetime: 400 },
  { timestamp: 18, text: "But is Danny really DEAD?", triggered: false, color: "#FDF200" },
  { timestamp: 22, text: "HELP TINA SAVE DANNY!", triggered: false, color: "#FDF200" },
  { timestamp: 26, text: "COME ON FLUFFY!", triggered: false, color: "#FDF200" },
  { timestamp: 36, text: "MMM Vitamin C!", triggered: false, color: "#FDF200" },
  { timestamp: 49, text: "Flying Buses WTF!?", triggered: false, color: "#FDF200" },
  { timestamp: 83, text: "Cock block!", triggered: false, color: "#FDF200" },
  { timestamp: 93, text: "COME ON FLUFFY!", triggered: false, color: "#FDF200" },
  { timestamp: 130, text: "Biological Weapons! You gotta be kidding me.", triggered: false, color: "#FDF200" },
  { timestamp: 135, text: "COME ON FLUFFY!", triggered: false, color: "#FDF200" },
  { timestamp: 173, text: "OH DANNY BOY!", triggered: false, color: "#FDF200" },
  { timestamp: 190, text: "PUFF. PUFF. GET FLUFFY!", triggered: false, color: "#FDF200" },
  { timestamp: 252, text: "HOLY SCHNIKEYS!", triggered: false, color: "#FDF200" },
  { timestamp: 286, text: "DANNY HERE WE COME!", triggered: false, color: "#FDF200" },
  { timestamp: 301, text: "DAAAAAAAAAAAAANNNNNNNNNNYYYYYYYY!!!", triggered: false, color: "#FDF200" },
  { timestamp: 328, text: "GREAT WORK FLUFFY!!! YOU SAVED DANNY!", triggered: false, color: "#FDF200" },
];

// Color change events for level 1
export const createLevel1ColorEvents = (): TimedColorEvent[] => [
  { timestamp: 0, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: true, transitionDuration: 3 },
  { timestamp: 105, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 3 },
  { timestamp: 139, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 3 },
  { timestamp: 234, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 240, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 258, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 264, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 274, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 280, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 282, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 288, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 325, backgroundColor: "#F47920", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 330, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 335, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 340, backgroundColor: "#F47920", waveColor: "rgba(244,121,32,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 345, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 350, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 355, backgroundColor: "#A4CE38", waveColor: "rgba(164,206,56,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 360, backgroundColor: "#1489CF", waveColor: "rgba(20,137,207,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 361, backgroundColor: "#ED1D24", waveColor: "rgba(237,29,36,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 362, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 363, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 364, backgroundColor: "#F47920", waveColor: "rgba(244,121,32,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 365, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 390, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 409, backgroundColor: "#A4CE38", waveColor: "rgba(164,206,56,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 410, backgroundColor: "#1489CF", waveColor: "rgba(20,137,207,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 411, backgroundColor: "#ED1D24", waveColor: "rgba(237,29,36,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 412, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 413, backgroundColor: "#FECB07", waveColor: "rgba(254,203,7,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 424, backgroundColor: "#F47920", waveColor: "rgba(244,121,32,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 425, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 426, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 431, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
];

// Color change events for level 2
export const createLevel2ColorEvents = (): TimedColorEvent[] => [
  { timestamp: 0, backgroundColor: "#000000", waveColor: "rgba(0,0,0,0.4)", triggered: true, transitionDuration: 3 },
/*   { timestamp: 5, backgroundColor: "#1A0A1F", waveColor: "rgba(26,10,31,0.4)", triggered: false, transitionDuration: 3 },
  { timestamp: 49, backgroundColor: "#14142E", waveColor: "rgba(20,20,46,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 83, backgroundColor: "#2E0D0D", waveColor: "rgba(46,13,13,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 130, backgroundColor: "#1A0A1F", waveColor: "rgba(26,10,31,0.4)", triggered: false, transitionDuration: 3 },
  { timestamp: 173, backgroundColor: "#2E142E", waveColor: "rgba(46,20,46,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 190, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 3 },
  { timestamp: 252, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 286, backgroundColor: "#2E142E", waveColor: "rgba(46,20,46,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 301, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 328, backgroundColor: "#1A0A1F", waveColor: "rgba(26,10,31,0.4)", triggered: false, transitionDuration: 3 }, */
];

// Level 3 timed text events
export const createLevel3TimedTextEvents = (): TimedTextEvent[] => [
  { timestamp: 6, text: "HAVE YOU EVER HAD A FEELING YOU COULD FLY", triggered: false, color: "#FDF200" },
  { timestamp: 30, text: "GET FLUFFY WITH FLUFFY", triggered: false, color: "#FDF200" },
  { timestamp: 71, text: "MMM MUSHROOMS!", triggered: false, color: "#FDF200" },
  { timestamp: 90, text: "FLUFFY THE FLYING FISH", triggered: false, color: "#FDF200" },
  { timestamp: 125, text: "MMM MUSHROOMS!", triggered: false, color: "#A0D8EF" },
  { timestamp: 150, text: "FLY FLUFFY FLY!", triggered: false, color: "#FDF200" },
  { timestamp: 165, text: "A STORMS A BREWING!", triggered: false, color: "#FDF200" },
  { timestamp: 185, text: "WATCH OUT FOR LIGHTING FLUFF!", triggered: false, color: "#888888" },
  { timestamp: 210, text: "BIRDS OF PREY! WTF!", triggered: false, color: "#888888" },
  { timestamp: 230, text: "BALD EAGLES TOO!", triggered: false, color: "#888888" },
  { timestamp: 270, text: "MUSHROOOOOOOOOOOMS!!!", triggered: false, color: "#FDF200" },
  { timestamp: 304, text: "WOWOWOWOWEEEEWOW! THE COLORS!", triggered: false, color: "#FF00FF" },
  { timestamp: 340, text: "FLUFFY FLUFF FLUFF! IT'S BEAUTIFUL", triggered: false, color: "#00FFFF" },
  { timestamp: 370, text: "IT'S SOOO BEAUTIFUL", triggered: false, color: "#FF8800" },
  { timestamp: 410, text: "HOLY SMOKES! NICE WORK FLUFF!", triggered: false, color: "#FDF200" },
];

// Color change events for level 3
export const createLevel3ColorEvents = (): TimedColorEvent[] => [
  { timestamp: 0, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: true, transitionDuration: 3 },
  { timestamp: 125, backgroundColor: "#A0D8EF", waveColor: "rgba(160,216,239,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 150, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 2 },
  // Light purple pastels
  { timestamp: 160, backgroundColor: "#E6C3E6", waveColor: "rgba(230,195,230,0.4)", triggered: false, transitionDuration: 2 },
  // Storm colors
  { timestamp: 165, backgroundColor: "#888888", waveColor: "rgba(136,136,136,0.4)", triggered: false, transitionDuration: 2 },
  { timestamp: 270, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  // Trippy color transitions - rapidly changing colors for the psychedelic section
  { timestamp: 304, backgroundColor: "#FF00FF", waveColor: "rgba(255,0,255,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 315, backgroundColor: "#00FFFF", waveColor: "rgba(0,255,255,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 325, backgroundColor: "#FF8800", waveColor: "rgba(255,136,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 335, backgroundColor: "#A8238E", waveColor: "rgba(168,35,142,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 345, backgroundColor: "#14AEEF", waveColor: "rgba(20,174,239,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 355, backgroundColor: "#A4CE38", waveColor: "rgba(164,206,56,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 365, backgroundColor: "#E6C3E6", waveColor: "rgba(230,195,230,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 375, backgroundColor: "#FF00FF", waveColor: "rgba(255,0,255,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 385, backgroundColor: "#00FFFF", waveColor: "rgba(0,255,255,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 395, backgroundColor: "#FF8800", waveColor: "rgba(255,136,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 405, backgroundColor: "#FDF200", waveColor: "rgba(253,242,0,0.4)", triggered: false, transitionDuration: 1 },
  { timestamp: 410, backgroundColor: "#E6C3E6", waveColor: "rgba(230,195,230,0.4)", triggered: false, transitionDuration: 1 },
];

// Function to return color events based on level ID
export const createColorEventsByLevel = (levelId: number): TimedColorEvent[] => {
  switch (levelId) {
    case 1:
      return createLevel1ColorEvents();
    case 2:
      return createLevel2ColorEvents();
    case 3:
      return createLevel3ColorEvents();
    default:
      return createLevel1ColorEvents();
  }
};

// Level 3 timed events for obstacles, pickups, and visuals
export const createLevel3TimedEvents = (): Level3TimedEvents => ({
  obstacles: [
    // Eagles as obstacles
    { timestamp: 210, type: 'eagle', triggered: false },
    { timestamp: 215, type: 'eagle', triggered: false },
    { timestamp: 220, type: 'eagle', triggered: false },
    // More eagles at 230s
    { timestamp: 230, type: 'eagle', triggered: false },
    { timestamp: 235, type: 'eagle', triggered: false },
    { timestamp: 240, type: 'eagle', triggered: false },
    { timestamp: 245, type: 'eagle', triggered: false },
    { timestamp: 250, type: 'eagle', triggered: false },
    { timestamp: 255, type: 'eagle', triggered: false },
    { timestamp: 260, type: 'eagle', triggered: false },
  ],
  pickups: [
    // Mushrooms as pickups
    { timestamp: 71, type: 'mushroom', variant: '1', triggered: false },
    { timestamp: 75, type: 'mushroom', variant: '2', triggered: false },
    { timestamp: 80, type: 'mushroom', variant: '3', triggered: false },
    { timestamp: 85, type: 'mushroom', variant: '4', triggered: false },
    { timestamp: 125, type: 'mushroom', variant: '5', triggered: false },
    { timestamp: 130, type: 'mushroom', variant: '6', triggered: false },
    { timestamp: 135, type: 'mushroom', variant: '7', triggered: false },
    { timestamp: 140, type: 'mushroom', variant: '8', triggered: false },
    { timestamp: 270, type: 'mushroom', variant: '9', triggered: false },
    { timestamp: 275, type: 'mushroom', variant: '1', triggered: false },
    { timestamp: 280, type: 'mushroom', variant: '2', triggered: false },
    { timestamp: 285, type: 'mushroom', variant: '3', triggered: false },
    { timestamp: 290, type: 'mushroom', variant: '4', triggered: false },
    { timestamp: 295, type: 'mushroom', variant: '5', triggered: false },
    { timestamp: 300, type: 'mushroom', variant: '6', triggered: false },
  ],
  visuals: [
    // Clouds rising at beginning
    { timestamp: 3, type: 'cloud', triggered: false },
    // Floating clouds
    { timestamp: 30, type: 'cloud', triggered: false },
    { timestamp: 40, type: 'cloud', triggered: false },
    { timestamp: 50, type: 'cloud', triggered: false },
    { timestamp: 60, type: 'cloud', triggered: false },
    // Storm clouds
    { timestamp: 165, type: 'cloud', variant: 'storm', triggered: false },
    { timestamp: 170, type: 'cloud', variant: 'storm', triggered: false },
    { timestamp: 175, type: 'cloud', variant: 'storm', triggered: false },
    { timestamp: 180, type: 'cloud', variant: 'storm', triggered: false },
    // Trippy visuals starting at 304s
    { timestamp: 304, type: 'trippy', variant: 'gummyWorm', triggered: false },
    { timestamp: 310, type: 'trippy', variant: 'magicRabbit', triggered: false },
    { timestamp: 316, type: 'trippy', variant: 'baby', triggered: false },
    { timestamp: 322, type: 'trippy', variant: 'kitten', triggered: false },
    { timestamp: 328, type: 'trippy', variant: 'pomeranian', triggered: false },
    { timestamp: 334, type: 'trippy', variant: 'squirtToy', triggered: false },
    { timestamp: 340, type: 'trippy', variant: 'baby2', triggered: false },
    { timestamp: 346, type: 'trippy', variant: 'blueMan', triggered: false },
    { timestamp: 352, type: 'trippy', variant: 'woman', triggered: false },
    { timestamp: 358, type: 'trippy', variant: 'gummyWorm', triggered: false },
    { timestamp: 364, type: 'trippy', variant: 'magicRabbit', triggered: false },
    { timestamp: 370, type: 'trippy', variant: 'baby', triggered: false },
    { timestamp: 376, type: 'trippy', variant: 'kitten', triggered: false },
    { timestamp: 382, type: 'trippy', variant: 'pomeranian', triggered: false },
    { timestamp: 388, type: 'trippy', variant: 'squirtToy', triggered: false },
    { timestamp: 394, type: 'trippy', variant: 'baby2', triggered: false },
    { timestamp: 400, type: 'trippy', variant: 'blueMan', triggered: false },
  ]
});

// Level 2 timed events for obstacles and pickups
export const createLevel2TimedEvents = (): Level2TimedEvents => ({
  obstacles: [
    // Flying Buses - starting around 49 second mark
    { timestamp: 49, type: 'bus', triggered: false },
    { timestamp: 55, type: 'bus', triggered: false },
    { timestamp: 62, type: 'bus', triggered: false },
    
    // Chickens - starting around 83 second mark
    { timestamp: 83, type: 'chicken', triggered: false },
    { timestamp: 88, type: 'chicken', triggered: false },
    { timestamp: 93, type: 'chicken', triggered: false },
    
    // Bats - starting around 120 second mark
    { timestamp: 120, type: 'bats', triggered: false },
    { timestamp: 125, type: 'bats', triggered: false },
    { timestamp: 130, type: 'bats', triggered: false },
    
    // Mixed obstacles - around 173 mark (all obstacles randomly mixed)
    { timestamp: 173, type: 'bus', triggered: false },
    { timestamp: 176, type: 'chicken', triggered: false },
    { timestamp: 180, type: 'bats', triggered: false },
    { timestamp: 185, type: 'bus', triggered: false },
    { timestamp: 188, type: 'chicken', triggered: false },
    { timestamp: 192, type: 'bats', triggered: false },
    
    // Major shift at 252 - HOLY SCHNIKEYS! moment
    { timestamp: 252, type: 'bus', triggered: false },
    { timestamp: 255, type: 'chicken', triggered: false },
    { timestamp: 258, type: 'bats', triggered: false },
    { timestamp: 262, type: 'bus', triggered: false },
    { timestamp: 266, type: 'chicken', triggered: false },
    { timestamp: 270, type: 'bats', triggered: false },
    
    // Final extreme obstacle flood for the outro at 301 mark
    { timestamp: 301, type: 'bats', triggered: false },
    { timestamp: 302, type: 'bats', triggered: false },
    { timestamp: 303, type: 'bats', triggered: false },
    { timestamp: 304, type: 'bats', triggered: false },
    { timestamp: 305, type: 'bats', triggered: false },
    { timestamp: 306, type: 'bats', triggered: false },
    { timestamp: 307, type: 'bats', triggered: false },
    { timestamp: 308, type: 'bats', triggered: false },
    { timestamp: 310, type: 'bats', triggered: false },
    { timestamp: 312, type: 'bats', triggered: false }
  ],
  pickups: [
    // Orange Slices (VitaminC) incoming at 28 seconds
    { timestamp: 28, type: 'vitaminC', triggered: false },
    { timestamp: 32, type: 'vitaminC', triggered: false },
    { timestamp: 36, type: 'vitaminC', triggered: false },
    
    // Ginger comes at 36 second mark
    { timestamp: 36, type: 'ginger', triggered: false },
    { timestamp: 40, type: 'ginger', triggered: false },
    { timestamp: 44, type: 'ginger', triggered: false },
    
    // Mix of health items during mid-game
    { timestamp: 70, type: 'pill', triggered: false },
    { timestamp: 80, type: 'tumeric', triggered: false },
    { timestamp: 90, type: 'vitaminC', triggered: false },
    { timestamp: 100, type: 'ginger', triggered: false },
    { timestamp: 110, type: 'pill', triggered: false },
    
    // More pickups during intense sections
    { timestamp: 150, type: 'tumeric', triggered: false },
    { timestamp: 160, type: 'vitaminC', triggered: false },
    { timestamp: 170, type: 'ginger', triggered: false },
    
    // Continued pickups during mixed obstacle section
    { timestamp: 200, type: 'pill', triggered: false },
    { timestamp: 220, type: 'tumeric', triggered: false },
    { timestamp: 240, type: 'vitaminC', triggered: false },
    
    // Final stretch pickups
    { timestamp: 280, type: 'ginger', triggered: false },
    { timestamp: 290, type: 'pill', triggered: false }
  ]
});

// Default game levels
export const getDefaultLevels = (): Level[] => {
  return [
    {
      id: 1,
      title: "WELCOME TO CVCHE",
      songFile: "https://storage.googleapis.com/assets.urnowhere.com/publicmedia/cvche/welcomeToCVCHE.mp3",
      initialBackground: "#FDF200",
      initialWaveColor: "rgba(253,242,0,0.4)",
      unlocked: true,
      isCaveMechanic: false,
      highScore: 0,
      highestStreak: 0
    },
    {
      id: 2,
      title: "Eyes of Darkness",
      songFile: "https://storage.googleapis.com/assets.urnowhere.com/publicmedia/cvche/Eyes_of_Darkness.mp3",
      initialBackground: "#000000",
      initialWaveColor: "rgba(0,0,0,0.4)",
      unlocked: true,
      isCaveMechanic: false,
      highScore: 0,
      highestStreak: 0
    },
    {
      id: 3,
      title: "Fluffy the Flying Fish",
      songFile: "sounds/GetFluffy.mp3",
      initialBackground: "#FDF200",
      initialWaveColor: "rgba(253,242,0,0.4)",
      unlocked: true,
      isCaveMechanic: true, // For the storm section with cave mechanics
      highScore: 0,
      highestStreak: 0
    }
  ];
};

// Initial level toggles state
export const getInitialLevelToggles = (): LevelToggles => ({
  showFlora: false,
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
  // Level 2 specific obstacle toggles
  showBuses: false,
  showBats: false,
  showChickens: false,
  // Level 3 specific toggles
  showClouds: false,
  showMushrooms: false,
  showEagles: false,
  showTrippyObjects: false,
  showStormEffects: false
});
