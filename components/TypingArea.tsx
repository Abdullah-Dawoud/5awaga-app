'use client';

import { useTyping } from '@/hooks/useTyping';
import { RotateCcw, Volume2, Keyboard } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { speakText } from '@/utils/audio';

interface TypingAreaProps {
  text: string;
  translation?: string;
  onFinish: (wpm: number, accuracy: number) => void;
}

export default function TypingArea({ text, translation, onFinish }: TypingAreaProps) {
  const { containerRef, inputRef, focusInput, isStarted, stats, resetTyping } = useTyping({
    targetText: text,
    onFinish,
  });

  const readText = useCallback(() => {
    speakText(text, false);
  }, [text]);

  useEffect(() => {
    resetTyping();
    const timeoutId = setTimeout(readText, 100);
    return () => clearTimeout(timeoutId);
  }, [text, resetTyping, readText]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-between items-center mb-4 md:mb-6 text-slate-400 font-mono">
        <div className="flex gap-4 md:gap-8 text-lg md:text-xl">
          <div className="flex flex-col">
            <span className="text-xs md:text-sm uppercase tracking-widest opacity-50">WPM</span>
            <span className={`font-bold transition-colors ${isStarted ? 'text-slate-100' : ''}`}>
              {stats.wpm}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm uppercase tracking-widest opacity-50">ACC</span>
            <span className={`font-bold transition-colors ${isStarted ? 'text-slate-100' : ''}`}>
              {stats.accuracy}%
            </span>
          </div>
        </div>
        <div className="flex gap-1 md:gap-2">
          <button
            onClick={readText}
            className="p-2 hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-600"
            aria-label="Hear the sentence again"
            title="Listen to sentence"
          >
            <Volume2 className="w-5 h-5 md:w-6 md:h-6 group-hover:text-slate-200" />
          </button>
          <button
            onClick={() => { resetTyping(); focusInput(); }}
            className="p-2 hover:bg-slate-800 active:bg-slate-700 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-600"
            aria-label="Restart typing test"
            title="Restart (Tab on desktop)"
          >
            <RotateCcw className="w-5 h-5 md:w-6 md:h-6 group-hover:text-slate-200" />
          </button>
        </div>
      </div>

      {/* ── Hidden input — captures mobile soft keyboard input ────────────── */}
      <input
        ref={inputRef}
        className="mobile-input"
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ── Typing display ────────────────────────────────────────────────── */}
      <div
        className="typing-display relative w-full text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed font-mono outline-none mb-6 md:mb-8 cursor-text"
        dir="ltr"
        onClick={focusInput}
        onTouchStart={focusInput}
        role="textbox"
        aria-label="Typing area — tap to start on mobile"
        aria-multiline="false"
      >
        {/* Ghost / target text */}
        <div className="absolute inset-0 z-0 text-slate-600 break-words whitespace-pre-wrap">
          {text.split('').map((char, i) => (
            <span key={`target-${i}`}>{char}</span>
          ))}
        </div>
        {/* Typed overlay + cursor */}
        <div
          ref={containerRef}
          className="relative z-10 break-words whitespace-pre-wrap text-transparent"
        >
          {text.split('').map((char, i) => (
            <span key={i} className="char transition-colors duration-75">
              {char}
            </span>
          ))}
          <div
            id="cursor"
            className="absolute w-0.5 bg-yellow-400 transition-all duration-75 ease-out animate-pulse"
            style={{
              height: '1.2em',
              top: 0,
              left: 0,
              opacity: isStarted ? 1 : 0.5,
            }}
          />
        </div>
      </div>

      {/* ── Translation ───────────────────────────────────────────────────── */}
      {translation && (
        <div
          className="w-full text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-500 font-sans mt-2 md:mt-4 text-center pb-6 md:pb-8 border-b border-slate-800/50"
          dir="rtl"
        >
          {translation}
        </div>
      )}

      {/* ── Start prompt ──────────────────────────────────────────────────── */}
      {!isStarted && (
        <div className="mt-8 md:mt-12 flex flex-col items-center gap-3">
          {/* Desktop hint */}
          <p className="hidden md:block text-slate-500 animate-pulse text-sm">
            Type any key to start
          </p>
          {/* Mobile tap button */}
          <button
            onClick={focusInput}
            className="md:hidden flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 font-medium animate-tap-pulse active:scale-95 transition-transform"
            aria-label="Tap to start typing"
          >
            <Keyboard className="w-5 h-5" />
            Tap to start typing
          </button>
          {/* Mobile secondary hint */}
          <p className="md:hidden text-slate-600 text-xs text-center">
            Your keyboard will appear automatically
          </p>
        </div>
      )}
    </div>
  );
}
