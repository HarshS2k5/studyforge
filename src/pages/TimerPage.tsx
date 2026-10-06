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
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const TimerPage: React.FC = () => {
  const { user, updateUserStats } = useAuth();

  // Modes: 25-min focus, 5-min break, 50-min focus, 10-min break, custom
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
  const [customMinutes, setCustomMinutes] = useState<number>(15);
  const [breakReminder, setBreakReminder] = useState<string | null>(null);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(0);

  // Audio tone helper using Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
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
      // Focus session complete
      setCompletedSessionsCount(prev => prev + 1);
      setBreakReminder('Well done! You completed your focus session. Time for a well-deserved 5-minute break to stretch and rest your eyes.');

      const sessionDuration = modeDurations[mode];
      try {
        const res = await api.logStudySession({
          duration_seconds: sessionDuration,
          session_type: mode,
        });
        if (user) {
          updateUserStats(user.xp + res.xpEarned, user.level, false, res.unlockedAchievements);
        }
      } catch (err) {
        console.error('Failed to log session:', err);
      }
    } else {
      setBreakReminder('Break completed! Ready to begin another focused learning block?');
    }
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-center">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <Clock className="w-7 h-7 text-indigo-500" /> Focus Pomodoro Timer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Structured study intervals with healthy break reminders to maintain cognitive clarity.
        </p>
      </div>

      {/* Mode Selectors (Section #15: 25m, 5m break, 50m, 10m break, Custom) */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => handleModeChange('pomodoro_25')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'pomodoro_25'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          25-min Focus
        </button>

        <button
          onClick={() => handleModeChange('break_5')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'break_5'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 inline mr-1" /> 5-min Break
        </button>

        <button
          onClick={() => handleModeChange('pomodoro_50')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'pomodoro_50'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          50-min Focus
        </button>

        <button
          onClick={() => handleModeChange('break_10')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'break_10'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          <Coffee className="w-3.5 h-3.5 inline mr-1" /> 10-min Break
        </button>

        <button
          onClick={() => handleModeChange('custom')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            mode === 'custom'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
              : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
          }`}
        >
          Custom Timer
        </button>
      </div>

      {mode === 'custom' && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <span className="text-slate-500">Custom minutes:</span>
          <input
            type="number"
            min="1"
            max="120"
            value={customMinutes}
            onChange={e => handleCustomChange(Number(e.target.value))}
            className="w-16 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
          />
        </div>
      )}

      {/* Main Timer Display Circle */}
      <div className="py-6 flex justify-center">
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center shadow-2xl bg-white dark:bg-slate-900">
          {/* Progress Ring visual indicator */}
          <div
            className="absolute inset-0 rounded-full border-8 border-indigo-600 transition-all duration-1000"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${progressPercent >= 25 ? '100% 0%' : '50% 0%'}, ${progressPercent >= 50 ? '100% 100%' : progressPercent >= 25 ? '100% 50%' : '50% 0%'}, ${progressPercent >= 75 ? '0% 100%' : progressPercent >= 50 ? '50% 100%' : '50% 0%'}, ${progressPercent >= 100 ? '0% 0%' : progressPercent >= 75 ? '0% 50%' : '50% 0%'})`,
            }}
          />

          <div className="relative z-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {mode.includes('break') ? 'Break Time' : 'Deep Focus'}
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              {formatDisplay(timeLeft)}
            </div>
            <div className="text-[11px] text-slate-400 mt-2 font-medium">
              {progressPercent}% Complete
            </div>
          </div>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center justify-center gap-4">
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
          onClick={resetTimer}
          title="Reset timer"
          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Break Reminder Notification Banner (Requirement #15) */}
      {breakReminder && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 max-w-md mx-auto flex items-start gap-3 animate-slide-up text-left">
          <Coffee className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Break Reminder</div>
            <p className="mt-0.5">{breakReminder}</p>
          </div>
        </div>
      )}

      {/* Stats Footnote */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 max-w-md mx-auto flex items-center justify-around text-xs text-slate-500">
        <div>
          <span className="font-bold text-slate-900 dark:text-white">{completedSessionsCount}</span> Sessions Completed Today
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-white">+{completedSessionsCount * 25}</span> XP Logged
        </div>
      </div>
    </div>
  );
};
