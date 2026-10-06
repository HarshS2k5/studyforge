# StudyForge 🎓
> *Study smarter. Learn better.*  
> An all-in-one, modern educational platform designed for student learning, revision, practice, and organization.

---

## 🌟 Overview

**StudyForge** is a full-stack, production-ready educational platform created by **Harsh Sisodia** for students across Grades 8 through 12. It provides a comprehensive ecosystem supporting lessons, Socratic AI tutoring, smart quizzes, spaced-repetition flashcards, structured notes with AI synthesis, an interactive study planner, Pomodoro focus timer, mistake revision workbook, XP and achievements gamification, mock exam simulations, curriculum reporting, and an administrative moderation dashboard.

### 👤 Created by Harsh Sisodia
Harsh is a young developer and creator who enjoys building websites, experimenting with technology, and creating useful digital experiences. Learn more on the dedicated [About Us page](http://localhost:3001/about).

#### Other Projects by Harsh:
- **[Internet Time Machine](https://internet-time-machine-six.vercel.app)** — An interactive project exploring the history and evolution of websites and the internet.
- **[PC Builder](https://pc-builder-seven-ashen.vercel.app)** — A PC building project designed to help users explore PC components and create their own computer builds.
- **[GameRank](https://gamerank-one.vercel.app)** — A gaming-focused project where users can explore and rank games.

---

## 🚀 Quick Start

### 1. Installation & Setup
```bash
# Navigate to project directory
cd "C:\Users\DHRUV SISODIA\.gemini\antigravity\scratch\studyforge"

# Install dependencies (already installed)
npm install

# Initialize and seed SQLite database (already seeded)
npm run seed

# Build production assets
npm run build

# Start the full-stack server (runs on http://localhost:3001)
npm start
```

### 2. Live Development Mode
```bash
npm run dev
# Starts backend on http://localhost:3001 and Vite client on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Student (Alex Morgan)** | `student@studyforge.edu` | `student123` | Dashboard, AI Tutor, Quizzes, Notes, Flashcards, Timer, Mistake Book, Exam Mode, Leaderboard, Bookmarks |
| **Admin (Admin Professor)** | `admin@studyforge.edu` | `admin123` | Everything above + Admin Dashboard, Content Bank Manager, User Roles, Content Reports, AI Configuration |

*Note: You can also use the 1-Click "Demo Student" and "Demo Admin" buttons directly inside the sign-in modal for instantaneous access.*

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - **React 19** + **TypeScript**
  - **Tailwind CSS v4** + `@tailwindcss/vite`
  - **Lucide Icons**
  - **Canvas Confetti** for rewarding level-ups and milestones
  - Theme Engine: Full **Dark & Light Mode** support persisted in `localStorage`
- **Backend**:
  - **Node.js** + **Express 5**
  - **better-sqlite3** with Write-Ahead Logging (WAL) for blazing fast, atomic operations
  - **bcryptjs** for secure password hashing
  - **jsonwebtoken (JWT)** for role-based authentication
  - Dual-Mode Socratic AI Engine:
    - **Google GenAI SDK (`@google/genai`)** with `gemini-3.8-flash`
    - Intelligent Built-in Fallback Pedagogical Engine for zero-dependency local operation
- **Data Safety**:
  - Server-side validation of all XP, levels, study streaks, and quiz grading.
  - Answers strictly hidden during quizzes and exam simulations until final submission.

---

## 📚 Core Features & Capabilities (35 Feature Suite)

1. **Modern Landing Page**:
   - Hero header: *"Study smarter. Learn better."*
   - Subtitle: *"Your all-in-one study companion for lessons, quizzes, notes, flashcards and progress tracking."*
   - Direct call-to-actions, feature spotlights, curriculum previews, and student testimonials.
2. **User Authentication & Profile**:
   - Secure sign-up, sign-in, and password reset flows with JWT session persistence.
   - Comprehensive profile showing Grade, subjects, level, streak, XP, quiz accuracy, and study hours.
3. **Personalized Onboarding**:
   - Short 4-step wizard capturing class/grade, subjects of interest, study goals, and learning styles.
   - Allows skipping optional steps and updates dashboard recommendations.
4. **Student Dashboard**:
   - Dynamic time-of-day greeting: *"Good morning/afternoon/evening, [username]"*.
   - Today's actionable goals checklist (+XP on completion).
   - Streak counter (`🔥`), level badge, weekly study graph, and one-click "Continue Studying" resume card.
5. **Subject & Chapter Hierarchy**:
   - 6 Core Subjects: Mathematics, Science, English, Hindi, Social Science, Computer Science.
   - Support for custom student-created subjects.
   - Chapter exploration with progress bars, topic breakdowns, and direct quiz/flashcard launches.
6. **Immersive Lesson Reader**:
   - Step-by-step curriculum with formatted formulas, definitions, key takeaways, and practice drills.
   - Bookmark button and direct "Ask AI Tutor About This Lesson" launcher.
7. **Socratic AI Tutor**:
   - Pedagogical approach emphasizing *understanding over dumping raw answers*.
   - Quick Action Controls:
     - 💡 *Explain simpler* (grade-tailored analogies)
     - 🔍 *Give another example* (step-by-step solved walkthrough)
     - 🎯 *Quiz me* (conceptual verification checks)
     - 📝 *Summarize* (core takeaways & pitfalls)
     - 🛠️ *Explain my mistake* (diagnose misconception)
   - Built-in uncertainty disclaimers advising students to verify textbook definitions.
8. **Smart Quiz Generator**:
   - Filter by subject, chapter, topic, difficulty (Easy, Medium, Hard), count, and question type.
   - Supports Multiple Choice, True/False, and Fill-in-the-Blank.
   - Concealed answer security: answers are never transmitted to client before test submission.
   - Post-quiz diagnostic report: score, accuracy, time taken, and topics needing improvement.
9. **Unlimited Practice Mode**:
   - Immediate feedback with clear explanations and one-click "Save to Mistake Book" button.
10. **Spaced-Repetition Flashcards**:
    - 3D interactive flipping cards with deck organization.
    - Self-rating (*Easy*, *Medium*, *Hard*) adjusting interval scheduling so difficult cards appear more frequently.
11. **Notes & AI Note Synthesizer**:
    - Rich note-taking with markdown headings, checklists, and search filtering.
    - AI Note Tools: transform notes into Summaries, Key Points, Flashcard decks, or Revision Checklists.
12. **Study Planner & Timetable**:
    - Weekly schedule breakdown (e.g. *Monday: Math 30 min, Science 20 min*).
    - Daily, weekly, and exam goal creation with checkbox completion awards.
13. **Focus Study Timer**:
    - Preset Pomodoro intervals (25m Focus / 5m Break, 50m Focus / 10m Break) and Custom timer.
    - Audio chime notification and sensible break reminders to prevent study burnout.
    - Automatically credits study minutes and XP to student profile.
14. **Mistake Book (Misconception Repository)**:
    - Dedicated workbook preserving incorrect attempts, student answer, correct answer, and explanation.
    - Interactive "Practice Mistakes" drill mode to turn weaknesses into strengths.
15. **XP, Streaks & Achievements**:
    - Server-side XP calculation with milestone titles (Level 1 Beginner → Level 5 Learner → Level 10 Scholar → Level 20 Expert → Level 30 Master).
    - Non-punitive daily streak counter (`🔥`) with weekly activity calendar.
    - 12 unlockable achievement badges.
16. **Timed Exam Simulation Mode**:
    - Live countdown timer, question palette navigator, and "Mark for Review" flags.
    - Accidental submission prevention modal with unanswered question alerts.
    - Detailed score breakdown, accuracy metrics, and review sheet.
17. **Global Search (`Ctrl+K`)**:
    - Fast, indexed curriculum search querying subjects, chapters, lessons, questions, and personal notes.
18. **Bookmarks System**:
    - Central repository of saved lessons, practice problems, and study notes.
19. **Privacy-Preserving Leaderboard**:
    - Weekly XP standings using custom display names with sensitive student metrics protected.
20. **Content Reporting System**:
    - Student bug and typo reporting (Pending, Reviewing, Resolved status workflow).
21. **Administrative Moderation Dashboard**:
    - Platform overview metrics (active users, questions, quizzes taken, pending reports).
    - Role management (promote students to admins).
    - Question bank manager (create and delete questions across subjects).
    - AI Configuration panel (set custom Gemini API keys or choose AI models).

---

## 🧪 Automated Verification Suite

Run the full end-to-end integration test suite verifying all 20 API modules:
```bash
npx tsx test_all_features.ts
```
**Test Results**:
```
🧪 Starting StudyForge Automated Feature Verification...
✅ PASS: Health check returns healthy
✅ PASS: Demo student login succeeds with JWT
✅ PASS: Demo admin login succeeds
✅ PASS: Found 6 subjects (Math, Sci, Eng, Hin, Soc, CS)
✅ PASS: Mathematics subject exists
✅ PASS: Mathematics has 3 chapters
✅ PASS: First lesson found: "Operations with Proper & Improper Fractions"
✅ PASS: Completing lesson awards +30 XP and updates streak
✅ PASS: AI Tutor Socratic pedagogical response generated
✅ PASS: AI Note Tools: Generated summary successfully
✅ PASS: Quiz Generator created 5-question test
✅ PASS: Quiz question DOES NOT leak correct answer before submission
✅ PASS: Quiz submitted: accuracy 20%, awarded 35 XP
✅ PASS: Practice questions retrieved (5)
✅ PASS: Practice question checked with explanation
✅ PASS: Flashcard decks retrieved (2)
✅ PASS: Cards in deck: 5
✅ PASS: Spaced review interval updated to 3 days
✅ PASS: Note created with ID 4
✅ PASS: Note successfully pinned to top
✅ PASS: Study goal created with ID 8
✅ PASS: Goal completed and awarded +20 XP
✅ PASS: 25-min study timer logged +25 XP to student account
✅ PASS: Mistake saved to Mistake Book with ID 3
✅ PASS: Mistake Book contains 3 items
✅ PASS: Progress summary returns streak, XP, and weekly chart activity
✅ PASS: Achievements returned (12 badges)
✅ PASS: Exam simulation initialized with countdown and question palette
✅ PASS: Global search returns matching curriculum resources
✅ PASS: Bookmark saved
✅ PASS: Bookmarks list contains 1 items
✅ PASS: Report submitted with ID 2
✅ PASS: Admin overview accessed: 2 users
✅ PASS: Admin viewed 2 curriculum reports

========================================
🏆 TEST RESULTS: 34 Passed, 0 Failed
========================================
```

---

## 🛡️ License & Ethical Educational Standards
StudyForge is built free-first for all students, with no manipulative paywalls, non-purchasable XP, healthy streak mechanics, and strict pedagogical standards.
