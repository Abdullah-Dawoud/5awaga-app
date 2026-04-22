'use client';

import { useState, useEffect, useMemo } from 'react';
import { Keyboard, Trophy, ChevronRight, Play, ArrowLeft, Coffee, Code, Quote, Plane, Briefcase, GraduationCap } from 'lucide-react';
import levelsDataRaw from '@/data/levels.json';
import categoriesData from '@/data/categories.json';
import TypingArea from '@/components/TypingArea';
import ResultScreen from '@/components/ResultScreen';
import { getProgress, updateHighScore, unlockNextLevel, getUnlockedLevel, saveSentenceProgress, getSentenceProgress } from '@/utils/storage';

// Cast the JSON properly
const levelsData = levelsDataRaw as Record<string, { level: number, sentences: { id: number, en: string, ar: string }[] }[]>;

type GameState = 'category_select' | 'level_select' | 'typing' | 'result';

const iconMap: Record<string, React.ReactNode> = {
  Coffee: <Coffee className="w-8 h-8 text-yellow-400 mb-4" />,
  Code: <Code className="w-8 h-8 text-yellow-400 mb-4" />,
  Quote: <Quote className="w-8 h-8 text-yellow-400 mb-4" />,
  Plane: <Plane className="w-8 h-8 text-yellow-400 mb-4" />,
  Briefcase: <Briefcase className="w-8 h-8 text-yellow-400 mb-4" />,
  GraduationCap: <GraduationCap className="w-8 h-8 text-yellow-400 mb-4" />
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('category_select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [results, setResults] = useState({ wpm: 0, accuracy: 0 });
  
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [completedSentencesCount, setCompletedSentencesCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (selectedCategory) {
      setMaxUnlockedLevel(getUnlockedLevel(selectedCategory));
      setCompletedSentencesCount(getSentenceProgress(selectedCategory, currentLevelId));
    }
  }, [selectedCategory, currentLevelId, gameState]);

  const currentLevelData = useMemo(() => {
    if (!selectedCategory || !levelsData[selectedCategory]) return null;
    return levelsData[selectedCategory].find(l => l.level === currentLevelId) || levelsData[selectedCategory][0];
  }, [selectedCategory, currentLevelId]);

  const currentSentence = useMemo(() => {
    if (!currentLevelData) return null;
    return currentLevelData.sentences[sentenceIndex] || currentLevelData.sentences[0];
  }, [currentLevelData, sentenceIndex]);

  const handleFinish = (wpm: number, accuracy: number) => {
    if (!selectedCategory) return;
    
    setResults({ wpm, accuracy });
    setGameState('result');
    updateHighScore(selectedCategory, currentLevelId, wpm, accuracy);
    
    if (accuracy >= 80) {
      const newCompleted = Math.max(completedSentencesCount, sentenceIndex + 1);
      saveSentenceProgress(selectedCategory, currentLevelId, newCompleted);
      setCompletedSentencesCount(getSentenceProgress(selectedCategory, currentLevelId));

      if (sentenceIndex === currentLevelData!.sentences.length - 1) {
        unlockNextLevel(selectedCategory, currentLevelId);
        setMaxUnlockedLevel(getUnlockedLevel(selectedCategory));
      }
    }
  };

  const startTyping = () => {
    setGameState('typing');
  };

  const hasNextSentence = currentLevelData ? sentenceIndex < currentLevelData.sentences.length - 1 : false;

  const handleNext = () => {
    if (!selectedCategory) return;
    
    if (hasNextSentence) {
      setSentenceIndex(sentenceIndex + 1);
      setGameState('typing');
    } else {
      const nextLevel = currentLevelId + 1;
      if (levelsData[selectedCategory].some(l => l.level === nextLevel)) {
        setCurrentLevelId(nextLevel);
        setSentenceIndex(0);
        setGameState('level_select');
      }
    }
  };

  const handleRetry = () => {
    setGameState('typing');
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setGameState('level_select');
    setCurrentLevelId(1);
    setSentenceIndex(0);
  };

  const backToCategories = () => {
    setGameState('category_select');
    setSelectedCategory(null);
  };

  const renderHeader = () => (
    <header className="flex justify-between items-center py-6 mb-12 border-b border-slate-800">
      <button 
        onClick={() => setGameState('category_select')}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-lg"
        title="Return to main page"
      >
        <div className="bg-yellow-400 p-2 rounded-lg">
          <Keyboard className="w-6 h-6 text-slate-950" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">TypeFlow</h1>
      </button>
    </header>
  );

  if (!isMounted) {
    return (
      <main className="min-h-screen flex flex-col p-6 max-w-6xl mx-auto">
        {renderHeader()}
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-6 max-w-6xl mx-auto">
      {renderHeader()}

      <div className="flex-1 flex flex-col w-full">
        {gameState === 'category_select' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Choose your <span className="text-yellow-400">path</span>
              </h2>
              <p className="text-slate-400 text-lg">
                Select a category to practice real-world vocabulary, complex grammar, and everyday phrases.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesData.map((category) => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category.id)}
                  className="flex flex-col items-start p-8 rounded-2xl bg-slate-800/30 border border-slate-700 hover:border-yellow-400 hover:bg-slate-800/50 transition-all text-left group"
                >
                  {iconMap[category.icon]}
                  <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-yellow-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {category.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'level_select' && selectedCategory && (
          <div className="animate-in fade-in zoom-in duration-300 w-full max-w-4xl mx-auto">
            <button 
              onClick={backToCategories}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </button>
            
            <div className="grid md:grid-cols-2 gap-12 w-full">
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                  Level {currentLevelId} Phrases
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Complete each sentence with 80%+ accuracy to unlock the next one.
                </p>
                
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {currentLevelData?.sentences.map((sentence, i) => {
                    const isUnlocked = i <= completedSentencesCount;
                    const isCompleted = i < completedSentencesCount;
                    
                    return (
                      <button
                        key={sentence.id}
                        disabled={!isUnlocked}
                        onClick={() => {
                          setSentenceIndex(i);
                          startTyping();
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                          isUnlocked 
                            ? 'border-slate-700 bg-slate-800/50 hover:border-yellow-400 hover:bg-slate-800 cursor-pointer' 
                            : 'border-slate-800/50 bg-slate-900/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="pr-4">
                          <div className={`font-bold mb-1 ${isCompleted ? 'text-green-400' : isUnlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                            Sentence {i + 1}
                          </div>
                          <div className="text-sm text-slate-400 line-clamp-1">
                            {sentence.en}
                          </div>
                        </div>
                        {isUnlocked && <Play className={`w-5 h-5 flex-shrink-0 ${isCompleted ? 'text-green-400' : 'text-yellow-400'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold text-lg">Levels</h3>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {levelsData[selectedCategory]?.map((levelData) => {
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
                          <div className="text-sm text-slate-400">
                            10 Sentences
                          </div>
                        </div>
                        {isUnlocked && <ChevronRight className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-slate-500'}`} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'typing' && currentSentence && (
          <div className="animate-in fade-in duration-300 w-full mt-12">
            <div className="text-center text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">
              Level {currentLevelId} • Sentence {sentenceIndex + 1} / 10
            </div>
            <TypingArea 
              text={currentSentence.en} 
              translation={currentSentence.ar}
              onFinish={handleFinish} 
            />
          </div>
        )}

        {gameState === 'result' && selectedCategory && (
          <ResultScreen
            wpm={results.wpm}
            accuracy={results.accuracy}
            categoryId={selectedCategory}
            level={currentLevelId}
            onRetry={handleRetry}
            onNext={handleNext}
            hasNext={hasNextSentence || levelsData[selectedCategory].some(l => l.level === currentLevelId + 1)}
            nextLabel={hasNextSentence ? "Next Sentence" : "Next Level"}
          />
        )}
      </div>
      
      <footer className="mt-12 text-center text-slate-500 text-sm py-6">
        <p>TypeFlow &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}
