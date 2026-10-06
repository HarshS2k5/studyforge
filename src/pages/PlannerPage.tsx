import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Trophy,
  Sparkles,
  BookOpen,
  X,
  Target,
} from 'lucide-react';
import { api } from '../services/api';
import { PlannerGoal, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

export const PlannerPage: React.FC = () => {
  const { user, updateUserStats } = useAuth();
  const [goals, setGoals] = useState<{
    daily: PlannerGoal[];
    weekly: PlannerGoal[];
    exam: PlannerGoal[];
    all: PlannerGoal[];
  }>({ daily: [], weekly: [], exam: [], all: [] });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    type: 'daily',
    title: '',
    subject_id: 1,
    target_minutes: 30,
    scheduled_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
    loadSubjects();
  }, []);

  async function loadGoals() {
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (e) {
      console.error('Failed to load planner goals:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects() {
    try {
      const data = await api.getSubjects();
      setSubjects(data.subjects || []);
    } catch (e) {}
  }

  const handleToggleGoal = async (id: number) => {
    try {
      const res = await api.toggleGoal(id);
      if (user && res.xpEarned > 0) {
        updateUserStats(user.xp + res.xpEarned, user.level, false);
      }
      await loadGoals();
    } catch (e) {
      console.error('Failed to toggle goal:', e);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await api.deleteGoal(id);
      await loadGoals();
    } catch (e) {
      console.error('Failed to delete goal:', e);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    try {
      await api.createGoal(newGoal);
      setIsAddModalOpen(false);
      setNewGoal({
        type: 'daily',
        title: '',
        subject_id: subjects[0]?.id || 1,
        target_minutes: 30,
        scheduled_date: new Date().toISOString().split('T')[0],
      });
      await loadGoals();
    } catch (e) {
      console.error('Failed to create goal:', e);
    }
  };

  // Timetable example days
  const scheduleDays = [
    { day: 'Monday', sessions: [{ subject: 'Math', mins: 30 }, { subject: 'Science', mins: 20 }] },
    { day: 'Tuesday', sessions: [{ subject: 'English', mins: 30 }] },
    { day: 'Wednesday', sessions: [{ subject: 'Computer Science', mins: 45 }, { subject: 'Hindi', mins: 20 }] },
    { day: 'Thursday', sessions: [{ subject: 'Social Science', mins: 30 }, { subject: 'Math', mins: 25 }] },
    { day: 'Friday', sessions: [{ subject: 'Science (Physics)', mins: 40 }] },
    { day: 'Saturday', sessions: [{ subject: 'Full Practice & Flashcards', mins: 60 }] },
    { day: 'Sunday', sessions: [{ subject: 'Weekly Review & Planner', mins: 20 }] },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-500" /> Study Planner & Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Schedule subjects, set daily and exam targets, and maintain a consistent learning rhythm.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Goal
        </button>
      </div>

      {/* 1. WEEKLY CALENDAR & TIMETABLE OVERVIEW (Section #14 Example) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-500" /> Weekly Timetable Structure
          </h2>
          <span className="text-xs text-slate-400">Weekly Target: 4.5 Hours</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {scheduleDays.map((item, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex flex-col justify-between"
            >
              <div className="font-bold text-xs text-slate-900 dark:text-white mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-700">
                {item.day}
              </div>

              <div className="space-y-1.5">
                {item.sessions.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[11px]"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{s.subject}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-indigo-500" /> {s.mins} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. GOALS COLUMNS: Daily, Weekly, Exam Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Goals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-500" /> Daily Goals
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {goals.daily.filter(g => g.is_completed).length} / {goals.daily.length} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {goals.daily.map(g => (
              <div
                key={g.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  g.is_completed
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => handleToggleGoal(g.id)}
                  className="flex items-start gap-2.5 text-left text-xs font-semibold cursor-pointer"
                >
                  {g.is_completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={g.is_completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                      {g.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {g.target_minutes} min • {g.subject_name || 'Academics'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDeleteGoal(g.id)}
                  className="text-slate-300 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Goals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-purple-500" /> Weekly Goals
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              {goals.weekly.filter(g => g.is_completed).length} / {goals.weekly.length} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {goals.weekly.map(g => (
              <div
                key={g.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  g.is_completed
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => handleToggleGoal(g.id)}
                  className="flex items-start gap-2.5 text-left text-xs font-semibold cursor-pointer"
                >
                  {g.is_completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={g.is_completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                      {g.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {g.target_minutes} min • {g.subject_name || 'Curriculum Goal'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDeleteGoal(g.id)}
                  className="text-slate-300 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Goals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" /> Exam Targets
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              {goals.exam.filter(g => g.is_completed).length} / {goals.exam.length} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {goals.exam.map(g => (
              <div
                key={g.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  g.is_completed
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => handleToggleGoal(g.id)}
                  className="flex items-start gap-2.5 text-left text-xs font-semibold cursor-pointer"
                >
                  {g.is_completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={g.is_completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                      {g.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      Target: {g.target_minutes} min • {g.subject_name || 'Exam Target'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDeleteGoal(g.id)}
                  className="text-slate-300 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Create Goal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create Study Goal</h3>
            <p className="text-xs text-slate-500 mb-4">Set clear, achievable academic targets.</p>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={newGoal.title}
                  onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Master Linear Equations"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={newGoal.type}
                    onChange={e => setNewGoal({ ...newGoal, type: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="daily">Daily Goal</option>
                    <option value="weekly">Weekly Goal</option>
                    <option value="exam">Exam Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Minutes
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={newGoal.target_minutes}
                    onChange={e => setNewGoal({ ...newGoal, target_minutes: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newGoal.subject_id}
                  onChange={e => setNewGoal({ ...newGoal, subject_id: Number(e.target.value) })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
