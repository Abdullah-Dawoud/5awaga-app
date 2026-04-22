import { useEffect, useRef, useState, useCallback } from 'react';
import { playTypingSound } from '@/utils/audio';

interface UseTypingProps {
  targetText: string;
  onFinish: (wpm: number, accuracy: number) => void;
}

export function useTyping({ targetText, onFinish }: UseTypingProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100 });
  
  const cursorIndexRef = useRef(0);
  const typedRef = useRef<string[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const totalTypedRef = useRef(0);
  const correctTypedRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateStats = useCallback(() => {
    if (!startTimeRef.current) return { wpm: 0, accuracy: 100 };
    
    const timeElapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
    const wpm = timeElapsedMinutes > 0 
      ? Math.round((correctTypedRef.current / 5) / timeElapsedMinutes) 
      : 0;
    
    const accuracy = totalTypedRef.current > 0 
      ? Math.round((correctTypedRef.current / totalTypedRef.current) * 100) 
      : 100;
      
    return { wpm, accuracy };
  }, []);

  const updateStats = useCallback(() => {
    setStats(calculateStats());
  }, [calculateStats]);

  const resetTyping = useCallback(() => {
    setIsStarted(false);
    setStats({ wpm: 0, accuracy: 100 });
    cursorIndexRef.current = 0;
    typedRef.current = [];
    startTimeRef.current = null;
    totalTypedRef.current = 0;
    correctTypedRef.current = 0;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (containerRef.current) {
      const spans = containerRef.current.querySelectorAll('span.char');
      spans.forEach(span => {
        span.className = 'char transition-colors duration-75'; // Reset classes
      });
      updateCursorDOM();
    }
  }, []);

  const updateCursorDOM = () => {
    if (!containerRef.current) return;
    const spans = containerRef.current.querySelectorAll('span.char');
    const cursor = containerRef.current.querySelector('#cursor') as HTMLElement;
    
    if (cursor) {
      if (cursorIndexRef.current < spans.length) {
        const targetSpan = spans[cursorIndexRef.current] as HTMLElement;
        cursor.style.left = `${targetSpan.offsetLeft}px`;
        cursor.style.top = `${targetSpan.offsetTop}px`;
        cursor.style.height = `${targetSpan.offsetHeight}px`;
      } else if (spans.length > 0) {
        const lastSpan = spans[spans.length - 1] as HTMLElement;
        cursor.style.left = `${lastSpan.offsetLeft + lastSpan.offsetWidth}px`;
        cursor.style.top = `${lastSpan.offsetTop}px`;
        cursor.style.height = `${lastSpan.offsetHeight}px`;
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        resetTyping();
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey || targetText.length === 0) return;

      if (!isStarted && e.key.length === 1) {
        setIsStarted(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(updateStats, 1000);
      }

      const spans = containerRef.current?.querySelectorAll('span.char');
      if (!spans) return;

      if (e.key === 'Backspace') {
        if (cursorIndexRef.current > 0) {
          cursorIndexRef.current--;
          typedRef.current.pop();
          
          const span = spans[cursorIndexRef.current] as HTMLElement;
          span.className = 'char transition-colors duration-75'; // Reset class
          updateCursorDOM();
        }
      } else if (e.key.length === 1) {
        // Stop if we reached the end
        if (cursorIndexRef.current >= targetText.length) return;

        // "Do NOT allow skipping incorrect characters (user must fix mistakes before proceeding)"
        // If the last character typed was incorrect, block further typing until backspace is used.
        const typedLen = typedRef.current.length;
        if (typedLen > 0 && typedRef.current[typedLen - 1] !== targetText[typedLen - 1]) {
          return; // Block input
        }

        const expectedChar = targetText[cursorIndexRef.current];
        const typedChar = e.key;
        const isCorrect = expectedChar === typedChar;

        typedRef.current.push(typedChar);
        totalTypedRef.current++;

        const span = spans[cursorIndexRef.current] as HTMLElement;
        if (isCorrect) {
          span.className = 'char text-green-500 transition-colors duration-75';
          correctTypedRef.current++;
          playTypingSound(true);
        } else {
          span.className = 'char text-red-600 bg-red-500/20 rounded-sm transition-colors duration-75';
          playTypingSound(false);
        }

        cursorIndexRef.current++;
        updateCursorDOM();

        // Check for completion
        if (cursorIndexRef.current === targetText.length) {
          const hasErrors = typedRef.current.some((char, i) => char !== targetText[i]);
          if (!hasErrors) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            const finalStats = calculateStats();
            setStats(finalStats);
            onFinish(finalStats.wpm, finalStats.accuracy);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Initial cursor placement
    const timeout = setTimeout(updateCursorDOM, 50);
    window.addEventListener('resize', updateCursorDOM);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateCursorDOM);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(timeout);
    };
  }, [isStarted, targetText, onFinish, updateStats, resetTyping, calculateStats]);

  return {
    containerRef,
    isStarted,
    stats,
    resetTyping
  };
}
