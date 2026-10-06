import React, { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  Edit2,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { ParsedSyllabusResult, ParsedSyllabusSubject } from '../types';

interface SyllabusImporterPageProps {
  onNavigate: (path: string) => void;
}

export const SyllabusImporterPage: React.FC<SyllabusImporterPageProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [defaultSubject, setDefaultSubject] = useState('Mathematics');

  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<ParsedSyllabusResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const base64Data = result.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim() && !imageBase64) {
      alert('Please paste syllabus text or upload an image.');
      return;
    }

    try {
      setAnalyzing(true);
      const res = await api.previewSyllabus({
        text: inputText,
        imageBase64: imageBase64 || undefined,
        defaultSubject,
      });

      setPreview(res.preview);
    } catch (err: any) {
      alert(err.message || 'Failed to parse syllabus');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    try {
      setConfirming(true);
      const res = await api.confirmSyllabus({
        subjects: preview.subjects,
        detectedExamDates: preview.detectedExamDates,
      });

      setSuccessResult(res.createdSummary);
    } catch (err: any) {
      alert(err.message || 'Failed to import syllabus structure');
    } finally {
      setConfirming(false);
    }
  };

  // Inline topic edit handlers
  const handleAddTopic = (subjIdx: number, chIdx: number) => {
    if (!preview) return;
    const topic = prompt('Enter topic title:');
    if (!topic || !topic.trim()) return;

    const updated = { ...preview };
    updated.subjects[subjIdx].chapters[chIdx].topics.push(topic.trim());
    setPreview({ ...updated });
  };

  const handleDeleteTopic = (subjIdx: number, chIdx: number, topicIdx: number) => {
    if (!preview) return;
    const updated = { ...preview };
    updated.subjects[subjIdx].chapters[chIdx].topics.splice(topicIdx, 1);
    setPreview({ ...updated });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 text-xs font-semibold mb-2">
          <Upload className="w-3.5 h-3.5" />
          SYLLABUS IMPORTER
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Import Course Syllabus
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Upload a syllabus document or photo. StudyForge detects your chapters, topics, and exam dates, allows you to inspect and edit the detected layout, then builds your structured learning environment with one click.
        </p>
      </div>

      {successResult ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Curriculum Imported Successfully!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            StudyForge has created {successResult.chapters} chapters, {successResult.topics} topics, and {successResult.exams} exams. Your personal dashboard is updated.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigate('/subjects')}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow hover:bg-indigo-700 transition-all"
            >
              View Subjects & Topics
            </button>
            <button
              onClick={() => {
                setSuccessResult(null);
                setPreview(null);
                setInputText('');
                setImageBase64(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Import Another Syllabus
            </button>
          </div>
        </div>
      ) : !preview ? (
        /* Input Form */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Text Input */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-500" />
              Paste Syllabus Text
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Subject Focus
              </label>
              <input
                type="text"
                value={defaultSubject}
                onChange={e => setDefaultSubject(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                placeholder="e.g. Science / Biology"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Syllabus Outline or Course Document
              </label>
              <textarea
                rows={10}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Unit 1: Cell Biology and Cellular Respiration&#10;- Cell Membrane and Organelles&#10;- Osmosis and Active Transport&#10;- Mitosis vs Meiosis&#10;&#10;Unit 2: Genetics and Inheritance&#10;- Mendelian Laws&#10;- Punnett Squares and Genotypes&#10;Exam Date: 2026-11-20"
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-violet-500" />
                Or Upload Document / Photo
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Take a photo of your printed course syllabus, whiteboard outline, or textbook index page.
              </p>

              <div className="mt-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-violet-400 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {imagePreview ? (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Syllabus preview" className="max-h-48 mx-auto rounded-lg object-contain shadow" />
                    <p className="text-xs text-emerald-600 font-bold">Image loaded successfully</p>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload photo or document</div>
                    <div className="text-[10px] text-slate-400">PNG, JPG, PDF up to 10MB</div>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={analyzing}
              onClick={handleAnalyze}
              className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {analyzing ? 'Detecting Curriculum Structure...' : 'Analyze & Preview Structure'}
            </button>
          </div>
        </div>
      ) : (
        /* Preview & Edit Screen */
        <div className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-bold">Review Detected Structure:</span> StudyForge detected the chapters and topics below. You can add or remove items before confirming. Nothing is saved until you click <strong>"Confirm & Import"</strong>.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {preview.subjects.map((subj, subjIdx) => (
                <div key={subjIdx} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Subject</span>
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{subj.name}</h3>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {subj.chapters.length} Chapters
                    </span>
                  </div>

                  {/* Chapters */}
                  <div className="space-y-4">
                    {subj.chapters.map((ch, chIdx) => (
                      <div key={chIdx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-violet-500" />
                            {ch.title}
                          </h4>
                          <button
                            onClick={() => handleAddTopic(subjIdx, chIdx)}
                            className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Topic
                          </button>
                        </div>

                        {/* Topics List */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ch.topics.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                            >
                              <span>{t}</span>
                              <button
                                onClick={() => handleDeleteTopic(subjIdx, chIdx, tIdx)}
                                className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar: Detected Exams & Actions */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />
                  Detected Exam Dates
                </h4>
                {preview.detectedExamDates && preview.detectedExamDates.length > 0 ? (
                  <div className="space-y-2">
                    {preview.detectedExamDates.map((e, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs">
                        <div className="font-bold text-red-900 dark:text-red-300">{e.title}</div>
                        <div className="text-red-600 dark:text-red-400 mt-0.5">{e.date} • {e.subjectName}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No specific exam dates found in text. You can add them later in Planner.</p>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  disabled={confirming}
                  onClick={handleConfirmImport}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {confirming ? 'Creating Curriculum...' : 'Confirm & Import to StudyForge'}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  Back to Edit Input
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
