import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Check,
  Trash2,
  AlertCircle,
  Filter,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { MistakeItem } from '../types';

export const MistakeBookPage: React.FC = () => {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [filterResolved, setFilterResolved] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [loading, setLoading] = useState(true);

  // Practice Mistakes drill mode
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState('');
  const [drillFeedback, setDrillFeedback] = useState<boolean | null>(null);

  useEffect(() => {
    loadMistakes();
  }, []);

  async function loadMistakes() {
    try {
      const data = await api.getMistakes();
      setMistakes(data.mistakes || []);
    } catch (e) {
      console.error('Failed to load mistakes:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleResolve = async (id: number) => {
    try {
      await api.toggleResolveMistake(id);
      await loadMistakes();
    } catch (e) {
      console.error('Failed to toggle resolve:', e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteMistake(id);
      await loadMistakes();
    } catch (e) {
      console.error('Failed to delete mistake:', e);
    }
  };

  const filteredMistakes = mistakes.filter(m => {
    if (filterResolved === 'unresolved') return m.is_resolved === 0;
    if (filterResolved === 'resolved') return m.is_resolved === 1;
    return true;
  });

  const activeDrillList = mistakes.filter(m => m.is_resolved === 0);
  const currentDrillItem = activeDrillList[practiceIndex];

  const handleCheckDrill = () => {
    if (!currentDrillItem || !drillAnswer.trim()) return;
    const isCorrect = drillAnswer.trim().toLowerCase() === currentDrillItem.correct_answer.trim().toLowerCase();
    setDrillFeedback(isCorrect);
  };

  const handleNextDrill = () => {
    setDrillAnswer('');
    setDrillFeedback(null);
    if (practiceIndex < activeDrillList.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      setPracticeMode(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-rose-500" /> Dedicated Mistake Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Turn your errors into your highest exam scores by studying and drilling misconceptions.
          </p>
        </div>

        {activeDrillList.length > 0 && !practiceMode && (
          <button
            onClick={() => {
              setPracticeIndex(0);
              setDrillAnswer('');
              setDrillFeedback(null);
              setPracticeMode(true);
            }}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Practice Mistakes ({activeDrillList.length})
          </button>
        )}
      </div>

      {/* VIEW: PRACTICE MISTAKES DRILL MODE */}
      {practiceMode && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 max-w-2xl mx-auto animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPracticeMode(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Exit Practice Mode
            </button>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Drill {practiceIndex + 1} of {activeDrillList.length}
            </span>
          </div>

          {currentDrillItem ? (
            <div className="space-y-4">
              <div className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 w-fit">
                {currentDrillItem.subject_name} • {currentDrillItem.topic}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentDrillItem.original_question}
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Your Solution:
                </label>
                <input
                  type="text"
                  disabled={drillFeedback !== null}
                  value={drillAnswer}
                  onChange={e => setDrillAnswer(e.target.value)}
                  placeholder="Type the corrected answer..."
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {drillFeedback !== null && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                    drillFeedback
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {drillFeedback ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> You mastered it!
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-500" /> Not quite yet
                      </>
                    )}
                  </div>
                  <div>
                    <strong>Correct answer:</strong> {currentDrillItem.correct_answer}
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    <strong>Explanation:</strong> {currentDrillItem.explanation}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {drillFeedback === null ? (
                  <button
                    onClick={handleCheckDrill}
                    disabled={!drillAnswer.trim()}
                    className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    Check
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleResolve(currentDrillItem.id)}
                      className="py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1" /> Mark Resolved
                    </button>
                    <button
                      onClick={handleNextDrill}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                      Next Mistake
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              You reviewed all active mistakes!
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      {!practiceMode && (
        <div className="flex items-center justify-between">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
            <button
              onClick={() => setFilterResolved('unresolved')}
              className={`py-1.5 px-3.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterResolved === 'unresolved'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Needs Practice ({mistakes.filter(m => m.is_resolved === 0).length})
            </button>
            <button
              onClick={() => setFilterResolved('resolved')}
              className={`py-1.5 px-3.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterResolved === 'resolved'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Mastered ({mistakes.filter(m => m.is_resolved === 1).length})
            </button>
            <button
              onClick={() => setFilterResolved('all')}
              className={`py-1.5 px-3.5 rounded-xl font-bold transition-all cursor-pointer ${
                filterResolved === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              All ({mistakes.length})
            </button>
          </div>
        </div>
      )}

      {/* Mistake Entries List */}
      {!practiceMode && (
        <div className="space-y-4">
          {filteredMistakes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                No mistakes in this filter!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Any missed questions from quizzes or practice sessions will appear here for targeted review.
              </p>
            </div>
          ) : (
            filteredMistakes.map(m => (
              <div
                key={m.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  m.is_resolved
                    ? 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 opacity-80'
                    : 'border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {m.subject_name || 'Academics'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{m.topic}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 font-normal">
                      Added {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleResolve(m.id)}
                      className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        m.is_resolved
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-emerald-600'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {m.is_resolved ? 'Mastered' : 'Mark as Mastered'}
                    </button>

                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Original Question */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {m.original_question}
                </h3>

                {/* Comparative Answers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-200">
                    <span className="text-[11px] text-rose-500 font-semibold block mb-0.5">
                      Your Initial Incorrect Answer:
                    </span>
                    <span className="font-bold">{m.student_answer || 'No answer submitted'}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200">
                    <span className="text-[11px] text-emerald-600 font-semibold block mb-0.5">
                      Verified Correct Solution:
                    </span>
                    <span className="font-bold">{m.correct_answer}</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">
                    Concept Explanation & Why The Slip Happened:
                  </strong>
                  {m.explanation}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
