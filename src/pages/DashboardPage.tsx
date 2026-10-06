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
  ShieldCheck,
  Hourglass,
  Compass,
  FileText,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Subject,
  PlannerGoal,
  DailyChallenge,
  WeakTopic,
  Exam,
  StudyPlan,
  SmartRecommendation,
  TimedSessionPlan,
  StreakRecoveryStatus,
  AntiCramData,
  WeeklyReportData,
  SmartGoal,
} from '../types';

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

  // New Advanced Features State
  const [smartNext, setSmartNext] = useState<SmartRecommendation | null>(null);
  const [streakRecovery, setStreakRecovery] = useState<StreakRecoveryStatus | null>(null);
  const [antiCram, setAntiCram] = useState<AntiCramData | null>(null);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);

  // "I Have X Minutes" Modal State
  const [minuteModalOpen, setMinuteModalOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(20);
  const [timedPlan, setTimedPlan] = useState<TimedSessionPlan | null>(null);
  const [loadingTimedPlan, setLoadingTimedPlan] = useState(false);

  // Weekly Report Modal State
  const [weeklyReportModalOpen, setWeeklyReportModalOpen] = useState(false);

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
        const [
          subRes,
          goalsRes,
          progRes,
          challengeRes,
          weakRes,
          examRes,
          planRes,
          smartNextRes,
          recoveryRes,
          antiCramRes,
          smartGoalsRes,
          reportRes,
        ] = await Promise.allSettled([
          api.getSubjects(),
          user ? api.getGoals() : Promise.resolve({ daily: [], weekly: [], exam: [], all: [] }),
          user ? api.getProgressSummary() : Promise.resolve(null),
          api.getDailyChallenge().catch(() => ({ challenges: [] })),
          api.getWeakTopics().catch(() => ({ weakTopics: [] })),
          api.getExams().catch(() => ({ exams: [] })),
          api.getDailyPlan().catch(() => null),
          user ? api.getSmartNextActivity().catch(() => null) : Promise.resolve(null),
          user ? api.getStreakRecoveryStatus().catch(() => null) : Promise.resolve(null),
          user ? api.getAntiCramStatus().catch(() => null) : Promise.resolve(null),
          user ? api.getSmartGoals().catch(() => ({ goals: [] })) : Promise.resolve({ goals: [] }),
          user ? api.getWeeklyReport().catch(() => null) : Promise.resolve(null),
        ]);

        if (subRes.status === 'fulfilled') setSubjects(subRes.value.subjects || []);
        if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value.daily || []);
        if (progRes.status === 'fulfilled') setProgressSummary(progRes.value);
        if (challengeRes.status === 'fulfilled') setChallenges(challengeRes.value.challenges || []);
        if (weakRes.status === 'fulfilled') setWeakTopics(weakRes.value.weakTopics || []);
        if (examRes.status === 'fulfilled') setExams(examRes.value.exams || []);
        if (planRes.status === 'fulfilled') setDailyPlan(planRes.value);

        // Advanced features
        if (smartNextRes.status === 'fulfilled' && smartNextRes.value) {
          setSmartNext(smartNextRes.value.recommendation);
        }
        if (recoveryRes.status === 'fulfilled' && recoveryRes.value) {
          setStreakRecovery(recoveryRes.value);
        }
        if (antiCramRes.status === 'fulfilled' && antiCramRes.value) {
          setAntiCram(antiCramRes.value);
        }
        if (smartGoalsRes.status === 'fulfilled' && smartGoalsRes.value) {
          setSmartGoals(smartGoalsRes.value.goals || []);
        }
        if (reportRes.status === 'fulfilled' && reportRes.value) {
          setWeeklyReport(reportRes.value.report);
        }
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

  const handleToggleSmartGoalTask = async (goalId: number, taskId: number) => {
    try {
      const res = await api.toggleSmartGoalTask(goalId, taskId);
      setSmartGoals(prev =>
        prev.map(g => {
          if (g.id === goalId) {
            const updatedTasks = (g.tasks || []).map(t =>
              t.id === taskId ? { ...t, is_completed: res.is_completed } : t
            );
            return { ...g, tasks: updatedTasks, progress_percent: res.progress_percent };
          }
          return g;
        })
      );
    } catch (err) {
      console.error('Failed to toggle smart task', err);
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

  const handleOpenMinuteModal = async (minutes: number = 20) => {
    setSelectedMinutes(minutes);
    setMinuteModalOpen(true);
    setLoadingTimedPlan(true);
    try {
      const res = await api.getMinuteSession(minutes);
      setTimedPlan(res.plan);
    } catch (err: any) {
      console.error('Failed to generate timed session', err);
    } finally {
      setLoadingTimedPlan(false);
    }
  };

  const handleSelectMinutes = async (mins: number) => {
    setSelectedMinutes(mins);
    setLoadingTimedPlan(true);
    try {
      const res = await api.getMinuteSession(mins);
      setTimedPlan(res.plan);
    } catch (err: any) {
      console.error('Failed to fetch plan', err);
    } finally {
      setLoadingTimedPlan(false);
    }
  };

  const handleRecoverStreakSession = async () => {
    try {
      const res = await api.recoverStreak(15);
      alert(res.message);
      if (user) {
        updateUserStats(user.xp + 50, user.level, false);
      }
      const refreshed = await api.getStreakRecoveryStatus();
      setStreakRecovery(refreshed);
    } catch (err: any) {
      alert(err.message || 'Failed to complete recovery session');
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
              {user?.grade || 'Grade 10'} &bull; {user?.learning_goals || 'Exam Prep'}
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
            Your personalized study cockpit. What would you like to master today?
          </p>
        </div>

        {/* Quick actions bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenMinuteModal(20)}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Hourglass className="w-3.5 h-3.5" /> I Have X Minutes
          </button>
          <button
            onClick={() => onNavigate('/learning-path')}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" /> Learning Path
          </button>
          <button
            onClick={() => onNavigate('/practice-lab')}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Practice Lab
          </button>
          <button
            onClick={() => onNavigate('/concept-maps')}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-500" /> Concept Maps
          </button>
        </div>
      </div>

      {/* 2. SMART STREAK RECOVERY ALERT (Section #12) */}
      {streakRecovery?.recoveryAvailable && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent border border-amber-300 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-scale-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  🔥 Smart Streak Protector Active
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  Preserve {streakRecovery.currentStreak} Day Streak
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                {streakRecovery.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRecoverStreakSession}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> Start 15-Min Quick Recovery (+50 XP)
            </button>
          </div>
        </div>
      )}

      {/* 3. ANTI-CRAM SUSTAINABLE PLAN BANNER (Section #15) */}
      {antiCram?.antiCramTriggered && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-transparent border border-rose-300 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Anti-Cram Sustainable Plan
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                  Exam in {antiCram.examDetails?.daysLeft} Days
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {antiCram.planSummary}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/learning-path')}
            className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            Open Anti-Cram Schedule
          </button>
        </div>
      )}

      {/* 4. "WHAT SHOULD I STUDY RIGHT NOW?" FLAGSHIP HERO CARD (Section #16 & #17) */}
      {smartNext && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> What Should I Study Right Now?
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {smartNext.reason}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {smartNext.title}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl mt-1 leading-relaxed">
                {smartNext.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate(smartNext.link)}
                className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-white hover:bg-indigo-50 text-indigo-950 font-extrabold text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-amber-500 text-amber-500" /> Start Smart Session
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleOpenMinuteModal(smartNext.estimatedMinutes || 20)}
                className="inline-flex items-center gap-1.5 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-xs transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-indigo-300" />
                <span>~{smartNext.estimatedMinutes} mins ({smartNext.xpReward} XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STATS ROW */}
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

      {/* 6. DAILY CHALLENGE STRIP */}
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

      {/* 7. MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Weak Topics, Subject Progress, AI Weekly Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* WEAK TOPIC DETECTOR */}
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
                        className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Brain className="w-3.5 h-3.5" /> Ask AI Tutor
                      </button>
                      <button
                        onClick={() => onNavigate('/practice-lab')}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Practice Lab
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI WEEKLY REPORT CARD (Section #14) */}
          {weeklyReport && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" /> Your Week in StudyForge
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Factual performance analytics and AI academic observations
                  </p>
                </div>
                <button
                  onClick={() => setWeeklyReportModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View Full Insights
                </button>
              </div>

              {/* Weekly Mini Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {weeklyReport.studyMinutesLogged}m
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Study Time</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {weeklyReport.quizzesCompleted}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Quizzes Taken</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {weeklyReport.overallAccuracy}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</div>
                </div>
              </div>

              {/* 3 Factual Recommendations */}
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Targeted Academic Insights:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {(weeklyReport.recommendations || []).slice(0, 3).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
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

        {/* Right 1 Col: Smart Goals & Today's Checklist */}
        <div className="space-y-6">
          {/* SMART GOALS WITH SUB-TASKS (Section #10) */}
          {smartGoals.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" /> Smart Actionable Goals
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Decomposed milestone tasks</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  {smartGoals[0].progress_percent}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-3">
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {smartGoals[0].title}
                </div>
                {/* 6 Actionable Sub-tasks */}
                <div className="space-y-2">
                  {(smartGoals[0].tasks || []).map(task => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleSmartGoalTask(smartGoals[0].id, task.id)}
                      className="flex items-center gap-2.5 text-xs cursor-pointer group"
                    >
                      {task.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                      )}
                      <span className={task.is_completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                        {task.task_title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Today's Goals Checklist */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Today&apos;s Habits
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Daily learning streak checkpoints</p>
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

          {/* Quick Study Tools Navigation */}
          <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 space-y-3">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
              Interactive Study Tools
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('/calendar')}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold hover:border-indigo-400 cursor-pointer"
              >
                📅 Study Calendar
              </button>
              <button
                onClick={() => onNavigate('/study-groups')}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold hover:border-indigo-400 cursor-pointer"
              >
                👥 Study Groups
              </button>
              <button
                onClick={() => onNavigate('/textbook-assistant')}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold hover:border-indigo-400 cursor-pointer"
              >
                📖 Textbook AI
              </button>
              <button
                onClick={() => onNavigate('/syllabus-importer')}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold hover:border-indigo-400 cursor-pointer"
              >
                📑 Import Syllabus
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* "I HAVE X MINUTES" MODAL (Section #6) */}
      {minuteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-6">
            <button
              onClick={() => setMinuteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mb-2">
                <Hourglass className="w-3.5 h-3.5" /> High-Efficiency Timed Routine
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                &ldquo;I Have X Minutes&rdquo; Mode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Choose your available time. StudyForge builds a calibrated micro-routine across multiple activities.
              </p>
            </div>

            {/* Time Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[10, 20, 30, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleSelectMinutes(mins)}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMinutes === mins
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* Plan Display */}
            {loadingTimedPlan ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Calibrating {selectedMinutes}-minute optimal multi-activity routine...
              </div>
            ) : timedPlan ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {timedPlan.title}
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400">
                    {timedPlan.description} &bull; Expected Reward: +{timedPlan.xpExpected} XP
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {(timedPlan.routine || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{step.task}</div>
                          <div className="text-[10px] text-slate-400">{step.subject} &bull; {step.actionType}</div>
                        </div>
                      </div>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {step.minutes} mins
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setMinuteModalOpen(false);
                    onNavigate('/timer');
                  }}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" /> Start {selectedMinutes}-Minute Timed Sprint
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* WEEKLY REPORT FULL MODAL */}
      {weeklyReportModalOpen && weeklyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setWeeklyReportModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-1">
                <BarChart3 className="w-3.5 h-3.5" /> Full Performance Breakdown
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Your Week in StudyForge
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  Study Consistency & Activity
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Study Minutes: <strong>{weeklyReport.studyMinutesLogged}m</strong></div>
                  <div>Quizzes Taken: <strong>{weeklyReport.quizzesCompleted}</strong></div>
                  <div>Accuracy Rate: <strong>{weeklyReport.overallAccuracy}%</strong></div>
                  <div>Streak Days: <strong>{weeklyReport.streakMaintained} days</strong></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  Actionable AI Academic Recommendations:
                </div>
                {(weeklyReport.recommendations || []).map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
