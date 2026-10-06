import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [grade, setGrade] = useState<string>('Grade 10');
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([1, 2, 6]); // Default Math, Science, CS
  const [learningGoals, setLearningGoals] = useState<string>('Master Core Concepts & Exam Prep');
  const [studyStyle, setStudyStyle] = useState<string>('Visual & Step-by-Step');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const subjectsList = [
    { id: 1, name: 'Mathematics', desc: 'Algebra, Geometry, Arithmetic' },
    { id: 2, name: 'Science', desc: 'Physics, Chemistry, Biology' },
    { id: 3, name: 'English', desc: 'Grammar, Reading, Rhetoric' },
    { id: 4, name: 'Hindi', desc: 'व्याकरण, गद्य-पद्य, साहित्य' },
    { id: 5, name: 'Social Science', desc: 'History, Civics, Geography' },
    { id: 6, name: 'Computer Science', desc: 'Python, Algorithms, Web' },
  ];

  const toggleSubject = (id: number) => {
    if (selectedSubjects.includes(id)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== id));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, id]);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.completeOnboarding({
        grade,
        subjects: selectedSubjects,
        learning_goals: learningGoals,
        study_style: studyStyle,
      });
      await refreshUser();
      onClose();
    } catch (err) {
      console.error('Onboarding save failed:', err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Step progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Grade Selection */}
        {step === 1 && (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Step 1 of 3
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Select Your Grade or Level
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              StudyForge tunes lesson depth and AI tutor explanations to your current level.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { name: 'Grade 8', desc: 'Pre-Algebra & General Science' },
                { name: 'Grade 9', desc: 'Algebra I & Physical Science' },
                { name: 'Grade 10', desc: 'Geometry, Biology & Boards' },
                { name: 'Grade 11', desc: 'Advanced Mechanics & Calculus' },
                { name: 'Grade 12', desc: 'Senior Secondary & College Prep' },
                { name: 'College / Uni', desc: 'Higher Education & Majors' },
              ].map(g => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => setGrade(g.name)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    grade === g.name
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                    {g.name}
                    {grade === g.name && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{g.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Subjects Selection */}
        {step === 2 && (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Step 2 of 3
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Choose Your Priority Subjects
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Select what you are currently studying. You can always add more subjects later.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {subjectsList.map(s => {
                const isSelected = selectedSubjects.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                      {s.name}
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{s.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Learning Goals & Study Style */}
        {step === 3 && (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Step 3 of 3
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Goals & Preferred Study Style
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              We personalize your dashboard recommendations based on these preferences.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Learning Goal
                </label>
                <select
                  value={learningGoals}
                  onChange={e => setLearningGoals(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Master Core Concepts & Exam Prep">Master Core Concepts & Exam Prep</option>
                  <option value="Daily Homework Help & Understanding">Daily Homework Help & Understanding</option>
                  <option value="Fast Review & Flashcards">Fast Review & Flashcards</option>
                  <option value="High Test Scores & Competition">High Test Scores & Competition</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred Study Style
                </label>
                <select
                  value={studyStyle}
                  onChange={e => setStudyStyle(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Visual & Step-by-Step">Visual & Step-by-Step (Analogies, breakdown)</option>
                  <option value="Practice-First">Practice-First (Solve questions, learn from mistakes)</option>
                  <option value="Deep Conceptual & Socratic">Deep Conceptual & Socratic (Why things work)</option>
                  <option value="Summary & Flashcard Driven">Summary & Flashcard Driven (High yield)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Personalizing...' : 'Launch Dashboard'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
