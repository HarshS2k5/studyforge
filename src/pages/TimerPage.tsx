import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Sparkles,
  CheckCircle2,
  Bell,
  Volume2,
  Maximize2,
  Minimize2,
  Square,
  Flame,
  Calendar,
  Target,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TimerPage: React.FC = () => {
  const { user, updateUserStats } = useAuth();

  // Modes
  type TimerMode = 'pomodoro_25' | 'break_5' | 'pomodoro_50' | 'break_10' | 'custom';
  const [mode, setMode] = useState<TimerMode>('pomodoro_25');

  const modeDurations: Record<TimerMode, number> = {
    pomodoro_25: 25 * 60,
    break_5: 5 * 60,
    pomodoro_50: 50 * 60,
    break_10: 10 * 60,
    custom: 15 * 60,
  };

  const [timeLeft, setTimeLeft] = useState<number>(modeDurations.pomodoro_25);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  const [breakReminder, setBreakReminder] = useState<string | null>(null);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);

  // Focus Context from URL parameters
  const [subjectContext, setSubjectContext] = useState<string | null>(null);
  const [topicContext, setTopicContext] = useState<string | null>(null);

  // Distraction-Free full screen mode
  const [isDistractionFree, setIsDistractionFree] = useState(false);

  // Focus Stats (Today & Weekly)
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [weeklyFocusMinutes, setWeeklyFocusMinutes] = useState(0);

  // Audio tone helper
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio play unavailable:', e);
    }
  };

  // Read URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subject');
    const top = params.get('topic');
    const dur = params.get('duration');

    if (sub) setSubjectContext(sub);
    if (top) setTopicContext(top);
    if (dur) {
      const mins = Math.max(1, parseInt(dur, 10));
      setCustomMinutes(mins);
      setMode('custom');
      setTimeLeft(mins * 60);
    }

    loadFocusStats();
  }, []);

  const loadFocusStats = async () => {
    try {
      const overview = await api.getAnalyticsOverview();
      if (overview.studySeconds) {
        setTodayFocusMinutes(Math.round(overview.studySeconds.today / 60));
        setWeeklyFocusMinutes(Math.round(overview.studySeconds.thisWeek / 60));
      }
    } catch (err) {
      console.error('Failed to load focus statistics', err);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    playChime();
    const isBreak = mode === 'break_5' || mode === 'break_10';

    if (!isBreak) {
      const sessionDuration = mode === 'custom' ? customMinutes * 60 : modeDurations[mode];
      setCompletedSessionsCount(prev => prev + 1);
      setBreakReminder(
        'Outstanding focus sprint completed! Time for a refreshing break to hydrate and stretch your legs.'
      );

      try {
        const res = await api.logStudySession({
          duration_seconds: sessionDuration,
          session_type: mode,
        });
        if (user) {
          updateUserStats(user.xp + res.xpEarned, user.level, false, res.unlockedAchievements);
        }
        await loadFocusStats();
      } catch (err) {
        console.error('Failed to log session:', err);
      }
    } else {
      setBreakReminder('Break completed! Ready for your next deep work sprint?');
    }
  };

  // End Session prematurely & record partial focus time
  const handleEndSessionEarly = async () => {
    if (!isRunning && timeLeft === (mode === 'custom' ? customMinutes * 60 : modeDurations[mode])) {
      return;
    }

    const totalSecs = mode === 'custom' ? customMinutes * 60 : modeDurations[mode];
    const elapsedSecs = Math.max(0, totalSecs - timeLeft);
    setIsRunning(false);

    if (elapsedSecs >= 60 && !mode.includes('break')) {
      try {
        const res = await api.logStudySession({
          duration_seconds: elapsedSecs,
          session_type: 'early_focus',
        });
        if (user) {
          updateUserStats(user.xp + res.xpEarned, user.level, false);
        }
        setCompletedSessionsCount(prev => prev + 1);
        await loadFocusStats();
      } catch (err) {
        console.error('Failed to log partial focus time', err);
      }
    }

    resetTimer();
  };

  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setBreakReminder(null);
    if (newMode === 'custom') {
      setTimeLeft(customMinutes * 60);
    } else {
      setTimeLeft(modeDurations[newMode]);
    }
  };

  const handleCustomChange = (mins: number) => {
    setCustomMinutes(mins);
    if (mode === 'custom') {
      setTimeLeft(mins * 60);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'custom') {
      setTimeLeft(customMinutes * 60);
    } else {
      setTimeLeft(modeDurations[mode]);
    }
  };

  const formatDisplay = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalDuration = mode === 'custom' ? customMinutes * 60 : modeDurations[mode];
  const progressPercent = Math.round(((totalDuration - timeLeft) / totalDuration) * 100);

  return (
    <div className={`transition-colors ${isDistractionFree ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-12 text-white overflow-hidden' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-center'}`}>
      {/* Top Banner & Distraction-Free Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
            <Clock className="w-7 h-7 text-indigo-500" /> Focus Mode & Pomodoro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 text-center sm:text-left">
            Structured study intervals with healthy break reminders to maintain cognitive clarity.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
          <button
            onClick={() => setIsDistractionFree(!isDistractionFree)}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            {isDistractionFree ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Exit Zen Mode
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500" /> Distraction-Free
              </>
            )}
          </button>
        </div>
      </div>

      {/* Linked Task Context Header if launched from Study Plan */}
      {(subjectContext || topicContext) && (
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 font-semibold mx-auto">
          <Target className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Focusing on: {subjectContext} {topicContext ? `• ${topicContext}` : ''}
          </span>
        </div>
      )}

      {/* Focus Time Stats Cards (Today & Weekly) */}
      {!isDistractionFree && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Focus</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {todayFocusMinutes} <span className="text-xs font-normal text-slate-400">mins</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">This Week</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {(weeklyFocusMinutes / 60).toFixed(1)} <span className="text-xs font-normal text-slate-400">hrs</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sessions Done</div>
            <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {completedSessionsCount}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">XP Earned</div>
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{completedSessionsCount * 25}
            </div>
          </div>
        </div>
      )}

      {/* Mode Selectors */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => handleModeChange('pomodoro_25')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'pomodoro_25'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          25m Focus
        </button>

        <button
          onClick={() => handleModeChange('break_5')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'break_5'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 inline mr-1" /> 5m Short Break
        </button>

        <button
          onClick={() => handleModeChange('pomodoro_50')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'pomodoro_50'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          50m Deep Work
        </button>

        <button
          onClick={() => handleModeChange('break_10')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'break_10'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 inline mr-1" /> 10m Long Break
        </button>

        <button
          onClick={() => handleModeChange('custom')}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'custom'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          Custom
        </button>
      </div>

      {mode === 'custom' && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Custom Duration:</span>
          <input
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={e => handleCustomChange(Number(e.target.value))}
            className="w-16 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold text-slate-900 dark:text-white"
          />
          <span className="text-slate-500 dark:text-slate-400">minutes</span>
        </div>
      )}

      {/* Main Timer Display Circle */}
      <div className="py-6 flex justify-center">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full border-8 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-2xl bg-white dark:bg-slate-900">
          <div
            className="absolute inset-0 rounded-full border-8 border-indigo-600 transition-all duration-1000"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${progressPercent >= 25 ? '100% 0%' : '50% 0%'}, ${progressPercent >= 50 ? '100% 100%' : progressPercent >= 25 ? '100% 50%' : '50% 0%'}, ${progressPercent >= 75 ? '0% 100%' : progressPercent >= 50 ? '50% 100%' : '50% 0%'}, ${progressPercent >= 100 ? '0% 0%' : progressPercent >= 75 ? '0% 50%' : '50% 0%'})`,
            }}
          />

          <div className="relative z-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {mode.includes('break') ? 'Break Relaxation' : 'Deep Study Focus'}
            </span>
            <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatDisplay(timeLeft)}
            </div>
            <div className="text-xs text-slate-400 mt-2 font-medium">
              {progressPercent}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Timer Controls: Start / Pause / Reset / End Session */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`py-3.5 px-8 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Start Focus
            </>
          )}
        </button>

        <button
          onClick={handleEndSessionEarly}
          title="End session and record study time"
          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <Square className="w-4 h-4" /> End Session
        </button>

        <button
          onClick={resetTimer}
          title="Reset timer"
          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Break Reminder Banner */}
      {breakReminder && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 max-w-md mx-auto flex items-start gap-3 animate-slide-up text-left">
          <Coffee className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Break Reminder</div>
            <p className="mt-0.5">{breakReminder}</p>
          </div>
        </div>
      )}
    </div>
  );
};
