import { TimedTextEvent, TimedColorEvent, Level2TimedEvents, Level, LevelToggles } from '../types';

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
  { timestamp: 6, text: "It's 1981. Endless Love by Diana Ross and Lionel Richie is song of the year.", triggered: false },
  { timestamp: 10, text: "But still the world feels unstable.", triggered: false },
  { timestamp: 14, text: "Tina's son Danny was killed in a tragic bus accident.", triggered: false },
  { timestamp: 18, text: "But is Danny really DEAD?", triggered: false },
  { timestamp: 22, text: "HELP TINA SAVE DANNY!", triggered: false },
  { timestamp: 26, text: "COME ON FLUFFY!", triggered: false },
  { timestamp: 36, text: "MMM Vitamin C!", triggered: false },
  { timestamp: 49, text: "Flying Buses WTF!?", triggered: false },
  { timestamp: 83, text: "Cock block!", triggered: false },
  { timestamp: 93, text: "COME ON FLUFFY!", triggered: false },
  { timestamp: 130, text: "Biological Weapons! You gotta be kidding me.", triggered: false },
  { timestamp: 135, text: "COME ON FLUFFY!", triggered: false },
  { timestamp: 173, text: "OH DANNY BOY!", triggered: false },
  { timestamp: 190, text: "PUFF. PUFF. GET FLUFFY!", triggered: false },
  { timestamp: 252, text: "HOLY SCHNIKEYS!", triggered: false },
  { timestamp: 286, text: "DANNY HERE WE COME!", triggered: false },
  { timestamp: 301, text: "DAAAAAAAAAAAAANNNNNNNNNNYYYYYYYY!!!", triggered: false },
  { timestamp: 328, text: "GREAT WORK FLUFFY!!! YOU SAVED DANNY!", triggered: false },
];

// Color change events for level 1
export const createColorEvents = (): TimedColorEvent[] => [
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
    }
  ];
};

// Initial level toggles state
export const getInitialLevelToggles = (): LevelToggles => ({
  showFlora: false,
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
  // Level 2 specific obstacle toggles
  showBuses: false,
  showBats: false,
  showChickens: false
});