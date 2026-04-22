'use client';

import { useTyping } from '@/hooks/useTyping';
import { RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { speakText } from '@/utils/audio';

interface TypingAreaProps {
  text: string;
  translation?: string;
  onFinish: (wpm: number, accuracy: number) => void;
}

export default function TypingArea({ text, translation, onFinish }: TypingAreaProps) {
  const { containerRef, isStarted, stats, resetTyping } = useTyping({
    targetText: text,
    onFinish,
  });

  const readText = useCallback(() => {
    speakText(text, false);
  }, [text]);

  useEffect(() => {
    resetTyping();
    // Small delay to ensure the UI has transitioned before speaking
    const timeoutId = setTimeout(readText, 100);
    return () => clearTimeout(timeoutId);
  }, [text, resetTyping, readText]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6 text-slate-400 font-mono text-xl">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-sm uppercase tracking-widest opacity-50">WPM</span>
            <span className={`font-bold transition-colors ${isStarted ? 'text-slate-100' : ''}`}>
              {stats.wpm}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm uppercase tracking-widest opacity-50">ACC</span>
            <span className={`font-bold transition-colors ${isStarted ? 'text-slate-100' : ''}`}>
              {stats.accuracy}%
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={readText}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-600"
            aria-label="Hear the sentence again"
            title="Listen to sentence"
          >
            <Volume2 className="w-6 h-6 group-hover:text-slate-200" />
          </button>
          <button
            onClick={resetTyping}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-600"
            aria-label="Restart typing test (Tab)"
            title="Restart (Tab)"
          >
            <RotateCcw className="w-6 h-6 group-hover:text-slate-200" />
          </button>
        </div>
      </div>

      <div 
        className="relative w-full text-3xl md:text-4xl leading-relaxed font-mono select-none outline-none mb-8"
        dir="ltr"
      >
        <div className="absolute inset-0 z-0 text-slate-600 break-words whitespace-pre-wrap">
          {text.split('').map((char, i) => (
            <span key={`target-${i}`}>{char}</span>
          ))}
        </div>
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
              opacity: isStarted ? 1 : 0.5 
            }}
          />
        </div>
      </div>
      
      {translation && (
        <div 
          className="w-full text-2xl md:text-3xl text-slate-500 font-sans mt-4 text-center pb-8 border-b border-slate-800/50"
          dir="rtl"
        >
          {translation}
        </div>
      )}
      
      {!isStarted && (
        <div className="mt-12 text-slate-500 animate-pulse text-sm">
          Type any key to start
        </div>
      )}
    </div>
  );
}
