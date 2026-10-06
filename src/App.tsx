import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ReportModal } from './components/ReportModal';
import { LevelUpModal } from './components/LevelUpModal';
import { AchievementToast } from './components/AchievementToast';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { ChapterDetailPage } from './pages/ChapterDetailPage';
import { LessonViewerPage } from './pages/LessonViewerPage';
import { AITutorPage } from './pages/AITutorPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { QuizActivePage } from './pages/QuizActivePage';
import { PracticePage } from './pages/PracticePage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { NotesPage } from './pages/NotesPage';
import { PlannerPage } from './pages/PlannerPage';
import { TimerPage } from './pages/TimerPage';
import { ProgressPage } from './pages/ProgressPage';
import { MistakeBookPage } from './pages/MistakeBookPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ExamModePage } from './pages/ExamModePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');

  // Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id?: string; type?: string }>({});

  // Active quiz state
  const [activeQuizData, setActiveQuizData] = useState<any | null>(null);

  // Sync browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setActiveQuizData(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setActiveQuizData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleOpenReport = (contentId?: string, contentType?: string) => {
    setReportTarget({ id: contentId, type: contentType });
    setReportOpen(true);
  };

  // Simple router based on currentPath
  const renderContent = () => {
    // Active quiz takes full focus
    if (activeQuizData) {
      return (
        <QuizActivePage
          quizData={activeQuizData}
          onFinish={() => {
            setActiveQuizData(null);
            navigate('/quizzes');
          }}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath === '/' || currentPath === '') {
      return <LandingPage onNavigate={navigate} onOpenAuth={handleOpenAuth} />;
    }

    if (currentPath === '/dashboard') {
      return <DashboardPage onNavigate={navigate} onOpenAuth={handleOpenAuth} />;
    }

    if (currentPath === '/subjects') {
      return <SubjectsPage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/subjects/')) {
      const subjectId = currentPath.split('/')[2];
      // Subject detail / Chapter view
      return <ChapterDetailPage chapterId={subjectId} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/chapters/')) {
      const chapterId = currentPath.split('/')[2];
      return <ChapterDetailPage chapterId={chapterId} onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/lessons/')) {
      const lessonId = currentPath.split('/')[2];
      return (
        <LessonViewerPage
          lessonId={lessonId}
          onNavigate={navigate}
          onOpenReport={handleOpenReport}
        />
      );
    }

    if (currentPath === '/tutor') {
      const params = new URLSearchParams(window.location.search);
      return (
        <AITutorPage
          initialSubject={params.get('subject') || undefined}
          initialTopic={params.get('topic') || undefined}
        />
      );
    }

    if (currentPath === '/quizzes') {
      const params = new URLSearchParams(window.location.search);
      return (
        <QuizGeneratorPage
          initialSubjectId={params.get('subject_id') || undefined}
          onStartQuiz={(data) => setActiveQuizData(data)}
        />
      );
    }

    if (currentPath === '/practice') {
      const params = new URLSearchParams(window.location.search);
      return <PracticePage initialSubjectId={params.get('subject_id') || undefined} />;
    }

    if (currentPath === '/flashcards') {
      return <FlashcardsPage />;
    }

    if (currentPath === '/notes') {
      return <NotesPage />;
    }

    if (currentPath === '/planner') {
      return <PlannerPage />;
    }

    if (currentPath === '/timer') {
      return <TimerPage />;
    }

    if (currentPath === '/progress') {
      return <ProgressPage />;
    }

    if (currentPath === '/mistakes') {
      return <MistakeBookPage />;
    }

    if (currentPath === '/achievements') {
      return <AchievementsPage />;
    }

    if (currentPath === '/exam') {
      return <ExamModePage onNavigate={navigate} />;
    }

    if (currentPath === '/leaderboard') {
      return <LeaderboardPage />;
    }

    if (currentPath === '/bookmarks') {
      return <BookmarksPage onNavigate={navigate} />;
    }

    if (currentPath === '/profile') {
      return <ProfilePage />;
    }

    if (currentPath === '/admin') {
      return <AdminDashboardPage />;
    }

    if (currentPath === '/about' || currentPath.startsWith('/about')) {
      return <AboutPage onNavigate={navigate} />;
    }

    // Default fallback to Landing or Dashboard
    return <LandingPage onNavigate={navigate} onOpenAuth={handleOpenAuth} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAuth={handleOpenAuth}
        onOpenReport={() => handleOpenReport()}
        onNavigate={navigate}
        currentPath={currentPath}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">{renderContent()}</main>

      {/* Footer */}
      <Footer onNavigate={navigate} onOpenReport={() => handleOpenReport()} />

      {/* Global Modals & Overlays */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onRegisterSuccess={() => setOnboardingOpen(true)}
      />

      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        contentId={reportTarget.id}
        contentType={reportTarget.type}
      />

      <LevelUpModal />
      <AchievementToast />
    </div>
  );
};
