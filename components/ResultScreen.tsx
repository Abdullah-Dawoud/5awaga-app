'use client';

import { RotateCcw, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress, HighScore } from '@/utils/storage';

interface ResultScreenProps {
  wpm: number;
  accuracy: number;
  categoryId: string;
  level: number;
  onRetry: () => void;
  onNext: () => void;
  hasNext: boolean;
  nextLabel: string;
}

export default function ResultScreen({
  wpm,
  accuracy,
  categoryId,
  level,
  onRetry,
  onNext,
  hasNext,
  nextLabel,
}: ResultScreenProps) {
  const [highScore, setHighScore] = useState<HighScore | null>(null);

  useEffect(() => {
    const data = getProgress();
    if (data.highScores[categoryId] && data.highScores[categoryId][level]) {
      setHighScore(data.highScores[categoryId][level]);
    }
  }, [categoryId, level, wpm, accuracy]);

  const passed = accuracy >= 80;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-4 py-8 md:p-8 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm animate-in fade-in zoom-in duration-300">

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-2">
        {passed ? 'Test Complete 🎉' : 'Keep Practicing!'}
      </h2>
      {!passed && (
        <p className="text-sm text-slate-400 mb-6 text-center">
          You need <span className="text-yellow-400 font-bold">80%+</span> accuracy to unlock the next sentence.
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 w-full mt-4 mb-8 md:mb-12">
        <div className="flex flex-col items-center p-4 md:p-6 bg-slate-800/50 rounded-xl">
          <span className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mb-2">WPM</span>
          <span className="text-4xl md:text-6xl font-mono font-bold text-yellow-400">{wpm}</span>
          {highScore && highScore.wpm < wpm && (
            <span className="text-xs text-green-400 mt-2 font-mono">New Best!</span>
          )}
        </div>
        <div className="flex flex-col items-center p-4 md:p-6 bg-slate-800/50 rounded-xl">
          <span className="text-slate-400 text-xs md:text-sm uppercase tracking-widest mb-2">Accuracy</span>
          <span className={`text-4xl md:text-6xl font-mono font-bold ${passed ? 'text-slate-100' : 'text-red-400'}`}>
            {accuracy}%
          </span>
        </div>
      </div>

      {/* Action buttons — stack on mobile, row on desktop */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <RotateCcw className="w-5 h-5" />
          Retry
        </button>
        {hasNext && passed && (
          <button
            onClick={onNext}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-300 text-slate-950 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {nextLabel}
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Desktop-only keyboard hint */}
      <div className="hidden md:block mt-6 md:mt-8 text-sm text-slate-500">
        Press <kbd className="bg-slate-800 px-2 py-1 rounded">Tab</kbd> to quickly retry
      </div>
    </div>
  );
}
