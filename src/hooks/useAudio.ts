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
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
    
    const audioCtx = audioEl._audioCtx || new AudioContextClass();
    audioEl._audioCtx = audioCtx;
    
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    
    let source: MediaElementAudioSourceNode;
    if (!audioEl._mediaElementSource) {
      source = audioCtx.createMediaElementSource(audioEl);
      audioEl._mediaElementSource = source;
    } else {
      source = audioEl._mediaElementSource;
    }
    
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    const resumeAudioCtx = () => {
      if (audioCtx.state !== 'running') audioCtx.resume();
    };
    
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    document.body.addEventListener('click', resumeAudioCtx, { once: true });
    
    return () => {
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
      audioRef.current.play().catch(console.error);
    }
  }, [isPaused, gameStarted]);

  // Helper function to get average amplitude
  const getAverageAmplitude = (): number => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    if (!analyser || !dataArray) return 0;
    
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    
    return sum / dataArray.length;
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