import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Play,
  X,
  Sparkles,
  BookOpen,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Homework, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

interface HomeworkPageProps {
  onNavigate?: (path: string) => void;
}

export const HomeworkPage: React.FC<HomeworkPageProps> = ({ onNavigate }) => {
  const { user, updateUserStats } = useAuth();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'due_today' | 'due_tomorrow' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<number>(1);
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(30);
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success XP popup indicator
  const [xpToast, setXpToast] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hwRes, subRes] = await Promise.all([
        api.getHomework(),
        api.getSubjects(),
      ]);
      setHomeworkList(hwRes.homework || []);
      setSubjects(subRes.subjects || []);
      if (subRes.subjects && subRes.subjects.length > 0) {
        setNewSubjectId(subRes.subjects[0].id);
      }
    } catch (err) {
      console.error('Failed to load homework:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: 'not_started' | 'in_progress' | 'completed') => {
    try {
      setHomeworkList(prev =>
        prev.map(h => (h.id === id ? { ...h, status } : h))
      );
      const res = await api.updateHomework(id, { status });
      if (status === 'completed' && res.xpEarned) {
        if (user) {
          updateUserStats(user.xp + res.xpEarned, user.level, false);
        }
        setXpToast(`+${res.xpEarned} XP Earned for completing homework!`);
        setTimeout(() => setXpToast(null), 3000);
      }
      loadData();
    } catch (err) {
      console.error('Failed to update homework status:', err);
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this homework assignment?')) return;
    try {
      await api.deleteHomework(id);
      setHomeworkList(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete homework:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      await api.createHomework({
        subject_id: newSubjectId,
        title: newTitle.trim(),
        description: newDesc.trim(),
        due_date: newDueDate,
        priority: newPriority,
        estimated_minutes: Number(newEstimatedMinutes) || 30,
      });

      setNewTitle('');
      setNewDesc('');
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create homework');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHomework = homeworkList.filter(item => {
    if (activeTab === 'all') return item.status !== 'completed';
    if (activeTab === 'completed') return item.status === 'completed';
    return item.category === activeTab && item.status !== 'completed';
  });

  const counts = {
    all: homeworkList.filter(h => h.status !== 'completed').length,
    due_today: homeworkList.filter(h => h.category === 'due_today' && h.status !== 'completed').length,
    due_tomorrow: homeworkList.filter(h => h.category === 'due_tomorrow' && h.status !== 'completed').length,
    upcoming: homeworkList.filter(h => h.category === 'upcoming' && h.status !== 'completed').length,
    overdue: homeworkList.filter(h => h.category === 'overdue' && h.status !== 'completed').length,
    completed: homeworkList.filter(h => h.status === 'completed').length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in relative">
      {/* Toast notification */}
      {xpToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>{xpToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-indigo-500" /> Homework & Assignment Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily assignments, stay ahead of deadlines, and earn +25 XP upon completion.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Assignment
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Active ({counts.all})
        </button>

        <button
          onClick={() => setActiveTab('due_today')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'due_today'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Due Today ({counts.due_today})
        </button>

        <button
          onClick={() => setActiveTab('due_tomorrow')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'due_tomorrow'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Due Tomorrow ({counts.due_tomorrow})
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Upcoming ({counts.upcoming})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Overdue ({counts.overdue})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`py-2 px-3.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Homework Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading assignments...</div>
        ) : filteredHomework.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              {activeTab === 'completed' ? 'No completed assignments yet' : 'All caught up! No pending homework in this filter.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'completed' ? 'Complete a task to earn +25 XP' : 'Add new tasks using the button above'}
            </p>
          </div>
        ) : (
          filteredHomework.map(item => {
            const isCompleted = item.status === 'completed';
            const isOverdue = item.category === 'overdue' && !isCompleted;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs ${
                  isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : isOverdue
                    ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                }`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {item.subject_name || 'Subject'}
                    </span>

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.priority === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          : item.priority === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.priority.toUpperCase()} PRIORITY
                    </span>

                    {/* Due Date Relative Tag */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isOverdue
                          ? 'bg-rose-500 text-white'
                          : item.category === 'due_today'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {item.category === 'due_today'
                        ? 'Due Today'
                        : item.category === 'due_tomorrow'
                        ? 'Due Tomorrow'
                        : isOverdue
                        ? 'OVERDUE'
                        : `Due ${item.due_date}`}
                    </span>
                  </div>

                  <h3
                    className={`font-bold text-sm sm:text-base text-slate-900 dark:text-white ${
                      isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ~{item.estimated_minutes} mins
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Status buttons */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'not_started')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      item.status === 'not_started'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 ring-1 ring-slate-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    Not Started
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'in_progress')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      item.status === 'in_progress'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, 'completed')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      item.status === 'completed'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done (+25 XP)</span>
                  </button>

                  {/* Launch Focus Timer */}
                  {onNavigate && !isCompleted && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate(
                          `/timer?subject=${encodeURIComponent(item.subject_name || '')}&topic=${encodeURIComponent(item.title)}&duration=${item.estimated_minutes}`
                        )
                      }
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Start Focus Timer for this assignment"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Delete homework"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD HOMEWORK MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" /> Add Homework Assignment
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Science Chapter 3 Questions 1-15"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newSubjectId}
                    onChange={e => setNewSubjectId(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Est. Minutes
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={newEstimatedMinutes}
                    onChange={e => setNewEstimatedMinutes(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="e.g. Include diagrams and graph plots"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? 'Adding...' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
