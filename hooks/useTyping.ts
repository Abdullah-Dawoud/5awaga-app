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
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether we're done so we don't fire onFinish twice
  const isFinishedRef = useRef(false);

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

  const updateCursorDOM = useCallback(() => {
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
  }, []);

  const resetTyping = useCallback(() => {
    setIsStarted(false);
    setStats({ wpm: 0, accuracy: 100 });
    cursorIndexRef.current = 0;
    typedRef.current = [];
    startTimeRef.current = null;
    totalTypedRef.current = 0;
    correctTypedRef.current = 0;
    isFinishedRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (containerRef.current) {
      const spans = containerRef.current.querySelectorAll('span.char');
      spans.forEach(span => {
        span.className = 'char transition-colors duration-75';
      });
      updateCursorDOM();
    }
  }, [updateCursorDOM]);

  // ─── Core character processing (shared by keyboard & mobile input) ───────────
  const processChar = useCallback((key: string, onFinishCallback: (wpm: number, accuracy: number) => void) => {
    if (isFinishedRef.current) return;

    const spans = containerRef.current?.querySelectorAll('span.char');
    if (!spans) return;

    if (key === 'Backspace') {
      if (cursorIndexRef.current > 0) {
        cursorIndexRef.current--;
        typedRef.current.pop();
        const span = spans[cursorIndexRef.current] as HTMLElement;
        span.className = 'char transition-colors duration-75';
        updateCursorDOM();
      }
      return;
    }

    if (key.length !== 1) return;

    // Block if we're at the end
    if (cursorIndexRef.current >= targetText.length) return;

    // Block until previous error is corrected
    const typedLen = typedRef.current.length;
    if (typedLen > 0 && typedRef.current[typedLen - 1] !== targetText[typedLen - 1]) {
      return;
    }

    const expectedChar = targetText[cursorIndexRef.current];
    const isCorrect = expectedChar === key;

    typedRef.current.push(key);
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
        isFinishedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        const finalStats = calculateStats();
        setStats(finalStats);
        onFinishCallback(finalStats.wpm, finalStats.accuracy);
      }
    }
  }, [targetText, calculateStats, updateCursorDOM]);

  // ─── Focus the hidden input (shows mobile keyboard) ──────────────────────────
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Keyboard event handler (desktop) ────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab always resets regardless of state
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

      processChar(e.key, onFinish);
    };

    window.addEventListener('keydown', handleKeyDown);
    const timeout = setTimeout(updateCursorDOM, 50);
    window.addEventListener('resize', updateCursorDOM);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updateCursorDOM);
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(timeout);
    };
  }, [isStarted, targetText, onFinish, updateStats, resetTyping, processChar, updateCursorDOM]);

  // ─── Mobile input handler (hidden <input> captures mobile keyboard) ───────────
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleInput = (e: Event) => {
      const nativeEvent = e as InputEvent;

      if (targetText.length === 0) return;

      if (!isStarted) {
        setIsStarted(true);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(updateStats, 1000);
      }

      if (nativeEvent.inputType === 'deleteContentBackward') {
        processChar('Backspace', onFinish);
      } else if (nativeEvent.data) {
        // Process each character (handles paste and composition)
        for (const char of nativeEvent.data) {
          processChar(char, onFinish);
        }
      }

      // Always clear the hidden input so we keep getting fresh events
      input.value = '';
    };

    input.addEventListener('input', handleInput);
    return () => input.removeEventListener('input', handleInput);
  }, [isStarted, targetText, onFinish, updateStats, processChar]);

  return {
    containerRef,
    inputRef,
    focusInput,
    isStarted,
    stats,
    resetTyping,
  };
}
