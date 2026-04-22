export interface HighScore {
  wpm: number;
  accuracy: number;
}

export interface ProgressData {
  currentLevel: number;
  highScores: Record<number, HighScore>;
}

const STORAGE_KEY = 'typing_progress_v1';

export function getProgress(): ProgressData {
  if (typeof window === 'undefined') {
    return { currentLevel: 1, highScores: {} };
  }
  
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse progress', e);
    }
  }
  return { currentLevel: 1, highScores: {} };
}

export function saveProgress(data: ProgressData) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateHighScore(level: number, wpm: number, accuracy: number) {
  const data = getProgress();
  const existing = data.highScores[level];
  
  if (!existing || wpm > existing.wpm || (wpm === existing.wpm && accuracy > existing.accuracy)) {
    data.highScores[level] = { wpm, accuracy };
    saveProgress(data);
  }
}

export function unlockNextLevel(currentLevel: number) {
  const data = getProgress();
  if (data.currentLevel <= currentLevel) {
    data.currentLevel = currentLevel + 1;
    saveProgress(data);
  }
}
