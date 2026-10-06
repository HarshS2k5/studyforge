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
  RotateCw,
  Play,
  SkipForward,
  AlertCircle,
  HelpCircle,
  Zap,
  Layers,
  Flame,
} from 'lucide-react';
import { api } from '../services/api';
import { PlannerGoal, Subject, StudyPlan, StudyPlanActivity, Exam } from '../types';
import { useAuth } from '../context/AuthContext';

interface PlannerPageProps {
  onNavigate?: (path: string) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({ onNavigate }) => {
  const { user, updateUserStats } = useAuth();

  // Daily Plan State
  const [dailyPlan, setDailyPlan] = useState<StudyPlan | null>(null);
  const [regeneratingPlan, setRegeneratingPlan] = useState(false);

  // Exams State
  const [exams, setExams] = useState<Exam[]>([]);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    title: '',
    subject_id: 1,
    exam_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    priority: 'high' as 'low' | 'medium' | 'high',
    chapters_included: 'Chapters 1-4',
  });

  // Goals & Timetable State
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
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const [goalsRes, subRes, planRes, examRes] = await Promise.all([
        api.getGoals(),
        api.getSubjects(),
        api.getDailyPlan().catch(() => null),
        api.getExams().catch(() => ({ exams: [] })),
      ]);
      setGoals(goalsRes);
      setSubjects(subRes.subjects || []);
      if (planRes) setDailyPlan(planRes);
      setExams(examRes.exams || []);

      if (subRes.subjects && subRes.subjects.length > 0) {
        setNewExam(e => ({ ...e, subject_id: subRes.subjects[0].id }));
        setNewGoal(g => ({ ...g, subject_id: subRes.subjects[0].id }));
      }
    } catch (e) {
      console.error('Failed to load planner data:', e);
    } finally {
      setLoading(false);
    }
  }

  // Study Plan Actions
  const handleUpdateActivityStatus = async (activityId: number, status: string) => {
    try {
      const res = await api.updatePlanActivity(activityId, status);
      if (status === 'completed' && res.xpEarned && user) {
        updateUserStats(user.xp + res.xpEarned, user.level, false);
      }
      const refreshed = await api.getDailyPlan();
      setDailyPlan(refreshed);
    } catch (e) {
      console.error('Failed to update plan activity:', e);
    }
  };

  const handleRegeneratePlan = async () => {
    setRegeneratingPlan(true);
    try {
      await api.regenerateDailyPlan();
      const refreshed = await api.getDailyPlan();
      setDailyPlan(refreshed);
    } catch (e) {
      console.error('Failed to regenerate plan:', e);
    } finally {
      setRegeneratingPlan(false);
    }
  };

  // Exam Actions
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.title.trim()) return;

    try {
      await api.createExam({
        subject_id: newExam.subject_id,
        title: newExam.title.trim(),
        exam_date: newExam.exam_date,
        priority: newExam.priority,
        chapter_ids: [1, 2],
      });
      setExamModalOpen(false);
      setNewExam(prev => ({ ...prev, title: '' }));
      const examRes = await api.getExams();
      setExams(examRes.exams || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create exam');
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!confirm('Remove this exam countdown?')) return;
    try {
      await api.deleteExam(id);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete exam', err);
    }
  };

  // Goals Actions
  const handleToggleGoal = async (id: number) => {
    try {
      const res = await api.toggleGoal(id);
      if (user && res.xpEarned > 0) {
        updateUserStats(user.xp + res.xpEarned, user.level, false);
      }
      const data = await api.getGoals();
      setGoals(data);
    } catch (e) {
      console.error('Failed to toggle goal:', e);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await api.deleteGoal(id);
      const data = await api.getGoals();
      setGoals(data);
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
      const data = await api.getGoals();
      setGoals(data);
    } catch (e) {
      console.error('Failed to create goal:', e);
    }
  };

  // Timetable
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
            <CalendarIcon className="w-7 h-7 text-indigo-500" /> Study Planner & Exam Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalized daily schedule, upcoming exam countdowns, and structured weekly timetable.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setExamModalOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-500" /> Add Exam
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
      </div>

      {/* 1. EXAM COUNTDOWN STRIP (Section #6) */}
      {exams.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-500" /> Upcoming Exam Deadlines
            </h2>
            <span className="text-xs text-slate-400">{exams.length} Exams scheduled</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {exams.map(exam => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-amber-400/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {exam.subject_name || 'Subject'}
                    </span>
                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-rose-500 text-white shadow-xs">
                      {exam.countdownBadge || `${exam.daysLeft} DAYS LEFT`}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {exam.title}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>Target Date: {exam.exam_date}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Priority: {exam.priority?.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                    title="Remove exam"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. "STUDY TODAY" — SMART DAILY STUDY PLAN (Section #7 Flagship) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Flagship Feature
              </span>
              <span className="text-xs text-slate-300">
                {dailyPlan?.planDate || 'Today'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold mt-1 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-400" /> Study Today — Daily Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Dynamically adapted to upcoming exams, active weak topics, and scheduled flashcards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRegeneratePlan}
              disabled={regeneratingPlan}
              className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${regeneratingPlan ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Progress metric */}
        {dailyPlan && (
          <div className="space-y-1.5 bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>
                Progress: {dailyPlan.completedCount} of {dailyPlan.totalCount} Tasks Done
              </span>
              <span>
                {dailyPlan.completedMinutes} / {dailyPlan.totalMinutes} mins completed
              </span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${dailyPlan.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Planned Activities */}
        <div className="space-y-3">
          {dailyPlan?.activities.map((act: StudyPlanActivity) => {
            const isDone = act.status === 'completed';
            const isSkipped = act.status === 'skipped';

            return (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  isDone
                    ? 'bg-emerald-950/40 border-emerald-500/40 opacity-80'
                    : isSkipped
                    ? 'bg-white/5 border-white/10 opacity-50'
                    : 'bg-white/10 border-white/15 hover:border-indigo-400/50'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200">
                      {act.subject}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                      {act.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-300" /> ~{act.durationMinutes} min
                    </span>
                  </div>

                  <h4
                    className={`font-bold text-sm sm:text-base ${
                      isDone ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {act.title}
                  </h4>

                  {/* Reason for Suggestion (Required by Section #7) */}
                  <div className="text-xs text-amber-200/90 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>Suggested because: {act.reason}</span>
                  </div>
                </div>

                {/* Activity Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDone && !isSkipped && (
                    <>
                      <button
                        onClick={() => handleUpdateActivityStatus(act.id, 'completed')}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done (+25 XP)
                      </button>

                      {onNavigate && (
                        <button
                          onClick={() =>
                            onNavigate(
                              `/timer?subject=${encodeURIComponent(act.subject)}&topic=${encodeURIComponent(act.title)}&duration=${act.durationMinutes}`
                            )
                          }
                          className="py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Start Focus Timer"
                        >
                          <Play className="w-3.5 h-3.5" /> Focus
                        </button>
                      )}

                      <button
                        onClick={() => handleUpdateActivityStatus(act.id, 'skipped')}
                        className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                        title="Skip for today"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isDone && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Finished
                    </span>
                  )}

                  {isSkipped && (
                    <span className="text-xs text-slate-400">Skipped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. WEEKLY CALENDAR & TIMETABLE OVERVIEW */}
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

      {/* 4. GOALS COLUMNS: Daily, Weekly, Exam Targets */}
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

      {/* Modal: Create Exam */}
      {examModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> Schedule Upcoming Exam
              </h3>
              <button
                onClick={() => setExamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  value={newExam.title}
                  onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="e.g. Mid-Term Mathematics Assessment"
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newExam.subject_id}
                    onChange={e => setNewExam({ ...newExam, subject_id: Number(e.target.value) })}
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
                    value={newExam.priority}
                    onChange={e => setNewExam({ ...newExam, priority: e.target.value as any })}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Exam Date *
                </label>
                <input
                  type="date"
                  required
                  value={newExam.exam_date}
                  onChange={e => setNewExam({ ...newExam, exam_date: e.target.value })}
                  className="w-full py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExamModalOpen(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
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
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
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
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
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
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none"
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
