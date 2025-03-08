export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  opacity: number;
  shape?: 'circle' | 'heart';
}
//Level2TimedEvents
export interface Level2TimedEvents {
  obstacles: Level2TimedEvent[];
  pickups: Level2TimedEvent[];
}
//Level2TimedEvent
export interface Level2TimedEvent {
  timestamp: number;
  type: 'bus' | 'bats' | 'chicken' | 'vitaminC' | 'pill' | 'tumeric' | 'ginger';
  triggered: boolean;
}
//Level
export interface Level {
  id: number;
  title: string;
  songFile: string;
  initialBackground: string;
  initialWaveColor: string;
  unlocked: boolean;
  isCaveMechanic?: boolean;
  highScore?: number;
  highestStreak?: number;
}

//CaveState
export interface CaveState {
  upper: { points: CavePoint[], amplitude: number },
  lower: { points: CavePoint[], amplitude: number }
}

//points 
export interface CavePoint {
  x: number;
  y: number;
} 


//Player
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  speed: number;
  rotation: number;
  spinRotation: number;
  hitTime?: number;
  hitType?: 'trash' | 'obstacle' | 'fishhook' | 'flipflop' | 'toothbrush' | 'hotdog' | 'rubberducky';
}

//GameState
export interface GameState {
  level: Level;
  levelToggles: LevelToggles;
  score: number;
  streak: number;

  highScore: number;
  highestStreak: number;
  time: number;
  paused: boolean;
  gameOver: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  gameItems: GameItem[];
  particles: Particle[];
  pickups: GameItem[];
  trashStats: TrashStats;
  obstacles: GameItem[];
  scorePopups: ScorePopup[];
  timedTextEvents: TimedTextEvent[];
  activeTimedText: ActiveTimedText;
  timedColorEvents: TimedColorEvent[];
  activeColor: ActiveColor;
  bubbles: Bubble[];
  flora: Flora[];
  streakDisplay: StreakDisplay;
  multiplier: number;
  player: Player;
}

//TrashStats { totalSpawned: 0, collected: 0, missed: 0 }
export interface TrashStats {
  totalSpawned: number;
  collected: number;
  missed: number;
}

export interface GameItem {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'trash' | 'obstacle' | 'fishhook' | 'flipflop' | 'toothbrush' | 'hotdog' | 'rubberducky';
  speed: number;
  rotation?: number;
  pickupImage?: HTMLImageElement;
  baseY?: number;
}

export interface ExtendedHTMLAudioElement extends HTMLAudioElement {
  _mediaElementSource?: MediaElementAudioSourceNode;
  _audioCtx?: AudioContext;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  opacity: number;
  lifetime: number;
}

export interface TimedTextEvent {
  timestamp: number;
  text: string;
  triggered: boolean;
  color?: string; // Optional text color property
  lifetime?: number;
}

export interface ActiveTimedText {
  text: string;
  lifetime: number;
  color: string;
}

export interface TimedColorEvent {
  timestamp: number;
  backgroundColor: string;
  waveColor: string;
  triggered: boolean;
  transitionDuration: number; // in seconds
}

export interface ActiveColor {
  backgroundColor: string;
  waveColor: string;
  progress: number;
  targetBackgroundColor: string;
  targetWaveColor: string;
  transitionDuration: number;
}

export interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

export interface Flora {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  swayOffset: number;
  swaySpeed: number;
  scrollSpeed: number;
  active: boolean; // Add this property
}

export interface StreakDisplay {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

export interface Level {
  id: number;
  title: string;
  songFile: string;
  initialBackground: string;
  initialWaveColor: string;
  unlocked: boolean;
  isCaveMechanic?: boolean;
  highScore?: number; // Add this property
  highestStreak?: number; // NEW: Save highest streak here
}

export interface LevelToggles {
  showFlora: boolean;
  showBags: boolean;         // replaced showTrash
  showBottles: boolean;       // replaced showTrash
  showOilSplats: boolean;
  showHooks: boolean;
  showVisualizer: boolean;
  showBubbles: boolean;
  showBackgroundPattern: boolean;
  showFlipFlops: boolean;
  showToothbrushes: boolean;
  showHotdogs: boolean;
  showRubberDuckies: boolean;
  // Level 2 specific obstacle toggles
  showBuses?: boolean;
  showBats?: boolean;
  showChickens?: boolean;
}

export interface Props {
  onGameStart?: () => void;
}

export interface GameProps {
  onGameStart?: () => void;
}
