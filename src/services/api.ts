import {
  User,
  Subject,
  Chapter,
  Lesson,
  Question,
  QuizAttempt,
  FlashcardDeck,
  Flashcard,
  Note,
  PlannerGoal,
  MistakeItem,
  Achievement,
  Bookmark,
  ReportItem,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('studyforge_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<{ token: string; user: User; unlockedAchievements?: any[] }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: (role: 'student' | 'admin') => request<{ token: string; user: User }>('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request<{ user: User }>('/auth/me'),
  updateProfile: (body: any) => request<{ message: string }>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  completeOnboarding: (body: any) => request<{ message: string }>('/auth/onboarding', { method: 'POST', body: JSON.stringify(body) }),
  forgotPassword: (email: string) => request<{ message: string; resetToken?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // Subjects & Lessons
  getSubjects: () => request<{ subjects: Subject[] }>('/subjects'),
  getSubject: (id: number | string) => request<{ subject: Subject; chapters: Chapter[] }>(`/subjects/${id}`),
  createSubject: (body: any) => request<{ message: string; id: number }>('/subjects', { method: 'POST', body: JSON.stringify(body) }),
  getChapter: (id: number | string) => request<{ chapter: Chapter; lessons: Lesson[]; stats: any }>(`/chapters/${id}`),
  getLesson: (id: number | string) => request<{ lesson: Lesson; navigation: { prevLesson: any; nextLesson: any } }>(`/lessons/${id}`),
  completeLesson: (id: number | string) => request<{ message: string; xpEarned: number; newXp: number; levelUp: boolean; newLevel: number; streak: number; unlockedAchievements: any[] }>(`/lessons/${id}/complete`, { method: 'POST' }),

  // AI Tutor
  askTutor: (body: { message?: string; history?: any[]; grade?: string; subject?: string; topic?: string; action?: string }) =>
    request<{ reply: string; suggestedFollowUps?: string[]; isAiGenerated: boolean; provider: string }>('/tutor/chat', { method: 'POST', body: JSON.stringify(body) }),
  transformNote: (body: { noteContent: string; noteTitle?: string; tool: string }) =>
    request<{ result: any; tool: string; isAiGenerated: boolean }>('/tutor/transform-note', { method: 'POST', body: JSON.stringify(body) }),

  // Quizzes
  generateQuiz: (body: any) => request<{ quiz_id: string; total_questions: number; questions: Question[] }>('/quizzes/generate', { method: 'POST', body: JSON.stringify(body) }),
  submitQuiz: (body: any) => request<{
    score: number;
    accuracy: number;
    correctCount: number;
    totalQuestions: number;
    time_taken_seconds: number;
    topics_to_improve: string[];
    xp_earned: number;
    new_xp: number;
    new_level: number;
    level_up: boolean;
    unlocked_achievements: any[];
    answers: Array<{
      question_id: number;
      question_text: string;
      user_answer: string;
      correct_answer: string;
      explanation: string;
      topic?: string;
      is_correct: boolean;
    }>;
  }>('/quizzes/submit', { method: 'POST', body: JSON.stringify(body) }),
  getQuizHistory: () => request<{ history: QuizAttempt[] }>('/quizzes/history'),

  // Practice
  getPracticeQuestions: (params: { subject_id?: number | string; chapter_id?: number | string; difficulty?: string; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ questions: Question[] }>(`/practice/questions?${query}`);
  },
  submitPracticeAnswer: (body: { question_id: number; user_answer: string; time_taken_seconds?: number }) =>
    request<{ is_correct: boolean; correct_answer: string; explanation: string; xp_earned: number; unlocked_achievements: any[] }>('/practice/answer', { method: 'POST', body: JSON.stringify(body) }),

  // Flashcards
  getFlashcardDecks: () => request<{ decks: FlashcardDeck[] }>('/flashcards/decks'),
  createDeck: (body: any) => request<{ message: string; id: number }>('/flashcards/decks', { method: 'POST', body: JSON.stringify(body) }),
  getDeckCards: (deckId: number | string) => request<{ deck: FlashcardDeck; cards: Flashcard[] }>(`/flashcards/decks/${deckId}/cards`),
  addDeckCard: (deckId: number | string, body: { front: string; back: string }) => request<{ message: string; id: number }>(`/flashcards/decks/${deckId}/cards`, { method: 'POST', body: JSON.stringify(body) }),
  reviewFlashcard: (cardId: number, rating: 'easy' | 'medium' | 'hard') => request<{ message: string; next_interval_days: number }>(`/flashcards/cards/${cardId}/review`, { method: 'POST', body: JSON.stringify({ rating }) }),

  // Notes
  getNotes: (params?: { search?: string; subject_id?: number | string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ notes: Note[] }>(`/notes?${query}`);
  },
  createNote: (body: any) => request<{ message: string; id: number }>('/notes', { method: 'POST', body: JSON.stringify(body) }),
  updateNote: (id: number, body: any) => request<{ message: string }>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteNote: (id: number) => request<{ message: string }>(`/notes/${id}`, { method: 'DELETE' }),
  togglePinNote: (id: number) => request<{ is_pinned: boolean }>(`/notes/${id}/pin`, { method: 'POST' }),

  // Planner
  getGoals: () => request<{ daily: PlannerGoal[]; weekly: PlannerGoal[]; exam: PlannerGoal[]; all: PlannerGoal[] }>('/planner/goals'),
  createGoal: (body: any) => request<{ message: string; id: number }>('/planner/goals', { method: 'POST', body: JSON.stringify(body) }),
  toggleGoal: (id: number) => request<{ is_completed: boolean; xpEarned: number }>(`/planner/goals/${id}/toggle`, { method: 'PUT' }),
  deleteGoal: (id: number) => request<{ message: string }>(`/planner/goals/${id}`, { method: 'DELETE' }),

  // Timer
  logStudySession: (body: { duration_seconds: number; session_type: string; subject_id?: number | null }) =>
    request<{ message: string; xpEarned: number; streak: number; unlockedAchievements: any[] }>('/timer/session', { method: 'POST', body: JSON.stringify(body) }),

  // Mistake Book
  getMistakes: () => request<{ mistakes: MistakeItem[] }>('/mistakes'),
  saveMistake: (body: any) => request<{ message: string; id: number }>('/mistakes', { method: 'POST', body: JSON.stringify(body) }),
  toggleResolveMistake: (id: number) => request<{ is_resolved: boolean }>(`/mistakes/${id}/resolve`, { method: 'PUT' }),
  deleteMistake: (id: number) => request<{ message: string }>(`/mistakes/${id}`, { method: 'DELETE' }),

  // Progress
  getProgressSummary: () => request<{
    streak: number;
    xp: number;
    level: number;
    totalStudyHours: number;
    totalStudyMinutes: number;
    chaptersCompleted: number;
    flashcardsReviewed: number;
    totalQuestionsAnswered: number;
    completedLessons: number;
    totalLessons: number;
    lessonProgressPercent: number;
    weeklyActivity: Array<{ date: string; day: string; minutes: number }>;
    subjectBreakdown: Array<{ subject: string; color: string; accuracy: number; attempts: number }>;
  }>('/progress/summary'),

  // Achievements
  getAchievements: () => request<{ achievements: Achievement[]; unlockedCount: number; totalCount: number }>('/achievements'),

  // Exam Mode
  startExam: (body: any) => request<{ exam_id: string; time_limit_minutes: number; total_questions: number; questions: any[] }>('/exam/start', { method: 'POST', body: JSON.stringify(body) }),

  // Leaderboard
  getLeaderboard: () => request<{ leaderboard: Array<{ rank: number; id: number; displayName: string; grade: string; xp: number; level: number; streak: number; isCurrentUser: boolean }> }>('/leaderboard'),

  // Search
  searchGlobal: (q: string) => request<{ results: { subjects: any[]; chapters: any[]; lessons: any[]; notes: any[]; questions: any[]; flashcards: any[] } }>(`/search?q=${encodeURIComponent(q)}`),

  // Bookmarks
  getBookmarks: () => request<{ bookmarks: Bookmark[] }>('/bookmarks'),
  addBookmark: (body: any) => request<{ message: string }>('/bookmarks', { method: 'POST', body: JSON.stringify(body) }),
  removeBookmark: (item_type: string, item_id: number) => request<{ message: string }>(`/bookmarks/${item_type}/${item_id}`, { method: 'DELETE' }),

  // Reports
  submitReport: (body: any) => request<{ message: string; id: number }>('/reports', { method: 'POST', body: JSON.stringify(body) }),
  getReports: () => request<{ reports: ReportItem[] }>('/reports'),
  updateReportStatus: (id: number, body: { status: string; admin_notes?: string }) => request<{ message: string }>(`/reports/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),

  // Admin
  getAdminOverview: () => request<{ stats: any; aiConfigured: boolean }>('/admin/overview'),
  getAdminUsers: () => request<{ users: User[] }>('/admin/users'),
  updateUserRole: (id: number, role: string) => request<{ message: string }>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  addAdminQuestion: (body: any) => request<{ message: string; id: number }>('/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  deleteAdminQuestion: (id: number) => request<{ message: string }>(`/admin/questions/${id}`, { method: 'DELETE' }),
  getAdminAiConfig: () => request<{ geminiApiKeySet: boolean; maskedKey: string; model: string }>('/admin/ai-config'),
  saveAdminAiConfig: (body: { apiKey?: string; model?: string }) => request<{ message: string }>('/admin/ai-config', { method: 'POST', body: JSON.stringify(body) }),
};
