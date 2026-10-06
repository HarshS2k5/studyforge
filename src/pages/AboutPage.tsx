import React, { useEffect } from 'react';
import {
  Sparkles,
  ExternalLink,
  Code2,
  Cpu,
  Gamepad2,
  History,
  BookOpen,
  Brain,
  Target,
  Rocket,
  Heart,
  ArrowRight,
  Laptop,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  // Handle scrolling to #projects hash if present
  useEffect(() => {
    if (window.location.hash === '#projects') {
      setTimeout(() => {
        document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const projects = [
    {
      id: 'internet-time-machine',
      title: 'Internet Time Machine',
      url: 'https://internet-time-machine-six.vercel.app',
      displayUrl: 'internet-time-machine-six.vercel.app',
      description: 'An interactive project exploring the history and evolution of websites and the internet.',
      icon: History,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Web History & Archive',
      accentBorder: 'group-hover:border-blue-400 dark:group-hover:border-blue-500/60',
      accentGlow: 'group-hover:shadow-blue-500/10',
    },
    {
      id: 'pc-builder',
      title: 'PC Builder',
      url: 'https://pc-builder-seven-ashen.vercel.app',
      displayUrl: 'pc-builder-seven-ashen.vercel.app',
      description: 'A PC building project designed to help users explore PC components and create their own computer builds.',
      icon: Cpu,
      color: 'from-emerald-500 to-teal-500',
      badge: 'Hardware & Custom Builds',
      accentBorder: 'group-hover:border-emerald-400 dark:group-hover:border-emerald-500/60',
      accentGlow: 'group-hover:shadow-emerald-500/10',
    },
    {
      id: 'gamerank',
      title: 'GameRank',
      url: 'https://gamerank-one.vercel.app',
      displayUrl: 'gamerank-one.vercel.app',
      description: 'A gaming-focused project where users can explore and rank games.',
      icon: Gamepad2,
      color: 'from-purple-500 to-pink-500',
      badge: 'Gaming & Rankings',
      accentBorder: 'group-hover:border-purple-400 dark:group-hover:border-purple-500/60',
      accentGlow: 'group-hover:shadow-purple-500/10',
    },
  ];

  const featureCards = [
    {
      icon: BookOpen,
      color: 'bg-blue-500 text-white',
      title: 'Learn',
      emoji: '📚',
      description: 'Practice concepts and understand difficult topics with structured lessons and formulas.',
    },
    {
      icon: Brain,
      color: 'bg-purple-500 text-white',
      title: 'Practice',
      emoji: '🧠',
      description: 'Use quizzes and practice questions to strengthen your knowledge and retention.',
    },
    {
      icon: Target,
      color: 'bg-emerald-500 text-white',
      title: 'Improve',
      emoji: '🎯',
      description: 'Track progress, review saved mistakes, and identify areas that need more attention.',
    },
    {
      icon: Rocket,
      color: 'bg-amber-500 text-white',
      title: 'Build Better Habits',
      emoji: '🚀',
      description: 'Organize study sessions, set focus timers, and steadily work toward your learning goals.',
    },
  ];

  const handleOpenProject = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-gradient-to-tr from-indigo-500/15 via-purple-500/15 to-blue-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          {/* Creator Attribution Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Created by Harsh Sisodia</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            About{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              StudyForge
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-medium">
            "Built by a young creator who loves technology, gaming, and building things on the web."
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#projects"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Explore Projects by Harsh</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => onNavigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all cursor-pointer shadow-2xs"
            >
              <span>Launch StudyForge</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. CREATOR PROFILE & MY JOURNEY */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Creator Mini Bio Card */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-indigo-500/20 mb-5">
              HS
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Harsh Sisodia
            </h3>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-4">
              Creator & Developer
            </p>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Harsh is a young developer and creator who enjoys building websites, experimenting with technology, and creating useful digital experiences.
            </p>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-500" />
                <span>Web Development & Prototyping</span>
              </div>
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-purple-500" />
                <span>Gaming Enthusiast & Explorer</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <span>Student Tools & Education</span>
              </div>
            </div>
          </div>

          {/* My Journey Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Background</span>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Journey
            </h2>

            <div className="bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 text-slate-700 dark:text-slate-300 leading-relaxed text-base">
              <p>
                "I started creating projects because I enjoy learning how technology works and turning ideas into real websites. Every project I build helps me learn something new, experiment with different ideas, and improve my development skills."
              </p>
              <p>
                "StudyForge is one of those projects — a platform built with the goal of making studying more organized, interactive, and enjoyable."
              </p>
            </div>

            {/* Core Values Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
                  Learning First
                </div>
                <div className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                  Experimenting with modern web technologies and real-world tools.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider mb-1">
                  Practical Ideas
                </div>
                <div className="text-xs text-purple-700/80 dark:text-purple-300/80">
                  Building websites that solve everyday problems for people.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1">
                  Honest Progress
                </div>
                <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  Growing skills step-by-step with every completed project.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY I BUILT STUDYFORGE */}
      <section className="py-16 sm:py-20 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 mb-4">
            <Target className="w-3.5 h-3.5 text-indigo-500" />
            <span>The Vision</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Why StudyForge?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            "I wanted to create a place where students could bring different parts of studying together — lessons, quizzes, flashcards, notes, goals, and progress — in one simple platform."
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${feat.color} flex items-center justify-center shadow-xs`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl">{feat.emoji}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Integrated in StudyForge</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. OTHER PROJECTS BY HARSH */}
      <section id="projects" className="py-16 sm:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300 mb-4">
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Portfolio</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Other Projects by Harsh
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Explore three interactive digital experiences created by Harsh, exploring history, computer hardware, and gaming.
          </p>
        </div>

        {/* 3 Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleOpenProject(proj.url)}
              className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${proj.accentBorder} rounded-3xl p-7 shadow-xs hover:shadow-xl ${proj.accentGlow} transition-all duration-300 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden`}
            >
              {/* Top Accent Gradient Line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${proj.color}`} />

              <div>
                {/* Header row with Icon and Category Tag */}
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${proj.color} text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-110 transition-transform`}>
                    <proj.icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                    {proj.badge}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                  <span>{proj.title}</span>
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  {proj.description}
                </p>
              </div>

              <div>
                {/* Display URL */}
                <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-4 truncate group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                  🔗 {proj.displayUrl}
                </div>

                {/* Visit Project Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenProject(proj.url);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs cursor-pointer"
                >
                  <span>Visit Project</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. A MESSAGE FROM THE CREATOR */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-950 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 rounded-3xl p-8 sm:p-12 shadow-md relative text-center">
            {/* Top Icon Pill */}
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6 border border-indigo-100 dark:border-indigo-900/50">
              <Heart className="w-6 h-6 fill-indigo-500/20" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
              A Message From the Creator
            </h2>

            {/* Exact Creator Quote */}
            <blockquote className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-8 italic">
              "Thanks for checking out StudyForge! This project is a part of my journey of learning, building, and experimenting with technology. I hope StudyForge can be useful to students and make studying a little more organized and enjoyable."
            </blockquote>

            {/* Signature */}
            <div className="inline-block border-t border-slate-200 dark:border-slate-800 pt-4 px-6">
              <div className="font-extrabold text-lg text-slate-900 dark:text-white">
                — Harsh Sisodia
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Creator of StudyForge
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. READY TO STUDY CTA BANNER */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white p-8 sm:p-12 text-center shadow-xl shadow-indigo-500/15 relative overflow-hidden">
          <div className="max-w-xl mx-auto relative z-10">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Ready to start your study session?
            </h3>
            <p className="text-indigo-100 text-sm sm:text-base mb-8">
              Explore lessons across 6 core subjects, test your knowledge with smart quizzes, or ask the Socratic AI tutor.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('/dashboard')}
                className="px-6 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => onNavigate('/subjects')}
                className="px-6 py-3 rounded-2xl bg-indigo-800/80 hover:bg-indigo-900 text-white border border-indigo-500/40 font-semibold text-sm transition-all cursor-pointer"
              >
                Browse Subjects
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
