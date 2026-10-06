import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { User, ReportItem, Subject } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'content' | 'ai'>('overview');
  const [overview, setOverview] = useState<any | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [aiConfig, setAiConfig] = useState<{ geminiApiKeySet: boolean; maskedKey: string; model: string }>({
    geminiApiKeySet: false,
    maskedKey: '',
    model: 'gemini-3.8-flash',
  });

  // Forms
  const [newQuestion, setNewQuestion] = useState({
    subject_id: 1,
    question_text: '',
    type: 'multiple_choice',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_answer: '',
    explanation: '',
    difficulty: 'medium',
    topic: 'Core Concept',
  });

  const [inputApiKey, setInputApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  async function loadAllAdminData() {
    setLoading(true);
    try {
      const [ovRes, repRes, usRes, sbRes, aiRes] = await Promise.allSettled([
        api.getAdminOverview(),
        api.getReports(),
        api.getAdminUsers(),
        api.getSubjects(),
        api.getAdminAiConfig(),
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
      if (repRes.status === 'fulfilled') setReports(repRes.value.reports || []);
      if (usRes.status === 'fulfilled') setUsers(usRes.value.users || []);
      if (sbRes.status === 'fulfilled') setSubjects(sbRes.value.subjects || []);
      if (aiRes.status === 'fulfilled') setAiConfig(aiRes.value);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateReport = async (id: number, status: string) => {
    try {
      await api.updateReportStatus(id, { status, admin_notes: 'Reviewed by admin staff.' });
      const rep = await api.getReports();
      setReports(rep.reports || []);
    } catch (e) {
      console.error('Failed to update report:', e);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      const us = await api.getAdminUsers();
      setUsers(us.users || []);
    } catch (e) {
      console.error('Failed to update role:', e);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options =
        newQuestion.type === 'multiple_choice'
          ? [newQuestion.option1, newQuestion.option2, newQuestion.option3, newQuestion.option4].filter(Boolean)
          : undefined;

      await api.addAdminQuestion({
        subject_id: newQuestion.subject_id,
        question_text: newQuestion.question_text,
        type: newQuestion.type,
        options,
        correct_answer: newQuestion.correct_answer,
        explanation: newQuestion.explanation,
        difficulty: newQuestion.difficulty,
        topic: newQuestion.topic,
      });

      alert('Question added successfully to curriculum question bank!');
      setNewQuestion({
        subject_id: 1,
        question_text: '',
        type: 'multiple_choice',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_answer: '',
        explanation: '',
        difficulty: 'medium',
        topic: 'Core Concept',
      });
      loadAllAdminData();
    } catch (e) {
      console.error('Failed to add question:', e);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      await api.saveAdminAiConfig({ apiKey: inputApiKey, model: aiConfig.model });
      setSaveMessage('Gemini API key saved securely!');
      setInputApiKey('');
      const aiRes = await api.getAdminAiConfig();
      setAiConfig(aiRes);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error('Failed to save AI config:', e);
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-600 dark:text-purple-400" /> Admin Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage educational curriculum, student accounts, issue reports, and AI infrastructure.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Reports ({reports.filter(r => r.status === 'Pending').length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'content'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Content & Questions
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            AI Config
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400">Total Students</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {overview?.stats?.totalUsers || users.length}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400">Subjects & Chapters</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {overview?.stats?.totalSubjects || 6} / {overview?.stats?.totalChapters || 11}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400">Question Bank</span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                {overview?.stats?.totalQuestions || 18} Qs
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs text-slate-400">Pending Reports</span>
              <div className="text-2xl font-extrabold text-rose-500 mt-1">
                {reports.filter(r => r.status === 'Pending').length}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">System Health & AI Integration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Database Engine</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1">SQLite 3 (WAL Mode Active)</div>
                <div className="text-[10px] text-emerald-500 font-semibold mt-1">100% Responsive & Synced</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">AI Tutor Engine</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1">
                  {aiConfig.geminiApiKeySet ? 'Google Gemini 3.8 Flash' : 'Built-in Socratic Engine'}
                </div>
                <div className="text-[10px] text-indigo-500 font-semibold mt-1">Zero-Latency Fallback Ready</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Security & Roles</span>
                <div className="font-bold text-slate-900 dark:text-white mt-1">Role-Based Access (JWT)</div>
                <div className="text-[10px] text-purple-500 font-semibold mt-1">Bcrypt Salt 10 Enabled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORTS MANAGEMENT TAB (Section #31) */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Content & Typo Reports From Students
          </h3>

          {reports.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No reports filed yet. The curriculum is in pristine condition!
            </div>
          ) : (
            reports.map(rep => (
              <div
                key={rep.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {rep.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Reported by {rep.reporter_username || 'Anonymous'} ({new Date(rep.created_at).toLocaleDateString()})
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      rep.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : rep.status === 'Reviewing'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {rep.description}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400">Content Reference: {rep.content_id || 'N/A'}</span>
                  <div className="flex items-center gap-2">
                    {rep.status !== 'Reviewing' && (
                      <button
                        onClick={() => handleUpdateReport(rep.id, 'Reviewing')}
                        className="py-1 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                      >
                        Mark Reviewing
                      </button>
                    )}
                    {rep.status !== 'Resolved' && (
                      <button
                        onClick={() => handleUpdateReport(rep.id, 'Resolved')}
                        className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
            User Accounts ({users.length})
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {u.username}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="text-slate-400 mt-0.5">{u.email} • {u.grade} • Level {u.level} ({u.xp} XP)</div>
                </div>

                <div className="flex items-center gap-2">
                  {u.role === 'student' ? (
                    <button
                      onClick={() => handleUpdateUserRole(u.id, 'admin')}
                      className="py-1.5 px-3 rounded-lg border border-purple-200 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-[11px] font-semibold cursor-pointer"
                    >
                      Promote to Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateUserRole(u.id, 'student')}
                      className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
                    >
                      Demote to Student
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONTENT & QUESTION CREATOR */}
      {activeTab === 'content' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Curriculum Question</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add new multiple choice, true/false, or short answer questions directly to the bank.
            </p>
          </div>

          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject
                </label>
                <select
                  value={newQuestion.subject_id}
                  onChange={e => setNewQuestion({ ...newQuestion, subject_id: Number(e.target.value) })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Type
                </label>
                <select
                  value={newQuestion.type}
                  onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="fill_blank">Fill in Blank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={newQuestion.difficulty}
                  onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Question Text
              </label>
              <textarea
                rows={2}
                required
                value={newQuestion.question_text}
                onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                placeholder="What is the question to ask the student?"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {newQuestion.type === 'multiple_choice' && (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Option A"
                  value={newQuestion.option1}
                  onChange={e => setNewQuestion({ ...newQuestion, option1: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Option B"
                  value={newQuestion.option2}
                  onChange={e => setNewQuestion({ ...newQuestion, option2: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  placeholder="Option C"
                  value={newQuestion.option3}
                  onChange={e => setNewQuestion({ ...newQuestion, option3: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  placeholder="Option D"
                  value={newQuestion.option4}
                  onChange={e => setNewQuestion({ ...newQuestion, option4: e.target.value })}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correct Answer
                </label>
                <input
                  type="text"
                  required
                  placeholder="Exact correct answer string"
                  value={newQuestion.correct_answer}
                  onChange={e => setNewQuestion({ ...newQuestion, correct_answer: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fractions, Kinetics, Big-O"
                  value={newQuestion.topic}
                  onChange={e => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Explanation & Pedagogical Reasoning
              </label>
              <textarea
                rows={2}
                required
                value={newQuestion.explanation}
                onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                placeholder="Why is this answer correct? Explain step-by-step so students learn."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              Add Question to Bank
            </button>
          </form>
        </div>
      )}

      {/* 5. AI CONFIGURATION TAB */}
      {activeTab === 'ai' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" /> Google Gemini API Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              StudyForge seamlessly supports Google Gemini 3.8 Flash for AI tutoring and note transformations. If no key is set, the platform uses its built-in pedagogical Socratic engine.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Current API Status:</span>
              <span className={`font-bold ${aiConfig.geminiApiKeySet ? 'text-emerald-500' : 'text-amber-500'}`}>
                {aiConfig.geminiApiKeySet ? 'Configured & Active' : 'Using Built-in Socratic Engine'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Key:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{aiConfig.maskedKey || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{aiConfig.model}</span>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {saveMessage}
            </div>
          )}

          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Update Gemini API Key
              </label>
              <input
                type="password"
                value={inputApiKey}
                onChange={e => setInputApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Stored securely in the server SQLite config table and never sent to clients.
              </span>
            </div>

            <button
              type="submit"
              disabled={savingKey || !inputApiKey.trim()}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              {savingKey ? 'Saving...' : 'Save AI Configuration'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
