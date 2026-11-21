export type Category =
  | 'Syntax & Methods'
  | 'STL Containers'
  | 'Algorithms & Iterators'
  | 'Memory & Modern C++'
  | 'AI Generated';

/** The four hand-curated categories (everything except 'AI Generated'). */
export type CoreCategory = Exclude<Category, 'AI Generated'>;

export const CORE_CATEGORIES: CoreCategory[] = [
  'Syntax & Methods',
  'STL Containers',
  'Algorithms & Iterators',
  'Memory & Modern C++',
];

export const ALL_CATEGORIES: Category[] = [...CORE_CATEGORIES, 'AI Generated'];

export type Difficulty = 'Quick Syntax' | 'Concept' | 'Gotcha';
export const DIFFICULTIES: Difficulty[] = ['Quick Syntax', 'Concept', 'Gotcha'];

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  prompt: string;
  code?: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  deepDive: {
    conceptTitle: string;
    details: string;
    interviewTip?: string;
  };
  /** Only set on AI-generated questions: the specific C++ area it was generated for. */
  subtopic?: CoreCategory;
}

export type TopicFilter = 'All Topics' | Category;
export const TOPIC_FILTERS: TopicFilter[] = ['All Topics', ...ALL_CATEGORIES];

export type QuestionStatus = 'unseen' | 'missed' | 'mastered';

export interface QuestionProgress {
  seenCount: number;
  correctCount: number;
  /** epoch ms of the last answer */
  lastSeen: number;
  status: QuestionStatus;
  /** For missed questions: the global answer turn at which it becomes due again. */
  dueTurn?: number;
}

export type ProgressMap = Record<string, QuestionProgress>;

export interface StreakState {
  currentStreak: number;
  /** Local calendar date YYYY-MM-DD of the last day with at least one answer. */
  lastCompletedDate: string | null;
  totalAnswered: number;
  totalCorrect: number;
}

/** Persisted popup session so closing/reopening the popup doesn't skip a question. */
export interface SessionState {
  currentId: string | null;
  selectedIndex: number | null;
  /** Monotonic count of answers given; drives the "re-queue after 3–5 questions" logic. */
  turn: number;
  topicFilter: TopicFilter;
  /** Most recently shown question ids (newest last) to avoid immediate repeats. */
  recent: string[];
}

export type Provider = 'Anthropic' | 'OpenAI';
export type GenTopic = CoreCategory | 'Mixed';

export interface LlmSettings {
  provider: Provider;
  apiKey: string;
  model: string;
  genTopic: GenTopic;
}

export interface GenStatus {
  state: 'idle' | 'running' | 'done' | 'error';
  message: string;
  at: number;
}
