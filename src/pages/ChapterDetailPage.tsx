import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Zap,
  HelpCircle,
  Layers,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { Chapter, Lesson } from '../types';

interface ChapterDetailPageProps {
  chapterId: string | number;
  onNavigate: (path: string) => void;
}

export const ChapterDetailPage: React.FC<ChapterDetailPageProps> = ({ chapterId, onNavigate }) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChapter() {
      try {
        const data = await api.getChapter(chapterId);
        setChapter(data.chapter);
        setLessons(data.lessons || []);
      } catch (err) {
        console.error('Failed to load chapter:', err);
      } finally {
        setLoading(false);
      }
    }
    loadChapter();
  }, [chapterId]);

  if (loading) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading chapter curriculum...</div>;
  }

  if (!chapter) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Chapter not found</h3>
        <button onClick={() => onNavigate('/subjects')} className="mt-4 text-xs font-semibold text-indigo-600 hover:underline">
          Return to Subjects
        </button>
      </div>
    );
  }

  const completedCount = lessons.filter(l => l.completed).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Breadcrumb & Navigation */}
      <button
        onClick={() => onNavigate(`/subjects/${chapter.subject_id}`)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Back to {chapter.subject_name || 'Subject'}
      </button>

      {/* Chapter Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {chapter.subject_name} • Chapter {chapter.order_num}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {chapter.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {chapter.description}
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{progressPercent}%</div>
            <div className="text-[11px] text-slate-400">
              {completedCount} of {lessons.length} Lessons Finished
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Quick Chapter Actions: Practice, Quiz, Flashcards (Required in Section #7) */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate(`/practice?subject_id=${chapter.subject_id}&chapter_id=${chapter.id}`)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" /> Practice Questions
          </button>
          <button
            onClick={() => onNavigate(`/quizzes?subject_id=${chapter.subject_id}&chapter_id=${chapter.id}`)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500" /> Take Chapter Quiz
          </button>
          <button
            onClick={() => onNavigate('/flashcards')}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-500" /> Flashcards
          </button>
        </div>
      </div>

      {/* Topics / Lessons List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" /> Chapter Topics & Lessons
          </h2>
          <span className="text-xs text-slate-400">{lessons.length} Topics</span>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              onClick={() => onNavigate(`/lessons/${lesson.id}`)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-xs transition-all flex items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {lesson.completed ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {lesson.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lesson.estimated_minutes || 15} mins</span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
