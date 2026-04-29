'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Keyboard, Trophy, ChevronRight, Play, ArrowLeft, Coffee, Code, Quote, Plane, Briefcase, GraduationCap, LogIn, LogOut } from 'lucide-react';
import levelsDataRaw from '@/data/levels.json';
import categoriesData from '@/data/categories.json';
import TypingArea from '@/components/TypingArea';
import ResultScreen from '@/components/ResultScreen';
import ErrorBoundary from '@/components/ErrorBoundary';
import { updateHighScore, unlockNextLevel, getUnlockedLevel, saveSentenceProgress, getSentenceProgress } from '@/utils/storage';

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
  const { data: session, status } = useSession();
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
    <header suppressHydrationWarning className="flex justify-between items-center py-4 md:py-6 mb-6 md:mb-12 border-b border-slate-800">
      {/* Logo */}
      <button
        onClick={() => setGameState('category_select')}
        className="flex items-center gap-2 md:gap-3 hover:opacity-80 active:opacity-60 transition-opacity focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded-lg"
        title="Return to main page"
      >
        <div suppressHydrationWarning className="bg-yellow-400 p-1.5 md:p-2 rounded-lg">
          <Keyboard className="w-5 h-5 md:w-6 md:h-6 text-slate-950" />
        </div>
        <h1 className="text-lg md:text-xl font-bold tracking-tight">TypeFlow</h1>
      </button>

      {/* Auth area — only rendered client-side to avoid hydration mismatch.
          isMounted ensures server and first-client render are identical (empty div),
          then the real UI swaps in after hydration. */}
      <div className="flex items-center gap-2 md:gap-3" suppressHydrationWarning>
        {!isMounted ? (
          // Neutral placeholder — same on server AND first client render
          <div className="w-8 h-8" />
        ) : status === 'loading' ? (
          // Skeleton while session resolves
          <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
        ) : session?.user ? (
          // Signed-in state
          <>
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name ?? 'User avatar'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full border-2 border-yellow-400 object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="hidden sm:block text-sm text-slate-300 font-medium max-w-[120px] truncate">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 active:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-600"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        ) : (
          // Signed-out state
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-sm font-semibold bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-200 text-slate-950 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );

  if (!isMounted) {
    return (
      <main className="min-h-screen flex flex-col px-4 py-4 md:p-6 max-w-6xl mx-auto">
        {renderHeader()}
      </main>
    );
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen flex flex-col px-4 py-4 md:p-6 max-w-6xl mx-auto">
      {renderHeader()}

      <div className="flex-1 flex flex-col w-full">
        {gameState === 'category_select' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 md:mb-4">
                Choose your <span className="text-yellow-400">path</span>
              </h2>
              <p className="text-slate-400 text-sm md:text-lg px-2">
                Select a category to practice real-world vocabulary, complex grammar, and everyday phrases.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {categoriesData.map((category) => (
                <button
                  key={category.id}
                  onClick={() => selectCategory(category.id)}
                  className="flex flex-col items-start p-5 md:p-8 rounded-2xl bg-slate-800/30 border border-slate-700 hover:border-yellow-400 active:border-yellow-400 hover:bg-slate-800/50 active:bg-slate-800/70 transition-all text-left group"
                >
                  {iconMap[category.icon]}
                  <h3 className="text-lg md:text-xl font-bold text-slate-100 mb-1 md:mb-2 group-hover:text-yellow-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 line-clamp-2">
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
              className="flex items-center gap-2 text-slate-400 hover:text-slate-100 active:text-slate-200 mb-6 md:mb-8 transition-colors text-sm md:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </button>

            {/* On mobile: Levels panel on top, Sentences below */}
            <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-6 md:gap-12 w-full">

              {/* ── Sentences panel ── */}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-1 md:mb-2">
                  Level {currentLevelId} Phrases
                </h2>
                <p className="text-slate-400 text-xs md:text-sm mb-4 md:mb-6">
                  Complete each sentence with 80%+ accuracy to unlock the next one.
                </p>

                <div className="flex flex-col gap-2 md:gap-3 max-h-[45vh] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2">
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
                        className={`flex items-center justify-between p-3 md:p-4 rounded-xl border text-left transition-all ${
                          isUnlocked
                            ? 'border-slate-700 bg-slate-800/50 hover:border-yellow-400 active:border-yellow-400 hover:bg-slate-800 active:bg-slate-800 cursor-pointer'
                            : 'border-slate-800/50 bg-slate-900/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="pr-3 md:pr-4">
                          <div className={`font-bold text-sm md:text-base mb-0.5 md:mb-1 ${
                            isCompleted ? 'text-green-400' : isUnlocked ? 'text-slate-100' : 'text-slate-500'
                          }`}>
                            Sentence {i + 1}
                          </div>
                          <div className="text-xs md:text-sm text-slate-400 line-clamp-1">
                            {sentence.en}
                          </div>
                        </div>
                        {isUnlocked && (
                          <Play className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${
                            isCompleted ? 'text-green-400' : 'text-yellow-400'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Levels panel ── */}
              <div className="bg-slate-800/30 rounded-2xl p-4 md:p-6 border border-slate-800">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                  <h3 className="font-bold text-base md:text-lg">Levels</h3>
                </div>

                <div className="flex flex-col gap-2 md:gap-3 max-h-[30vh] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2">
                  {levelsData[selectedCategory]?.map((levelData) => {
                    const isUnlocked = levelData.level <= maxUnlockedLevel;
                    const isActive = currentLevelId === levelData.level;

                    return (
                      <button
                        key={levelData.level}
                        disabled={!isUnlocked}
                        onClick={() => setCurrentLevelId(levelData.level)}
                        className={`flex items-center justify-between p-3 md:p-4 rounded-xl border text-left transition-all ${
                          isActive
                            ? 'border-yellow-400 bg-yellow-400/10'
                            : isUnlocked
                              ? 'border-slate-700 bg-slate-800/50 hover:bg-slate-800 active:bg-slate-800 cursor-pointer'
                              : 'border-slate-800/50 bg-slate-900/50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm md:text-base mb-0.5 md:mb-1">
                            Level {levelData.level}
                          </div>
                          <div className="text-xs md:text-sm text-slate-400">
                            10 Sentences
                          </div>
                        </div>
                        {isUnlocked && (
                          <ChevronRight className={`w-4 h-4 md:w-5 md:h-5 ${
                            isActive ? 'text-yellow-400' : 'text-slate-500'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'typing' && currentSentence && (
          <div className="animate-in fade-in duration-300 w-full mt-6 md:mt-12">
            <div className="text-center text-xs md:text-sm font-bold text-slate-400 mb-4 md:mb-8 uppercase tracking-widest">
              Level {currentLevelId} &bull; Sentence {sentenceIndex + 1} / 10
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
      
      <footer className="mt-8 md:mt-12 text-center text-slate-500 text-xs md:text-sm py-4 md:py-6">
        <p suppressHydrationWarning>TypeFlow &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
    </ErrorBoundary>
  );
}
