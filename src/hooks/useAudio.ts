// Update to the useAudio.ts hook to improve audio handling

import { useRef, useEffect, useState } from 'react';
import { ExtendedHTMLAudioElement } from '../types';

export const useAudio = (
  gameStarted: boolean,
  isPaused: boolean,
  setAudioProgress: (progress: number) => void,
  setCurrentTime: (time: number) => void,
  setDuration: (duration: number) => void,
  setLevelEnded: (ended: boolean) => void,
  gameLoopRef: React.MutableRefObject<boolean>,
  animationFrameIdRef: React.MutableRefObject<number | null>,
  analyserRef: React.MutableRefObject<AnalyserNode | null>,
  dataArrayRef: React.MutableRefObject<Uint8Array | null>
) => {
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);

  // Set up AudioContext and analyser when the game starts
  useEffect(() => {
    if (!gameStarted) return;
    
    const audioEl = audioRef.current as ExtendedHTMLAudioElement;
    if (!audioEl) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
    
    // Function to ensure the audio context is created and connected
    const setupAudio = async () => {
      try {
        // Create a new audio context if one doesn't exist
        const audioCtx = audioEl._audioCtx || new AudioContextClass();
        audioEl._audioCtx = audioCtx;
        
        // Create analyser with increased sensitivity for beat detection
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024; // Larger FFT size for better frequency resolution
        analyser.smoothingTimeConstant = 0.2; // More responsive to sudden changes
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10; // Higher max for better sensitivity
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        // Create or reuse the media element source
        if (!audioEl._mediaElementSource) {
          console.log('[DEBUG] Creating new media element source');
          const source = audioCtx.createMediaElementSource(audioEl);
          audioEl._mediaElementSource = source;
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
        } else {
          console.log('[DEBUG] Reusing existing media element source');
        }
        
        // Ensure context is running
        if (audioCtx.state !== 'running') {
          console.log('[DEBUG] Resuming AudioContext...');
          await audioCtx.resume();
          console.log('[DEBUG] AudioContext state after resume:', audioCtx.state);
        }
        
        setIsAudioContextReady(true);
        console.log('[DEBUG] Audio setup complete - Analyzer created with bufferLength:', bufferLength);
        
        // Test the audio data
        setTimeout(() => {
          if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
              sum += dataArrayRef.current[i];
            }
            console.log('[DEBUG] Initial audio data test:', sum > 0 ? 'RECEIVING DATA ✅' : 'NO DATA ❌');
            
            // Set up fallback beat generation if no audio data is detected
            if (sum === 0) {
              console.log('[DEBUG] No audio data detected, activating fallback beat generation');
              startFallbackBeatGeneration();
            }
          }
        }, 1000);
        
      } catch (error) {
        console.error("Error setting up audio:", error);
        // If there's an error, activate the fallback immediately
        startFallbackBeatGeneration();
      }
    };

    // Create a fallback timer that generates beats at regular intervals
    const startFallbackBeatGeneration = () => {
      if (fallbackTimerRef.current) return; // Don't start if already running
      
      const BPM = 120; // Beats per minute
      const interval = 60000 / BPM; // Convert to ms between beats
      console.log(`[DEBUG] Starting fallback beat generator at ${BPM} BPM (${interval}ms)`);
      
      fallbackTimerRef.current = window.setInterval(() => {
        console.log('[DEBUG] Fallback beat generated');
        // We don't do anything here, as the beat detection function will generate beats automatically
        // when it detects that no audio data is coming through
      }, interval);
    };
    
    // Set up event listeners to handle audio context state
    const handlePlay = () => {
      setupAudio();
      console.log('[DEBUG] Audio playback started, setup called');
    };
    
    audioEl.addEventListener('play', handlePlay);
    
    // Also try to set up initially
    setupAudio();
    
    const resumeAudioCtx = async () => {
      if (audioEl._audioCtx && audioEl._audioCtx.state !== 'running') {
        try {
          await audioEl._audioCtx.resume();
          console.log('[DEBUG] AudioContext resumed from user interaction');
        } catch (error) {
          console.error('[DEBUG] Error resuming AudioContext:', error);
        }
      }
    };
    
    // Resume AudioContext on user interaction
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    document.body.addEventListener('click', resumeAudioCtx, { once: true });
    document.body.addEventListener('keydown', resumeAudioCtx, { once: true });
    
    // Force play may be needed on some browsers
    if (!isPaused && gameStarted) {
      audioEl.play().catch(e => {
        console.log('[DEBUG] Initial play failed:', e);
        // Activate fallback if autoplay fails
        startFallbackBeatGeneration();
      });
    }
    
    return () => {
      audioEl.removeEventListener('play', handlePlay);
      document.body.removeEventListener('touchstart', resumeAudioCtx);
      document.body.removeEventListener('click', resumeAudioCtx);
      document.body.removeEventListener('keydown', resumeAudioCtx);
      
      // Clear the fallback timer if it exists
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [gameStarted, analyserRef, dataArrayRef, isPaused]);

  // Update audio progress
  useEffect(() => {
    if (!gameStarted) return;
    
    const updateProgress = () => {
      if (audioRef.current) {
        const curTime = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        
        if (dur) {
          setAudioProgress((curTime / dur) * 100);
          setCurrentTime(curTime);
          setDuration(dur);
          
          // Check if song has ended
          if (dur - curTime < 0.1) {
            setLevelEnded(true);
            gameLoopRef.current = false;
            
            if (animationFrameIdRef.current) {
              cancelAnimationFrame(animationFrameIdRef.current);
              animationFrameIdRef.current = null;
            }
          }
        }
      }
    };
    
    const intervalId = setInterval(updateProgress, 100);
    return () => clearInterval(intervalId);
  }, [gameStarted, setAudioProgress, setCurrentTime, setDuration, setLevelEnded, gameLoopRef, animationFrameIdRef]);

  // Handle pause/resume
  useEffect(() => {
    if (!audioRef.current || !gameStarted) return;
    
    if (isPaused) {
      audioRef.current.pause();
      // Pause fallback beat generation too
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    } else {
      audioRef.current.play().catch(error => {
        if (error.name === 'AbortError') return; // Ignore abort errors.
        console.error("Error playing audio:", error);
        // Continue with game even if audio fails by using fallback
        if (!fallbackTimerRef.current) {
          const BPM = 120;
          const interval = 60000 / BPM;
          fallbackTimerRef.current = window.setInterval(() => {
            // Just keeping the timer running
          }, interval);
        }
      });
    }
  }, [isPaused, gameStarted]);
  
  // Helper function to get average amplitude
  const getAverageAmplitude = (): number => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!analyser || !dataArray) {
      console.log('[DEBUG] getAverageAmplitude: Analyzer or dataArray not available');
      return 0;
    }
    
    try {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      let count = 0;
      
      // Focus on lower frequencies for beat detection (first quarter of frequencies)
      const rangeEnd = Math.floor(dataArray.length / 4);
      for (let i = 0; i < rangeEnd; i++) {
        sum += dataArray[i];
        count++;
      }
      
      const avg = count > 0 ? sum / count : 0;
      
      // Log amplitude occasionally to avoid console spam
      if (Math.random() < 0.05) {
        console.log(`[DEBUG] Current amplitude: ${avg.toFixed(2)}, from ${count} frequency bins`);
      }
      
      return avg;
    } catch (error) {
      console.error("[DEBUG] Error getting amplitude:", error);
      return 0;
    }
  };

  // Beat detection helper with reliable fallback mechanism
  const detectBeat = (amplitude: number, lastBeatTimeRef: React.MutableRefObject<number>): boolean => {
    const now = Date.now();
    const beatThreshold = 10; // Lower threshold to catch more beats
    const minTimeBetweenBeats = 300; // Allow beats to be closer together (ms)
    const forceBeatInterval = 800; // Generate a beat at least every 800ms for low amplitude
    
    // Always generate a beat if it's been too long since the last one
    // This ensures gameplay continues even with audio issues
    const timeSinceLastBeat = now - lastBeatTimeRef.current;
    
    // Log beat detection data occasionally
    if (Math.random() < 0.1) {
      console.log(`[DEBUG] Beat detection - amplitude: ${amplitude.toFixed(2)}, threshold: ${beatThreshold}, timeSinceLastBeat: ${timeSinceLastBeat}ms`);
    }
    
    // Guaranteed fallback beat generation
    if (timeSinceLastBeat > forceBeatInterval) {
      console.log('[DEBUG] Generating fallback beat after timeout');
      lastBeatTimeRef.current = now;
      return true;
    }
    
    // Normal beat detection for when audio is working
    if (amplitude > beatThreshold && timeSinceLastBeat > minTimeBetweenBeats) {
      lastBeatTimeRef.current = now;
      console.log('[DEBUG] 🎵 Beat detected from audio!');
      return true;
    }
    
    return false;
  };

  return {
    audioRef,
    getAverageAmplitude,
    detectBeat
  };
};