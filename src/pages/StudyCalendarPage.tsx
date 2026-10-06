import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Layers,
  Target,
  Sparkles,
  ArrowRight,
  Plus,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CalendarEvent } from '../types';

interface StudyCalendarPageProps {
  onNavigate: (path: string) => void;
}

export const StudyCalendarPage: React.FC<StudyCalendarPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected date inspection
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getCalendarEvents();
      setEvents(res.events || []);
    } catch (err: any) {
      console.error('Failed to load calendar events', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Month generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Filter events
  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const selectedEvents = getEventsForDate(selectedDateStr);

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'homework':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      case 'review':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300';
      case 'session':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300';
      case 'goal':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Interactive Study Calendar
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              Smart Deadlines & Reviews
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Academic Master Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track exams, homework deadlines, scheduled sessions, daily goals, and spaced reviews in one comprehensive timeline.
          </p>
        </div>

        {/* View mode toggle & month nav */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {mode} View
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-2xs cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-600 dark:text-slate-300 shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-bold">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { key: 'all', label: 'All Items' },
          { key: 'exam', label: '🔴 Exams' },
          { key: 'homework', label: '🟡 Homework' },
          { key: 'session', label: '🔵 Study Sessions' },
          { key: 'review', label: '🟣 Spaced Flashcards' },
          { key: 'goal', label: '🟢 Daily Goals' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilterType(item.key)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterType === item.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Current Month Banner */}
      <div className="flex items-center justify-between text-base font-extrabold text-slate-900 dark:text-white">
        <span>
          {currentDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
            ...(viewMode === 'day' ? { day: 'numeric', weekday: 'long' } : {}),
          })}
        </span>
        <span className="text-xs font-normal text-slate-400">
          {events.length} total active events in schedule
        </span>
      </div>

      {/* Main Grid: Calendar View (8 cols) & Task Inspector Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Grid Area */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
          {viewMode === 'month' && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty days before month starts */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[90px] rounded-2xl bg-slate-50/40 dark:bg-slate-950/30 border border-transparent p-2 text-slate-300 dark:text-slate-700 text-xs"
                  />
                ))}

                {/* Actual days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const dayEvents = getEventsForDate(dateStr);
                  const isSelected = selectedDateStr === dateStr;
                  const isToday =
                    dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={dayNum}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`min-h-[95px] rounded-2xl p-2 border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                          : isToday
                          ? 'border-indigo-300 dark:border-indigo-800 bg-slate-50 dark:bg-slate-850'
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/20 dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {dayNum}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event chips preview */}
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 2).map(evt => (
                          <div
                            key={evt.id}
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate border ${getBadgeStyle(
                              evt.type
                            )}`}
                          >
                            {evt.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-bold pl-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 mb-2 font-bold">Week Timeline (7 Days)</div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {Array.from({ length: 7 }).map((_, idx) => {
                  const d = new Date(currentDate);
                  const currentDay = d.getDay();
                  d.setDate(d.getDate() - currentDay + idx);
                  const dateStr = d.toISOString().split('T')[0];
                  const dayEvents = getEventsForDate(dateStr);
                  const isSelected = selectedDateStr === dateStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/30'
                      }`}
                    >
                      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold uppercase text-slate-400">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {d.getDate()}
                        </div>
                      </div>
                      <div className="space-y-1.5 min-h-[160px]">
                        {dayEvents.map(evt => (
                          <div
                            key={evt.id}
                            className={`p-1.5 rounded-xl border text-[11px] font-medium leading-tight ${getBadgeStyle(
                              evt.type
                            )}`}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Agenda for {currentDate.toLocaleDateString('en-US', { dateStyle: 'full' })}
              </div>
              <div className="space-y-2">
                {getEventsForDate(currentDate.toISOString().split('T')[0]).map(evt => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border mr-2 ${getBadgeStyle(evt.type)}`}>
                        {evt.type.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{evt.title}</span>
                      <p className="text-xs text-slate-500 mt-1">{evt.description}</p>
                    </div>
                    {evt.link && (
                      <button
                        onClick={() => onNavigate(evt.link!)}
                        className="py-1.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Open
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer: Selected Date Tasks & Fast Launcher */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Selected Date Details
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                {selectedEvents.length} Tasks
              </span>
            </div>

            {selectedEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 opacity-80" />
                <p>No high-priority deadlines or exams logged on this date.</p>
                <button
                  onClick={() => onNavigate('/planner')}
                  className="py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer"
                >
                  Schedule Goal in Planner
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(evt.type)}`}>
                        {evt.type.toUpperCase()}
                      </span>
                      {evt.priority && (
                        <span className="text-[10px] font-semibold text-rose-500 uppercase">
                          {evt.priority} Priority
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {evt.title}
                    </div>
                    {evt.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {evt.description}
                      </p>
                    )}
                    {evt.link && (
                      <button
                        onClick={() => onNavigate(evt.link!)}
                        className="w-full mt-2 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        Launch Activity <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule Helper Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white border border-indigo-800/40 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Smart Calendar Sync
              </h4>
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Every exam, homework item, spaced flashcard review, and smart goal you save automatically synchronizes across your master calendar!
            </p>
            <button
              onClick={() => onNavigate('/planner')}
              className="w-full py-2 px-3 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              Add New Exam / Homework
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
