import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  ArrowRight,
  Calculator,
  Atom,
  Languages,
  Globe2,
  Code2,
  Zap,
  Layers,
  HelpCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { Subject } from '../types';
import { useAuth } from '../context/AuthContext';

interface SubjectsPageProps {
  onNavigate: (path: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: '',
    grade_level: 'Grade 10',
    color: 'indigo',
    icon: 'BookOpen',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    try {
      const data = await api.getSubjects();
      setSubjects(data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code) {
      setError('Please provide a subject name and short code');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.createSubject(newSubject);
      await loadSubjects();
      setIsAddModalOpen(false);
      setNewSubject({
        name: '',
        code: '',
        description: '',
        grade_level: 'Grade 10',
        color: 'indigo',
        icon: 'BookOpen',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create subject');
    } finally {
      setCreating(false);
    }
  };

  const getSubjectIcon = (code: string) => {
    switch (code) {
      case 'MATH':
        return <Calculator className="w-6 h-6 text-indigo-500" />;
      case 'SCI':
        return <Atom className="w-6 h-6 text-emerald-500" />;
      case 'ENG':
        return <BookOpen className="w-6 h-6 text-amber-500" />;
      case 'HIN':
        return <Languages className="w-6 h-6 text-rose-500" />;
      case 'SOC':
        return <Globe2 className="w-6 h-6 text-blue-500" />;
      case 'CS':
        return <Code2 className="w-6 h-6 text-purple-500" />;
      default:
        return <Sparkles className="w-6 h-6 text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Curriculum Subjects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore chapters, structured lessons, interactive practice problems, and smart quizzes.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Grid of Subjects */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading curriculum subjects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(sub => {
            const progress = sub.stats?.progressPercent || 0;
            return (
              <div
                key={sub.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center">
                      {getSubjectIcon(sub.code)}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {sub.grade_level || 'All Grades'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                      <span>Curriculum Completion</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Stats Badges */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white">{sub.stats?.chapterCount || 0}</div>
                      <div className="text-[10px] text-slate-400">Chapters</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white">{sub.stats?.lessonCount || 0}</div>
                      <div className="text-[10px] text-slate-400">Lessons</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white">{sub.stats?.questionCount || 0}</div>
                      <div className="text-[10px] text-slate-400">Questions</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigate(`/practice?subject_id=${sub.id}`)}
                      title="Practice questions"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate(`/quizzes?subject_id=${sub.id}`)}
                      title="Generate quiz"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onNavigate('/flashcards')}
                      title="Study flashcards"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onNavigate(`/subjects/${sub.id}`)}
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    View Chapters <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add New Subject</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add a custom academic subject to your personalized syllabus.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={newSubject.name}
                  onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="e.g. Environmental Studies"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubject.code}
                    onChange={e => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. EVS"
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Grade Level
                  </label>
                  <select
                    value={newSubject.grade_level}
                    onChange={e => setNewSubject({ ...newSubject, grade_level: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Grade 8 - 10">Grade 8 - 10</option>
                    <option value="Grade 11 - 12">Grade 11 - 12</option>
                    <option value="College">College</option>
                    <option value="All Grades">All Grades</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newSubject.description}
                  onChange={e => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Summary of topics covered in this subject..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? 'Adding...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
