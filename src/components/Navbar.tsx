import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Moon,
  Sun,
  Flame,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  BookOpen,
  Bookmark,
  Layers,
  Award,
  HelpCircle,
  Bell,
  CheckSquare,
  Settings as SettingsIcon,
  Clock,
  Calendar,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenReport: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenAuth,
  onOpenReport,
  onNavigate,
  currentPath,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Subjects', path: '/subjects' },
    { label: 'AI Tutor', path: '/tutor' },
    { label: 'Homework', path: '/homework' },
    { label: 'Practice', path: '/practice' },
    { label: 'Quizzes', path: '/quizzes' },
    { label: 'Flashcards', path: '/flashcards' },
    { label: 'Notes', path: '/notes' },
    { label: 'Planner', path: '/planner' },
    { label: 'Timer', path: '/timer' },
    { label: 'About', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-200 bg-clip-text text-transparent">
                StudyForge
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Search, Streak, XP, Notifications, Theme, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 text-xs transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-[10px] font-mono border border-slate-300 dark:border-slate-700 px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-500">
              Ctrl+K
            </kbd>
          </button>

          {/* User Status (Streak & XP) */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {/* Streak */}
              <div
                title={`${user.streak} day streak! Keep learning daily`}
                className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs font-bold shadow-2xs"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>{user.streak}</span>
              </div>

              {/* XP & Level */}
              <button
                onClick={() => onNavigate('/progress')}
                title="View Progress & Level Breakdown"
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Lvl {user.level}</span>
                <span className="text-[10px] text-indigo-500/80 font-normal">({user.xp} XP)</span>
              </button>
            </div>
          )}

          {/* Notifications Center Bell (Section #18) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs animate-scale-in"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      {notifications.length} Updates
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        All clear! No pending notifications.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.link_path) onNavigate(n.link_path);
                          }}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors space-y-1"
                        >
                          <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{n.title}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono">
                              {n.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Menu or Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs animate-scale-in"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{user.username}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    <div className="mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      {user.grade}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('/profile')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" /> Profile & Overview
                  </button>

                  <button
                    onClick={() => onNavigate('/homework')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4 text-slate-400" /> Homework Tracker
                  </button>

                  <button
                    onClick={() => onNavigate('/settings')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" /> Settings & Export
                  </button>

                  <button
                    onClick={() => onNavigate('/bookmarks')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-slate-400" /> Bookmarks
                  </button>

                  <button
                    onClick={() => onNavigate('/mistakes')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" /> Mistake Book
                  </button>

                  <button
                    onClick={() => onNavigate('/achievements')}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <Award className="w-4 h-4 text-slate-400" /> Achievements
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => onNavigate('/admin')}
                      className="w-full text-left px-4 py-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin Dashboard
                    </button>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                  <button
                    onClick={onOpenReport}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" /> Report an Issue
                  </button>

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="py-1.5 px-3.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="py-1.5 px-3.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                Join Free
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 animate-slide-down">
          {navLinks.map(link => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => {
                  onNavigate(link.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onNavigate('/settings');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5"
            >
              <SettingsIcon className="w-4 h-4" /> Settings & Export
            </button>
            <button
              onClick={() => {
                onNavigate('/leaderboard');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Leaderboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
