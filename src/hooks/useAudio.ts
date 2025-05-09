// src/hooks/useAudio.ts
import { useRef, useEffect, useState } from 'react'; // Import useState
import { ExtendedHTMLAudioElement } from '../types';

export const useAudio = (
  gameStarted: boolean,
  isPaused: boolean,
  isLoadingAssets: boolean,
  setAudioProgress: (progress: number) => void,
  setCurrentTime: (time: number) => void,
  setDuration: (duration: number) => void,
  setLevelEnded: (ended: boolean) => void,
  gameLoopRef: React.MutableRefObject<boolean>,
  animationFrameIdRef: React.MutableRefObject<number | null>,
  analyserRef: React.MutableRefObject<AnalyserNode | null>,
  dataArrayRef: React.MutableRefObject<Uint8Array | null>,
  lastBeatTimeRef: React.MutableRefObject<number>,
  currentLevelId: number // <-- new parameter to trigger re-setup when level changes
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false); // Add state for audio readiness

  // When no audio data is detected, update the last beat time every 500ms.
  const startFallbackBeatGeneration = () => {
    if (fallbackTimerRef.current) return; // Don't start if already running
    const BPM = 120; // Beats per minute
    const interval = 60000 / BPM; 
   // console.log(`[DEBUG] Starting fallback beat generator at ${BPM} BPM (${interval}ms)`);
    fallbackTimerRef.current = window.setInterval(() => {
      lastBeatTimeRef.current = Date.now();
    //  console.log('[DEBUG] Fallback beat generated');
    }, interval);
  };
  // Effect to set up audio context and analyser
  useEffect(() => {
    // This effect should only run when the game starts or the level changes,
    // not when the pause state changes.
    if (!gameStarted) {
      setIsAudioReady(false); // Reset when game stops
      return;
    }
    
    console.log(`Setting up audio context for level ${currentLevelId}`);
    setIsAudioReady(false); // Reset ready state on level change/game start
    
    const audioEl = audioRef.current as ExtendedHTMLAudioElement;
    if (!audioEl) return;
    
    // Use a type assertion that works with the WebkitAudioContext
    const AudioContextClass = window.AudioContext || ((window as unknown) as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
    
    // Setup audio directly when the effect runs, instead of waiting for 'play' event
    const setupAudio = async () => {
      try {
        const audioCtx = audioEl._audioCtx || new AudioContextClass();
        audioEl._audioCtx = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        if (!audioEl._mediaElementSource) {
          const source = audioCtx.createMediaElementSource(audioEl);
          audioEl._mediaElementSource = source;
        } else {
          audioEl._mediaElementSource.disconnect();
        }
        audioEl._mediaElementSource.connect(analyser);
        analyser.connect(audioCtx.destination);

        if (audioCtx.state !== 'running') {
          console.log("AudioContext state is not 'running', attempting to resume...");
          await audioCtx.resume(); // Await completion
          console.log(`AudioContext resumed. New state: ${audioCtx.state}`);
        } else {
          console.log("AudioContext state is already 'running'.");
        }

        // Check state again after attempting resume
        if (audioCtx.state === 'running') {
          setIsAudioReady(true); // Set ready state only AFTER successful resume
          console.log("Audio setup complete, isAudioReady set to true.");
        } else {
          console.warn(`AudioContext did not resume successfully. State: ${audioCtx.state}. Audio might not play.`);
          setIsAudioReady(false); // Explicitly false if resume failed
          startFallbackBeatGeneration(); // Start fallback if context isn't running
        }
        
        setTimeout(() => {
          if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
              sum += dataArrayRef.current[i];
            }
            if (sum === 0) {
              startFallbackBeatGeneration();
            }
          }
        }, 1000);
      } catch (error) {
        console.error("Error setting up audio:", error);
        setIsAudioReady(false); // Ensure it's false on error
        startFallbackBeatGeneration();
      }
    };

    // Call setupAudio directly instead of waiting for 'play' event
    setupAudio();
    
    // Keep the user interaction listeners to ensure AudioContext can be resumed
    const resumeAudioCtx = async () => {
      if (audioEl._audioCtx && audioEl._audioCtx.state !== 'running') {
        try {
          await audioEl._audioCtx.resume();
          console.log("AudioContext resumed from user interaction");
        } catch (error) {
          console.error("Error resuming AudioContext:", error);
        }
      }
    };
    
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    document.body.addEventListener('click', resumeAudioCtx, { once: true });
    document.body.addEventListener('keydown', resumeAudioCtx, { once: true });
    
    return () => {
      document.body.removeEventListener('touchstart', resumeAudioCtx);
      document.body.removeEventListener('click', resumeAudioCtx);
      document.body.removeEventListener('keydown', resumeAudioCtx);
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [gameStarted, currentLevelId]); // Removed isPaused from dependencies
  
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

  // Effect to handle audio play/pause based on game state and loading status
  useEffect(() => {
    if (!audioRef.current || !gameStarted) return;

    // Only attempt to play if not paused AND not currently loading assets AND audio is ready
    if (isPaused || isLoadingAssets || !isAudioReady) {
      console.log(`Pausing audio (isPaused: ${isPaused}, isLoadingAssets: ${isLoadingAssets}, isAudioReady: ${isAudioReady})`);
      audioRef.current.pause();
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    } else {
      // Attempt to play audio
      console.log("Attempting to play audio (Conditions met: !paused, !loading, ready)");
      audioRef.current.play().catch(error => {
        if (error.name === 'AbortError') return; // Ignore expected AbortError
        console.error("Error playing audio:", error);
        // If playback fails and no audio data is detected, start fallback beat generation
        if (!fallbackTimerRef.current) {
           // Note: Fallback beat generation is handled by the setupAudio effect
           // This catch block primarily logs errors and could potentially
           // trigger fallback if setupAudio didn't for some reason, but
           // the main trigger is in setupAudio based on initial data check.
        }
      });
    }
  }, [isPaused, gameStarted, isLoadingAssets, isAudioReady]); // Added isAudioReady to dependencies

  const getAverageAmplitude = (): number => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) {
    //  console.log('[DEBUG] getAverageAmplitude: Analyzer or dataArray not available');
      return 0;
    }
    try {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      let count = 0;
      const rangeEnd = Math.floor(dataArray.length / 4);
      for (let i = 0; i < rangeEnd; i++) {
        sum += dataArray[i];
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      if (Math.random() < 0.05) {
    //    console.log(`[DEBUG] Current amplitude: ${avg.toFixed(2)}, from ${count} frequency bins`);
      }
      return avg;
    } catch (error) {
      console.error("[DEBUG] Error getting amplitude:", error); // Log the error
      return 0;
    }
  };

  const detectBeat = (amplitude: number, lastBeatTimeRefParam: React.MutableRefObject<number>): boolean => {
    const now = Date.now();
    const beatThreshold = 10;
    const minTimeBetweenBeats = 300;
    const forceBeatInterval = 800;
    const timeSinceLastBeat = now - lastBeatTimeRefParam.current;
    if (timeSinceLastBeat > forceBeatInterval) {
    //  console.log('[DEBUG] Generating fallback beat after timeout');
      lastBeatTimeRefParam.current = now;
      return true;
    }
    if (amplitude > beatThreshold && timeSinceLastBeat > minTimeBetweenBeats) {
      lastBeatTimeRefParam.current = now;
    //  console.log('[DEBUG] 🎵 Beat detected from audio!');
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
