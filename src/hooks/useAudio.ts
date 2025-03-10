// src/hooks/useAudio.ts
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
  dataArrayRef: React.MutableRefObject<Uint8Array | null>,
  lastBeatTimeRef: React.MutableRefObject<number>,
  currentLevelId: number // <-- new parameter to trigger re-setup when level changes
) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

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
  useEffect(() => {
    if (!gameStarted) return;
    const audioEl = audioRef.current as ExtendedHTMLAudioElement;
    if (!audioEl) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.error("Web Audio API not supported.");
      return;
    }
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
      //    console.log('[DEBUG] Creating new media element source');
          const source = audioCtx.createMediaElementSource(audioEl);
          audioEl._mediaElementSource = source;
        } else {
        //  console.log('[DEBUG] Reusing existing media element source');
          audioEl._mediaElementSource.disconnect();
        }
        audioEl._mediaElementSource.connect(analyser);
        analyser.connect(audioCtx.destination);
  
        if (audioCtx.state !== 'running') {
       //   console.log('[DEBUG] Resuming AudioContext...');
          await audioCtx.resume();
          //console.log('[DEBUG] AudioContext state after resume:', audioCtx.state);
        }
      //  console.log('[DEBUG] Audio setup complete - Analyzer created with bufferLength:', bufferLength);
        setTimeout(() => {
          if (analyserRef.current && dataArrayRef.current) {
            analyserRef.current.getByteFrequencyData(dataArrayRef.current);
            let sum = 0;
            for (let i = 0; i < dataArrayRef.current.length; i++) {
              sum += dataArrayRef.current[i];
            }
          //  console.log('[DEBUG] Initial audio data test:', sum > 0 ? 'RECEIVING DATA ✅' : 'NO DATA ❌');
            if (sum === 0) {
          //    console.log('[DEBUG] No audio data detected, activating fallback beat generation');
              startFallbackBeatGeneration();
            }
          }
        }, 1000);
      } catch (error) {
        console.error("Error setting up audio:", error);
        startFallbackBeatGeneration();
      }
    };
  
    const handlePlay = () => {
      setupAudio();
    };
    audioEl.addEventListener('play', handlePlay);
    const resumeAudioCtx = async () => {
      if (audioEl._audioCtx && audioEl._audioCtx.state !== 'running') {
        try {
          await audioEl._audioCtx.resume();
     //     console.log('[DEBUG] AudioContext resumed from user interaction');
        } catch (error) {
       //   console.error('[DEBUG] Error resuming AudioContext:', error);
        }
      }
    };
    document.body.addEventListener('touchstart', resumeAudioCtx, { once: true });
    document.body.addEventListener('click', resumeAudioCtx, { once: true });
    document.body.addEventListener('keydown', resumeAudioCtx, { once: true });
    return () => {
      audioEl.removeEventListener('play', handlePlay);
      document.body.removeEventListener('touchstart', resumeAudioCtx);
      document.body.removeEventListener('click', resumeAudioCtx);
      document.body.removeEventListener('keydown', resumeAudioCtx);
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [gameStarted, currentLevelId, isPaused]);
  
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

  useEffect(() => {
    if (!audioRef.current || !gameStarted) return;
    if (isPaused) {
      audioRef.current.pause();
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    } else {
      audioRef.current.play().catch(error => {
        if (error.name === 'AbortError') return;
        console.error("Error playing audio:", error);
        if (!fallbackTimerRef.current) {
          const BPM = 120;
          const interval = 60000 / BPM;
          fallbackTimerRef.current = window.setInterval(() => {}, interval);
        }
      });
    }
  }, [isPaused, gameStarted]);

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
     // console.error("[DEBUG] Error getting amplitude:", error);
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
