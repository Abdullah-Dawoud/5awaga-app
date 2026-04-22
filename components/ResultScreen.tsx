'use client';

import { RotateCcw, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProgress, HighScore } from '@/utils/storage';

interface ResultScreenProps {
  wpm: number;
  accuracy: number;
  level: number;
  onRetry: () => void;
  onNextLevel: () => void;
  hasNextLevel: boolean;
}

export default function ResultScreen({ 
  wpm, 
  accuracy, 
  level, 
  onRetry, 
  onNextLevel,
  hasNextLevel 
}: ResultScreenProps) {
  const [highScore, setHighScore] = useState<HighScore | null>(null);

  useEffect(() => {
    const data = getProgress();
    if (data.highScores[level]) {
      setHighScore(data.highScores[level]);
    }
  }, [level, wpm, accuracy]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
      <h2 className="text-3xl font-bold text-slate-100 mb-8">Test Complete</h2>
      
      <div className="grid grid-cols-2 gap-8 w-full mb-12">
        <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-xl">
          <span className="text-slate-400 text-sm uppercase tracking-widest mb-2">WPM</span>
          <span className="text-6xl font-mono font-bold text-yellow-400">{wpm}</span>
          {highScore && highScore.wpm < wpm && (
            <span className="text-xs text-green-400 mt-2 font-mono">New Best!</span>
          )}
        </div>
        <div className="flex flex-col items-center p-6 bg-slate-800/50 rounded-xl">
          <span className="text-slate-400 text-sm uppercase tracking-widest mb-2">Accuracy</span>
          <span className="text-6xl font-mono font-bold text-slate-100">{accuracy}%</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <RotateCcw className="w-5 h-5" />
          Retry Level
        </button>
        {hasNextLevel && (
          <button
            onClick={onNextLevel}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-400 text-slate-950 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Next Level
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="mt-8 text-sm text-slate-500">
        Press <kbd className="bg-slate-800 px-2 py-1 rounded">Tab</kbd> to quickly retry
      </div>
    </div>
  );
}
