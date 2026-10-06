import React, { useState } from 'react';
import {
  User as UserIcon,
  Flame,
  Trophy,
  Clock,
  Target,
  BookOpen,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    grade: user?.grade || 'Grade 10',
    learning_goals: user?.learning_goals || 'Master Core Concepts',
    study_style: user?.study_style || 'Visual & Step-by-Step',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const streak = user?.streak || 5;
  const xp = user?.xp || 420;
  const level = user?.level || 4;
  const levelTitle = user?.levelInfo?.title || 'Scholar';
  const studyHours = user?.stats?.studyHours || Math.round(((user?.total_study_seconds || 5400) / 3600) * 10) / 10;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserIcon className="w-7 h-7 text-indigo-500" /> Student Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your academic achievements, study metrics, and personalization preferences.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.username}</h2>
              <p className="text-xs text-slate-400">{user?.email}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {user?.grade}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  Level {level} ({levelTitle})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold self-start sm:self-auto cursor-pointer"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Preferences'}
          </button>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Preferences updated successfully!
          </div>
        )}

        {/* Edit Preferences Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Grade / Level
                </label>
                <select
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="College">College</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Learning Goal
                </label>
                <input
                  type="text"
                  value={formData.learning_goals}
                  onChange={e => setFormData({ ...formData, learning_goals: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Study Style
                </label>
                <input
                  type="text"
                  value={formData.study_style}
                  onChange={e => setFormData({ ...formData, study_style: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Profile Overview Metrics (Section #3) */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Study Streak
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{streak} Days</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Total XP
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{xp} Points</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Study Time
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{studyHours} Hours</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-500" /> Quiz Accuracy
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.stats?.quizAccuracy || 80}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-purple-500" /> Lessons Finished
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.stats?.completedLessons || 1}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 mb-1">
                <Award className="w-3.5 h-3.5 text-amber-500" /> Flashcards
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.stats?.flashcardsReviewed || 8}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
