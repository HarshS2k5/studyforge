import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Award,
  Flame,
  Shield,
  Medal,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBoard() {
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data.leaderboard || []);
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadBoard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-7 h-7 text-amber-500" /> Academic Community Standings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Celebrating learning consistency and diligence. Standings use privacy-preserving display names.
        </p>
      </div>

      {/* Philosophy Callout (Requirement #24) */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-800 dark:text-indigo-300 flex items-center gap-2.5">
        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>
          StudyForge prioritizes individual mastery over competitive pressure. Use leaderboards for friendly inspiration!
        </span>
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading standings...</div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {leaderboard.map((item, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                    item.isCurrentUser
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-bold'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0">
                      {isFirst ? (
                        <span className="text-amber-500 text-base">🥇</span>
                      ) : isSecond ? (
                        <span className="text-slate-400 text-base">🥈</span>
                      ) : isThird ? (
                        <span className="text-amber-700 text-base">🥉</span>
                      ) : (
                        <span className="text-slate-400">{idx + 1}</span>
                      )}
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {item.displayName}
                        {item.isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.grade} • Level {item.level}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" /> {item.streak} days
                      </div>
                      <div className="text-[10px] text-slate-400">Streak</div>
                    </div>

                    <div>
                      <div className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                        {item.xp} XP
                      </div>
                      <div className="text-[10px] text-slate-400">Total Points</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
