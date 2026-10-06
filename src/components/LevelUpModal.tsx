import React from 'react';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LevelUpModal: React.FC = () => {
  const { activeLevelUp, dismissLevelUp } = useAuth();

  if (!activeLevelUp) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 animate-bounce">
          <Trophy className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-100 dark:border-indigo-900">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Level Up!
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          You Reached Level {activeLevelUp.level}!
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Outstanding dedication to your academic craft. You have unlocked new prestige and badges in StudyForge.
        </p>

        <button
          onClick={dismissLevelUp}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
        >
          Keep Studying <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
