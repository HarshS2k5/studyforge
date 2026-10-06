import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LearningPathData, LearningPathScheduleItem } from '../types';

interface LearningPathPageProps {
  onNavigate: (path: string) => void;
}

export const LearningPathPage: React.FC<LearningPathPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPathData[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Creation form state
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    examDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    syllabusTopics: 'Algebraic Expressions\nLinear Equations\nQuadratic Formulas\nCoordinate Geometry\nTrigonometric Ratios',
    currentLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    dailyMinutes: 35,
  });
  const [generating, setGenerating] = useState(false);
  const [previewSchedule, setPreviewSchedule] = useState<LearningPathScheduleItem[] | null>(null);
  const [adaptationToast, setAdaptationToast] = useState<string | null>(null);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    try {
      setLoading(true);
      const res = await api.getLearningPaths();
      setPaths(res.paths || []);
      if (res.paths && res.paths.length > 0) {
        setSelectedPath(res.paths[0]);
      }
    } catch (err) {
      console.error('Failed to load learning paths:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPlan = async () => {
    try {
      setGenerating(true);
      const topics = formData.syllabusTopics
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await api.generateLearningPlan({
        subject: formData.subject,
        examDate: formData.examDate,
        syllabusTopics: topics,
        currentLevel: formData.currentLevel,
        dailyMinutes: formData.dailyMinutes,
      });

      setPreviewSchedule(res.schedule);
    } catch (err: any) {
      alert(err.message || 'Failed to generate learning plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      const topics = formData.syllabusTopics
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await api.createLearningPath({
        subject: formData.subject,
        examDate: formData.examDate,
        syllabusTopics: topics,
        currentLevel: formData.currentLevel,
        dailyMinutes: formData.dailyMinutes,
        schedule: previewSchedule,
        title: `${formData.subject} Comprehensive Exam Sprint`,
      });

      setShowCreateModal(false);
      setPreviewSchedule(null);
      await loadPaths();
      alert(res.message || 'Learning path established!');
    } catch (err: any) {
      alert(err.message || 'Failed to save learning path');
    }
  };

  const handleCompleteMilestone = async (itemId: string) => {
    if (!selectedPath) return;
    try {
      const res = await api.completeLearningPathItem(selectedPath.id, itemId);
      setSelectedPath(prev => {
        if (!prev) return null;
        const updated = prev.schedule.map(i => (i.id === itemId ? { ...i, status: 'completed' as const } : i));
        const done = updated.filter(i => i.status === 'completed').length;
        return {
          ...prev,
          schedule: updated,
          completedCount: done,
          progressPercent: Math.round((done / updated.length) * 100),
        };
      });
      setAdaptationToast('Milestone validated! +20 XP awarded.');
      setTimeout(() => setAdaptationToast(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update milestone');
    }
  };

  const handleAdapt = async (triggerType: 'missed_session' | 'poor_quiz' | 'early_completion') => {
    if (!selectedPath) return;
    try {
      const res = await api.adaptLearningPath(selectedPath.id, {
        triggerType,
        topic: selectedPath.schedule.find(i => i.status === 'pending')?.topic,
      });
      setSelectedPath(prev => prev ? { ...prev, schedule: res.schedule } : null);
      setAdaptationToast(res.summary);
      setTimeout(() => setAdaptationToast(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to adapt plan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in relative">
      {/* Toast */}
      {adaptationToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-indigo-600 text-white font-medium text-sm shadow-xl flex items-center gap-3 animate-slide-up border border-indigo-400/30">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span>{adaptationToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            AI LEARNING PATH
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Intelligent Study Schedules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Day-by-day calibrated learning paths that automatically adapt when you excel, miss a day, or face tough quiz questions.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setPreviewSchedule(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Learning Path
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-slate-500">Analyzing curriculum & plans...</div>
      ) : paths.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Compass className="w-16 h-16 text-indigo-500 mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Learning Paths Yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
            Enter your subject, exam date, and topics. StudyForge will generate a calibrated day-by-day plan guaranteed to prepare you without cramming.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-all"
          >
            Create Your First Path
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Path Selector & Summary */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Active Learning Paths
              </h3>
              <div className="space-y-2">
                {paths.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPath(p)}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      selectedPath?.id === p.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        {p.progressPercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Exam: {p.target_exam_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {p.daily_minutes}m/day
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Adaptation Controls */}
            {selectedPath && (
              <div className="bg-gradient-to-br from-indigo-900/10 to-violet-900/10 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-3xl p-6 border border-indigo-200 dark:border-indigo-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <RefreshCw className="w-4 h-4" />
                  INTELLIGENT ADAPTATION
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  StudyForge recalculates intelligently. Unlike rigid schedules, milestones adapt without losing exam alignment:
                </p>
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handleAdapt('missed_session')}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium hover:border-indigo-400 transition-all flex items-center justify-between"
                  >
                    <span>⚠️ Missed Yesterday (Accelerate next)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleAdapt('poor_quiz')}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium hover:border-indigo-400 transition-all flex items-center justify-between"
                  >
                    <span>🧠 Struggled on Quiz (Inject Remediation)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleAdapt('early_completion')}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium hover:border-indigo-400 transition-all flex items-center justify-between"
                  >
                    <span>🚀 Mastered Early (Fast-track next)</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Day-by-Day Timeline */}
          {selectedPath && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{selectedPath.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedPath.completedCount} of {selectedPath.schedule.length} days completed • Target Exam: {selectedPath.target_exam_date}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{selectedPath.progressPercent}%</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Progress</div>
                </div>
              </div>

              {/* Day-by-day Cards */}
              <div className="space-y-3">
                {selectedPath.schedule.map((day, idx) => {
                  const isDone = day.status === 'completed';
                  const isMissed = day.status === 'missed';

                  return (
                    <div
                      key={day.id || idx}
                      className={`p-5 rounded-2xl border transition-all ${
                        isDone
                          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-emerald-200 dark:border-emerald-900/40 opacity-80'
                          : isMissed
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <button
                            onClick={() => handleCompleteMilestone(day.id)}
                            className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                {day.dayName}
                              </span>
                              <span className="text-xs text-slate-400">• {day.dateStr}</span>
                              {day.adaptationNote && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                                  Adapted
                                </span>
                              )}
                            </div>
                            <h4 className={`text-sm font-bold mt-1 ${isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                              {day.topic}
                            </h4>
                            {day.adaptationNote && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                                {day.adaptationNote}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            {day.durationMinutes} min
                          </span>
                          {!isDone && (
                            <button
                              onClick={() => onNavigate(`/tutor?subject=${encodeURIComponent(day.subject)}&topic=${encodeURIComponent(day.topic)}`)}
                              className="px-3.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs transition-colors flex items-center gap-1"
                            >
                              Study <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Learning Path Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Design AI Learning Path</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Target Exam Date
                  </label>
                  <input
                    type="date"
                    value={formData.examDate}
                    onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Current Knowledge Level
                  </label>
                  <select
                    value={formData.currentLevel}
                    onChange={e => setFormData({ ...formData, currentLevel: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white"
                  >
                    <option value="beginner">Beginner (Foundations first)</option>
                    <option value="intermediate">Intermediate (Standard pacing)</option>
                    <option value="advanced">Advanced (High-yield fast track)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Available Study Time Per Day: <span className="text-indigo-600">{formData.dailyMinutes} mins</span>
                </label>
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={5}
                  value={formData.dailyMinutes}
                  onChange={e => setFormData({ ...formData, dailyMinutes: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Syllabus Topics (One per line)
                </label>
                <textarea
                  rows={5}
                  value={formData.syllabusTopics}
                  onChange={e => setFormData({ ...formData, syllabusTopics: e.target.value })}
                  placeholder="Paste syllabus topics..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {previewSchedule && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Plan Preview Generated ({previewSchedule.length} days total)
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pr-2">
                  {previewSchedule.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                      <span className="font-bold text-indigo-600">{item.dayName}:</span>
                      <span className="truncate max-w-[280px]">{item.topic}</span>
                      <span className="font-semibold text-slate-400">{item.durationMinutes}m</span>
                    </div>
                  ))}
                  {previewSchedule.length > 6 && (
                    <div className="text-center text-slate-400 pt-1 italic">
                      + {previewSchedule.length - 6} more calibrated days until exam
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              {!previewSchedule ? (
                <button
                  disabled={generating}
                  onClick={handlePreviewPlan}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {generating ? 'Calculating Schedule...' : 'Generate AI Schedule'}
                </button>
              ) : (
                <button
                  onClick={handleSavePlan}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Start Learning Path
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
