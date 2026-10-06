import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  Clock,
  Flag,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';
import { Subject, Chapter, Question } from '../types';
import { useAuth } from '../context/AuthContext';

interface ExamModePageProps {
  onNavigate: (path: string) => void;
}

export const ExamModePage: React.FC<ExamModePageProps> = ({ onNavigate }) => {
  const { updateUserStats } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Config states
  const [isExamActive, setIsExamActive] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<number | string>(1);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  // Active exam states
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flaggedForReview, setFlaggedForReview] = useState<Record<number, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);
  const [examResult, setExamResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getSubjects();
        setSubjects(data.subjects || []);
        if (data.subjects?.length > 0) {
          setSelectedSubject(data.subjects[0].id);
        }
      } catch (e) {}
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    async function loadChaps() {
      try {
        const data = await api.getSubject(selectedSubject);
        setChapters(data.chapters || []);
      } catch (e) {}
    }
    loadChaps();
  }, [selectedSubject]);

  // Exam Countdown Timer
  useEffect(() => {
    if (!isExamActive || examResult) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamActive, examResult]);

  const handleStartExam = async () => {
    setLoading(true);
    try {
      const data = await api.startExam({
        subject_id: selectedSubject,
        num_questions: numQuestions,
        time_limit_minutes: timeLimitMinutes,
      });

      setExamQuestions(data.questions || []);
      setSecondsRemaining(data.time_limit_minutes * 60);
      setCurrentIndex(0);
      setAnswers({});
      setFlaggedForReview({});
      setExamResult(null);
      setIsExamActive(true);
    } catch (e) {
      console.error('Failed to start exam:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = (id: number) => {
    setFlaggedForReview(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectAnswer = (qId: number, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleAttemptSubmit = () => {
    const unansweredCount = examQuestions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      setShowSubmitWarning(true);
    } else {
      handleSubmitExam();
    }
  };

  const handleSubmitExam = async () => {
    setShowSubmitWarning(false);
    setLoading(true);

    try {
      const payloadAnswers = examQuestions.map(q => ({
        question_id: q.id,
        user_answer: answers[q.id] || '',
      }));

      const timeUsed = timeLimitMinutes * 60 - secondsRemaining;

      const res = await api.submitQuiz({
        subject_id: selectedSubject,
        quiz_type: 'exam',
        answers: payloadAnswers,
        time_taken_seconds: Math.max(10, timeUsed),
      });

      setExamResult(res);
      updateUserStats(res.new_xp, res.new_level, res.level_up, res.unlocked_achievements);

      if (res.accuracy >= 75) {
        try {
          confetti({
            particleCount: 110,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to submit exam:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ==========================================
  // VIEW 1: EXAM RESULT DIAGNOSTIC REPORT
  // ==========================================
  if (examResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Exam Simulation Report
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Final Examination Score: {examResult.score}%
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{examResult.accuracy}%</div>
              <div className="text-[11px] text-slate-400">Accuracy</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-black text-slate-900 dark:text-white">{examResult.correctCount} / {examResult.totalQuestions}</div>
              <div className="text-[11px] text-slate-400">Correct</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-2xl font-black text-slate-900 dark:text-white">{formatTimer(examResult.time_taken_seconds)}</div>
              <div className="text-[11px] text-slate-400">Time Used</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">+{examResult.xp_earned} XP</div>
              <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80">Rewards</div>
            </div>
          </div>

          {examResult.topics_to_improve && examResult.topics_to_improve.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 max-w-lg mx-auto text-left text-xs">
              <div className="font-bold text-rose-700 dark:text-rose-300 mb-1">
                Curriculum Areas To Strengthen:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {examResult.topics_to_improve.map((t: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-rose-600 text-[11px] font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => {
                setIsExamActive(false);
                setExamResult(null);
              }}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Start Another Exam
            </button>
            <button
              onClick={() => onNavigate('/mistakes')}
              className="py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Review in Mistake Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE EXAM SIMULATION (Section #23)
  // ==========================================
  if (isExamActive) {
    const currentQ = examQuestions[currentIndex];
    const isFlagged = flaggedForReview[currentQ?.id];

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
        {/* Exam Navigation Bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
              Exam Simulation
            </span>
            <span className="text-xs text-slate-400">
              Question {currentIndex + 1} of {examQuestions.length}
            </span>
          </div>

          {/* Countdown Timer with color warning if < 2 mins */}
          <div
            className={`flex items-center gap-1.5 py-1 px-3.5 rounded-xl font-mono text-xs font-bold ${
              secondsRemaining < 120
                ? 'bg-rose-100 text-rose-700 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Left: {formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => handleToggleFlag(currentQ.id)}
            className={`inline-flex items-center gap-1 text-xs font-semibold py-1 px-2.5 rounded-xl border transition-colors cursor-pointer ${
              isFlagged
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
            {isFlagged ? 'Marked for Review' : 'Mark for Review'}
          </button>
        </div>

        {/* Question Palette (Section #23 Question navigation) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-2 font-semibold">Palette:</span>
          {examQuestions.map((q, idx) => {
            const hasAns = Boolean(answers[q.id]);
            const isFlg = Boolean(flaggedForReview[q.id]);
            const isCurr = currentIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-xl font-bold text-xs transition-all relative cursor-pointer ${
                  isCurr
                    ? 'ring-2 ring-indigo-500 font-black'
                    : ''
                } ${
                  isFlg
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : hasAns
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Body */}
        {currentQ && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
            <div className="text-xs font-semibold text-slate-400">
              Topic: {currentQ.topic || 'General'}
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question_text}
            </h3>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {(currentQ.options || ['True', 'False']).map((opt: string, i: number) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectAnswer(currentQ.id, opt)}
                    className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>

            {/* Controls & Accidental Submission Prevention */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-3">
                {currentIndex < examQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}

                <button
                  onClick={handleAttemptSubmit}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Submit Final Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accidental Submission Prevention Modal (Section #23 Requirement) */}
        {showSubmitWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Unanswered Questions Remaining</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                You have {examQuestions.length - Object.keys(answers).length} unanswered questions. Are you sure you want to finalize your exam submission now?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSubmitWarning(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Return to Exam
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 3: CONFIGURATION SETUP
  // ==========================================
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Layers className="w-7 h-7 text-indigo-500" /> Exam Simulation Mode
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Realistic timed mock examinations with question palettes, review flags, and detailed analytics.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Target Subject
          </label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(Number(e.target.value))}
            className="w-full py-3 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Question Count
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 15].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestions(n)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    numQuestions === n
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Time Limit (Minutes)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 30].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimeLimitMinutes(m)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    timeLimitMinutes === m
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleStartExam}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Initializing Paper...' : 'Begin Examination'}
          </button>
        </div>
      </div>
    </div>
  );
};
