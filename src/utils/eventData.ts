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
  { timestamp: 10, text: "HELP TINA SAVE DANNY", triggered: false },
  { timestamp: 20, text: "GO FLUFFY GO", triggered: false },
  { timestamp: 30, text: "DON'T GET THE FLU!", triggered: false },
  { timestamp: 40, text: "SAVE THE PLANET", triggered: false },
  { timestamp: 50, text: "DON'T Get Squashed by the bus!", triggered: false },
  { timestamp: 60, text: "MMM VITAMIN C!", triggered: false },
  { timestamp: 70, text: "MMM TUMERIC!", triggered: false },
  { timestamp: 80, text: "MMM GINGER!", triggered: false },
  { timestamp: 90, text: "SAVE DANNY!", triggered: false },
  { timestamp: 100, text: "BIOLOGICAL WEAPON'S CAN'T STOP FLUFFY!", triggered: false },
  { timestamp: 110, text: "WE'RE COMING DANNY!", triggered: false },
  { timestamp: 120, text: "WUHAN MAKES CYMBOLS!", triggered: false },
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
    { timestamp: 15, type: 'bus', triggered: false },
    { timestamp: 25, type: 'bats', triggered: false },
    { timestamp: 35, type: 'chicken', triggered: false },
    { timestamp: 45, type: 'bus', triggered: false },
    { timestamp: 50, type: 'bats', triggered: false },
    { timestamp: 55, type: 'chicken', triggered: false },
    { timestamp: 65, type: 'bus', triggered: false },
    { timestamp: 75, type: 'bats', triggered: false },
    { timestamp: 85, type: 'chicken', triggered: false },
    { timestamp: 95, type: 'bus', triggered: false },
    { timestamp: 105, type: 'bats', triggered: false },
    { timestamp: 115, type: 'chicken', triggered: false }
  ],
  pickups: [
    { timestamp: 10, type: 'vitaminC', triggered: false },
    { timestamp: 20, type: 'pill', triggered: false },
    { timestamp: 30, type: 'tumeric', triggered: false },
    { timestamp: 40, type: 'ginger', triggered: false },
    { timestamp: 60, type: 'vitaminC', triggered: false },
    { timestamp: 70, type: 'pill', triggered: false },
    { timestamp: 80, type: 'tumeric', triggered: false },
    { timestamp: 90, type: 'ginger', triggered: false },
    { timestamp: 100, type: 'vitaminC', triggered: false },
    { timestamp: 110, type: 'pill', triggered: false },
    { timestamp: 120, type: 'tumeric', triggered: false }
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
  showRubberDuckies: false
});