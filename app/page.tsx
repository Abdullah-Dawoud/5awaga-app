'use client';

import { useState, useEffect, useMemo } from 'react';
import { Keyboard, Languages, Trophy, ChevronRight, Play } from 'lucide-react';
import levelsData from '@/data/levels.json';
import TypingArea from '@/components/TypingArea';
import ResultScreen from '@/components/ResultScreen';
import { getProgress, updateHighScore, unlockNextLevel } from '@/utils/storage';

type GameState = 'start' | 'typing' | 'result';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [results, setResults] = useState({ wpm: 0, accuracy: 0 });
  
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  
  useEffect(() => {
    const data = getProgress();
    setMaxUnlockedLevel(data.currentLevel);
  }, []);

  const currentLevelData = useMemo(() => {
    return levelsData.find(l => l.level === currentLevelId) || levelsData[0];
  }, [currentLevelId]);

  const currentSentence = useMemo(() => {
    return currentLevelData.sentences[sentenceIndex] || currentLevelData.sentences[0];
  }, [currentLevelData, sentenceIndex]);

  const targetText = currentSentence.en;
  const translationText = currentSentence.ar;

  const handleFinish = (wpm: number, accuracy: number) => {
    setResults({ wpm, accuracy });
    setGameState('result');
    updateHighScore(currentLevelId, wpm, accuracy);
    
    // Unlock next level if they complete all sentences in the current level
    // For simplicity, we just unlock next level upon completing ANY sentence for now, 
    // or we can require them to finish the whole level. Let's just unlock the next level
    // if accuracy is decent (e.g. > 80%).
    if (accuracy >= 80) {
      unlockNextLevel(currentLevelId);
      const data = getProgress();
      setMaxUnlockedLevel(data.currentLevel);
    }
  };

  const startTyping = () => {
    setGameState('typing');
  };

  const handleNextLevel = () => {
    const nextLevel = currentLevelId + 1;
    if (levelsData.some(l => l.level === nextLevel)) {
      setCurrentLevelId(nextLevel);
      setSentenceIndex(0);
      setGameState('start');
    }
  };

  const handleRetry = () => {
    setGameState('typing');
  };

  return (
    <main className="min-h-screen flex flex-col p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center py-6 mb-12 border-b border-slate-800">
        <button 
          onClick={() => setGameState('start')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-lg"
          title="Return to main page"
        >
          <div className="bg-yellow-400 p-2 rounded-lg">
            <Keyboard className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TypeFlow</h1>
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center w-full">
        {gameState === 'start' && (
          <div className="grid md:grid-cols-2 gap-12 w-full animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Master your <span className="text-yellow-400">typing</span> speed.
              </h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md">
                Practice typing with our curated levels. Improve your accuracy and speed in English.
              </p>
              
              <button
                onClick={startTyping}
                className="flex items-center gap-3 w-fit px-8 py-4 rounded-xl font-bold bg-yellow-400 hover:bg-yellow-300 text-slate-950 transition-all focus:outline-none focus:ring-4 focus:ring-yellow-500/50 shadow-lg shadow-yellow-500/20"
              >
                <Play className="w-6 h-6 fill-current" />
                Start Typing Test
              </button>
            </div>
            
            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-800">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-lg">Levels</h3>
              </div>
              
              <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                {levelsData.map((levelData) => {
                  const isUnlocked = levelData.level <= maxUnlockedLevel;
                  const isActive = currentLevelId === levelData.level;
                  
                  return (
                    <button
                      key={levelData.level}
                      disabled={!isUnlocked}
                      onClick={() => setCurrentLevelId(levelData.level)}
                      className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isActive 
                          ? 'border-yellow-400 bg-yellow-400/10' 
                          : isUnlocked 
                            ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 cursor-pointer' 
                            : 'border-slate-800/50 bg-slate-900/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="font-bold mb-1">Level {levelData.level}</div>
                        <div className="text-sm text-slate-400 line-clamp-1">
                          {levelData.sentences[0].en}
                        </div>
                      </div>
                      {isUnlocked && <ChevronRight className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-slate-500'}`} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {gameState === 'typing' && (
          <div className="animate-in fade-in duration-300 w-full">
            <TypingArea 
              text={targetText} 
              translation={translationText}
              onFinish={handleFinish} 
            />
          </div>
        )}

        {gameState === 'result' && (
          <ResultScreen
            wpm={results.wpm}
            accuracy={results.accuracy}
            level={currentLevelId}
            onRetry={handleRetry}
            onNextLevel={handleNextLevel}
            hasNextLevel={levelsData.some(l => l.level === currentLevelId + 1)}
          />
        )}
      </div>
      
      <footer className="mt-12 text-center text-slate-500 text-sm py-6">
        <p>TypeFlow &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
