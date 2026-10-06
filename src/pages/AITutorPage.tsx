import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Send,
  Sparkles,
  HelpCircle,
  Lightbulb,
  FileQuestion,
  ListRestart,
  AlertCircle,
  BookOpen,
  Bot,
  User as UserIcon,
  Camera,
  UploadCloud,
  X,
  Plus,
  Trash2,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Subject, ChatSession, ChatMessage } from '../types';

interface UIMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  followUps?: string[];
  provider?: string;
  timestamp: string;
}

interface AITutorPageProps {
  initialSubject?: string;
  initialTopic?: string;
}

export const AITutorPage: React.FC<AITutorPageProps> = ({ initialSubject, initialTopic }) => {
  const { user } = useAuth();

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Subject & Topic state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [subjectName, setSubjectName] = useState(initialSubject || 'Mathematics');
  const [topic, setTopic] = useState(initialTopic || 'General Understanding');
  const [grade, setGrade] = useState(user?.grade || 'Grade 10');

  // Messages & input state
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text: `Hello ${user?.username || 'Student'}! I am your StudyForge Socratic AI Assistant.\n\nMy purpose is to guide your understanding step-by-step rather than just handing out answers.\n\nYou can select a specific **Subject & Topic**, type any difficult question, or use the **📸 Scan Question** tool to analyze homework images!\n\n*StudyForge AI is an educational companion. Always verify important exam formulas with your official textbook.*`,
      followUps: [
        'How does the Pythagorean theorem work?',
        "Explain Newton's second law with a real-life analogy",
        'Why do fractions need common denominators to add?',
        'How does binary search achieve O(log n) time?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Question Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanImageBase64, setScanImageBase64] = useState<string | null>(null);
  const [scanMimeType, setScanMimeType] = useState('image/jpeg');
  const [scanNotes, setScanNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    questionText: string;
    subject: string;
    topic: string;
    stepByStepSolution: string;
    similarPracticeQuestions: Array<{ question: string; options: string[]; answer: string; explanation: string }>;
    commonPitfalls: string;
    isAiGenerated: boolean;
  } | null>(null);
  const [selectedPracticeAnswers, setSelectedPracticeAnswers] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch subjects & sessions on load
  useEffect(() => {
    loadSubjects();
    if (user) {
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadSubjects = async () => {
    try {
      const res = await api.getSubjects();
      setSubjects(res.subjects || []);
      if (res.subjects && res.subjects.length > 0) {
        if (!initialSubject) {
          setSelectedSubjectId(res.subjects[0].id);
          setSubjectName(res.subjects[0].name);
        } else {
          const match = res.subjects.find(s => s.name.toLowerCase() === initialSubject.toLowerCase());
          if (match) {
            setSelectedSubjectId(match.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.getChatSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to load chat sessions', err);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    setActiveSessionId(session.id);
    setSubjectName(session.subject_name || 'Mathematics');
    setTopic(session.topic || 'General');
    try {
      const res = await api.getChatSession(session.id);
      if (res.messages && res.messages.length > 0) {
        setMessages(
          res.messages.map(m => ({
            id: 'db-' + m.id,
            sender: m.sender,
            text: m.message_text,
            followUps: m.metadata?.followUps,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      } else {
        setMessages([
          {
            id: 'welcome-' + session.id,
            sender: 'tutor',
            text: `Started chat: **${session.title}** (${session.subject_name || 'General'}). What would you like to explore?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch session messages', err);
    }
    setSidebarOpen(false);
  };

  const handleNewChat = async () => {
    try {
      const title = `${subjectName}: ${topic || 'General Concept'}`;
      const res = await api.createChatSession({
        title,
        subject_id: typeof selectedSubjectId === 'number' ? selectedSubjectId : undefined,
        topic,
      });
      setSessions(prev => [res.session, ...prev]);
      setActiveSessionId(res.session.id);
      setMessages([
        {
          id: 'welcome-' + res.session.id,
          sender: 'tutor',
          text: `New study session created for **${subjectName}** (${topic}). How can I assist your learning?`,
          followUps: [
            'Break this topic down step-by-step',
            'Give me a concrete real-world example',
            'Quiz me with a practice problem',
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      // Fallback local reset
      setActiveSessionId(null);
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'tutor',
          text: `Welcome! Let's explore **${subjectName}** (${topic}). What would you like to learn today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    try {
      await api.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subId = Number(e.target.value);
    setSelectedSubjectId(subId);
    const sub = subjects.find(s => s.id === subId);
    if (sub) {
      setSubjectName(sub.name);
    }
  };

  const handleSend = async (
    customPrompt?: string,
    action?: 'chat' | 'simpler' | 'example' | 'quiz_me' | 'summarize' | 'mistake'
  ) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() && action !== 'quiz_me' && action !== 'summarize') return;

    const userText = promptToSend || (action === 'quiz_me' ? 'Quiz me on this concept' : 'Summarize this topic');
    const userMsg: UIMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      if (activeSessionId) {
        // Send via session endpoint
        const res = await api.sendChatMessage(activeSessionId, {
          message: userText,
          action: action || 'chat',
        });
        const tutorMsg: UIMessage = {
          id: 'tutor-' + Date.now(),
          sender: 'tutor',
          text: res.reply,
          followUps: res.suggestedFollowUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, tutorMsg]);
      } else {
        // Stateless tutor endpoint
        const res = await api.askTutor({
          message: userText,
          grade,
          subject: subjectName,
          topic,
          action: action || 'chat',
        });
        const tutorMsg: UIMessage = {
          id: 'tutor-' + Date.now(),
          sender: 'tutor',
          text: res.reply,
          followUps: res.suggestedFollowUps,
          provider: res.provider,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, tutorMsg]);
      }
    } catch (err: any) {
      const errorMsg: UIMessage = {
        id: 'err-' + Date.now(),
        sender: 'tutor',
        text: 'I ran into a temporary hiccup processing your request. Please try asking again or break the question into smaller parts!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: 'simpler' | 'example' | 'quiz_me' | 'summarize' | 'mistake') => {
    const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user')?.text || topic;
    handleSend(lastUserMessage, action);
  };

  // Image Upload for Question Scanner
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    setScanMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setScanImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleScanSubmit = async () => {
    if (!scanImageBase64) return;
    setScanning(true);
    try {
      const res = await api.scanQuestion({
        imageBase64: scanImageBase64,
        mimeType: scanMimeType,
        notes: scanNotes,
      });
      setScanResult(res);
    } catch (err: any) {
      alert(err.message || 'Failed to scan question. Please try a clearer picture.');
    } finally {
      setScanning(false);
    }
  };

  const handleInsertScannedToChat = () => {
    if (!scanResult) return;
    setScannerOpen(false);
    const prompt = `I scanned a question: "${scanResult.questionText}"\n\nCould you guide me through solving it step-by-step?`;
    handleSend(prompt);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 flex gap-4 h-[calc(100vh-4.5rem)] animate-fade-in relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ChatGPT-style Sessions Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col transition-transform duration-200 shadow-xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Chat History</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleNewChat}
          className="mt-3 w-full py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Chat
        </button>

        <div className="flex-1 overflow-y-auto mt-3 space-y-1.5 pr-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No previous chats yet.<br />Ask your first question!
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s)}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                  activeSessionId === s.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800/50'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="truncate">{s.title}</div>
                  <div className="text-[10px] text-slate-400">
                    {s.subject_name || 'General'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => handleDeleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Question Scanner Launcher in Sidebar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Camera className="w-4 h-4" /> Question Scanner
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full space-y-3 min-w-0">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                StudyForge AI Assistant
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  Socratic
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Step-by-step guidance • Grade-adaptive • Zero direct homework dumps
              </p>
            </div>
          </div>

          {/* Subject & Topic Selectors */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <select
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              {subjects.length === 0 && <option value="">Mathematics</option>}
            </select>

            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Topic name..."
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none w-28 sm:w-36 text-xs"
            />

            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="College">College</option>
            </select>

            <button
              onClick={() => setScannerOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5 border border-amber-500/20 cursor-pointer"
              title="Scan Question / Homework"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
        </div>

        {/* Quick Socratic Prompt Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
          <button
            type="button"
            onClick={() => handleActionClick('simpler')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Explain simpler
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('example')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Give an example
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('quiz_me')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <FileQuestion className="w-3.5 h-3.5 text-emerald-500" /> Quiz me
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('summarize')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <ListRestart className="w-3.5 h-3.5 text-blue-500" /> Summarize
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('mistake')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Explain my mistake
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto rounded-3xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'tutor' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line font-sans">{msg.text}</div>

                {/* Follow-up suggestions */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Suggested Explorations:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUps.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(f)}
                          className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-[10px] text-right text-slate-400">{msg.timestamp}</div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                StudyForge AI is crafting a pedagogical explanation...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="shrink-0 space-y-1.5">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md"
          >
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Scan image"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask in ${subjectName} (${topic})... e.g. "Why is kinetic energy 1/2 mv²?"`}
              className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
            <span>Socratic guidance mode: helps you master the concepts yourself.</span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>

      {/* QUESTION SCANNER MODAL */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Question Scanner & Homework OCR
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload a textbook problem, diagram, or homework snippet
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setScannerOpen(false);
                  setScanResult(null);
                  setScanImageBase64(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Upload or Preview */}
            {!scanResult ? (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                    scanImageBase64
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  {scanImageBase64 ? (
                    <div className="space-y-2">
                      <img
                        src={`data:${scanMimeType};base64,${scanImageBase64}`}
                        alt="Uploaded question"
                        className="max-h-56 mx-auto rounded-xl object-contain border border-slate-200 dark:border-slate-800"
                      />
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        Click to choose a different image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="w-10 h-10 mx-auto text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Upload or snap a picture of your question
                      </p>
                      <p className="text-xs text-slate-400">Supports PNG, JPG, WebP up to 10MB</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    What part is confusing you? (Optional)
                  </label>
                  <input
                    type="text"
                    value={scanNotes}
                    onChange={e => setScanNotes(e.target.value)}
                    placeholder="e.g. I got stuck on step 2 when isolating x..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScannerOpen(false);
                      setScanImageBase64(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!scanImageBase64 || scanning}
                    onClick={handleScanSubmit}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    {scanning ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" /> Scanning & Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" /> Analyze Question
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Show Analysis & Practice Drills */
              <div className="space-y-5">
                {/* Question transcription */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Recognized Question</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {scanResult.subject} • {scanResult.topic}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {scanResult.questionText}
                  </p>
                </div>

                {/* Step-by-Step Solution */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" /> Pedagogical Step-by-Step Breakdown
                  </h4>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {scanResult.stepByStepSolution}
                  </div>
                </div>

                {/* Common Pitfalls */}
                {scanResult.commonPitfalls && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1">
                    <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Common Pitfalls to Avoid
                    </h5>
                    <p className="text-xs text-amber-900 dark:text-amber-200">
                      {scanResult.commonPitfalls}
                    </p>
                  </div>
                )}

                {/* Similar Practice Drills */}
                {scanResult.similarPracticeQuestions && scanResult.similarPracticeQuestions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4 text-emerald-500" /> Similar Practice Drill
                    </h4>
                    {scanResult.similarPracticeQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2"
                      >
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.options?.map((opt, oIdx) => {
                            const isChosen = selectedPracticeAnswers[idx] === opt;
                            const isCorrect = opt === q.answer;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() =>
                                  setSelectedPracticeAnswers(prev => ({ ...prev, [idx]: opt }))
                                }
                                className={`text-left p-2 rounded-lg border text-[11px] transition-all ${
                                  isChosen
                                    ? isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold'
                                      : 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-700 dark:text-rose-300'
                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {selectedPracticeAnswers[idx] && (
                          <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal Footer actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setScanResult(null);
                      setScanImageBase64(null);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Scan Another Image
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertScannedToChat}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    <span>Discuss in AI Chat</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
