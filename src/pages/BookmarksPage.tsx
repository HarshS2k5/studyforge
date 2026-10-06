import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Trash2,
  BookOpen,
  ArrowRight,
  Layers,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Bookmark as BookmarkItem } from '../types';

interface BookmarksPageProps {
  onNavigate: (path: string) => void;
}

export const BookmarksPage: React.FC<BookmarksPageProps> = ({ onNavigate }) => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  async function loadBookmarks() {
    try {
      const data = await api.getBookmarks();
      setBookmarks(data.bookmarks || []);
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleRemove = async (type: string, id: number) => {
    try {
      await api.removeBookmark(type, id);
      await loadBookmarks();
    } catch (e) {
      console.error('Failed to remove bookmark:', e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'flashcard':
        return <Layers className="w-5 h-5 text-purple-500" />;
      case 'note':
        return <FileText className="w-5 h-5 text-amber-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Bookmark className="w-7 h-7 text-indigo-500 fill-indigo-500" /> Saved Bookmarks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quickly access saved lessons, questions, and revision notes.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading bookmarks...</div>
      ) : bookmarks.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No bookmarks saved yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click the bookmark icon on any lesson or revision resource to store it here for instant access.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(b => (
            <div
              key={`${b.item_type}-${b.item_id}`}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs flex items-center justify-between gap-4 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                  {getIcon(b.item_type)}
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    {b.item_type}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{b.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate(b.link)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleRemove(b.item_type, b.item_id)}
                  title="Remove bookmark"
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
