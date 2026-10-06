export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'admin';
  grade: string;
  learning_goals: string;
  study_style: string;
  xp: number;
  level: number;
  streak: number;
  total_study_seconds: number;
  created_at?: string;
  levelInfo?: LevelInfo;
  stats?: {
    completedLessons: number;
    quizCount: number;
    quizAccuracy: number;
    totalQuestions: number;
    flashcardsReviewed: number;
    studyHours: number;
  };
}

export interface LevelInfo {
  level: number;
  title: string;
  currentFloor: number;
  nextCeiling: number;
  progressPercent: number;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  grade_level: string;
  color: string;
  is_custom: number;
  stats?: {
    chapterCount: number;
    lessonCount: number;
    questionCount: number;
    completedLessons: number;
    progressPercent: number;
  };
}

export interface Chapter {
  id: number;
  subject_id: number;
  title: string;
  order_num: number;
  description: string;
  subject_name?: string;
  subject_code?: string;
  lessons?: Lesson[];
  stats?: {
    lessonCount: number;
    completedCount: number;
    progressPercent: number;
    questionCount: number;
  };
}

export interface Lesson {
  id: number;
  chapter_id: number;
  title: string;
  summary: string;
  content_markdown: string;
  order_num: number;
  estimated_minutes: number;
  completed?: boolean;
  isBookmarked?: boolean;
  chapter_title?: string;
  subject_name?: string;
  subject_id?: number;
}

export interface Question {
  id: number;
  subject_id: number;
  chapter_id?: number;
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuizAttempt {
  id: number;
  user_id: number;
  subject_id: number;
  chapter_id?: number;
  quiz_type: string;
  total_questions: number;
  correct_count: number;
  score: number;
  accuracy: number;
  time_taken_seconds: number;
  topics_to_improve: string[];
  answers_json?: string;
  completed_at: string;
  subject_name?: string;
}

export interface FlashcardDeck {
  id: number;
  user_id?: number;
  subject_id?: number;
  chapter_id?: number;
  title: string;
  description: string;
  subject_name?: string;
  total_cards: number;
  mastered_cards: number;
  mastery_percent: number;
}

export interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  repetitions: number;
  interval_days: number;
  next_review_date?: string;
  last_reviewed_at?: string;
}

export interface Note {
  id: number;
  user_id: number;
  subject_id?: number;
  chapter_id?: number;
  title: string;
  content: string;
  is_pinned: number;
  subject_name?: string;
  created_at: string;
  updated_at: string;
}

export interface PlannerGoal {
  id: number;
  user_id: number;
  type: 'daily' | 'weekly' | 'exam';
  title: string;
  subject_id?: number;
  target_minutes: number;
  scheduled_date: string;
  is_completed: number;
  subject_name?: string;
  created_at: string;
}

export interface MistakeItem {
  id: number;
  user_id: number;
  question_id?: number;
  original_question: string;
  student_answer?: string;
  correct_answer: string;
  explanation: string;
  topic?: string;
  subject_name?: string;
  is_resolved: number;
  created_at: string;
}

export interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  isUnlocked?: boolean;
  unlockedAt?: string | null;
}

export interface Bookmark {
  id: number;
  item_type: 'lesson' | 'question' | 'note' | 'flashcard';
  item_id: number;
  title: string;
  subtitle?: string;
  link: string;
  created_at: string;
}

export interface ReportItem {
  id: number;
  user_id?: number;
  category: string;
  description: string;
  content_id?: string;
  content_type?: string;
  status: 'Pending' | 'Reviewing' | 'Resolved';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
  reporter_username?: string;
  reporter_email?: string;
}
