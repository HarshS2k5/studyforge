import React, { useEffect } from 'react';
import { Award, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AchievementToast: React.FC = () => {
  const { activeAchievement, dismissAchievement } = useAuth();

  useEffect(() => {
    if (activeAchievement) {
      const timer = setTimeout(() => {
        dismissAchievement();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeAchievement, dismissAchievement]);

  if (!activeAchievement) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-amber-500/30 flex items-start gap-3.5 backdrop-blur-md bg-opacity-95">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
          <Award className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            Achievement Unlocked!
          </div>
          <h4 className="text-sm font-bold text-white truncate">{activeAchievement.title}</h4>
          <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">{activeAchievement.description}</p>
          <div className="mt-1.5 text-[11px] font-medium text-amber-400">
            +{activeAchievement.xp_reward} XP Earned
          </div>
        </div>
        <button
          onClick={dismissAchievement}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
