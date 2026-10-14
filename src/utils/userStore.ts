import { UserProgress } from '../types';

const STORAGE_KEY = 'pymimo_user_progress_v1';

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

export const INITIAL_PROGRESS: UserProgress = {
  currentCourseId: 'python-basics',
  completedLessons: ['py-101'], // started with first lesson completed
  unlockedSections: ['sec-py-1', 'sec-py-2'],
  xp: 340,
  level: 3,
  streakDays: 4,
  lastActiveDate: getYesterdayString(),
  activeDates: [
    getYesterdayString(),
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      return d.toISOString().split('T')[0];
    })(),
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      return d.toISOString().split('T')[0];
    })(),
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 4);
      return d.toISOString().split('T')[0];
    })(),
  ],
  hasStreakFreeze: true,
  hearts: 5,
  maxHearts: 5,
  nextHeartRefillTime: Date.now() + 30 * 60 * 1000,
  soundEnabled: true,
  earnedBadges: [
    {
      id: 'first_run',
      name: 'First Code Run',
      icon: '⚡',
      description: 'Executed your very first Python program successfully.',
      unlockedAt: 'Oct 10, 2026',
    },
    {
      id: 'streak_3',
      name: '3-Day Streak Flame',
      icon: '🔥',
      description: 'Coded 3 consecutive days in a row.',
      unlockedAt: 'Oct 12, 2026',
    },
    {
      id: 'python_pioneer',
      name: 'Python Pioneer',
      icon: '🐍',
      description: 'Completed Section 1 fundamentals.',
      unlockedAt: 'Oct 13, 2026',
    },
  ],
  weakTopics: ['Python Indentation', 'Comparison vs Assignment (== vs =)'],
};

export function loadUserProgress(): UserProgress {
  if (typeof window === 'undefined') return INITIAL_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveUserProgress(INITIAL_PROGRESS);
      return INITIAL_PROGRESS;
    }
    const parsed = JSON.parse(raw) as UserProgress;

    // Check heart regeneration
    const now = Date.now();
    if (parsed.hearts < parsed.maxHearts && parsed.nextHeartRefillTime <= now) {
      const heartsToAdd = Math.floor((now - parsed.nextHeartRefillTime) / (30 * 60 * 1000)) + 1;
      parsed.hearts = Math.min(parsed.maxHearts, parsed.hearts + heartsToAdd);
      parsed.nextHeartRefillTime = now + 30 * 60 * 1000;
    }

    return parsed;
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveUserProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}

export function updateStreakOnActivity(currentProgress: UserProgress): { updated: UserProgress; streakIncreased: boolean } {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  if (currentProgress.lastActiveDate === today) {
    // Already counted today
    return { updated: currentProgress, streakIncreased: false };
  }

  let newStreak = currentProgress.streakDays;
  let hasFreeze = currentProgress.hasStreakFreeze;

  if (currentProgress.lastActiveDate === yesterday) {
    // Consecutive day!
    newStreak += 1;
  } else {
    // Missed a day
    if (hasFreeze) {
      // Use streak freeze
      hasFreeze = false;
      newStreak += 1; // preserved
    } else {
      newStreak = 1;
    }
  }

  const updatedActiveDates = Array.from(new Set([...currentProgress.activeDates, today]));

  const updated: UserProgress = {
    ...currentProgress,
    streakDays: newStreak,
    lastActiveDate: today,
    activeDates: updatedActiveDates,
    hasStreakFreeze: hasFreeze,
  };

  saveUserProgress(updated);
  return { updated, streakIncreased: true };
}
