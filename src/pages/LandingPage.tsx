import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Brain,
  Layers,
  Calendar,
  CheckCircle2,
  Trophy,
  Flame,
  Award,
  BookOpen,
  Compass,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { user } = useAuth();

  const handleStartStudying = () => {
    if (user) {
      onNavigate('/dashboard');
    } else {
      onOpenAuth('register');
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-amber-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>The Modern Educational Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Free Forever</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
            Study smarter.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Learn better.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Your all-in-one study companion for lessons, quizzes, notes, flashcards and progress tracking.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartStudying}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Start Studying <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-base shadow-2xs transition-all cursor-pointer"
            >
              Explore Features
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Complete Curriculum
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Socratic AI Pedagogical Tutor
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Spaced-Repetition System
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Paywalls
            </div>
            <button
              onClick={() => onNavigate('/about')}
              className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" /> Created by Harsh Sisodia
            </button>
          </div>
        </div>
      </section>

      {/* 2. LIVE INTERACTIVE SHOWCASE PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 mb-24">
        <div className="p-3 sm:p-5 rounded-3xl bg-gradient-to-b from-indigo-100/70 to-slate-200/50 dark:from-indigo-950/40 dark:to-slate-900/50 border border-indigo-200/60 dark:border-indigo-900/40 shadow-2xl backdrop-blur-md">
          <div className="rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-inner p-6">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">studyforge.edu/dashboard</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" /> 5 Day Streak
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                  Level 4 • 420 XP
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Mathematics</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Linear Equations</h4>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '75%' }} />
                </div>
                <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                  <span>3 of 4 Topics</span>
                  <span>75%</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">Science</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Newton&apos;s Laws of Motion</h4>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                  <span>Mastered</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">Computer Science</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Binary Search & Big-O</h4>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '50%' }} />
                </div>
                <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                  <span>In Progress</span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURE SECTIONS (As explicitly requested in Prompt Section #2) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
            Built for Academic Excellence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Every tool you need to excel in your studies
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            StudyForge integrates lessons, Socratic AI guidance, active testing, and retention algorithms into one cohesive workspace.
          </p>
        </div>

        {/* Feature 1: AI Tutor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Socratic AI Tutor
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike typical AI chatbots that dump homework answers, StudyForge’s AI Tutor is built around Socratic pedagogy. It explains the underlying logic, adjusts to your grade level, and asks thought-provoking follow-ups so you understand how to solve problems yourself.
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'One-click "Explain simpler" and "Give another example" controls',
                'Diagnoses the conceptual root of homework mistakes',
                'Interactive "Quiz me" quick checks to verify retention',
                'Strict academic safety: reminds students to confirm with textbooks',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/tutor')}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Try the AI Tutor Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" /> Socratic AI Session
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-800/80 text-slate-200">
                <span className="font-bold text-indigo-400">Student:</span> &ldquo;Why do we need a common denominator to add fractions?&rdquo;
              </div>
              <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-900 text-indigo-100 space-y-2">
                <span className="font-bold text-amber-400">StudyForge AI Tutor:</span>
                <p>
                  Think of it like adding slices of pizza! If one pizza is cut into 3 giant slices and another into 6 smaller slices, you can&apos;t just say &ldquo;2 + 5 = 7 slices&rdquo; because the slices are different sizes.
                </p>
                <p className="font-medium">
                  Finding a common denominator cuts both pizzas into identical slice sizes so you can count them fairly!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Smart Quizzes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div className="order-2 lg:order-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Mathematics • Chapter 1 Quiz</span>
              <span className="text-indigo-600 font-bold">Question 3 of 5</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              What is the value of x in: 4(2x - 3) + 7 = 3x + 20?
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl border border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300">
                A) x = 5
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                B) x = 4
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                C) x = 6
              </div>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                D) x = 3
              </div>
            </div>
            <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
              <span>Answers revealed strictly upon submission</span>
              <span className="font-bold text-emerald-500">+75 XP Reward</span>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Smart Quizzes & Exam Generator
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Generate tailored quizzes by subject, chapter, difficulty, and question type (Multiple choice, True/False, Fill in the blank, Short answer).
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'Honest testing: answers strictly hidden until submission',
                'Comprehensive breakdown: accuracy %, score, time taken',
                'Identifies weak topics needing further revision',
                'Full Exam Simulation mode with timer and review palette',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/quizzes')}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Generate a Quiz <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature 3: Flashcards & Spaced Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Spaced-Repetition Flashcards
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Master formulas, vocabulary, and core concepts with 3D flip study cards powered by spaced review intervals. Cards you find difficult appear more frequently, locking concepts into long-term memory.
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'Interactive 3D flip card animations',
                'Mark cards as Easy, Medium, or Hard to schedule future reviews',
                'Organize into custom decks by subject or chapter',
                'Track deck mastery percentage over time',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/flashcards')}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Explore Flashcards <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-md p-8 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-2xl text-center space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
                Mathematics • Formula Card
              </span>
              <h4 className="text-xl font-extrabold">Distance Formula</h4>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs font-mono text-lg font-bold">
                d = √[(x₂ - x₁)² + (y₂ - y₁)²]
              </div>
              <p className="text-xs text-indigo-200">
                Derived directly from Euclidean Pythagorean Theorem in 2D Cartesian plane.
              </p>
              <div className="pt-2 flex justify-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white/20">Hard (1d)</span>
                <span className="px-3 py-1 rounded-full bg-white/20">Medium (3d)</span>
                <span className="px-3 py-1 rounded-full bg-white/20">Easy (7d)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 4: Study Planner & Focus Timer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div className="order-2 lg:order-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">This Week&apos;s Study Timetable</span>
              <span className="text-xs text-indigo-600 font-bold">4 of 5 Goals Met</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Monday: Mathematics</div>
                  <div className="text-[11px] text-slate-500">30 min • Fractions & Algebra</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Tuesday: Science</div>
                  <div className="text-[11px] text-slate-500">20 min • Laws of Motion</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-indigo-900 dark:text-indigo-200">Today: Computer Science</div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400">25 min Focus Pomodoro</div>
                </div>
                <span className="text-xs font-bold text-indigo-600">Active</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Study Planner & Pomodoro Timer
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Organize your academic life with daily, weekly, and exam goals. Stay focused with built-in 25-minute and 50-minute study timers that log study hours and reward XP without burnout.
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'Daily checklists that keep you accountable',
                '25-min and 50-min Pomodoro focus sessions with break chimes',
                'Sensible break reminders: protect student well-being',
                'Total study time tracked automatically towards achievements',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 flex gap-4">
              <button
                onClick={() => onNavigate('/planner')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Open Study Planner <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
              <button
                onClick={() => onNavigate('/timer')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Launch Focus Timer <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Feature 5: Mistake Review (Mistake Book) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Dedicated &ldquo;Mistake Book&rdquo;
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              The true secret to top marks isn&apos;t answering easy questions repeatedly — it&apos;s eliminating your misconceptions. StudyForge saves every missed question into your personal Mistake Book so you can drill them until perfected.
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'Stores original question, your answer, and the verified solution',
                'Detailed pedagogical explanations clarifying why the slip occurred',
                '"Practice Mistakes" mode: retest exclusively on tricky questions',
                'Mark mistakes as resolved once mastered',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/mistakes')}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Review Mistake Book <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-600 dark:text-rose-400">Mistake Book Entry</span>
              <span className="text-slate-400">English • Grammar</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              &ldquo;The discovery was announced yesterday&rdquo; — What voice is this?
            </h4>
            <div className="text-xs space-y-1.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-100 dark:border-rose-900">
              <div>
                <strong>Your initial answer:</strong> Active Voice (Incorrect)
              </div>
              <div>
                <strong>Correct answer:</strong> Passive Voice
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                <strong>Why:</strong> The subject (&quot;the discovery&quot;) is receiving the announcement, not making it.
              </div>
            </div>
            <button
              onClick={() => onNavigate('/mistakes')}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Practice This Mistake
            </button>
          </div>
        </div>

        {/* Feature 6: Achievements, XP & Streaks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div className="order-2 lg:order-1 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Milestones & Prestige</span>
              <span className="text-xs text-amber-500 font-bold">12 Total Badges</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 flex items-center gap-2.5">
                <Flame className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">7-Day Streak</div>
                  <div className="text-[10px] text-slate-500">+250 XP</div>
                </div>
              </div>
              <div className="p-3 rounded-2xl border border-indigo-300 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Perfect Score</div>
                  <div className="text-[10px] text-slate-500">+150 XP</div>
                </div>
              </div>
              <div className="p-3 rounded-2xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center gap-2.5">
                <Award className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">10 Quizzes</div>
                  <div className="text-[10px] text-slate-500">+200 XP</div>
                </div>
              </div>
              <div className="p-3 rounded-2xl border border-purple-300 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/30 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Scholar (Lvl 10)</div>
                  <div className="text-[10px] text-slate-500">Mastery Rank</div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              XP, Levels & Healthy Streaks
            </h3>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Earn XP for real learning achievements: finishing lessons, scoring well on quizzes, solving practice problems, and staying consistent. Progress through levels from Beginner to Scholar and Master without toxic pressure.
            </p>
            <div className="space-y-2.5 pt-2">
              {[
                'Strictly non-purchasable: earned purely through effort',
                'Healthy streak mechanics: missing a day is treated with grace',
                'Unlockable badges with celebratory confetti milestones',
                'Optional, respectful leaderboards focused on personal growth',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/achievements')}
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                View All Achievements <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURRICULUM SUBJECTS PREVIEW */}
      <section className="bg-slate-100/60 dark:bg-slate-900/60 py-20 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
            Pre-loaded with foundational curriculum
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-10">
            Start studying immediately across key subjects, or add your own custom subjects and chapters anytime.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Mathematics', code: 'MATH', icon: '📐', desc: 'Algebra, Geometry, Fractions' },
              { name: 'Science', code: 'SCI', icon: '🔬', desc: 'Physics, Chemistry, Biology' },
              { name: 'English', code: 'ENG', icon: '📖', desc: 'Grammar, Reading, Rhetoric' },
              { name: 'Hindi', code: 'HIN', icon: '🇮🇳', desc: 'व्याकरण, गद्य-पद्य, साहित्य' },
              { name: 'Social Science', code: 'SOC', icon: '🌍', desc: 'History, Civics, Geography' },
              { name: 'Computer Sci', code: 'CS', icon: '💻', desc: 'Python, Big-O, Algorithms' },
            ].map(s => (
              <button
                key={s.code}
                onClick={() => onNavigate('/subjects')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-500 hover:shadow-md transition-all text-left group cursor-pointer"
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {s.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to revolutionize how you learn?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Join thousands of students who study with clarity, structure, and genuine understanding on StudyForge.
          </p>
          <div className="mt-8">
            <button
              onClick={handleStartStudying}
              className="inline-flex items-center gap-2.5 py-4 px-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-base shadow-xl shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Start Studying Free <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
