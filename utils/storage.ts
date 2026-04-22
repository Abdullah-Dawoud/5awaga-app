export interface HighScore {
  wpm: number;
  accuracy: number;
}

export interface ProgressData {
  currentLevel: Record<string, number>;
  completedSentences: Record<string, Record<number, number>>;
  highScores: Record<string, Record<number, HighScore>>;
}

const STORAGE_KEY = 'typing_progress_v3';

export function getProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return { currentLevel: {}, completedSentences: {}, highScores: {} };
  }
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Migrate old data if necessary
      if (!parsed.completedSentences) parsed.completedSentences = {};
      return parsed;
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return { currentLevel: {}, completedSentences: {}, highScores: {} };
}

export function saveProgress(data: ProgressData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateHighScore(categoryId: string, level: number, wpm: number, accuracy: number) {
  const data = getProgress();
  if (!data.highScores[categoryId]) {
    data.highScores[categoryId] = {};
  }
  
  const existing = data.highScores[categoryId][level];
  
  if (!existing || wpm > existing.wpm || (wpm === existing.wpm && accuracy > existing.accuracy)) {
    data.highScores[categoryId][level] = { wpm, accuracy };
    saveProgress(data);
  }
}

export function unlockNextLevel(categoryId: string, currentLevel: number) {
  const data = getProgress();
  if (!data.currentLevel[categoryId]) {
    data.currentLevel[categoryId] = 1;
  }
  
  if (data.currentLevel[categoryId] <= currentLevel) {
    data.currentLevel[categoryId] = currentLevel + 1;
    saveProgress(data);
  }
}

export function saveSentenceProgress(categoryId: string, level: number, completedCount: number) {
  const data = getProgress();
  if (!data.completedSentences[categoryId]) {
    data.completedSentences[categoryId] = {};
  }
  
  const currentCompleted = data.completedSentences[categoryId][level] || 0;
  if (completedCount > currentCompleted) {
    data.completedSentences[categoryId][level] = completedCount;
    saveProgress(data);
  }
}

export function getSentenceProgress(categoryId: string, level: number): number {
  const data = getProgress();
  if (!data.completedSentences[categoryId]) return 0;
  return data.completedSentences[categoryId][level] || 0;
}

export function getUnlockedLevel(categoryId: string): number {
  const data = getProgress();
  return data.currentLevel[categoryId] || 1;
}
