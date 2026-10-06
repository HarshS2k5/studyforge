import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User as UserIcon,
  Clock,
  Bell,
  Download,
  Save,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    daily_target_minutes: 45,
    notifications_enabled: true,
    theme_preference: 'system',
    grade: user?.grade || 'Grade 10',
    learning_goals: user?.learning_goals || 'Consistent daily study and exam preparation',
    study_style: user?.study_style || 'Practice-first',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setSettings({
          daily_target_minutes: res.settings.daily_target_minutes || 45,
          notifications_enabled: Boolean(res.settings.notifications_enabled ?? true),
          theme_preference: res.settings.theme_preference || 'system',
          grade: res.settings.grade || user?.grade || 'Grade 10',
          learning_goals: res.settings.learning_goals || 'Daily mastery',
          study_style: res.settings.study_style || 'Practice-first',
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyforge_backup_${user?.username || 'student'}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export study data');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative">
      {/* Toast */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-xl flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-indigo-500" /> Account & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your study targets, grade level, notifications, and download data backups.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Profile & Academics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                disabled
                value={user?.username || 'Student'}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'student@studyforge.edu'}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grade / Class
              </label>
              <select
                value={settings.grade}
                onChange={e => setSettings({ ...settings, grade: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
              >
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="College">College / Undergraduate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Study Style
              </label>
              <select
                value={settings.study_style}
                onChange={e => setSettings({ ...settings, study_style: e.target.value })}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
              >
                <option value="Practice-first">Practice & Quiz First</option>
                <option value="Visual & Diagrams">Visual & Diagrams</option>
                <option value="Reading & Summaries">Reading & Note Summaries</option>
                <option value="Step-by-step Socratic">Step-by-step Socratic Inquiry</option>
              </select>
            </div>
          </div>
        </div>

        {/* Study Target & Routine Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily Target & Goals</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Study Target
                </label>
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                  {settings.daily_target_minutes} Minutes / day
                </span>
              </div>
              <input
                type="range"
                min="15"
                max="180"
                step="5"
                value={settings.daily_target_minutes}
                onChange={e =>
                  setSettings({ ...settings, daily_target_minutes: Number(e.target.value) })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>15 mins (Light)</span>
                <span>45 mins (Balanced)</span>
                <span>90 mins (Intensive)</span>
                <span>180 mins (Exam Prep)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Learning Focus / Target Description
              </label>
              <textarea
                rows={2}
                value={settings.learning_goals}
                onChange={e => setSettings({ ...settings, learning_goals: e.target.value })}
                placeholder="e.g. Master STEM topics, improve quiz accuracy to 90%, prepare for board exams"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Notifications & Reminders
            </h2>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                In-App Smart Reminders
              </div>
              <div className="text-[11px] text-slate-400">
                Receive notifications for upcoming exams, due homework, and review flashcards.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={e =>
                  setSettings({ ...settings, notifications_enabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>
        </div>

        {/* Data Ownership & Export */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Download className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Export & Backup</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Download a complete JSON export of your study data.
              </p>
              <p className="text-[11px] text-slate-400">
                Includes all your notes, homework items, exams, quiz history, and progress stats.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              disabled={exporting}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>{exporting ? 'Exporting...' : 'Export JSON Backup'}</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
