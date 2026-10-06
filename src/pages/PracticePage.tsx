import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Filter,
  Sparkles,
  Trophy,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { Subject, Chapter, Question } from '../types';
import { useAuth } from '../context/AuthContext';

interface PracticePageProps {
  initialSubjectId?: string | number;
}

export const PracticePage: React.FC<PracticePageProps> = ({ initialSubjectId }) => {
  const { user, updateUserStats } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | number>(initialSubjectId || 1);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answeredState, setAnsweredState] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null>(null);

  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [savedToMistakes, setSavedToMistakes] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await api.getSubjects();
        setSubjects(data.subjects || []);
        if (!initialSubjectId && data.subjects?.length > 0) {
          setSelectedSubject(data.subjects[0].id);
        }
      } catch (e) {
        console.error('Failed to load subjects:', e);
      }
    }
    loadSubjects();
  }, [initialSubjectId]);

  useEffect(() => {
    if (!selectedSubject) return;
    async function loadChapters() {
      try {
        const data = await api.getSubject(selectedSubject);
        setChapters(data.chapters || []);
      } catch (e) {
        console.error('Failed to load chapters:', e);
      }
    }
    loadChapters();
  }, [selectedSubject]);

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedChapter, difficulty]);

  async function fetchQuestions() {
    setLoading(true);
    setAnsweredState(null);
    setSelectedAnswer('');
    setSavedToMistakes(false);
    try {
      const data = await api.getPracticeQuestions({
        subject_id: selectedSubject,
        chapter_id: selectedChapter !== 'all' ? selectedChapter : undefined,
        difficulty,
        limit: 15,
      });
      setQuestions(data.questions || []);
      setCurrentIndex(0);
    } catch (e) {
      console.error('Failed to fetch practice questions:', e);
    } finally {
      setLoading(false);
    }
  }

  const currentQ = questions[currentIndex];

  const handleCheckAnswer = async () => {
    if (!currentQ || !selectedAnswer || answeredState?.submitted) return;

    try {
      const res = await api.submitPracticeAnswer({
        question_id: currentQ.id,
        user_answer: selectedAnswer,
        time_taken_seconds: 15,
      });

      setAnsweredState({
        submitted: true,
        isCorrect: res.is_correct,
        correctAnswer: res.correct_answer,
        explanation: res.explanation,
      });

      setSessionScore(prev => ({
        correct: prev.correct + (res.is_correct ? 1 : 0),
        total: prev.total + 1,
      }));

      if (user && res.xp_earned > 0) {
        updateUserStats(user.xp + res.xp_earned, user.level, false, res.unlocked_achievements);
      }
    } catch (err) {
      console.error('Failed to check practice answer:', err);
    }
  };

  const handleNext = () => {
    setAnsweredState(null);
    setSelectedAnswer('');
    setSavedToMistakes(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop or re-fetch for unlimited practice
      fetchQuestions();
    }
  };

  const handleSaveMistake = async () => {
    if (!currentQ || !answeredState) return;
    try {
      await api.saveMistake({
        question_id: currentQ.id,
        original_question: currentQ.question_text,
        student_answer: selectedAnswer,
        correct_answer: answeredState.correctAnswer,
        explanation: answeredState.explanation,
        topic: currentQ.topic || 'General',
        subject_name: 'Practice Session',
      });
      setSavedToMistakes(true);
    } catch (e) {
      console.error('Failed to save mistake:', e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" /> Unlimited Practice Mode
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Solve problems at your own pace with instant step-by-step explanations and mistake logging.
          </p>
        </div>

        {/* Score pill */}
        <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-900 text-xs font-bold text-indigo-700 dark:text-indigo-300 self-start sm:self-auto">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Session Accuracy: {sessionScore.total > 0 ? Math.round((sessionScore.correct / sessionScore.total) * 100) : 100}%</span>
          <span className="text-slate-400 font-normal">({sessionScore.correct}/{sessionScore.total})</span>
        </div>
      </div>

      {/* Filter Ribbon (Section #10: Select Subject, Chapter, Difficulty) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-3.5 h-3.5 text-indigo-500" /> Filters:
        </div>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={e => setSelectedChapter(e.target.value)}
          className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
        >
          <option value="all">All Chapters</option>
          {chapters.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button
          onClick={fetchQuestions}
          className="ml-auto inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Refresh Questions
        </button>
      </div>

      {/* Main Practice Question Area */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500">Loading practice questions...</div>
      ) : !currentQ ? (
        <div className="py-20 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No questions found matching your filter criteria.</p>
          <button onClick={() => setDifficulty('all')} className="mt-3 text-xs text-indigo-600 font-bold hover:underline">
            Reset Difficulty Filter
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              {currentQ.topic || 'Concept Review'}
            </span>
            <span className="capitalize font-semibold text-slate-400">
              Difficulty: {currentQ.difficulty} • Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question_text}
          </h3>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.type === 'multiple_choice' || currentQ.type === 'true_false' ? (
              (currentQ.options || (currentQ.type === 'true_false' ? ['True', 'False'] : [])).map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                let optBorder = 'border-slate-200 dark:border-slate-800';
                let optBg = 'hover:border-slate-300 dark:hover:border-slate-700';

                if (isSelected && !answeredState?.submitted) {
                  optBorder = 'border-indigo-600';
                  optBg = 'bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-white';
                }

                if (answeredState?.submitted) {
                  if (opt === answeredState.correctAnswer) {
                    optBorder = 'border-emerald-500';
                    optBg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
                  } else if (isSelected && !answeredState.isCorrect) {
                    optBorder = 'border-rose-500';
                    optBg = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200';
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answeredState?.submitted}
                    onClick={() => setSelectedAnswer(opt)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${optBorder} ${optBg}`}
                  >
                    <span>{opt}</span>
                    {answeredState?.submitted && opt === answeredState.correctAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    {answeredState?.submitted && isSelected && !answeredState.isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div>
                <input
                  type="text"
                  disabled={answeredState?.submitted}
                  value={selectedAnswer}
                  onChange={e => setSelectedAnswer(e.target.value)}
                  placeholder="Type your exact answer here..."
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Answer Feedback & Explanation Box */}
          {answeredState?.submitted && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                answeredState.isCorrect
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold flex items-center gap-1.5 ${answeredState.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {answeredState.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Correct Answer! (+8 XP)
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" /> Incorrect
                    </>
                  )}
                </span>

                {!answeredState.isCorrect && (
                  <button
                    onClick={handleSaveMistake}
                    disabled={savedToMistakes}
                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {savedToMistakes ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Added to Mistake Book
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3.5 h-3.5" /> Save to Mistake Book
                      </>
                    )}
                  </button>
                )}
              </div>

              {!answeredState.isCorrect && (
                <div className="text-slate-700 dark:text-slate-300">
                  <strong>Correct answer:</strong> {answeredState.correctAnswer}
                </div>
              )}

              <div className="text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                <strong className="text-indigo-600 dark:text-indigo-400 block mb-0.5">Explanation:</strong>
                {answeredState.explanation}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {!answeredState?.submitted ? (
              <button
                type="button"
                disabled={!selectedAnswer}
                onClick={handleCheckAnswer}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Next Problem <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <span className="text-[11px] text-slate-400">
              Unlimited practice • Learn from every attempt
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
