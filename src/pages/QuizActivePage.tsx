import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Sparkles,
  BookOpen,
  RotateCcw,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { Question } from '../types';
import { useAuth } from '../context/AuthContext';

interface QuizActivePageProps {
  quizData: {
    quiz_id: string;
    subject_id?: number | string;
    chapter_id?: number | string;
    total_questions: number;
    questions: Question[];
  };
  onFinish: () => void;
  onNavigate: (path: string) => void;
}

export const QuizActivePage: React.FC<QuizActivePageProps> = ({
  quizData,
  onFinish,
  onNavigate,
}) => {
  const { updateUserStats } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [savedMistakes, setSavedMistakes] = useState<Record<number, boolean>>({});

  const questions = quizData.questions || [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (result) return;
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleSelectAnswer = (ans: string) => {
    if (result) return;
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: ans,
    });
  };

  const handleSubmitQuiz = async () => {
    if (submitting || result) return;
    setSubmitting(true);

    try {
      const payloadAnswers = questions.map(q => ({
        question_id: q.id,
        user_answer: userAnswers[q.id] || '',
      }));

      const res = await api.submitQuiz({
        subject_id: quizData.subject_id || 1,
        chapter_id: quizData.chapter_id || null,
        quiz_type: 'standard',
        answers: payloadAnswers,
        time_taken_seconds: secondsElapsed,
      });

      setResult(res);
      updateUserStats(res.new_xp, res.new_level, res.level_up, res.unlocked_achievements);

      if (res.accuracy >= 80) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    } catch (err) {
      console.error('Quiz submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveToMistakes = async (ans: any) => {
    try {
      await api.saveMistake({
        question_id: ans.question_id,
        original_question: ans.question_text,
        student_answer: ans.user_answer,
        correct_answer: ans.correct_answer,
        explanation: ans.explanation,
        topic: ans.topic || 'General',
        subject_name: 'Academic Quiz',
      });
      setSavedMistakes({ ...savedMistakes, [ans.question_id]: true });
    } catch (e) {
      console.error('Failed to save to mistake book:', e);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentQuestion && !result) {
    return <div className="py-24 text-center">No questions found.</div>;
  }

  // ==========================================
  // VIEW: POST-QUIZ RESULTS SCREEN
  // ==========================================
  if (result) {
    const isGreatScore = result.accuracy >= 80;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Results Hero Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Quiz Evaluation Complete
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
              {isGreatScore ? 'Outstanding Performance!' : 'Good Effort! Keep Reviewing'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
              Your results have been evaluated server-side. Check your answers, explanations, and key areas for revision below.
            </p>
          </div>

          {/* Scores Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{result.accuracy}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Accuracy</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {result.correctCount} / {result.totalQuestions}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Score</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatTime(result.time_taken_seconds)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Time Taken</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">+{result.xp_earned} XP</div>
              <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">Rewards</div>
            </div>
          </div>

          {/* Topics Needing Improvement */}
          {result.topics_to_improve && result.topics_to_improve.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 max-w-xl mx-auto text-left">
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 mb-1.5">
                <AlertCircle className="w-4 h-4" /> Topics Recommended for Revision:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.topics_to_improve.map((t: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={onFinish}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Retake or Choose New Quiz
            </button>
            <button
              onClick={() => onNavigate('/mistakes')}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-rose-500" /> Open Mistake Book
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Question-by-Question Diagnostic Review
          </h3>

          <div className="space-y-4">
            {result.answers.map((ans: any, idx: number) => (
              <div
                key={ans.question_id}
                className={`p-6 rounded-3xl border transition-all ${
                  ans.is_correct
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-slate-500">{ans.topic || 'General Topic'}</span>
                  </div>

                  {ans.is_correct ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Correct (+1)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                      <XCircle className="w-4 h-4" /> Incorrect
                    </span>
                  )}
                </div>

                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4">
                  {ans.question_text}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Your Submitted Answer:</span>
                    <span className={`font-bold ${ans.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {ans.user_answer || 'No answer'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Correct Answer:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {ans.correct_answer}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-indigo-600 dark:text-indigo-400 block mb-1">Explanation & Reasoning:</strong>
                  {ans.explanation}
                </div>

                {/* Save to Mistake Book Button (for wrong answers) */}
                {!ans.is_correct && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSaveToMistakes(ans)}
                      disabled={savedMistakes[ans.question_id]}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savedMistakes[ans.question_id] ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Saved to Mistake Book
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5" /> Save to Mistake Book
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIVE TEST IN PROGRESS (Answers Strictly Hidden)
  // ==========================================
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Quiz Progress & Timer Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            ({answeredCount} of {questions.length} answered)
          </span>
        </div>

        <div className="flex items-center gap-1.5 py-1 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>{formatTime(secondsElapsed)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
            {currentQuestion.topic || 'Curriculum Concept'}
          </span>
          <span className="text-xs capitalize font-semibold text-slate-400">
            {currentQuestion.difficulty}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
          {currentQuestion.question_text}
        </h3>

        {/* Options / Inputs according to question type */}
        <div className="space-y-3 pt-2">
          {currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false' ? (
            (currentQuestion.options || (currentQuestion.type === 'true_false' ? ['True', 'False'] : [])).map((opt, i) => {
              const isSelected = userAnswers[currentQuestion.id] === opt;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectAnswer(opt)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                </button>
              );
            })
          ) : (
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">
                Type your answer below:
              </label>
              <input
                type="text"
                value={userAnswers[currentQuestion.id] || ''}
                onChange={e => handleSelectAnswer(e.target.value)}
                placeholder="Type exact answer..."
                className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Question Navigation & Submit */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitQuiz}
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz & Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
