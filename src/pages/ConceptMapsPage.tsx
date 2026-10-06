import React, { useState, useEffect } from 'react';
import {
  GitFork,
  BookOpen,
  Layers,
  HelpCircle,
  Brain,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TopicNode {
  id: number;
  title: string;
  mastery_level: 'not_started' | 'learning' | 'mastered' | string;
  order_index?: number;
  notesCount?: number;
  flashcardsCount?: number;
  questionsCount?: number;
}

interface ChapterNode {
  id: number;
  title: string;
  chapter_number?: number;
  topics: TopicNode[];
}

interface SubjectMap {
  id: number;
  name: string;
  code: string;
  color?: string;
  chapters: ChapterNode[];
}

interface ConceptMapsPageProps {
  onNavigate: (path: string) => void;
}

export const ConceptMapsPage: React.FC<ConceptMapsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectMap[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{
    topic: TopicNode;
    chapterTitle: string;
    subjectName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    setLoading(true);
    try {
      const res = await api.getConceptMaps();
      setSubjects(res.subjects || []);
      if (res.subjects && res.subjects.length > 0) {
        setSelectedSubjectId(res.subjects[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load concept maps', err);
    } finally {
      setLoading(false);
    }
  };

  const activeSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const getMasteryColor = (status: string) => {
    switch (status) {
      case 'mastered':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/60',
          border: 'border-emerald-400 dark:border-emerald-600',
          text: 'text-emerald-700 dark:text-emerald-300',
          badge: 'bg-emerald-500 text-white',
          label: 'Mastered',
        };
      case 'learning':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/60',
          border: 'border-indigo-400 dark:border-indigo-600',
          text: 'text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-500 text-white',
          label: 'Learning',
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-900',
          border: 'border-slate-200 dark:border-slate-800',
          text: 'text-slate-700 dark:text-slate-300',
          badge: 'bg-slate-400 text-white',
          label: 'Not Started',
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              Visual Knowledge Graph
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              Interactive Concept Map
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <GitFork className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Interactive Concept Maps
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore hierarchical connections between curriculum chapters and topics. Click any concept node to inspect flashcards, notes, practice questions, and mastery status.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-2xs">
          <span className="text-slate-400 font-bold">Status:</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Not Started
          </span>
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> In Progress
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mastered
          </span>
        </div>
      </div>

      {/* Subject Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setSelectedSubjectId(s.id);
              setSelectedTopic(null);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedSubjectId === s.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading concept graph...</div>
      ) : !activeSubject ? (
        <div className="py-20 text-center text-slate-400">No subject selected</div>
      ) : (
        /* Visual Graph Canvas Area */
        <div className="relative bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xs overflow-x-auto">
          {/* Root Subject Hub */}
          <div className="flex flex-col items-center mb-12">
            <div className="p-5 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-xl shadow-indigo-500/20 flex flex-col items-center text-center max-w-sm w-full border border-indigo-400/30">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">
                Subject Core Node
              </span>
              <h2 className="text-xl font-black mt-0.5">{activeSubject.name}</h2>
              <span className="text-xs text-indigo-100/90 mt-1">
                {activeSubject.chapters?.length || 0} Key Chapters &bull; Master Curriculum
              </span>
            </div>
            {/* Trunk Line */}
            <div className="w-0.5 h-10 bg-indigo-300 dark:bg-indigo-800 mt-2" />
          </div>

          {/* Chapters & Topics Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeSubject.chapters || []).map((ch, chIdx) => (
              <div
                key={ch.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4 relative flex flex-col justify-between group hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
              >
                {/* Chapter Branch Header */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      Chapter {ch.chapter_number || chIdx + 1}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {ch.topics?.length || 0} Sub-topics
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">
                    {ch.title}
                  </h3>
                </div>

                {/* Topics Tree Nodes */}
                <div className="space-y-2.5 flex-1">
                  {(ch.topics || []).map(t => {
                    const style = getMasteryColor(t.mastery_level);
                    const isSelected = selectedTopic?.topic.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() =>
                          setSelectedTopic({
                            topic: t,
                            chapterTitle: ch.title,
                            subjectName: activeSubject.name,
                          })
                        }
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          style.bg
                        } ${style.border} ${
                          isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              t.mastery_level === 'mastered'
                                ? 'bg-emerald-500'
                                : t.mastery_level === 'learning'
                                ? 'bg-indigo-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className={`text-xs font-bold truncate ${style.text}`}>
                            {t.title}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 ${style.badge}`}
                        >
                          {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Chapter Quick Action Footer */}
                <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Click any node to explore</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOPIC INSPECTOR DRAWER / MODAL */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedTopic(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {selectedTopic.subjectName}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {selectedTopic.chapterTitle}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {selectedTopic.topic.title}
              </h3>
            </div>

            {/* Mastery Level Status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mastery Level</span>
                <div className="text-xs font-bold text-slate-900 dark:text-white capitalize mt-0.5">
                  {selectedTopic.topic.mastery_level.replace('_', ' ')}
                </div>
              </div>
              <span
                className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                  selectedTopic.topic.mastery_level === 'mastered'
                    ? 'bg-emerald-500 text-white'
                    : selectedTopic.topic.mastery_level === 'learning'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-400 text-white'
                }`}
              >
                {selectedTopic.topic.mastery_level.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Action Launchers */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Integrated Study Modules
              </div>

              {/* 1. AI Tutor */}
              <button
                onClick={() =>
                  onNavigate(
                    `/tutor?subject=${encodeURIComponent(
                      selectedTopic.subjectName
                    )}&topic=${encodeURIComponent(selectedTopic.topic.title)}`
                  )
                }
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Ask AI Socratic Tutor
                    </div>
                    <div className="text-[11px] text-slate-400">Step-by-step concept walkthrough</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 2. Practice Lab */}
              <button
                onClick={() => onNavigate(`/practice-lab`)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Adaptive Practice Lab
                    </div>
                    <div className="text-[11px] text-slate-400">Dynamic difficulty scaling drill</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 3. Flashcards */}
              <button
                onClick={() => onNavigate(`/flashcards`)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-400 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Spaced Repetition Flashcards
                    </div>
                    <div className="text-[11px] text-slate-400">SM-2 memory intervals</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* 4. Notes */}
              <button
                onClick={() => onNavigate(`/notes`)}
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Open Topic Notes
                    </div>
                    <div className="text-[11px] text-slate-400">Read and edit study notes</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
