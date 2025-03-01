import { useRef, useEffect } from 'react';
import { InputState } from '../types';

export const useInputHandlers = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  // Input state
  const inputRef = useRef<InputState>({
    isTouching: false,
    touchY: window.innerHeight / 2,
    isDesktop: false,
  });

  // Set up input event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Determine if device has coarse pointing (touch) or fine pointing (mouse)
    const hasCoarse = window.matchMedia('(pointer: coarse)').matches;
    inputRef.current.isDesktop = !hasCoarse;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (inputRef.current.isDesktop) {
        inputRef.current.touchY = e.clientY;
      } else if (inputRef.current.isTouching) {
        inputRef.current.touchY = e.clientY;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (inputRef.current.isTouching) {
        inputRef.current.touchY = e.touches[0].clientY;
      }
      e.preventDefault();
    };
    
    const handleTouchStart = (e: TouchEvent) => {
      inputRef.current.isTouching = true;
      inputRef.current.touchY = e.touches[0].clientY;
      e.preventDefault();
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      inputRef.current.isTouching = false;
      e.preventDefault();
    };
    
    // Add different event listeners based on device capabilities
    if (!hasCoarse) {
      // Desktop/mouse events
      canvas.addEventListener('mousemove', handleMouseMove);
    } else {
      // Mobile/touch events
      canvas.addEventListener('mousedown', () => inputRef.current.isTouching = true);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', () => inputRef.current.isTouching = false);
      canvas.addEventListener('touchstart', handleTouchStart);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
    }
    
    // Clean up event listeners
    return () => {
      if (!hasCoarse) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      } else {
        canvas.removeEventListener('mousedown', () => inputRef.current.isTouching = true);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', () => inputRef.current.isTouching = false);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [canvasRef]);

  // Handle visibility change to pause game when tab is unfocused
  const setupVisibilityHandler = (isPaused: boolean, gameStarted: boolean, togglePause: () => void) => {
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.hidden && !isPaused && gameStarted) {
          togglePause();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [isPaused, gameStarted, togglePause]);
  };

  return {
    inputRef,
    setupVisibilityHandler
  };
};