import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Sparkles,
  Layers,
  HelpCircle,
  ListChecks,
  CheckCircle2,
  X,
  Bot,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';
import { Note, Subject } from '../types';
import { useAuth } from '../context/AuthContext';

export const NotesPage: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubjectId, setEditSubjectId] = useState<number | undefined>(undefined);

  // AI tools state
  const [aiToolRunning, setAiToolRunning] = useState(false);
  const [aiToolResult, setAiToolResult] = useState<any | null>(null);
  const [activeAiTool, setActiveAiTool] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
    loadSubjects();
  }, [search, selectedSubject]);

  async function loadNotes() {
    try {
      const data = await api.getNotes({
        search: search || undefined,
        subject_id: selectedSubject !== 'all' ? selectedSubject : undefined,
      });
      setNotes(data.notes || []);
      if (!activeNote && data.notes?.length > 0) {
        setActiveNote(data.notes[0]);
      }
    } catch (e) {
      console.error('Failed to load notes:', e);
    }
  }

  async function loadSubjects() {
    try {
      const data = await api.getSubjects();
      setSubjects(data.subjects || []);
    } catch (e) {}
  }

  const handleStartCreate = () => {
    setActiveNote(null);
    setEditTitle('');
    setEditContent('');
    setEditSubjectId(subjects[0]?.id || 1);
    setIsEditing(true);
    setAiToolResult(null);
  };

  const handleStartEdit = (note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditSubjectId(note.subject_id);
    setIsEditing(true);
    setAiToolResult(null);
  };

  const handleSaveNote = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    try {
      if (activeNote) {
        await api.updateNote(activeNote.id, {
          title: editTitle,
          content: editContent,
          subject_id: editSubjectId,
        });
      } else {
        const res = await api.createNote({
          title: editTitle,
          content: editContent,
          subject_id: editSubjectId,
        });
      }
      setIsEditing(false);
      await loadNotes();
    } catch (e) {
      console.error('Failed to save note:', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(id);
      if (activeNote?.id === id) setActiveNote(null);
      await loadNotes();
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await api.togglePinNote(id);
      await loadNotes();
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  };

  // Run AI Note Tool (Section #13: Summary, Key points, Flashcards, Practice questions, Revision checklists)
  const handleRunAiTool = async (tool: 'summary' | 'key_points' | 'flashcards' | 'questions' | 'checklist') => {
    const content = isEditing ? editContent : activeNote?.content;
    const title = isEditing ? editTitle : activeNote?.title;
    if (!content) return;

    setAiToolRunning(true);
    setActiveAiTool(tool);
    try {
      const res = await api.transformNote({
        noteContent: content,
        noteTitle: title,
        tool,
      });
      setAiToolResult(res.result);
    } catch (e) {
      console.error('Failed to transform note with AI:', e);
    } finally {
      setAiToolRunning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-500" /> Notes & AI Synthesizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture lesson insights, pin priority sheets, and generate revision tools using AI.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Note List & Search (4 cols) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col">
          {/* Search & Subject Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:outline-none"
              >
                <option value="all">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes scroll container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[550px]">
            {notes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                No notes found. Create your first note above!
              </div>
            ) : (
              notes.map(n => {
                const isSelected = activeNote?.id === n.id && !isEditing;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setActiveNote(n);
                      setIsEditing(false);
                      setAiToolResult(null);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {n.is_pinned === 1 && (
                          <Pin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 fill-indigo-600 shrink-0" />
                        )}
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                          {n.title}
                        </h4>
                      </div>

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleTogglePin(n.id);
                        }}
                        title={n.is_pinned ? 'Unpin' : 'Pin to top'}
                        className="text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{n.subject_name || 'General'}</span>
                      <span>{new Date(n.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Viewer / Editor & AI Synthesizer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Main Card */}
          <div className="flex-1 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            {isEditing ? (
              /* EDITOR VIEW */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Note Title (e.g. Chapter 2 Formula Breakdown)"
                    className="flex-1 text-lg font-bold bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />

                  <select
                    value={editSubjectId}
                    onChange={e => setEditSubjectId(Number(e.target.value))}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={14}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Type your notes here... (Supports Markdown headings #, bullet points -, bold **text**, checklists [ ])"
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-850 text-slate-900 dark:text-white text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : activeNote ? (
              /* VIEWER VIEW */
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      {activeNote.subject_name || 'General Academic'}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {activeNote.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStartEdit(activeNote)}
                      title="Edit note"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(activeNote.id)}
                      title="Delete note"
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line py-2 max-h-[380px] overflow-y-auto">
                  {activeNote.content}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                Select a note on the left or create a new note to view.
              </div>
            )}

            {/* AI Note Tools Ribbon (Required by Section #13) */}
            {(activeNote || isEditing) && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI Note Synthesizer
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Transform your own notes into active study tools
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    disabled={aiToolRunning}
                    onClick={() => handleRunAiTool('summary')}
                    className="py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Summarize
                  </button>
                  <button
                    type="button"
                    disabled={aiToolRunning}
                    onClick={() => handleRunAiTool('key_points')}
                    className="py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Key Points
                  </button>
                  <button
                    type="button"
                    disabled={aiToolRunning}
                    onClick={() => handleRunAiTool('flashcards')}
                    className="py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Make Flashcards
                  </button>
                  <button
                    type="button"
                    disabled={aiToolRunning}
                    onClick={() => handleRunAiTool('questions')}
                    className="py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Practice Questions
                  </button>
                  <button
                    type="button"
                    disabled={aiToolRunning}
                    onClick={() => handleRunAiTool('checklist')}
                    className="py-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    Revision Checklist
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Output Container */}
          {aiToolRunning && (
            <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2.5 animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
              Synthesizing your notes into academic revision tools...
            </div>
          )}

          {aiToolResult && !aiToolRunning && (
            <div className="p-6 rounded-3xl bg-slate-900 text-white border border-indigo-900/80 shadow-xl space-y-4 animate-slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="w-4 h-4" /> Generated AI Synthesis: {activeAiTool?.toUpperCase()}
                </span>
                <button
                  onClick={() => setAiToolResult(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {Array.isArray(aiToolResult) ? (
                /* Generated flashcards */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiToolResult.map((c: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1.5">
                      <div className="font-bold text-indigo-300">Q: {c.front}</div>
                      <div className="text-slate-300">A: {c.back}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs sm:text-sm whitespace-pre-line text-slate-200 leading-relaxed font-sans">
                  {String(aiToolResult)}
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                Note: AI-generated note tools are for study assistance. Verify details against course textbooks.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
