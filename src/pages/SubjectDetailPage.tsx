import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  BookOpen,
  Plus,
  ArrowRight,
  Zap,
  HelpCircle,
  Layers,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  Target,
} from 'lucide-react';
import { api } from '../services/api';
import { Subject, ChapterWithTopics } from '../types';

interface SubjectDetailPageProps {
  subjectId: string | number;
  onNavigate: (path: string) => void;
}

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subjectId,
  onNavigate,
}) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<ChapterWithTopics[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Chapter Modal
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    try {
      const [subData, chapData] = await Promise.all([
        api.getSubject(subjectId),
        api.getChaptersWithTopics(subjectId).catch(() => ({ chapters: [] })),
      ]);
      setSubject(subData.subject);
      setChapters(chapData.chapters || (subData.chapters as any) || []);
    } catch (err) {
      console.error('Failed to load subject details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      await api.createChapter(subjectId, {
        title: newTitle.trim(),
        description: newDesc.trim(),
      });
      setNewTitle('');
      setNewDesc('');
      setAddChapterOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create chapter');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading subject curriculum...</div>;
  }

  if (!subject) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Subject not found</h3>
        <button
          onClick={() => onNavigate('/subjects')}
          className="mt-4 text-xs font-semibold text-indigo-600 hover:underline"
        >
          Return to All Subjects
        </button>
      </div>
    );
  }

  const totalTopics = chapters.reduce((acc, c) => acc + (c.totalTopics || 0), 0);
  const totalStrong = chapters.reduce((acc, c) => acc + (c.strongCount || 0), 0);
  const totalLearning = chapters.reduce((acc, c) => acc + (c.learningCount || 0), 0);

  const subjectMastery =
    totalTopics > 0
      ? Math.round(((totalStrong * 1.0 + totalLearning * 0.5) / totalTopics) * 100)
      : 50;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/subjects')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Curriculum Subjects
      </button>

      {/* Subject Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {subject.code} • {subject.grade_level || 'Grade 10'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {subject.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
              {subject.description || 'Comprehensive curriculum with chapters, competencies, and practice drills.'}
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {subjectMastery}%
            </div>
            <div className="text-[11px] text-slate-400">
              {chapters.length} Chapters • {totalTopics} Topics
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${subjectMastery}%` }}
          />
        </div>

        {/* Subject Quick Actions */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate(`/tutor?subject=${encodeURIComponent(subject.name)}`)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Brain className="w-4 h-4" /> Ask AI Tutor
          </button>
          <button
            onClick={() => onNavigate(`/quizzes?subject_id=${subject.id}`)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500" /> Subject Diagnostic Quiz
          </button>
          <button
            onClick={() => onNavigate(`/practice?subject_id=${subject.id}`)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" /> Practice Bank
          </button>
          <button
            onClick={() => setAddChapterOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Chapter
          </button>
        </div>
      </div>

      {/* Chapters Grid / List (Section #2 & #7) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" /> Curriculum Chapters ({chapters.length})
          </h2>
          <span className="text-xs text-slate-400">Click a chapter to explore topics & lessons</span>
        </div>

        <div className="space-y-4">
          {chapters.map((ch, idx) => {
            const mastery = ch.progressPercent ?? 0;
            return (
              <div
                key={ch.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Chapter {ch.order_num || idx + 1}
                    </span>
                    {ch.needsAttention && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Needs Attention
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => onNavigate(`/chapters/${ch.id}`)}
                    className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {ch.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl leading-relaxed">
                    {ch.description || 'Master key principles, formulas, and topic competencies.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>
                      {ch.totalTopics ? `${ch.totalTopics} Topics` : `${ch.topics?.length || 3} Topics`}
                    </span>
                    {ch.strongCount !== undefined && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {ch.strongCount} Strong
                      </span>
                    )}
                    {ch.learningCount !== undefined && ch.learningCount > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {ch.learningCount} Learning
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Progress & Chapter Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Mastery</span>
                      <span>{mastery}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(`/chapters/${ch.id}`)}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    <span>Open Chapter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD CHAPTER MODAL */}
      {addChapterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Add Chapter to {subject.name}
              </h3>
              <button
                onClick={() => setAddChapterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Quadratic Equations & Inequalities"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="e.g. Solving equations with factoring and the quadratic formula"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddChapterOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {creating ? 'Adding...' : 'Create Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
