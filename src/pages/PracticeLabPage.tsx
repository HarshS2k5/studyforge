import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Award,
  Zap,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Subject } from '../types';

interface PracticeLabPageProps {
  onNavigate: (path: string) => void;
}

export const PracticeLabPage: React.FC<PracticeLabPageProps> = ({ onNavigate }) => {
  const { user, updateUserStats } = useAuth();

  // Config
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('Science');
  const [selectedTopic, setSelectedTopic] = useState('General Concepts');

  // Question state
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Dynamic adaptive state
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [answerStreak, setAnswerStreak] = useState(0);
  const [questionsAnsweredSession, setQuestionsAnsweredSession] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
      if (res.subjects && res.subjects.length > 0) {
        setSelectedSubject(res.subjects[0].name);
      }
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [selectedSubject]);

  const fetchNextQuestion = async (customDifficulty?: 'easy' | 'medium' | 'hard') => {
    setLoadingQuestion(true);
    setSelectedAnswer(null);
    setSubmitted(false);
    setResult(null);
    setShowHint(false);

    try {
      const diff = customDifficulty || difficulty;
      const res = await api.getPracticeLabQuestion({
        subject: selectedSubject,
        topic: selectedTopic,
        currentDifficulty: diff,
        answerStreak,
      });
      setCurrentQuestion(res.question);
    } catch (err: any) {
      console.error('Failed to load practice lab question', err);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    if (submitted) return;
    setSelectedAnswer(opt);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion || submitted) return;

    try {
      const res = await api.submitPracticeLabAnswer({
        questionId: currentQuestion.id,
        selectedAnswer,
        correctAnswer: currentQuestion.answer,
        difficulty: currentQuestion.difficulty || difficulty,
        subject: selectedSubject,
        topic: selectedTopic,
      });

      setSubmitted(true);
      setResult(res);

      if (res.isCorrect) {
        setAnswerStreak(res.newStreak);
        setSessionXp(prev => prev + (res.xpEarned || 15));
        if (user && res.xpEarned) {
          updateUserStats(user.xp + res.xpEarned, user.level, false);
        }
      } else {
        setAnswerStreak(0);
        setShowHint(true); // Automatically unlock helpful hints when student struggles
      }

      setQuestionsAnsweredSession(prev => prev + 1);

      if (res.recommendedDifficulty && res.recommendedDifficulty !== difficulty) {
        setDifficulty(res.recommendedDifficulty);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit answer');
    }
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'hard':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      default:
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Adaptive Practice Lab
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              Real-Time Dynamic Difficulty
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" /> Adaptive Practice Lab
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Questions automatically scale with your performance: answer streaks increase difficulty, while missed questions unlock immediate hints and gentle guidance.
          </p>
        </div>

        {/* Live Session Stats Meter */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-xs">
          {/* Answer Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-extrabold text-xs">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{answerStreak} in a row</span>
          </div>

          {/* XP Gained */}
          <div className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{sessionXp} XP</span>
          </div>
        </div>
      </div>

      {/* Control Strip: Subject, Topic & Difficulty */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
              Topic
            </label>
            <input
              type="text"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              placeholder="e.g. Chemical Reactions"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Dynamic Difficulty Level Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Active Difficulty:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${getDifficultyBadge(
              difficulty
            )}`}
          >
            {difficulty}
          </span>
          {answerStreak >= 2 && difficulty !== 'hard' && (
            <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 animate-pulse">
              <TrendingUp className="w-3 h-3" /> Approaching Hard!
            </span>
          )}
        </div>
      </div>

      {/* Main Question Arena */}
      {loadingQuestion ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold">
            Calibrating dynamic question for {selectedSubject} ({difficulty})...
          </p>
        </div>
      ) : !currentQuestion ? (
        <div className="p-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs text-slate-400">No question available right now.</p>
          <button
            onClick={() => fetchNextQuestion()}
            className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          {/* Question Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">
              Question #{questionsAnsweredSession + 1}
            </span>
            <div className="flex items-center gap-2">
              {currentQuestion.hint && !showHint && !submitted && (
                <button
                  onClick={() => setShowHint(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Need a Hint?
                </button>
              )}
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${getDifficultyBadge(currentQuestion.difficulty || difficulty)}`}>
                {currentQuestion.difficulty || difficulty}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {currentQuestion.text || currentQuestion.question}
          </h2>

          {/* Hint Card */}
          {showHint && currentQuestion.hint && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5 animate-fade-in">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Guiding Hint: </span>
                <span>{currentQuestion.hint}</span>
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {(currentQuestion.options || []).map((opt: string, idx: number) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectAnswer =
                submitted && (opt === currentQuestion.answer || opt.startsWith(currentQuestion.answer));
              const isWrongChoice = submitted && isSelected && !isCorrectAnswer;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={submitted}
                  className={`p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    isCorrectAnswer
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                      : isWrongChoice
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 ring-2 ring-rose-500/30'
                      : isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {isWrongChoice && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Feedback & Explanation Box */}
          {submitted && result && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 animate-fade-in ${
                result.isCorrect
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="font-extrabold flex items-center justify-between">
                <span>{result.isCorrect ? '🎉 Correct!' : '❌ Not quite right'}</span>
                {result.isCorrect && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white font-mono">
                    +{result.xpEarned || 20} XP
                  </span>
                )}
              </div>
              <p className="leading-relaxed whitespace-pre-line text-xs">
                {result.explanation || currentQuestion.explanation}
              </p>
              {result.recommendedDifficulty && result.recommendedDifficulty !== difficulty && (
                <div className="pt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  ⚡ Dynamic Adjustment: Difficulty automatically adjusting to{' '}
                  <span className="uppercase">{result.recommendedDifficulty}</span>.
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => fetchNextQuestion()}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Skip Question
            </button>

            {!submitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={() => fetchNextQuestion()}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Next Adaptive Question <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
