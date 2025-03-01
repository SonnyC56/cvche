/**
 * Interpolates between two colors based on a factor (0-1)
 * Works with both hex colors (#RRGGBB) and rgba colors
 */
export const interpolateColor = (color1: string, color2: string, factor: number): string => {
    if (color1.startsWith('rgba') && color2.startsWith('rgba')) {
      const c1 = color1.match(/[\d.]+/g)?.map(Number) || [];
      const c2 = color2.match(/[\d.]+/g)?.map(Number) || [];
      return `rgba(${Math.round(c1[0] + (c2[0] - c1[0]) * factor)},${Math.round(c1[1] + (c2[1] - c1[1]) * factor)},${Math.round(c1[2] + (c2[2] - c1[2]) * factor)},${c1[3] + (c2[3] - c1[3]) * factor})`;
    }
  
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    const r1 = (c1 >> 16) & 255;
    const g1 = (c1 >> 8) & 255;
    const b1 = c1 & 255;
    const r2 = (c2 >> 16) & 255;
    const g2 = (c2 >> 8) & 255;
    const b2 = c2 & 255;
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };
  
  /**
   * Get particle color based on streak count
   */
  export const getParticleColorFromStreak = (streak: number): string => {
    if (streak >= 45) return '#FF00FF';
    if (streak >= 35) return '#FF0088';
    if (streak >= 25) return '#FF0000';
    if (streak >= 15) return '#FFA500';
    if (streak >= 5) return '#FFFF00';
    return '#FFD700';
  };
  
  /**
   * Get multiplier value based on streak count
   */
  export const getMultiplierFromStreak = (streak: number): number => {
    return Math.min(10, 1 + Math.floor(streak / 5));
  };
  
  /**
   * Get health bar color based on current health percentage
   */
  export const getHealthBarColor = (health: number): string => {
    const ratio = Math.max(0, Math.min(health / 100, 1));
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    return `rgb(${r}, ${g}, 0)`;
  };
  
  /**
   * Format time in minutes:seconds format
   */
  export const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };