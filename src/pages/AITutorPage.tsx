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
  Settings,
  ShieldAlert,
  ArrowRight,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Message {
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'tutor',
      text: `Hello ${user?.username || 'Student'}! I am your StudyForge Socratic Tutor.

My mission is to help you truly **understand** core academic concepts, not just dump homework answers.

How can I help you learn today? You can ask a concept question, type a math equation, or try one of the learning actions below!

*Note: StudyForge AI Tutor is an educational companion. Always verify important exam facts with your official textbook.*`,
      followUps: [
        'How does the Pythagorean theorem work?',
        "Explain Newton's second law with an analogy",
        'Why do we need common denominators?',
        'What is binary search time complexity?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [subject, setSubject] = useState(initialSubject || 'Mathematics');
  const [topic, setTopic] = useState(initialTopic || 'Fractions & Decimals');
  const [grade, setGrade] = useState(user?.grade || 'Grade 10');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string, action?: 'chat' | 'simpler' | 'example' | 'quiz_me' | 'summarize' | 'mistake') => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() && action !== 'quiz_me' && action !== 'summarize') return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: promptToSend || (action === 'quiz_me' ? 'Quiz me on this concept' : 'Summarize this topic'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const res = await api.askTutor({
        message: promptToSend,
        grade,
        subject,
        topic,
        action: action || 'chat',
      });

      const tutorMsg: Message = {
        id: 'tutor-' + Date.now(),
        sender: 'tutor',
        text: res.reply,
        followUps: res.suggestedFollowUps,
        provider: res.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, tutorMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        sender: 'tutor',
        text: 'I ran into a temporary hiccup processing your request. Please try asking again in simpler terms!',
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 animate-fade-in flex flex-col h-[calc(100vh-5rem)]">
      {/* Header & Context Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              StudyForge Socratic AI Tutor
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Adapting pedagogy to your grade level • Teaches step-by-step
            </p>
          </div>
        </div>

        {/* Academic Context Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
          >
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Social Science">Social Science</option>
            <option value="Computer Science">Computer Science</option>
          </select>

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
        </div>
      </div>

      {/* Socratic Action Pills Bar (Required by Prompt Section #8) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
        <button
          type="button"
          onClick={() => handleActionClick('simpler')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Explain simpler
        </button>
        <button
          type="button"
          onClick={() => handleActionClick('example')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Give another example
        </button>
        <button
          type="button"
          onClick={() => handleActionClick('quiz_me')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
        >
          <FileQuestion className="w-3.5 h-3.5 text-emerald-500" /> Quiz me
        </button>
        <button
          type="button"
          onClick={() => handleActionClick('summarize')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
        >
          <ListRestart className="w-3.5 h-3.5 text-blue-500" /> Summarize
        </button>
        <button
          type="button"
          onClick={() => handleActionClick('mistake')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
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

              <div className="mt-2 text-[10px] text-right text-slate-400">
                {msg.timestamp}
              </div>
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

      {/* Input Form & Safety Notice */}
      <div className="shrink-0 space-y-2">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask a question in ${subject} (${grade})... e.g. "Why is kinetic energy 1/2 mv^2?"`}
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
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
          <span>AI Tutor teaches and guides reasoning. Always verify key textbook formulas.</span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};
