import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  History,
  Clock,
  Target,
  Trophy,
  HelpCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { Subject, Chapter, QuizAttempt } from '../types';

interface QuizGeneratorPageProps {
  onStartQuiz: (config: any) => void;
  initialSubjectId?: string | number;
}

export const QuizGeneratorPage: React.FC<QuizGeneratorPageProps> = ({
  onStartQuiz,
  initialSubjectId,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');

  const [subjectId, setSubjectId] = useState<number | string>(initialSubjectId || 1);
  const [chapterId, setChapterId] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [questionType, setQuestionType] = useState<string>('all');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [subRes, histRes] = await Promise.allSettled([
          api.getSubjects(),
          api.getQuizHistory(),
        ]);
        if (subRes.status === 'fulfilled') {
          setSubjects(subRes.value.subjects || []);
          if (!initialSubjectId && subRes.value.subjects?.length > 0) {
            setSubjectId(subRes.value.subjects[0].id);
          }
        }
        if (histRes.status === 'fulfilled') {
          setHistory(histRes.value.history || []);
        }
      } catch (e) {
        console.error('Error loading quiz config:', e);
      }
    }
    loadData();
  }, [initialSubjectId]);

  useEffect(() => {
    if (!subjectId) return;
    async function loadSubjectChapters() {
      try {
        const data = await api.getSubject(subjectId);
        setChapters(data.chapters || []);
      } catch (e) {
        console.error('Error loading chapters:', e);
      }
    }
    loadSubjectChapters();
  }, [subjectId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const data = await api.generateQuiz({
        subject_id: subjectId,
        chapter_id: chapterId !== 'all' ? chapterId : undefined,
        difficulty,
        num_questions: numQuestions,
        question_type: questionType,
      });

      onStartQuiz({
        quiz_id: data.quiz_id,
        subject_id: subjectId,
        chapter_id: chapterId !== 'all' ? chapterId : undefined,
        total_questions: data.total_questions,
        questions: data.questions,
      });
    } catch (err) {
      console.error('Quiz generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-500 fill-amber-500" /> Smart Quiz Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build active recall quizzes adapted to your exact study focus.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Configure Quiz
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" /> History ({history.length})
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  1. Subject
                </label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  2. Chapter
                </label>
                <select
                  value={chapterId}
                  onChange={e => setChapterId(e.target.value)}
                  className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Chapters in Subject</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  3. Difficulty
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['all', 'easy', 'medium', 'hard'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2.5 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        difficulty === d
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  4. Number of Questions
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumQuestions(n)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        numQuestions === n
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {n} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                5. Question Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'all', label: 'Mixed Format' },
                  { id: 'multiple_choice', label: 'Multiple Choice' },
                  { id: 'true_false', label: 'True / False' },
                  { id: 'fill_blank', label: 'Fill in Blank' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setQuestionType(t.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      questionType === t.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                Answers are strictly evaluated server-side upon completion.
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  'Generating Questions...'
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Start Quiz
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Quiz History View */
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No quizzes completed yet</p>
              <p className="text-xs text-slate-400 mt-1">Configure and start your first quiz above to track accuracy!</p>
            </div>
          ) : (
            history.map(item => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.subject_name || 'Academic Quiz'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {item.total_questions} Questions
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Completed {new Date(item.completed_at).toLocaleDateString()} • {Math.round(item.time_taken_seconds / 60)} mins
                  </div>
                  {item.topics_to_improve && item.topics_to_improve.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-rose-500 font-semibold">Review:</span>
                      {item.topics_to_improve.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-2xl font-extrabold ${item.accuracy >= 80 ? 'text-emerald-500' : item.accuracy >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {item.accuracy}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.correct_count} / {item.total_questions} Correct
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
