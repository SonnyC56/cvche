/**
 * Global game configuration
 * This file contains settings that can be changed to configure the game behavior
 */

export const gameConfig = {
  /**
   * Level availability settings
   * Set to false to disable a level completely
   */
  levels: {
    level1: true,
    level2: true,
    level3: true  // Level 3 is toggled off as requested
  },

  /**
   * Asset loading settings
   */
  assetLoading: {
    // Ensure all assets are loaded before starting the game
    preloadAllAssets: true,
    
    // Timeout for asset loading in milliseconds
    loadingTimeout: 30000 // 30 seconds
  }
};