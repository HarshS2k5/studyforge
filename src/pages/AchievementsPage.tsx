import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  BookOpen,
  Zap,
  Target,
  CheckCircle2,
  Layers,
  Flame,
  Compass,
  GraduationCap,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { api } from '../services/api';
import { Achievement } from '../types';

export const AchievementsPage: React.FC = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAchievements() {
      try {
        const data = await api.getAchievements();
        setAchievements(data.achievements || []);
        setUnlockedCount(data.unlockedCount || 0);
      } catch (e) {
        console.error('Failed to load achievements:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, []);

  const getAchievementIcon = (iconName: string, isUnlocked: boolean) => {
    const className = `w-6 h-6 ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`;
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'CheckCircle2':
        return <CheckCircle2 className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Clock':
        return <Clock className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" /> Academic Achievements & Badges
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Earn prestige badges and learning XP as you complete lessons, maintain streaks, and master tests.
          </p>
        </div>

        <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-bold text-amber-700 dark:text-amber-400 self-start sm:self-auto">
          <Award className="w-4 h-4" />
          <span>{unlockedCount} of {achievements.length} Badges Unlocked</span>
        </div>
      </div>

      {/* Progress Bar Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>Overall Badge Progress</span>
          <span>{achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Achievements Grid (All requirements in Section #18) */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading achievements...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(ach => (
            <div
              key={ach.id}
              className={`p-6 rounded-3xl border transition-all flex items-start gap-4 ${
                ach.isUnlocked
                  ? 'border-amber-300 dark:border-amber-900/60 bg-white dark:bg-slate-900 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  ach.isUnlocked
                    ? 'bg-gradient-to-tr from-amber-100 to-amber-50 dark:from-amber-950/60 dark:to-slate-800 border border-amber-200 dark:border-amber-800'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {ach.isUnlocked ? (
                  getAchievementIcon(ach.icon, true)
                ) : (
                  <Lock className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {ach.title}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                    +{ach.xp_reward} XP
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ach.description}
                </p>

                <div className="pt-2 text-[10px] font-medium">
                  {ach.isUnlocked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-slate-400">Locked Milestone</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
