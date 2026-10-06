import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  UploadCloud,
  FileText,
  Layers,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Plus,
  BookmarkCheck,
  ChevronRight,
  Copy,
  Clock,
  BookMarked,
  Lightbulb,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TextbookAnalysisResult, UploadedMaterial } from '../types';

interface TextbookAssistantPageProps {
  onNavigate: (path: string) => void;
}

export const TextbookAssistantPage: React.FC<TextbookAssistantPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [chapter, setChapter] = useState('');
  const [textContent, setTextContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis result
  const [analysis, setAnalysis] = useState<TextbookAnalysisResult | null>(null);
  const [createdMaterialId, setCreatedMaterialId] = useState<number | null>(null);
  const [deckCreated, setDeckCreated] = useState(false);
  const [convertingDeck, setConvertingDeck] = useState(false);

  // History
  const [materials, setMaterials] = useState<UploadedMaterial[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Practice question state (index -> revealed answer boolean)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getMaterials();
      setMaterials(res.materials || []);
    } catch (err: any) {
      console.error('Failed to load materials history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() || textContent.trim().length < 40) {
      setError('Please provide at least 40 characters of chapter text or lecture notes to analyze.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    setDeckCreated(false);

    try {
      const res = await api.analyzeMaterial({
        title: title || `${subject}: Chapter Excerpt`,
        subject,
        chapter,
        textContent,
      });

      setAnalysis(res.analysis);
      setCreatedMaterialId(res.material?.id || null);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze educational content. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConvertToDeck = async () => {
    if (!createdMaterialId) return;
    setConvertingDeck(true);
    try {
      const res = await api.convertMaterialToDeck(createdMaterialId);
      setDeckCreated(true);
      alert(`Success! Created flashcard deck "${res.deck?.title}" with ${res.deck?.cardCount} cards.`);
    } catch (err: any) {
      alert(err.message || 'Failed to create flashcard deck.');
    } finally {
      setConvertingDeck(false);
    }
  };

  const handleLoadSample = () => {
    setTitle('Cellular Respiration & Energy Production');
    setSubject('Science');
    setChapter('Cell Biology');
    setTextContent(`Cellular respiration is a metabolic pathway that breaks down glucose and produces ATP. The stages of cellular respiration include glycolysis, pyruvate oxidation, the citric acid or Krebs cycle, and oxidative phosphorylation.
Glycolysis is an anaerobic process taking place in the cytosol, splitting glucose into two molecules of pyruvate while yielding a net of 2 ATP and 2 NADH.
Under aerobic conditions, pyruvate enters the mitochondria. In the matrix, it undergoes oxidative decarboxylation to form acetyl-CoA, releasing CO2.
Acetyl-CoA enters the citric acid cycle, producing 2 ATP, 6 NADH, and 2 FADH2 per glucose molecule.
Finally, in oxidative phosphorylation, the electron transport chain (located on the inner mitochondrial membrane) pumps protons into the intermembrane space, establishing an electrochemical proton gradient. ATP synthase uses this proton-motive force (chemiosmosis) to generate approximately 26 to 28 ATP molecules.
In total, aerobic cellular respiration yields roughly 30 to 32 ATP per glucose molecule. Without oxygen, fermentation occurs to regenerate NAD+ from NADH.`);
  };

  const handleSelectPastMaterial = async (item: UploadedMaterial) => {
    try {
      const full = await api.getMaterial(item.id);
      setAnalysis(full.material.parsed_data);
      setCreatedMaterialId(full.material.id);
      setTitle(full.material.title);
      setSubject(full.material.subject || 'Science');
      setChapter(full.material.chapter || '');
      setActiveTab('analyze');
    } catch (err: any) {
      alert('Failed to load past material: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              AI Academic Assistant
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              Textbook & Lecture Extractor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> Textbook & Chapter Assistant
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Paste or upload any textbook chapter, notes, or article. StudyForge automatically generates summaries, key definitions, flashcards, and practice questions.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Assistant Analyzer
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Saved Chapters ({materials.length})
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* Saved Materials Tab */
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Analyzed Chapters & Materials</h2>
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-400">Loading saved materials...</div>
          ) : materials.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No analyzed materials yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Paste chapter text in the assistant to break down summaries and generate instant flashcards.
              </p>
              <button
                onClick={() => setActiveTab('analyze')}
                className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Start Analyzing
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materials.map(m => (
                <div
                  key={m.id}
                  onClick={() => handleSelectPastMaterial(m)}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer space-y-3 group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {m.subject || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {m.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{m.flashcards_count || 0} Flashcards</span>
                    <span>•</span>
                    <span>{m.questions_count || 0} Practice Qs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Analyze & Results View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form (4 cols if analysis exists, 12 cols if fresh) */}
          <div className={analysis ? 'lg:col-span-5 space-y-6' : 'lg:col-span-12 max-w-3xl mx-auto space-y-6 w-full'}>
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Chapter or Notes Input
                </h2>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Fill Sample
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Mathematics</option>
                      <option>Science</option>
                      <option>English</option>
                      <option>Social Studies</option>
                      <option>Computer Science</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chapter / Topic Name
                    </label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={e => setChapter(e.target.value)}
                      placeholder="e.g. Chemical Bonding"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Chapter 4 Key Notes"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chapter Text / Lecture Notes
                  </label>
                  <textarea
                    rows={analysis ? 8 : 12}
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    placeholder="Paste text from your digital textbook, notes, syllabus reading, or teacher slides..."
                    className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs leading-relaxed text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>{textContent.length} characters</span>
                    <span>Minimum 40 chars</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" /> Analyzing Educational Text...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Analyze Chapter with AI
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Comprehensive Analysis Breakdown (7 cols) */}
          {analysis && (
            <div className="lg:col-span-7 space-y-6">
              {/* Top Action Bar */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Chapter Breakdown Complete
                  </span>
                </div>

                {analysis.flashcards && analysis.flashcards.length > 0 && (
                  <button
                    onClick={handleConvertToDeck}
                    disabled={deckCreated || convertingDeck}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    {deckCreated ? 'Deck Created in Flashcards!' : convertingDeck ? 'Converting...' : 'Convert to Flashcard Deck'}
                  </button>
                )}
              </div>

              {/* 1. Summary */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Executive Chapter Summary
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {analysis.summary}
                </p>
                {analysis.simpleExplanation && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Plain-English Concept ("In Simple Terms"):
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      {analysis.simpleExplanation}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Key Definitions */}
              {analysis.keyDefinitions && analysis.keyDefinitions.length > 0 && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-emerald-600" /> Key Definitions to Master
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {analysis.keyDefinitions.map((def, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-1"
                      >
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {def.term}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {def.definition}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Important Points & Difficult Topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Most Important Points */}
                {analysis.importantPoints && analysis.importantPoints.length > 0 && (
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BookmarkCheck className="w-4 h-4 text-indigo-600" /> Must-Remember Points
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      {analysis.importantPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Difficult Topics Warning */}
                {analysis.difficultTopics && analysis.difficultTopics.length > 0 && (
                  <div className="p-5 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" /> Needs Extra Attention
                    </h3>
                    <ul className="space-y-2 text-xs text-rose-900 dark:text-rose-200">
                      {analysis.difficultTopics.map((dt, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{dt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 4. Generated Flashcards */}
              {analysis.flashcards && analysis.flashcards.length > 0 && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" /> Generated Flashcards ({analysis.flashcards.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">Click to flip / review</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.flashcards.map((fc, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850 space-y-2 hover:border-purple-300 transition-colors"
                      >
                        <div className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">
                          Q #{idx + 1}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{fc.front}</div>
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                          {fc.back}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Practice Questions */}
              {analysis.practiceQuestions && analysis.practiceQuestions.length > 0 && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-500" /> Practice Questions & Checkpoints
                  </h3>

                  <div className="space-y-3">
                    {analysis.practiceQuestions.map((pq, idx) => {
                      const isRevealed = revealedAnswers[idx];
                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {idx + 1}. {pq.question}
                            </div>
                            <button
                              onClick={() => setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                            >
                              {isRevealed ? 'Hide Answer' : 'Check Answer'}
                            </button>
                          </div>

                          {pq.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                              {pq.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`p-2 rounded-xl border text-xs ${
                                    isRevealed && opt.startsWith(pq.answer)
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300'
                                      : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {isRevealed && (
                            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 animate-fade-in">
                              <div className="font-bold">Correct Answer: {pq.answer}</div>
                              {pq.explanation && <div>{pq.explanation}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
