import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Flame,
  Trophy,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  BookOpen,
  Brain,
  Layers,
  Zap,
  Target,
  Award,
  ChevronRight,
  BarChart3,
  Calendar,
  AlertTriangle,
  Gift,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Subject, PlannerGoal, DailyChallenge, WeakTopic, Exam, StudyPlan } from '../types';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, updateUserStats } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [goals, setGoals] = useState<PlannerGoal[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [dailyPlan, setDailyPlan] = useState<StudyPlan | null>(null);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, goalsRes, progRes, challengeRes, weakRes, examRes, planRes] =
          await Promise.allSettled([
            api.getSubjects(),
            user ? api.getGoals() : Promise.resolve({ daily: [], weekly: [], exam: [], all: [] }),
            user ? api.getProgressSummary() : Promise.resolve(null),
            api.getDailyChallenge().catch(() => ({ challenges: [] })),
            api.getWeakTopics().catch(() => ({ weakTopics: [] })),
            api.getExams().catch(() => ({ exams: [] })),
            api.getDailyPlan().catch(() => null),
          ]);

        if (subRes.status === 'fulfilled') setSubjects(subRes.value.subjects || []);
        if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.daily || []);
        if (progRes.status === 'fulfilled') setProgressSummary(progRes.value);
        if (challengeRes.status === 'fulfilled') setChallenges(challengeRes.value.challenges || []);
        if (weakRes.status === 'fulfilled') setWeakTopics(weakRes.value.weakTopics || []);
        if (examRes.status === 'fulfilled') setExams(examRes.value.exams || []);
        if (planRes.status === 'fulfilled') setDailyPlan(planRes.value);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleToggleGoal = async (id: number) => {
    try {
      const res = await api.toggleGoal(id);
      setGoals(goals.map(g => (g.id === id ? { ...g, is_completed: res.is_completed ? 1 : 0 } : g)));
    } catch (err) {
      console.error('Failed to toggle goal:', err);
    }
  };

  const handleClaimChallenge = async (challengeId: number) => {
    try {
      const res = await api.claimDailyChallenge(challengeId);
      if (user && res.xpEarned) {
        updateUserStats(user.xp + res.xpEarned, user.level, false);
      }
      const refreshed = await api.getDailyChallenge();
      setChallenges(refreshed.challenges || []);
    } catch (err: any) {
      alert(err.message || 'Challenge already claimed or in progress');
    }
  };

  const username = user?.username || 'Student';
  const streak = user?.streak || 5;
  const xp = user?.xp || 420;
  const level = user?.level || 4;
  const levelTitle = user?.levelInfo?.title || 'Scholar';
  const progressPercent = user?.levelInfo?.progressPercent || 65;

  const upcomingExam = exams.find(e => e.daysLeft >= 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. GREETING & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {user?.grade || 'Grade 10'} • {user?.learning_goals || 'Exam Prep'}
            </span>
            {upcomingExam && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500 text-white shadow-2xs">
                {upcomingExam.countdownBadge} ({upcomingExam.title})
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {username}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep your momentum going! Here is your daily roadmap and study plan.
          </p>
        </div>

        {/* Quick actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/tutor')}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" /> AI Tutor
          </button>
          <button
            onClick={() => onNavigate('/quizzes')}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Start Quiz
          </button>
          <button
            onClick={() => onNavigate('/timer')}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" /> Focus Mode
          </button>
          <button
            onClick={() => onNavigate('/flashcards')}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" /> Flashcards
          </button>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Streak</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            🔥 {streak} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Consistency builds mastery!</p>
        </div>

        {/* Level & XP */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rank & XP</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Level {level} <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">({levelTitle})</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>{xp} XP Total</span>
            <span>{progressPercent}% to next</span>
          </div>
        </div>

        {/* Study Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Study Time</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {progressSummary?.totalStudyHours || Math.round((user?.total_study_seconds || 5400) / 360) / 10} <span className="text-xs font-normal text-slate-400">hours</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Logged in focused Pomodoro sessions</p>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Quiz Accuracy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {user?.stats?.quizAccuracy || 80}%
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Over recent quizzes & tests</p>
        </div>
      </div>

      {/* 3. DAILY CHALLENGE STRIP (Section #11) */}
      {challenges.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Daily Challenge
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  +{challenges[0].xp_awarded} XP
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {challenges[0].title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {challenges[0].description} ({challenges[0].current_count}/{challenges[0].target_count})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleClaimChallenge(challenges[0].id)}
              disabled={challenges[0].is_completed === 1}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              {challenges[0].is_completed === 1 ? 'Claimed (+50 XP)' : 'Claim Challenge Reward'}
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Continue Studying Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-indigo-200 mb-3 backdrop-blur-xs">
                <BookOpen className="w-3.5 h-3.5" /> Continue Studying
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Mathematics: Fractions and Decimals
              </h3>
              <p className="text-xs text-indigo-200 max-w-lg mb-6 leading-relaxed">
                Pick up right where you left off on &ldquo;Operations with Proper and Improper Fractions&rdquo;. Master least common denominators and division reciprocity.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigate('/lessons/1')}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 shadow-md transition-all cursor-pointer"
                >
                  Resume Lesson <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate('/practice')}
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-xs transition-all cursor-pointer"
                >
                  Practice Questions
                </button>
              </div>
            </div>
          </div>

          {/* 5. "FOCUS NEXT" — WEAK TOPIC DETECTOR (Section #8) */}
          {weakTopics.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Focus Next — Weak Topic Detector
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Targeted practice to reinforce challenging areas
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Needs Review</span>
              </div>

              <div className="space-y-3">
                {weakTopics.slice(0, 3).map((wt, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all hover:border-amber-400"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          {wt.subject}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {wt.topic}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <strong>Why weak:</strong> {wt.reason}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        Suggested: {wt.recommendedActivity} (~{wt.recommendedTimeMinutes} mins)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          onNavigate(
                            `/tutor?subject=${encodeURIComponent(wt.subject)}&topic=${encodeURIComponent(wt.topic)}`
                          )
                        }
                        className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5" /> Ask AI Tutor
                      </button>
                      <button
                        onClick={() => onNavigate('/quizzes')}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Quiz Me
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject Progress Overview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Subject Progress</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Curriculum coverage across all enrolled subjects</p>
              </div>
              <button
                onClick={() => onNavigate('/subjects')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View All Subjects
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.slice(0, 4).map(sub => {
                const progress = sub.stats?.progressPercent || (sub.code === 'MATH' ? 50 : sub.code === 'SCI' ? 33 : 0);
                return (
                  <div
                    key={sub.id}
                    onClick={() => onNavigate(`/subjects/${sub.id}`)}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all cursor-pointer group bg-slate-50/50 dark:bg-slate-850"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {sub.name}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                      <span>{sub.stats?.chapterCount || 2} Chapters</span>
                      <span>{sub.stats?.lessonCount || 3} Lessons</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Today's Goals & Daily Plan */}
        <div className="space-y-6">
          {/* Today's Goals Checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Today&apos;s Goals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Check off daily learning habits</p>
              </div>
              <button
                onClick={() => onNavigate('/planner')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Planner
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 1, title: 'Study for 30 minutes', completed: true },
                { id: 2, title: 'Complete 1 lesson', completed: false },
                { id: 3, title: 'Complete 10 questions', completed: false },
                { id: 4, title: 'Review flashcards', completed: true },
              ].map(goal => (
                <div
                  key={goal.id}
                  onClick={() => handleToggleGoal(goal.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    goal.completed
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-600 dark:text-slate-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs font-semibold">
                    {goal.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}>
                      {goal.title}
                    </span>
                  </div>
                  {goal.completed && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+20 XP</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Study Plan Preview (Section #7) */}
          {dailyPlan && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> Today&apos;s Study Plan
                  </h3>
                  <p className="text-xs text-slate-400">
                    {dailyPlan.completedCount} of {dailyPlan.totalCount} tasks finished
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('/planner')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Open Plan
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {dailyPlan.activities.slice(0, 3).map((act, i) => (
                  <div
                    key={act.id || i}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{act.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {act.subject} • ~{act.durationMinutes}m
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
                      {act.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Homework Reminder */}
          <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                Homework & Deadlines
              </h3>
              <button
                onClick={() => onNavigate('/homework')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Tracker &rarr;
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Check your pending assignments, manage submission dates, and claim +25 XP rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
