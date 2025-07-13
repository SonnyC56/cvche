// iOS Mute Switch Audio Fallback Hook
// This hook provides a workaround for iOS devices with physical mute switches
// by playing audio directly through an HTML audio element without Web Audio API

import { useRef, useEffect } from 'react';

export const useIOSAudioFallback = () => {
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialized = useRef(false);

  // Initialize fallback audio element
  useEffect(() => {
    if (!isInitialized.current) {
      const audio = new Audio();
      
      // Critical iOS attributes
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.preload = 'auto';
      
      // Start with low volume to avoid jarring audio
      audio.volume = 0.7;
      
      fallbackAudioRef.current = audio;
      isInitialized.current = true;
    }

    return () => {
      if (fallbackAudioRef.current) {
        fallbackAudioRef.current.pause();
        fallbackAudioRef.current.src = '';
      }
    };
  }, []);

  // Sync two audio elements (for switching between primary and fallback)
  const syncAudioElements = (primary: HTMLAudioElement, fallback: HTMLAudioElement) => {
    // Sync current time
    if (Math.abs(primary.currentTime - fallback.currentTime) > 0.1) {
      fallback.currentTime = primary.currentTime;
    }
    
    // Sync playback rate if needed
    if (primary.playbackRate !== fallback.playbackRate) {
      fallback.playbackRate = primary.playbackRate;
    }
  };

  // Test if audio will play (for detecting mute switch)
  const testAudioPlayback = async (): Promise<boolean> => {
    try {
      // Create a test audio context
      const testContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Try to create and play a silent oscillator
      const oscillator = testContext.createOscillator();
      const gainNode = testContext.createGain();
      gainNode.gain.value = 0; // Silent
      
      oscillator.connect(gainNode);
      gainNode.connect(testContext.destination);
      
      oscillator.start();
      oscillator.stop(testContext.currentTime + 0.01);
      
      // If context is running, audio should work
      const canPlay = testContext.state === 'running';
      
      // Clean up
      await testContext.close();
      
      return canPlay;
    } catch (e) {
      console.warn('[iOS Audio] Test playback failed:', e);
      return false;
    }
  };

  return {
    fallbackAudioRef,
    syncAudioElements,
    testAudioPlayback
  };
};