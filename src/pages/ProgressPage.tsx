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
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await api.getProgressSummary();
        setData(res);
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

  const streak = data?.streak || user?.streak || 5;
  const xp = data?.xp || user?.xp || 420;
  const level = data?.level || user?.level || 4;
  const levelInfo = user?.levelInfo;

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

      {/* Primary KPI Grid (Section #16 metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Study Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> Total Time
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {data?.totalStudyHours || 1.5} <span className="text-xs font-normal text-slate-400">hrs</span>
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Target className="w-3.5 h-3.5 text-emerald-500" /> Accuracy
          </div>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {user?.stats?.quizAccuracy || 80}%
          </div>
        </div>

        {/* Questions Answered */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" /> Questions
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {data?.totalQuestionsAnswered || 15}
          </div>
        </div>

        {/* Chapters Completed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Chapters
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {data?.chaptersCompleted || 1}
          </div>
        </div>

        {/* Flashcards Reviewed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" /> Flashcards
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white">
            {data?.flashcardsReviewed || 8}
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-1 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-500" /> Streak
          </div>
          <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
            {streak} <span className="text-xs font-normal">days</span>
          </div>
        </div>
      </div>

      {/* Level Milestones & XP Progression (Section #19) */}
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

      {/* Visual Charts: 7-Day Activity & Accuracy Breakdown */}
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
