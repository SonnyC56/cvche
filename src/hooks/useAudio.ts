// Update to the useAudio.ts hook to improve audio handling

import { useRef, useEffect } from 'react';
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
    const setupAudio = () => {
      try {
        // Create a new audio context if one doesn't exist
        const audioCtx = audioEl._audioCtx || new AudioContextClass();
        audioEl._audioCtx = audioCtx;
        
        // Create analyser
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        // Create or reuse the media element source
        let source: MediaElementAudioSourceNode;
        if (!audioEl._mediaElementSource) {
          source = audioCtx.createMediaElementSource(audioEl);
          audioEl._mediaElementSource = source;
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
        }
        
        // Ensure context is running
        if (audioCtx.state !== 'running') {
          audioCtx.resume();
        }
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    };
    
    // Set up event listeners to handle audio context state
    const handlePlay = () => {
      setupAudio();
    };
    
    audioEl.addEventListener('play', handlePlay);
    
    // Also try to set up initially
    setupAudio();
    
    const resumeAudioCtx = () => {
      if (audioEl._audioCtx && audioEl._audioCtx.state !== 'running') {
        audioEl._audioCtx.resume();
      }
    };
    
    document.body.addEventListener('touchstart', resumeAudioCtx);
    document.body.addEventListener('click', resumeAudioCtx);
    
    return () => {
      audioEl.removeEventListener('play', handlePlay);
      document.body.removeEventListener('touchstart', resumeAudioCtx);
      document.body.removeEventListener('click', resumeAudioCtx);
    };
  }, [gameStarted, analyserRef, dataArrayRef]);

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
    } else {
      audioRef.current.play().catch(error => {
        if (error.name === 'AbortError') return; // Ignore abort errors.
        console.error("Error playing audio:", error);
        // Continue with game even if audio fails.
      });
    }
  }, [isPaused, gameStarted]);
  

  // Helper function to get average amplitude
  const getAverageAmplitude = (): number => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!analyser || !dataArray) return 0;
    
    try {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      
      return sum / dataArray.length;
    } catch (error) {
      console.error("Error getting amplitude:", error);
      return 0;
    }
  };

  // Beat detection helper
  const detectBeat = (amplitude: number, lastBeatTimeRef: React.MutableRefObject<number>): boolean => {
    const now = Date.now();
    const beatThreshold = 30;
    
    if (amplitude > beatThreshold && now - lastBeatTimeRef.current > 500) {
      lastBeatTimeRef.current = now;
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