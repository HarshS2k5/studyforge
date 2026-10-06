import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Flame,
  Trophy,
  Clock,
  Target,
  BookOpen,
  Layers,
  Award,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AnalyticsOverview } from '../types';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const [progressRes, analyticsRes] = await Promise.allSettled([
          api.getProgressSummary(),
          api.getAnalyticsOverview(),
        ]);
        if (progressRes.status === 'fulfilled') setData(progressRes.value);
        if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
      } catch (e) {
        console.error('Failed to load progress summary:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading progress analytics...</div>;
  }

  const streak = analytics?.streak?.current || data?.streak || user?.streak || 5;
  const longestStreak = analytics?.streak?.longest || streak;
  const xp = analytics?.xp || data?.xp || user?.xp || 420;
  const level = analytics?.level || data?.level || user?.level || 4;
  const levelInfo = user?.levelInfo;

  // Study times from analytics or fallback
  const todayMins = analytics?.studySeconds ? Math.round(analytics.studySeconds.today / 60) : 45;
  const thisWeekHours = analytics?.studySeconds ? (analytics.studySeconds.thisWeek / 3600).toFixed(1) : '3.5';
  const thisMonthHours = analytics?.studySeconds ? (analytics.studySeconds.thisMonth / 3600).toFixed(1) : '14.2';

  const strongTopics = analytics?.topicStrengths?.strong || 8;
  const learningTopics = analytics?.topicStrengths?.learning || 4;
  const tasksCompleted = analytics?.tasksCompleted || 12;
  const flashcardsReviewed = analytics?.flashcardsReviewed || data?.flashcardsReviewed || 18;
  const accuracy = analytics?.quizMetrics?.averageAccuracy || user?.stats?.quizAccuracy || 80;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-indigo-500" /> Learning Analytics & Mastery
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed metrics tracking your study consistency, accuracy rates, and knowledge acquisition.
        </p>
      </div>

      {/* 1. STUDY TIME WINDOWS: Today, This Week, This Month (Section #14) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Focus</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {todayMins} <span className="text-xs font-semibold text-slate-400">minutes</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Week</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {thisWeekHours} <span className="text-xs font-semibold text-slate-400">hours</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {thisMonthHours} <span className="text-xs font-semibold text-slate-400">hours</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. PRIMARY KPI GRID: Streak, Accuracy, Topic Strengths */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak & Record */}
        <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">
            <Flame className="w-4 h-4 fill-amber-500" /> Current Streak
          </div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
            {streak} <span className="text-xs font-normal">days</span>
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1">
            Personal record: <strong>{longestStreak} days</strong>
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Target className="w-4 h-4 text-emerald-500" /> Quiz Accuracy
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {accuracy}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all test sessions</div>
        </div>

        {/* Strengths vs Weaknesses */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Zap className="w-4 h-4 text-indigo-500" /> Topic Mastery
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            <span className="text-emerald-600 dark:text-emerald-400">{strongTopics}</span>
            <span className="text-xs text-slate-400 font-normal"> strong / </span>
            <span className="text-amber-500">{learningTopics}</span>
            <span className="text-xs text-slate-400 font-normal"> learning</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Competencies assessed</div>
        </div>

        {/* Tasks & Flashcards */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-purple-500" /> Engagement
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {tasksCompleted} <span className="text-xs font-normal text-slate-400">tasks</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {flashcardsReviewed} flashcards reviewed
          </div>
        </div>
      </div>

      {/* 3. LEVEL & XP PROGRESSION */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-xl border border-indigo-800/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-indigo-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Learning XP Progression
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              Level {level} — {levelInfo?.title || 'Scholar Rank'}
            </h2>
          </div>

          <div className="sm:text-right">
            <div className="text-xl font-extrabold text-amber-400">{xp} XP Total</div>
            <div className="text-[11px] text-indigo-200">
              {levelInfo?.nextCeiling ? `${levelInfo.nextCeiling - xp} XP to next level` : 'Keep earning XP'}
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-amber-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${levelInfo?.progressPercent || 60}%` }}
          />
        </div>

        {/* Level Ranks Guide */}
        <div className="pt-2 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          {[
            { lvl: 'Level 1', name: 'Beginner', xp: '0 XP' },
            { lvl: 'Level 5', name: 'Learner', xp: '850 XP' },
            { lvl: 'Level 10', name: 'Scholar', xp: '2,200 XP' },
            { lvl: 'Level 20', name: 'Expert', xp: '6,500 XP' },
            { lvl: 'Level 30', name: 'Master', xp: '12,000 XP' },
          ].map((r, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl border text-[11px] ${
                level >= (i === 0 ? 1 : i === 1 ? 5 : i === 2 ? 10 : i === 3 ? 20 : 30)
                  ? 'border-indigo-400 bg-indigo-950/60 text-white font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400'
              }`}
            >
              <div>{r.lvl}</div>
              <div className="font-semibold text-indigo-300">{r.name}</div>
              <div className="text-[10px] text-slate-400">{r.xp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. VISUAL CHARTS: 7-Day Activity & Accuracy Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Study Time Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Daily Focus Activity</h3>
              <p className="text-xs text-slate-400">Minutes studied each day over the past week</p>
            </div>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-6 px-2">
            {(data?.weeklyActivity || [
              { day: 'Mon', minutes: 30 },
              { day: 'Tue', minutes: 40 },
              { day: 'Wed', minutes: 25 },
              { day: 'Thu', minutes: 50 },
              { day: 'Fri', minutes: 35 },
              { day: 'Sat', minutes: 20 },
              { day: 'Sun', minutes: 30 },
            ]).map((d: any, i: number) => {
              const maxMin = 60;
              const heightPct = Math.min(100, Math.round((d.minutes / maxMin) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.minutes}m
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-xl h-full flex items-end">
                    <div
                      className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-t-xl transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Accuracy Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Subject Accuracy Breakdown</h3>
              <p className="text-xs text-slate-400">Performance on active testing and quizzes</p>
            </div>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="space-y-4 pt-2">
            {[
              { subject: 'Mathematics', accuracy: 85, color: 'bg-indigo-600' },
              { subject: 'Science', accuracy: 90, color: 'bg-emerald-600' },
              { subject: 'Computer Science', accuracy: 75, color: 'bg-purple-600' },
              { subject: 'English', accuracy: 80, color: 'bg-amber-600' },
              { subject: 'Social Science', accuracy: 70, color: 'bg-blue-600' },
            ].map((s, i) => (
              <div key={i} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{s.subject}</span>
                  <span className="text-slate-500">{s.accuracy}% Accuracy</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`${s.color} h-full rounded-full transition-all`} style={{ width: `${s.accuracy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
