// src/hooks/useAudio.ts
import { useRef, useEffect, useState } from 'react';
import { ExtendedHTMLAudioElement } from '../types';
import { setupSilentAudioForWebAudio, startSilentAudio } from '../utils/silentAudio';

// iOS detection helper
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Get iOS version
const getIOSVersion = (): number | null => {
  if (!isIOS()) return null;
  const match = navigator.userAgent.match(/OS (\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

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
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null); // Fallback audio for muted iOS
  const silentAudioRef = useRef<HTMLAudioElement | null>(null); // Silent audio to force media channel
  const fallbackTimerRef = useRef<number | null>(null);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false); // Renamed for clarity
  const [isMainSongBuffered, setIsMainSongBuffered] = useState(false); // New state for song buffering
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false); // Track if user interaction needed
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track user interaction
  const [usingFallbackAudio, setUsingFallbackAudio] = useState(false); // Track if using fallback
  const audioContextRef = useRef<AudioContext | null>(null); // Store AudioContext reference

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
      setIsAudioContextReady(false); // Reset when game stops
      setIsMainSongBuffered(false); // Reset when game stops
      setNeedsUserInteraction(false);
      setHasUserInteracted(false);
      // Clean up AudioContext when game stops
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }
    
    console.log(`[Audio] Setting up audio for level ${currentLevelId}`);
    const iosVersion = getIOSVersion();
    if (isIOS()) {
      console.log(`[Audio] iOS detected, version: ${iosVersion || 'unknown'}`);
    }
    
    setIsAudioContextReady(false); // Reset context ready state on level change/game start
    setIsMainSongBuffered(false); // Reset song buffered state on level change/game start
    
    const audioEl = audioRef.current as ExtendedHTMLAudioElement;
    if (!audioEl) return;
    
    // Create silent audio element to force WebAudio onto media channel (iOS mute switch workaround)
    if (!silentAudioRef.current && isIOS()) {
      silentAudioRef.current = setupSilentAudioForWebAudio();
      if (silentAudioRef.current) {
        console.log('[Audio] Silent audio element created for iOS mute switch workaround');
      }
    }
    
    // Create fallback audio element for iOS mute switch workaround
    if (!fallbackAudioRef.current && isIOS()) {
      fallbackAudioRef.current = new Audio();
      fallbackAudioRef.current.setAttribute('playsinline', 'true');
      fallbackAudioRef.current.setAttribute('webkit-playsinline', 'true');
      // Don't connect to Web Audio API - let it play directly
    }

    const handleCanPlayThrough = () => {
      console.log(`[Audio] Main song can play through for level ${currentLevelId}.`);
      setIsMainSongBuffered(true);
      audioEl.removeEventListener('canplaythrough', handleCanPlayThrough);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      audioEl.removeEventListener('error', handleAudioError);
    };

    const handleAudioError = (e: Event) => {
      console.error(`[Audio] Error loading main song for level ${currentLevelId}:`, e);
      // Consider setting setIsMainSongBuffered(true) or another state to avoid getting stuck,
      // or implement a timeout. For now, it might prevent playback.
      audioEl.removeEventListener('canplaythrough', handleCanPlayThrough);
      audioEl.removeEventListener('error', handleAudioError);
    };

    audioEl.addEventListener('canplaythrough', handleCanPlayThrough);
    audioEl.addEventListener('error', handleAudioError);
    
    // Use a type assertion that works with the WebkitAudioContext
    const AudioContextClass = window.AudioContext || ((window as unknown) as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
    
    // Setup audio - but defer AudioContext creation on iOS until user interaction
    const setupAudio = async () => {
      try {
        // On iOS, check if we need user interaction first
        if (isIOS() && !hasUserInteracted && !audioContextRef.current) {
          console.log("[Audio] iOS detected - waiting for user interaction before creating AudioContext");
          setNeedsUserInteraction(true);
          
          // Set up fallback audio that plays directly (bypasses mute switch)
          if (fallbackAudioRef.current && audioEl.src) {
            fallbackAudioRef.current.src = audioEl.src;
            fallbackAudioRef.current.volume = 0.7; // Slightly lower volume
            fallbackAudioRef.current.load();
          }
          return;
        }
        
        // Create or reuse AudioContext
        let audioCtx = audioContextRef.current || audioEl._audioCtx;
        if (!audioCtx) {
          audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          audioEl._audioCtx = audioCtx;
          console.log("[Audio] Created new AudioContext");
          
          // On iOS, start silent audio to force WebAudio onto media channel
          if (isIOS() && silentAudioRef.current) {
            startSilentAudio(silentAudioRef.current);
          }
        }
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
          
          // iOS-specific: sometimes needs multiple resume attempts
          let attempts = 0;
          const maxAttempts = isIOS() ? 3 : 1;
          
          while ((audioCtx.state === 'suspended' || audioCtx.state === 'closed') && attempts < maxAttempts) {
            try {
              await audioCtx.resume();
              attempts++;
              console.log(`AudioContext resume attempt ${attempts}. New state: ${audioCtx.state}`);
              
              // On iOS, sometimes needs a small delay between attempts
              if (isIOS() && (audioCtx.state === 'suspended' || audioCtx.state === 'closed') && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (e) {
              console.warn(`AudioContext resume attempt ${attempts} failed:`, e);
            }
          }
        } else {
          console.log("AudioContext state is already 'running'.");
        }

        // Check state again after attempting resume
        if (audioCtx.state === 'running') {
          setIsAudioContextReady(true); // Set context ready state only AFTER successful resume
          setNeedsUserInteraction(false); // Clear the need for interaction
          console.log("[Audio] AudioContext setup complete, isAudioContextReady set to true.");
        } else {
          console.warn(`[Audio] AudioContext did not resume successfully. State: ${audioCtx.state}. Audio might not play.`);
          setIsAudioContextReady(false); // Explicitly false if resume failed
          
          // On iOS, this might mean we need user interaction or mute switch is on
          if (isIOS()) {
            if (!hasUserInteracted) {
              setNeedsUserInteraction(true);
              console.log("[Audio] iOS requires user interaction to start audio");
            } else {
              // User has interacted but audio still won't play - likely mute switch
              console.log("[Audio] iOS mute switch may be on - enabling fallback audio");
              setUsingFallbackAudio(true);
              
              // Set up fallback audio source
              if (fallbackAudioRef.current && audioEl.src) {
                fallbackAudioRef.current.src = audioEl.src;
                fallbackAudioRef.current.currentTime = audioEl.currentTime;
                fallbackAudioRef.current.volume = 0.7;
              }
            }
          }
          
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
        console.error("[Audio] Error setting up audio:", error);
        setIsAudioContextReady(false); // Ensure it's false on error
        startFallbackBeatGeneration();
      }
    };

    // Call setupAudio directly instead of waiting for 'play' event
    setupAudio();
    
    // Enhanced user interaction handler that also triggers initial setup on iOS
    const handleUserInteraction = async () => {
      console.log("[Audio] User interaction detected");
      setHasUserInteracted(true);
      
      // If we were waiting for user interaction, set up audio now
      if (needsUserInteraction && !audioContextRef.current) {
        await setupAudio();
      }
      
      // Also try to resume if context exists but isn't running
      if (audioContextRef.current && audioContextRef.current.state !== 'running') {
        try {
          await audioContextRef.current.resume();
          console.log("[Audio] AudioContext resumed from user interaction");
          
          // Test if audio actually works by creating a silent oscillator
          const testOscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          gainNode.gain.value = 0; // Silent
          testOscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          testOscillator.start();
          testOscillator.stop(audioContextRef.current.currentTime + 0.001);
          
          // If we get here without errors, audio is working
          setIsAudioContextReady(true);
          setNeedsUserInteraction(false);
          setUsingFallbackAudio(false);
        } catch (error) {
          console.error("[Audio] Error resuming AudioContext:", error);
          // AudioContext failed even with user interaction - use fallback
          if (isIOS()) {
            console.log("[Audio] iOS mute switch detected - switching to fallback audio");
            setUsingFallbackAudio(true);
            setNeedsUserInteraction(false); // We have interaction, just need fallback
            
            // Set up fallback audio
            if (fallbackAudioRef.current && audioEl.src) {
              fallbackAudioRef.current.src = audioEl.src;
              fallbackAudioRef.current.currentTime = audioEl.currentTime || 0;
              fallbackAudioRef.current.volume = 0.7;
              try {
                await fallbackAudioRef.current.play();
                console.log("[Audio] Fallback audio started playing");
              } catch (e) {
                console.error("[Audio] Fallback audio play failed:", e);
              }
            }
          }
        }
      }
    };
    
    // Add multiple interaction listeners - remove 'once' to handle iOS quirks
    document.body.addEventListener('touchstart', handleUserInteraction);
    document.body.addEventListener('touchend', handleUserInteraction);
    document.body.addEventListener('click', handleUserInteraction);
    document.body.addEventListener('keydown', handleUserInteraction);
    
    // iOS-specific: Also listen on the audio element itself
    if (isIOS() && audioEl) {
      audioEl.addEventListener('play', handleUserInteraction);
    }
    
    return () => {
      document.body.removeEventListener('touchstart', handleUserInteraction);
      document.body.removeEventListener('touchend', handleUserInteraction);
      document.body.removeEventListener('click', handleUserInteraction);
      document.body.removeEventListener('keydown', handleUserInteraction);
      
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      
      // Cleanup event listeners for audio element
      if (audioEl) {
        audioEl.removeEventListener('canplaythrough', handleCanPlayThrough);
        audioEl.removeEventListener('error', handleAudioError);
        if (isIOS()) {
          audioEl.removeEventListener('play', handleUserInteraction);
        }
      }
    };
  }, [gameStarted, currentLevelId, analyserRef, dataArrayRef, lastBeatTimeRef, hasUserInteracted, needsUserInteraction]); // Added refs to dependency array as per ESLint suggestion if they were used inside callbacks not defined in effect
  
  useEffect(() => {
    if (!gameStarted) return;
    const updateProgress = () => {
      // Use fallback audio for progress if that's what we're playing
      const audioSource = (isIOS() && usingFallbackAudio && fallbackAudioRef.current) ? fallbackAudioRef.current : audioRef.current;
      
      if (audioSource) {
        const curTime = audioSource.currentTime;
        const dur = audioSource.duration;
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
  }, [gameStarted, setAudioProgress, setCurrentTime, setDuration, setLevelEnded, gameLoopRef, animationFrameIdRef, usingFallbackAudio]);

  // Effect to handle audio play/pause based on game state and loading status
  useEffect(() => {
    if (!audioRef.current || !gameStarted) return;

    const shouldUseFallback = isIOS() && usingFallbackAudio && fallbackAudioRef.current;
    const audioToControl = shouldUseFallback ? fallbackAudioRef.current! : audioRef.current;

    // Only attempt to play if not paused AND not currently loading assets AND audio context is ready AND main song is buffered
    // On iOS, also check if we need user interaction
    if (isPaused || isLoadingAssets || (!isAudioContextReady && !usingFallbackAudio) || !isMainSongBuffered || (isIOS() && needsUserInteraction)) {
      console.log(`[Audio] Pausing/deferring play (isPaused: ${isPaused}, isLoadingAssets: ${isLoadingAssets}, isAudioContextReady: ${isAudioContextReady}, isMainSongBuffered: ${isMainSongBuffered}, needsUserInteraction: ${needsUserInteraction}, usingFallback: ${usingFallbackAudio})`);
      audioToControl.pause();
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    } else {
      // Attempt to play audio
      console.log(`[Audio] Attempting to play audio (Conditions met: !paused, !loading, contextReady/fallback, songBuffered, using ${shouldUseFallback ? 'fallback' : 'primary'} audio)`);
      
      // Set properties on the audio element we're using
      audioToControl.volume = shouldUseFallback ? 0.7 : 1.0; // Slightly lower volume for fallback
      audioToControl.muted = false;
      
      // iOS-specific attributes
      if (isIOS()) {
        audioToControl.setAttribute('playsinline', 'true');
        audioToControl.setAttribute('webkit-playsinline', 'true');
        
        // For older iOS versions
        const iosVersion = getIOSVersion();
        if (iosVersion && iosVersion < 14) {
          audioToControl.setAttribute('x5-playsinline', 'true');
        }
      }
      
      // Sync fallback audio with main audio if using fallback
      if (shouldUseFallback && audioRef.current) {
        fallbackAudioRef.current!.currentTime = audioRef.current.currentTime || 0;
      }
      
      audioToControl.play().catch(error => {
        if (error.name === 'AbortError') return; // Ignore expected AbortError
        console.error("[Audio] Error playing audio:", error);
        
        // iOS-specific error handling
        if (isIOS() && error.name === 'NotAllowedError') {
          if (!hasUserInteracted) {
            console.log("[Audio] iOS requires user interaction - setting flag");
            setNeedsUserInteraction(true);
          } else if (!usingFallbackAudio) {
            // We have user interaction but still can't play - try fallback
            console.log("[Audio] iOS mute switch detected - switching to fallback audio");
            setUsingFallbackAudio(true);
          }
        }
        // If playback fails and no audio data is detected, start fallback beat generation
        // This might be redundant if setupAudio already handles fallback.
        if (!fallbackTimerRef.current && analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
              sum += dataArrayRef.current[i];
            }
            if (sum === 0) {
              console.log("[Audio] Playback error led to fallback beat generation due to no audio data.");
              startFallbackBeatGeneration();
            }
        }
      });
    }
  }, [isPaused, gameStarted, isLoadingAssets, isAudioContextReady, isMainSongBuffered, needsUserInteraction, usingFallbackAudio, hasUserInteracted, analyserRef, dataArrayRef]); // Added dependencies

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
    detectBeat,
    isMainSongBuffered, // Expose this state
    isAudioContextReady, // Expose this state for clarity if needed elsewhere
    needsUserInteraction, // Expose for UI to show interaction prompt
    fallbackAudioRef, // Expose fallback audio ref
    usingFallbackAudio // Expose fallback status
  };
};
