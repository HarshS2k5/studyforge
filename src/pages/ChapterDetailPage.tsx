import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  HelpCircle,
  Layers,
  ChevronLeft,
  Plus,
  AlertTriangle,
  Sparkles,
  Brain,
  X,
  Target,
} from 'lucide-react';
import { api } from '../services/api';
import { Chapter, Lesson, Topic } from '../types';

interface ChapterDetailPageProps {
  chapterId: string | number;
  onNavigate: (path: string) => void;
}

export const ChapterDetailPage: React.FC<ChapterDetailPageProps> = ({ chapterId, onNavigate }) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Topic Modal
  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  useEffect(() => {
    loadChapterData();
  }, [chapterId]);

  const loadChapterData = async () => {
    try {
      const data = await api.getChapter(chapterId);
      setChapter(data.chapter);
      setLessons(data.lessons || []);
      setTopics(data.topics || []);
    } catch (err) {
      console.error('Failed to load chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopicStatus = async (topicId: number, newStatus: 'not_started' | 'learning' | 'strong') => {
    try {
      setTopics(prev =>
        prev.map(t => (t.id === topicId ? { ...t, status: newStatus } : t))
      );
      await api.updateTopicProgress(topicId, newStatus);
    } catch (err) {
      console.error('Failed to update topic status', err);
      loadChapterData();
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    setCreatingTopic(true);
    try {
      await api.createTopic(chapterId, {
        title: newTopicTitle.trim(),
        description: newTopicDesc.trim(),
      });
      setNewTopicTitle('');
      setNewTopicDesc('');
      setAddTopicOpen(false);
      await loadChapterData();
    } catch (err: any) {
      alert(err.message || 'Failed to create topic');
    } finally {
      setCreatingTopic(false);
    }
  };

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

  // Calculate stats
  const totalTopics = topics.length;
  const strongCount = topics.filter(t => t.status === 'strong').length;
  const learningCount = topics.filter(t => t.status === 'learning').length;
  const notStartedCount = topics.filter(t => !t.status || t.status === 'not_started').length;
  const needsAttention = learningCount > 0 || (notStartedCount > 0 && strongCount === 0);

  const topicMasteryPercent =
    totalTopics > 0
      ? Math.round(((strongCount * 1.0 + learningCount * 0.5) / totalTopics) * 100)
      : lessons.length > 0
      ? Math.round((lessons.filter(l => l.completed).length / lessons.length) * 100)
      : 0;

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {chapter.subject_name} • Chapter {chapter.order_num}
              </span>
              {needsAttention && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Needs Attention
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {chapter.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {chapter.description}
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {topicMasteryPercent}%
            </div>
            <div className="text-[11px] text-slate-400">
              {strongCount} Strong • {learningCount} Learning • {notStartedCount} Not Started
            </div>
          </div>
        </div>

        {/* Mastery Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${topicMasteryPercent}%` }}
          />
        </div>

        {/* Quick Chapter Actions: Practice, Quiz, Flashcards */}
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
          <button
            onClick={() => setAddTopicOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Topic
          </button>
        </div>
      </div>

      {/* TOPICS BREAKDOWN & MASTERY STATUS (Required by Section #2) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" /> Topics & Competencies ({topics.length})
          </h2>
          <span className="text-xs text-slate-400">
            Click status to mark your mastery level
          </span>
        </div>

        {topics.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
            No topics added yet. Click &quot;Add Topic&quot; above to organize this chapter!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {topics.map(t => {
              const currentStatus = t.status || 'not_started';
              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {t.title}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {t.description}
                      </p>
                    )}
                  </div>

                  {/* Status Pills Selector */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateTopicStatus(t.id, 'not_started')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        currentStatus === 'not_started'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs ring-1 ring-slate-400'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      Not Started
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTopicStatus(t.id, 'learning')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        currentStatus === 'learning'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 shadow-2xs ring-1 ring-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                      }`}
                    >
                      Learning
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTopicStatus(t.id, 'strong')}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                        currentStatus === 'strong'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 shadow-2xs ring-1 ring-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      Strong (+15 XP)
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate(`/tutor?subject=${encodeURIComponent(chapter.subject_name || '')}&topic=${encodeURIComponent(t.title)}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                      title="Ask AI Tutor about this topic"
                    >
                      <Brain className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lessons List */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" /> Structured Lessons ({lessons.length})
          </h2>
          <span className="text-xs text-slate-400">Step-by-step interactive study material</span>
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

      {/* ADD TOPIC MODAL */}
      {addTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Add Topic to {chapter.title}
              </h3>
              <button
                onClick={() => setAddTopicOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Quadratic Formula & Discriminant"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newTopicDesc}
                  onChange={e => setNewTopicDesc(e.target.value)}
                  placeholder="e.g. Understanding real vs complex roots"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddTopicOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTopic}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {creatingTopic ? 'Adding...' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
