import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Bookmark,
  Share2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Brain,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import { Lesson } from '../types';
import { useAuth } from '../context/AuthContext';

interface LessonViewerPageProps {
  lessonId: string | number;
  onNavigate: (path: string) => void;
  onOpenReport: (contentId?: string, contentType?: string) => void;
}

export const LessonViewerPage: React.FC<LessonViewerPageProps> = ({
  lessonId,
  onNavigate,
  onOpenReport,
}) => {
  const { user, updateUserStats } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nav, setNav] = useState<{ prevLesson: any; nextLesson: any }>({ prevLesson: null, nextLesson: null });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    async function loadLesson() {
      try {
        setLoading(true);
        const data = await api.getLesson(lessonId);
        setLesson(data.lesson);
        setBookmarked(Boolean(data.lesson.isBookmarked));
        setNav(data.navigation || { prevLesson: null, nextLesson: null });
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId]);

  const handleComplete = async () => {
    if (!lesson) return;
    setCompleting(true);
    try {
      const res = await api.completeLesson(lesson.id);
      setLesson({ ...lesson, completed: true });
      updateUserStats(res.newXp, res.newLevel, res.levelUp, res.unlockedAchievements);
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setCompleting(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!lesson || !user) return;
    try {
      if (bookmarked) {
        await api.removeBookmark('lesson', lesson.id);
        setBookmarked(false);
      } else {
        await api.addBookmark({
          item_type: 'lesson',
          item_id: lesson.id,
          title: lesson.title,
          subtitle: `${lesson.subject_name || 'Subject'} • ${lesson.chapter_title || 'Chapter'}`,
          link: `/lessons/${lesson.id}`,
        });
        setBookmarked(true);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading lesson content...</div>;
  }

  if (!lesson) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Lesson not found</h3>
        <button onClick={() => onNavigate('/subjects')} className="mt-4 text-xs font-semibold text-indigo-600 hover:underline">
          Return to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onNavigate(`/chapters/${lesson.chapter_id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Chapter
        </button>

        <div className="flex items-center gap-2">
          {/* Ask AI Tutor quick trigger */}
          <button
            onClick={() => onNavigate(`/tutor?subject=${encodeURIComponent(lesson.subject_name || '')}&topic=${encodeURIComponent(lesson.title)}`)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" /> Ask AI Tutor
          </button>

          {/* Bookmark */}
          <button
            onClick={handleToggleBookmark}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              bookmarked
                ? 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
          </button>

          {/* Report Content */}
          <button
            onClick={() => onOpenReport(String(lesson.id), 'Lesson')}
            title="Report typo or error"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lesson Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <span>{lesson.subject_name}</span>
          <span>•</span>
          <span>{lesson.chapter_title}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {lesson.title}
        </h1>

        <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {lesson.estimated_minutes || 15} minutes
          </span>
          {lesson.completed && (
            <span className="flex items-center gap-1 text-emerald-500 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Markdown Article Content */}
      <article className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base space-y-4">
        {/* Render markdown sections formatted nicely */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="text-sm sm:text-base whitespace-pre-line font-sans leading-relaxed">
            {lesson.content_markdown}
          </div>
        </div>
      </article>

      {/* Interactive Completion Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {lesson.completed ? 'Lesson Finished!' : 'Finished Reading?'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lesson.completed
              ? 'Great work! You earned +30 XP and advanced your daily streak.'
              : 'Mark this lesson as completed to log progress and earn +30 XP!'}
          </p>
        </div>

        <button
          onClick={handleComplete}
          disabled={completing || lesson.completed}
          className={`py-3 px-6 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer ${
            lesson.completed
              ? 'bg-emerald-600 text-white cursor-default shadow-emerald-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 hover:scale-105'
          }`}
        >
          {lesson.completed ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Lesson Completed (+30 XP)
            </>
          ) : completing ? (
            'Saving...'
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Mark as Completed
            </>
          )}
        </button>
      </div>

      {/* Prev / Next Navigation Footer */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        {nav.prevLesson ? (
          <button
            onClick={() => onNavigate(`/lessons/${nav.prevLesson.id}`)}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> {nav.prevLesson.title}
          </button>
        ) : <div />}

        {nav.nextLesson && (
          <button
            onClick={() => onNavigate(`/lessons/${nav.nextLesson.id}`)}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            {nav.nextLesson.title} <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
