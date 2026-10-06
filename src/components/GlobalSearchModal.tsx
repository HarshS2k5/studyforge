import React, { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Layers, FileText, HelpCircle, X, ArrowRight, Compass, Target } from 'lucide-react';
import { api } from '../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    subjects: any[];
    chapters: any[];
    topics: any[];
    lessons: any[];
    notes: any[];
    questions: any[];
    flashcards: any[];
  }>({
    subjects: [],
    chapters: [],
    topics: [],
    lessons: [],
    notes: [],
    questions: [],
    flashcards: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ subjects: [], chapters: [], topics: [], lessons: [], notes: [], questions: [], flashcards: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ subjects: [], chapters: [], topics: [], lessons: [], notes: [], questions: [], flashcards: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchGlobal(query);
        setResults(res.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    results.subjects.length +
    results.chapters.length +
    (results.topics?.length || 0) +
    results.lessons.length +
    results.notes.length +
    results.questions.length +
    results.flashcards.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search lessons, formulas, notes, flashcards, questions..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md hidden sm:inline">
            ESC to close
          </span>
        </div>

        {/* Search results body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Searching curriculum and resources...
            </div>
          )}

          {!loading && query.trim() && totalResults === 0 && (
            <div className="py-12 text-center">
              <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for &quot;fraction&quot;, &quot;newton&quot;, &quot;python&quot;, or &quot;grammar&quot;.</p>
            </div>
          )}

          {/* Subjects */}
          {results.subjects.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Subjects ({results.subjects.length})
              </div>
              <div className="space-y-1">
                {results.subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onNavigate(`/subjects/${s.id}`);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{s.description}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {results.topics && results.topics.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-500" /> Topics ({results.topics.length})
              </div>
              <div className="space-y-1">
                {results.topics.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onNavigate(`/chapters/${t.chapter_id}`);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {t.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {t.subject_name} • {t.chapter_title} {t.description ? `— ${t.description}` : ''}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lessons */}
          {results.lessons.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Lessons ({results.lessons.length})
              </div>
              <div className="space-y-1">
                {results.lessons.map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      onNavigate(`/lessons/${l.id}`);
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {l.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {l.subject_name} • {l.chapter_title}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Flashcards */}
          {results.flashcards.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Flashcards ({results.flashcards.length})
              </div>
              <div className="space-y-1">
                {results.flashcards.map(f => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onNavigate('/flashcards');
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {f.front}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{f.back}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {results.notes.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Notes ({results.notes.length})
              </div>
              <div className="space-y-1">
                {results.notes.map(n => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onNavigate('/notes');
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {n.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{n.content}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Questions */}
          {results.questions.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> Questions ({results.questions.length})
              </div>
              <div className="space-y-1">
                {results.questions.map(q => (
                  <button
                    key={q.id}
                    onClick={() => {
                      onNavigate('/practice');
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {q.question_text}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{q.subject_name} • {q.topic}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
