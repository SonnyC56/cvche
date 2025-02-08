/* eslint-disable @typescript-eslint/no-unused-vars */
// src/PhaserGame.tsx
import React, { useEffect } from 'react';
import Phaser from 'phaser';

/**
 * MenuScene
 * - Displays the game title and instructions to start.
 * - Waits for the player to press SPACE, then starts the GameScene.
 */
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 50, 'Welcome to CVCHE', {
        fontSize: '48px',
        color: '#fff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2, 'Press SPACE to Start', {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5);

    // Listen for SPACE key to start the game.
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}

/**
 * GameScene
 * - Contains the main game logic:
 *   - Loads assets
 *   - Creates the player, trash and obstacles groups
 *   - Handles movement, collision, score and lives.
 *   - Transitions to GameOverScene when lives run out.
 */
class GameScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private trash!: Phaser.Physics.Arcade.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private score: number = 0;
  private lives: number = 3;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private gameSpeed: number = 3;
  private backgroundMusic!: Phaser.Sound.BaseSound;
  private analyser!: AnalyserNode;
  private audioData!: Uint8Array;
  private visualizer!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {

    // Temporary assets; replace these with your final assets later.
    this.load.image('fish', 'assets/sprites/fish.png');
    this.load.image('trash', 'assets/sprites/star.png');
    this.load.image('obstacle', 'assets/sprites/rock.png');
    
    // Add background music
    this.load.audio('background', 'assets/sounds/welcome_to_cvche.mp3');
  }

  create() {
    const { width, height } = this.scale;

    // Create the player sprite (Fluffy) and enable world bounds & bounce.
    this.player = this.physics.add.sprite(100, height / 2, 'fish');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);

    // Create groups for trash (collectibles) and obstacles.
    this.trash = this.physics.add.group();
    this.obstacles = this.physics.add.group();

    // Display the score and lives.
    this.scoreText = this.add.text(16, 16, 'Score: 0', {
      fontSize: '32px',
      color: '#fff',
    });
    this.livesText = this.add.text(16, 50, 'Lives: 3', {
      fontSize: '32px',
      color: '#fff',
    });

    // Initialize audio
    this.backgroundMusic = this.sound.add('background', { loop: true });
    
    // Set up audio analysis
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    // Connect to Phaser's own audio context
    const audioSource = (this.game.sound as any).context.destination;
    const source = audioContext.createMediaStreamSource(audioSource.stream);
    source.connect(this.analyser);
    this.analyser.connect(audioContext.destination);
    this.audioData = new Uint8Array(this.analyser.frequencyBinCount);

    this.backgroundMusic.play();

    // Create visualizer
    this.visualizer = this.add.graphics();

    // Increase game difficulty over time
    this.time.addEvent({
      delay: 10000, // Every 10 seconds
      callback: () => {
        this.gameSpeed = Math.min(this.gameSpeed + 0.5, 8); // Max speed cap
      },
      loop: true
    });

    // Generate initial trash and obstacles.
    this.generateTrash();
    this.generateObstacles();

    // Set up collision handlers.
    this.physics.add.overlap(
      this.player,
      this.trash,
      this.collectTrash,
      undefined,
      this
    );
    this.physics.add.collider(
      this.player,
      this.obstacles,
      this.hitObstacle,
      undefined,
      this
    );
  }

  update() {
    // Handle player movement with smoother controls
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors?.up?.isDown) {
      this.player.setVelocityY(-300);
    } else if (cursors?.down?.isDown) {
      this.player.setVelocityY(300);
    } else {
      // Add smooth deceleration
      this.player.setVelocityY(this.player.body.velocity.y * 0.9);
    }

    // Update audio visualization
    this.analyser.getByteFrequencyData(this.audioData);
    this.visualizer.clear();
    this.visualizer.lineStyle(2, 0x00ff00);
    
    // Draw audio visualization at the bottom of the screen
    const width = this.scale.width;
    const height = this.scale.height;
    this.visualizer.beginPath();
    for (let i = 0; i < this.audioData.length; i++) {
      const x = (i / this.audioData.length) * width;
      const y = height - (this.audioData[i] / 256) * 100;
      if (i === 0) {
        this.visualizer.moveTo(x, y);
      } else {
        this.visualizer.lineTo(x, y);
      }
    }
    this.visualizer.strokePath();

    // Safely iterate through trash and obstacles
    this.trash.children.each((child: Phaser.GameObjects.GameObject) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite && sprite.active) {
        sprite.x -= this.gameSpeed;
        if (sprite.x < -50) sprite.destroy();
      }
    });

    this.obstacles.children.each((child: Phaser.GameObjects.GameObject) => {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      if (sprite && sprite.active) {
        sprite.x -= this.gameSpeed;
        if (sprite.x < -50) sprite.destroy();
      }
    });

    // Increase spawn rates based on game speed
    if (Phaser.Math.Between(0, 100) < 2 * (this.gameSpeed / 3)) {
      this.generateTrash();
    }
    if (Phaser.Math.Between(0, 200) < 1 * (this.gameSpeed / 3)) {
      this.generateObstacles();
    }

    // Transition to GameOverScene when lives run out.
    if (this.lives <= 0) {
      this.scene.start('GameOverScene', { score: this.score });
    }
  }

  // Called when the player collects trash.
  collectTrash(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body,
    trashItem: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body
  ) {
    (trashItem as Phaser.Physics.Arcade.Sprite).destroy();
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }

  // Called when the player hits an obstacle.
  hitObstacle(
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body,
    _obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile | Phaser.Physics.Arcade.Body
  ) {
    const sprite = player as Phaser.Physics.Arcade.Sprite;
    // Flash red to indicate a hit.
    sprite.setTint(0xff0000);
    this.time.addEvent({
      delay: 200,
      callback: () => sprite.clearTint(),
    });
    this.lives -= 1;
    this.livesText.setText('Lives: ' + this.lives);
  }

  // Generate a trash item at a random vertical position.
  generateTrash() {
    const y = Phaser.Math.Between(50, this.scale.height - 50);
    const x = this.scale.width + 50;
    this.trash.create(x, y, 'trash');
  }

  // Generate an obstacle at a random vertical position.
  generateObstacles() {
    const y = Phaser.Math.Between(50, this.scale.height - 50);
    const x = this.scale.width + 50;
    this.obstacles.create(x, y, 'obstacle');
  }
}

/**
 * GameOverScene
 * - Displays the final score and a message.
 * - Waits for the player to press SPACE, then restarts the game.
 */
class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score: number }) {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2 - 50, 'Game Over', {
        fontSize: '48px',
        color: '#fff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2, 'Final Score: ' + data.score, {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 50, 'Press SPACE to Restart', {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5);

    // Listen for SPACE key to restart the game.
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}

/**
 * PhaserGame Component
 * - Initializes the Phaser game with the three scenes:
 *   MenuScene, GameScene, and GameOverScene.
 * - Cleans up the game instance when the component unmounts.
 */
const PhaserGame: React.FC = () => {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'phaser-container',
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      // The order of scenes matters: start with the menu.
      scene: [MenuScene, GameScene, GameOverScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div id="phaser-container" style={{ width: '100%', height: '100%' }} />;
};

export default PhaserGame;
