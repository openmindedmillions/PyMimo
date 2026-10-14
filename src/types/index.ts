export type Language = 'python' | 'javascript' | 'html_css' | 'sql';

export type StepType = 'concept' | 'fill_blank' | 'code_typing' | 'quiz' | 'bug_hunt';

export interface BlankOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface LessonStep {
  id: string;
  type: StepType;
  title: string;
  instructions: string;
  explanation?: string;
  codeSnippet?: string;
  starterCode?: string;
  solutionCode?: string;
  expectedOutput?: string;
  // For fill_blank
  codeTemplate?: string; // e.g. "for i in __BLANK__(5):\n    print(i)"
  blankOptions?: string[]; // choices for blank
  blankCorrectAnswers?: string[]; // correct values for blanks
  // For quiz
  quizQuestion?: string;
  quizOptions?: { id: string; text: string; isCorrect: boolean; explanation?: string }[];
  // For bug hunt
  buggyCode?: string;
  bugHint?: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  xp: number;
  durationMinutes: number;
  steps: LessonStep[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
  chestReward?: {
    xp: number;
    badge?: string;
  };
}

export interface Course {
  id: string;
  language: Language;
  title: string;
  badge: string;
  description: string;
  icon: string;
  accentColor: string;
  sections: Section[];
}

export interface UserProgress {
  currentCourseId: string;
  completedLessons: string[]; // lesson ids
  unlockedSections: string[];
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  activeDates: string[]; // ['2026-10-10', ...]
  hasStreakFreeze: boolean;
  hearts: number;
  maxHearts: number;
  nextHeartRefillTime: number; // timestamp
  soundEnabled: boolean;
  earnedBadges: { id: string; name: string; icon: string; description: string; unlockedAt: string }[];
  weakTopics: string[]; // e.g. ["Python Indentation", "While Loops"]
}

export interface LineIssue {
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'tip';
}

export interface TutorFeedbackResponse {
  status: 'correct' | 'syntax_error' | 'logic_error' | 'improvement_suggestion' | 'hint_only';
  headline: string;
  explanation: string;
  lineIssues?: LineIssue[];
  socraticNudge?: string;
  suggestedCode?: string | null;
  conceptExplained?: string;
  encouragement?: string;
}

export interface PersonalizedChallenge {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  language: Language;
  story: string;
  instructions: string[];
  starterCode: string;
  testCases: {
    input: string;
    expectedOutput: string;
    description: string;
  }[];
  hints: string[];
  solution: string;
  xpReward: number;
  conceptKey: string;
  completed?: boolean;
}

export interface ForumComment {
  id: string;
  author: {
    name: string;
    avatar: string;
    badge: string;
    isAITutor?: boolean;
  };
  content: string;
  codeSnippet?: string;
  createdAt: string;
  upvotes: number;
}

export interface ForumPost {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    level: number;
    badge: string;
  };
  language: Language;
  tags: string[];
  content: string;
  code?: string;
  createdAt: string;
  upvotes: number;
  hasUpvoted?: boolean;
  isSolved?: boolean;
  comments: ForumComment[];
  aiReview?: {
    summary: string;
    ratingScore: number;
    strengths: string[];
    suggestions: { topic: string; detail: string }[];
    refactoredCode?: string;
    timeComplexity?: string;
  };
}
