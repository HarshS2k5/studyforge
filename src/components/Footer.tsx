import React, { useState } from 'react';
import { Sparkles, Heart, Shield, HelpCircle, Mail, FileText, Lock, X } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenReport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenReport }) => {
  const [modalType, setModalType] = useState<'contact' | 'privacy' | 'terms' | null>(null);

  return (
    <>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Col */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  StudyForge
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                "Built with curiosity, creativity, and a love for technology."
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Created by Harsh Sisodia • Free-First Education</span>
              </div>
            </div>

            {/* Platform & About Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <button
                    onClick={() => onNavigate('/about')}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>About Us</span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-300">Creator</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onNavigate('/about');
                      setTimeout(() => {
                        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    Projects by Harsh
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType('contact')}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType('privacy')}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    Privacy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setModalType('terms')}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                  >
                    Terms
                  </button>
                </li>
              </ul>
            </div>

            {/* Quick Study Tools */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Study Tools
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li>
                  <button onClick={() => onNavigate('/tutor')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    AI Socratic Tutor
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/quizzes')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    Smart Quiz Generator
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/practice')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    Practice Mode
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/flashcards')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    Spaced Flashcards
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('/mistakes')} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
                    Mistake Book
                  </button>
                </li>
              </ul>
            </div>

            {/* Feedback & Rigor */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
                Feedback & Rigor
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Found an incorrect question, broken lesson, or typo? Help us keep the curriculum accurate.
              </p>
              <button
                onClick={onOpenReport}
                className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> Report Content / Typo
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              © {new Date().getFullYear()} StudyForge. Created by Harsh Sisodia.
            </div>
            <div className="flex items-center gap-1.5">
              <span>Built with curiosity, creativity, and a love for technology</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            </div>
          </div>
        </div>
      </footer>

      {/* Info Modals (Contact, Privacy, Terms) */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {modalType === 'contact' && (
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Contact & Feedback
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  Have a question, feedback, or suggestion regarding StudyForge? We love hearing from students, teachers, and fellow builders.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2 mb-6">
                  <div><strong>Developer:</strong> Harsh Sisodia</div>
                  <div><strong>Platform:</strong> StudyForge Educational Systems</div>
                  <div><strong>In-app tool:</strong> Use the "Report Content / Typo" button to report curriculum issues directly to admin moderation.</div>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close
                </button>
              </div>
            )}

            {modalType === 'privacy' && (
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Privacy Policy
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  StudyForge is built with student safety and data privacy as core tenets:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 mb-6 list-disc pl-4">
                  <li><strong>No data selling:</strong> Your learning data, notes, and study logs are never sold or shared with advertisers.</li>
                  <li><strong>Secure authentication:</strong> Passwords are hashed with bcrypt. Never trust client-side modifications.</li>
                  <li><strong>Private leaderboards:</strong> Leaderboards preserve student privacy by only displaying chosen usernames and earned XP.</li>
                </ul>
                <button
                  onClick={() => setModalType(null)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close
                </button>
              </div>
            )}

            {modalType === 'terms' && (
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Terms of Service
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  Guidelines for using StudyForge:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 mb-6 list-disc pl-4">
                  <li><strong>Free-First Education:</strong> StudyForge is designed to support student learning, revision, and practice without paywalls.</li>
                  <li><strong>Pedagogical Integrity:</strong> Use the Socratic AI tutor to understand concepts step-by-step rather than copying answers.</li>
                  <li><strong>Fair Play:</strong> XP, streaks, and achievements are earned through honest study sessions and practice.</li>
                </ul>
                <button
                  onClick={() => setModalType(null)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
