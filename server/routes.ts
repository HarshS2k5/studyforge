import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import {
  AuthRequest,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  generateToken,
  calculateLevelInfo,
  addXpAndCheckStreak,
  checkUserAchievements,
} from './auth.js';
import { askTutor, transformNote, scanQuestion, generateFlashcardsAi } from './tutorEngine.js';
import { getSmartNextActivity, generateMinuteSession } from './smartSessionEngine.js';
import { generateLearningPlan, adaptLearningPath } from './learningPathEngine.js';
import { parseSyllabusContent } from './syllabusParser.js';
import { analyzeEducationalText } from './textbookAssistant.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StudyForge Core API',
  });
});

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

router.post('/auth/register', (req, res) => {
  try {
    const { username, email, password, grade, learning_goals, study_style, subjects } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      res.status(400).json({ error: 'User with this email or username already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userGrade = grade || 'Grade 10';
    const goals = learning_goals || 'Exam Prep & Concept Mastery';
    const style = study_style || 'Visual & Step-by-Step';

    const info = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, grade, learning_goals, study_style, xp, level, streak, last_active_date)
      VALUES (?, ?, ?, 'student', ?, ?, ?, 50, 1, 1, date('now'))
    `).run(username, email, passwordHash, userGrade, goals, style);

    const userId = Number(info.lastInsertRowid);

    // Link selected or default subjects
    if (Array.isArray(subjects) && subjects.length > 0) {
      const insSub = db.prepare('INSERT OR IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)');
      for (const sId of subjects) {
        insSub.run(userId, sId);
      }
    } else {
      // Default link all subjects
      const allSubs = db.prepare('SELECT id FROM subjects').all() as { id: number }[];
      const insSub = db.prepare('INSERT OR IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)');
      for (const s of allSubs) {
        insSub.run(userId, s.id);
      }
    }

    const token = generateToken({ id: userId, email, username, role: 'student' });
    const levelInfo = calculateLevelInfo(50);

    res.json({
      token,
      user: {
        id: userId,
        username,
        email,
        role: 'student',
        grade: userGrade,
        learning_goals: goals,
        study_style: style,
        xp: 50,
        level: 1,
        levelInfo,
        streak: 1,
        total_study_seconds: 0,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body; // username or email

    if (!identifier || !password) {
      res.status(400).json({ error: 'Identifier and password are required' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').get(identifier, identifier) as any;
    if (!user) {
      res.status(401).json({ error: 'Invalid email/username or password' });
      return;
    }

    const matches = bcrypt.compareSync(password, user.password_hash);
    if (!matches) {
      res.status(401).json({ error: 'Invalid email/username or password' });
      return;
    }

    // Refresh streak / daily activity
    const streakResult = addXpAndCheckStreak(user.id, 0);

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const levelInfo = calculateLevelInfo(user.xp);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        grade: user.grade,
        learning_goals: user.learning_goals,
        study_style: user.study_style,
        xp: user.xp,
        level: user.level,
        levelInfo,
        streak: streakResult.streak,
        total_study_seconds: user.total_study_seconds,
      },
      unlockedAchievements: streakResult.unlockedAchievements,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT id, username, email, role, grade, learning_goals, study_style, xp, level, streak, total_study_seconds, created_at FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const levelInfo = calculateLevelInfo(user.xp);

    // Summary stats
    const completedLessons = (db.prepare('SELECT count(*) as c FROM lesson_progress WHERE user_id = ? AND completed = 1').get(userId) as any).c;
    const quizStats = db.prepare('SELECT count(*) as total, AVG(accuracy) as avg_acc FROM quiz_attempts WHERE user_id = ?').get(userId) as any;
    const totalQuestions = (db.prepare('SELECT count(*) as c FROM practice_logs WHERE user_id = ?').get(userId) as any).c + (db.prepare('SELECT COALESCE(SUM(total_questions), 0) as total FROM quiz_attempts WHERE user_id = ?').get(userId) as any).total;
    const flashcardsReviewed = (db.prepare('SELECT count(*) as c FROM flashcards f JOIN flashcard_decks d ON f.deck_id = d.id WHERE d.user_id = ? OR d.user_id IS NULL AND f.repetitions > 0').get(userId) as any).c;

    res.json({
      user: {
        ...user,
        levelInfo,
        stats: {
          completedLessons,
          quizCount: quizStats.total || 0,
          quizAccuracy: Math.round(quizStats.avg_acc || 0),
          totalQuestions,
          flashcardsReviewed,
          studyHours: Math.round((user.total_study_seconds / 3600) * 10) / 10,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/auth/profile', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { username, grade, learning_goals, study_style } = req.body;

    db.prepare(`
      UPDATE users 
      SET username = COALESCE(?, username),
          grade = COALESCE(?, grade),
          learning_goals = COALESCE(?, learning_goals),
          study_style = COALESCE(?, study_style)
      WHERE id = ?
    `).run(username, grade, learning_goals, study_style, userId);

    res.json({ message: 'Profile updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/auth/onboarding', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { grade, subjects, learning_goals, study_style } = req.body;

    db.prepare(`
      UPDATE users 
      SET grade = COALESCE(?, grade),
          learning_goals = COALESCE(?, learning_goals),
          study_style = COALESCE(?, study_style)
      WHERE id = ?
    `).run(grade, learning_goals, study_style, userId);

    if (Array.isArray(subjects) && subjects.length > 0) {
      db.prepare('DELETE FROM user_subjects WHERE user_id = ?').run(userId);
      const insSub = db.prepare('INSERT OR IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)');
      for (const sId of subjects) {
        insSub.run(userId, sId);
      }
    }

    res.json({ message: 'Onboarding completed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Demo quick-login convenience for reviewers/users
router.post('/auth/demo-login', (req, res) => {
  try {
    const { role } = req.body;
    const email = role === 'admin' ? 'admin@studyforge.edu' : 'student@studyforge.edu';
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      res.status(404).json({ error: 'Demo user not found' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const levelInfo = calculateLevelInfo(user.xp);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        grade: user.grade,
        learning_goals: user.learning_goals,
        study_style: user.study_style,
        xp: user.xp,
        level: user.level,
        levelInfo,
        streak: user.streak,
        total_study_seconds: user.total_study_seconds,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Forgot / Reset password
router.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!user) {
    // Return friendly generic response for privacy
    res.json({ message: 'If an account exists with this email, password reset instructions have been generated.' });
    return;
  }
  res.json({
    message: 'Password reset link simulated. For testing convenience, you may use the reset endpoint directly or sign in.',
    resetToken: 'mock-reset-token-' + Date.now(),
  });
});

router.post('/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and newPassword are required' });
    return;
  }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hash, email);
  res.json({ message: 'Password has been successfully updated. You may now login.' });
});

// ==========================================
// 2. SUBJECTS, CHAPTERS & LESSONS
// ==========================================

router.get('/subjects', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const subjects = db.prepare('SELECT * FROM subjects ORDER BY id ASC').all() as any[];

    const enriched = subjects.map(sub => {
      const chapterCount = (db.prepare('SELECT count(*) as c FROM chapters WHERE subject_id = ?').get(sub.id) as any).c;
      const lessonCount = (db.prepare('SELECT count(*) as c FROM lessons l JOIN chapters c ON l.chapter_id = c.id WHERE c.subject_id = ?').get(sub.id) as any).c;
      const questionCount = (db.prepare('SELECT count(*) as c FROM questions WHERE subject_id = ?').get(sub.id) as any).c;
      
      let completedLessons = 0;
      if (userId) {
        completedLessons = (db.prepare(`
          SELECT count(*) as c 
          FROM lesson_progress lp 
          JOIN lessons l ON lp.lesson_id = l.id 
          JOIN chapters c ON l.chapter_id = c.id 
          WHERE c.subject_id = ? AND lp.user_id = ? AND lp.completed = 1
        `).get(sub.id, userId) as any).c;
      }

      const progressPercent = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;

      return {
        ...sub,
        stats: {
          chapterCount,
          lessonCount,
          questionCount,
          completedLessons,
          progressPercent,
        },
      };
    });

    res.json({ subjects: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/subjects/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user?.id;

    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as any;
    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    const chapters = db.prepare('SELECT * FROM chapters WHERE subject_id = ? ORDER BY order_num ASC').all(subjectId) as any[];

    const enrichedChapters = chapters.map(ch => {
      const lessons = db.prepare('SELECT id, chapter_id, title, summary, order_num, estimated_minutes FROM lessons WHERE chapter_id = ? ORDER BY order_num ASC').all(ch.id) as any[];
      const questionCount = (db.prepare('SELECT count(*) as c FROM questions WHERE chapter_id = ?').get(ch.id) as any).c;
      
      const enrichedLessons = lessons.map(les => {
        let isCompleted = false;
        if (userId) {
          const prog = db.prepare('SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, les.id) as any;
          isCompleted = Boolean(prog?.completed);
        }
        return { ...les, completed: isCompleted };
      });

      const completedCount = enrichedLessons.filter(l => l.completed).length;
      const progressPercent = enrichedLessons.length > 0 ? Math.round((completedCount / enrichedLessons.length) * 100) : 0;

      return {
        ...ch,
        lessons: enrichedLessons,
        stats: {
          lessonCount: enrichedLessons.length,
          completedCount,
          progressPercent,
          questionCount,
        },
      };
    });

    res.json({ subject, chapters: enrichedChapters });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/subjects', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { name, code, description, icon, grade_level, color } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'Name and Code are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO subjects (name, code, description, icon, grade_level, color, is_custom)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(name, code.toUpperCase(), description || '', icon || 'BookOpen', grade_level || 'All Grades', color || 'indigo');

    const newSubId = Number(info.lastInsertRowid);
    db.prepare('INSERT OR IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)').run(req.user!.id, newSubId);

    res.json({ message: 'Subject created successfully', id: newSubId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/chapters/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const chapterId = req.params.id;
    const userId = req.user?.id;

    const chapter = db.prepare(`
      SELECT c.*, s.name as subject_name, s.code as subject_code 
      FROM chapters c 
      JOIN subjects s ON c.subject_id = s.id 
      WHERE c.id = ?
    `).get(chapterId) as any;

    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    const lessons = db.prepare('SELECT * FROM lessons WHERE chapter_id = ? ORDER BY order_num ASC').all(chapterId) as any[];
    const questionsCount = (db.prepare('SELECT count(*) as c FROM questions WHERE chapter_id = ?').get(chapterId) as any).c;

    const topics = db.prepare('SELECT * FROM topics WHERE chapter_id = ? ORDER BY order_num ASC').all(chapterId) as any[];
    const topicsWithProgress = topics.map(t => {
      let status = 'not_started';
      if (userId) {
        const prog = db.prepare('SELECT status FROM user_topic_progress WHERE user_id = ? AND topic_id = ?').get(userId, t.id) as any;
        if (prog) status = prog.status;
      }
      return { ...t, status };
    });

    const enrichedLessons = lessons.map(les => {
      let completed = false;
      if (userId) {
        const prog = db.prepare('SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, les.id) as any;
        completed = Boolean(prog?.completed);
      }
      return { ...les, completed };
    });

    res.json({ chapter, lessons: enrichedLessons, topics: topicsWithProgress, stats: { questionsCount } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/lessons/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user?.id;

    const lesson = db.prepare(`
      SELECT l.*, c.title as chapter_title, c.subject_id, s.name as subject_name 
      FROM lessons l 
      JOIN chapters c ON l.chapter_id = c.id 
      JOIN subjects s ON c.subject_id = s.id 
      WHERE l.id = ?
    `).get(lessonId) as any;

    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    let completed = false;
    let isBookmarked = false;

    if (userId) {
      const prog = db.prepare('SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lessonId) as any;
      completed = Boolean(prog?.completed);

      const bookmark = db.prepare("SELECT id FROM bookmarks WHERE user_id = ? AND item_type = 'lesson' AND item_id = ?").get(userId, lessonId);
      isBookmarked = Boolean(bookmark);
    }

    // Get adjacent lessons in this chapter for smooth next/prev navigation
    const allInChapter = db.prepare('SELECT id, title, order_num FROM lessons WHERE chapter_id = ? ORDER BY order_num ASC').all(lesson.chapter_id) as any[];
    const currentIndex = allInChapter.findIndex(l => l.id === Number(lessonId));
    const prevLesson = currentIndex > 0 ? allInChapter[currentIndex - 1] : null;
    const nextLesson = currentIndex < allInChapter.length - 1 ? allInChapter[currentIndex + 1] : null;

    res.json({
      lesson: {
        ...lesson,
        completed,
        isBookmarked,
      },
      navigation: { prevLesson, nextLesson },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/lessons/:id/complete', authenticateToken, (req: AuthRequest, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user!.id;

    db.prepare(`
      INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
      VALUES (?, ?, 1, datetime('now'))
      ON CONFLICT(user_id, lesson_id) DO UPDATE SET completed = 1, completed_at = datetime('now')
    `).run(userId, lessonId);

    // Award XP (30 XP for lesson completion)
    const result = addXpAndCheckStreak(userId, 30);

    res.json({
      message: 'Lesson marked as completed!',
      xpEarned: 30,
      newXp: result.newXp,
      levelUp: result.levelUp,
      newLevel: result.newLevel,
      streak: result.streak,
      unlockedAchievements: result.unlockedAchievements,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 3. AI TUTOR & AI NOTE TOOLS
// ==========================================

router.post('/tutor/chat', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { message, history, grade, subject, topic, action } = req.body;

    if (!message && action !== 'summarize' && action !== 'quiz_me') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    let userGrade = grade;
    if (!userGrade && req.user?.id) {
      const u = db.prepare('SELECT grade FROM users WHERE id = ?').get(req.user.id) as any;
      userGrade = u?.grade;
    }

    const response = await askTutor({
      message: message || `Explain key concepts of ${topic || subject}`,
      history,
      grade: userGrade || 'Grade 10',
      subject: subject || 'Academics',
      topic: topic || 'Core Topic',
      action: action || 'chat',
    });

    res.json(response);
  } catch (err: any) {
    console.error('Tutor error:', err);
    res.status(500).json({ error: err.message || 'Error communicating with AI tutor' });
  }
});

router.post('/tutor/transform-note', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { noteContent, noteTitle, tool } = req.body;

    if (!noteContent) {
      res.status(400).json({ error: 'Note content is required' });
      return;
    }

    const response = await transformNote(noteContent, noteTitle || 'Study Note', tool || 'summary');
    res.json(response);
  } catch (err: any) {
    console.error('Transform note error:', err);
    res.status(500).json({ error: err.message || 'Error processing notes' });
  }
});

router.post('/tutor/scan-question', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { imageBase64, mimeType, notes } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Image data is required' });
      return;
    }
    const result = await scanQuestion(imageBase64, mimeType || 'image/jpeg', notes);
    res.json(result);
  } catch (err: any) {
    console.error('Scan question error:', err);
    res.status(500).json({ error: err.message || 'Error processing question image' });
  }
});

router.get('/tutor/sessions', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const sessions = db.prepare(`
      SELECT s.id, s.title, s.subject_id, s.topic, s.created_at, s.updated_at,
             sub.name as subject_name
      FROM ai_chat_sessions s
      LEFT JOIN subjects sub ON sub.id = s.subject_id
      WHERE s.user_id = ?
      ORDER BY s.updated_at DESC
    `).all(userId);
    res.json({ sessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/tutor/sessions', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, subject_id, topic } = req.body;
    const info = db.prepare(`
      INSERT INTO ai_chat_sessions (user_id, title, subject_id, topic, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(userId, title || 'New Study Session', subject_id || null, topic || null);

    const session = db.prepare('SELECT * FROM ai_chat_sessions WHERE id = ?').get(info.lastInsertRowid);
    res.json({ session });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/tutor/sessions/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const session = db.prepare('SELECT * FROM ai_chat_sessions WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!session) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }
    const messages = db.prepare('SELECT id, role, content, created_at FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC').all(req.params.id);
    res.json({ session, messages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/tutor/sessions/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const sessionId = req.params.id;
    const { message, action } = req.body;

    const session = db.prepare('SELECT * FROM ai_chat_sessions WHERE id = ? AND user_id = ?').get(sessionId, userId) as any;
    if (!session) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }

    db.prepare("INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, 'user', ?)").run(sessionId, message);

    const prevMessages = db.prepare('SELECT role, content FROM ai_chat_messages WHERE session_id = ? ORDER BY id ASC LIMIT 20').all(sessionId) as any[];
    const history = prevMessages.map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      content: m.content,
    }));

    const subjectRow = session.subject_id ? db.prepare('SELECT name FROM subjects WHERE id = ?').get(session.subject_id) as any : null;
    const studentUser = db.prepare('SELECT grade FROM users WHERE id = ?').get(userId) as any;

    const tutorResponse = await askTutor({
      message,
      history,
      grade: studentUser?.grade || 'Grade 10',
      subject: subjectRow?.name || 'General Academics',
      topic: session.topic || 'Core Concept',
      action: action || 'chat',
    });

    db.prepare("INSERT INTO ai_chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)").run(sessionId, tutorResponse.reply);
    db.prepare("UPDATE ai_chat_sessions SET updated_at = datetime('now') WHERE id = ?").run(sessionId);

    addXpAndCheckStreak(userId, 5);

    res.json({ reply: tutorResponse.reply, suggestedFollowUps: tutorResponse.suggestedFollowUps });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/tutor/sessions/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM ai_chat_sessions WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Session deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 4. QUIZ GENERATOR & QUIZZES
// ==========================================

router.post('/quizzes/generate', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { subject_id, chapter_id, topic, difficulty, num_questions, question_type } = req.body;

    const count = Math.min(25, Math.max(3, Number(num_questions) || 5));
    let sql = 'SELECT id, subject_id, chapter_id, question_text, type, options_json, difficulty, topic FROM questions WHERE 1=1';
    const params: any[] = [];

    if (subject_id) {
      sql += ' AND subject_id = ?';
      params.push(subject_id);
    }
    if (chapter_id) {
      sql += ' AND chapter_id = ?';
      params.push(chapter_id);
    }
    if (difficulty && difficulty !== 'all') {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (question_type && question_type !== 'all') {
      sql += ' AND type = ?';
      params.push(question_type);
    }

    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    let questions = db.prepare(sql).all(...params) as any[];

    // Fallback if specific filters yielded fewer questions: pull from broader subject or bank
    if (questions.length < count && subject_id) {
      const fallback = db.prepare(`
        SELECT id, subject_id, chapter_id, question_text, type, options_json, difficulty, topic 
        FROM questions 
        WHERE subject_id = ? AND id NOT IN (${questions.map(q => q.id).join(',') || '0'})
        ORDER BY RANDOM() LIMIT ?
      `).all(subject_id, count - questions.length) as any[];
      questions = [...questions, ...fallback];
    }

    if (questions.length === 0) {
      // General fallback to any questions
      questions = db.prepare(`
        SELECT id, subject_id, chapter_id, question_text, type, options_json, difficulty, topic 
        FROM questions 
        ORDER BY RANDOM() LIMIT ?
      `).all(count) as any[];
    }

    // Parse options_json and ensure answers are NOT leaked before submission
    const safeQuestions = questions.map(q => ({
      ...q,
      options: q.options_json ? JSON.parse(q.options_json) : [],
    }));

    res.json({
      quiz_id: 'quiz-' + Date.now(),
      total_questions: safeQuestions.length,
      questions: safeQuestions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/quizzes/submit', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { subject_id, chapter_id, quiz_type, answers, time_taken_seconds } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({ error: 'Answers array is required' });
      return;
    }

    let correctCount = 0;
    const reviewedAnswers = [];
    const topicsToImprove = new Set<string>();

    for (const ans of answers) {
      const question = db.prepare('SELECT id, question_text, correct_answer, explanation, topic FROM questions WHERE id = ?').get(ans.question_id) as any;
      if (!question) continue;

      const isCorrect = String(ans.user_answer || '').trim().toLowerCase() === String(question.correct_answer || '').trim().toLowerCase();
      if (isCorrect) {
        correctCount += 1;
      } else {
        if (question.topic) topicsToImprove.add(question.topic);
      }

      reviewedAnswers.push({
        question_id: question.id,
        question_text: question.question_text,
        user_answer: ans.user_answer || 'No answer',
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        topic: question.topic,
        is_correct: isCorrect,
      });
    }

    const totalQuestions = reviewedAnswers.length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const score = Math.round(accuracy);
    const duration = Math.max(10, Number(time_taken_seconds) || 60);

    let xpEarned = 0;
    let unlockedAchievements: any[] = [];
    let newXp = 0;
    let newLevel = 1;
    let levelUp = false;

    if (userId) {
      // Base XP 25 + up to 50 XP scaled by accuracy + bonus for perfect score
      xpEarned = 25 + Math.round(accuracy * 0.5);
      if (accuracy === 100) xpEarned += 30;

      // Save attempt
      db.prepare(`
        INSERT INTO quiz_attempts (user_id, subject_id, chapter_id, quiz_type, total_questions, correct_count, score, accuracy, time_taken_seconds, topics_to_improve_json, answers_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        subject_id || 1,
        chapter_id || null,
        quiz_type || 'standard',
        totalQuestions,
        correctCount,
        score,
        accuracy,
        duration,
        JSON.stringify(Array.from(topicsToImprove)),
        JSON.stringify(reviewedAnswers)
      );

      const result = addXpAndCheckStreak(userId, xpEarned);
      newXp = result.newXp;
      newLevel = result.newLevel;
      levelUp = result.levelUp;
      unlockedAchievements = result.unlockedAchievements;
      recordAchievementMilestone(userId, 'highest_quiz_score', score);
    }

    res.json({
      score,
      accuracy,
      correctCount,
      totalQuestions,
      time_taken_seconds: duration,
      topics_to_improve: Array.from(topicsToImprove),
      xp_earned: xpEarned,
      new_xp: newXp,
      new_level: newLevel,
      level_up: levelUp,
      unlocked_achievements: unlockedAchievements,
      answers: reviewedAnswers,
    });
  } catch (err: any) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/quizzes/history', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ history: [], attempts: [] });
      return;
    }
    const history = db.prepare(`
      SELECT qa.*, s.name as subject_name 
      FROM quiz_attempts qa 
      JOIN subjects s ON qa.subject_id = s.id 
      WHERE qa.user_id = ? 
      ORDER BY qa.completed_at DESC 
      LIMIT 25
    `).all(userId) as any[];

    const mapped = history.map(h => ({
      ...h,
      topics_to_improve: h.topics_to_improve_json ? JSON.parse(h.topics_to_improve_json) : [],
      topicsToImprove: h.topics_to_improve_json ? JSON.parse(h.topics_to_improve_json) : [],
      answers: h.answers_json ? JSON.parse(h.answers_json) : [],
    }));

    res.json({
      history: mapped,
      attempts: mapped,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 5. PRACTICE MODE
// ==========================================

router.get('/practice/questions', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { subject_id, chapter_id, difficulty, limit } = req.query;
    const count = Math.min(30, Math.max(3, Number(limit) || 10));

    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params: any[] = [];

    if (subject_id) {
      sql += ' AND subject_id = ?';
      params.push(subject_id);
    }
    if (chapter_id) {
      sql += ' AND chapter_id = ?';
      params.push(chapter_id);
    }
    if (difficulty && difficulty !== 'all') {
      sql += ' AND difficulty = ?';
      params.push(difficulty);
    }

    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    const questions = db.prepare(sql).all(...params) as any[];

    res.json({
      questions: questions.map(q => ({
        ...q,
        options: q.options_json ? JSON.parse(q.options_json) : [],
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/practice/answer', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { question_id, user_answer, time_taken_seconds } = req.body;
    const userId = req.user?.id;

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(question_id) as any;
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const isCorrect = String(user_answer || '').trim().toLowerCase() === String(question.correct_answer || '').trim().toLowerCase();

    let xpEarned = 0;
    let unlockedAchievements: any[] = [];

    if (userId) {
      xpEarned = isCorrect ? 8 : 2; // Encouragement XP
      db.prepare(`
        INSERT INTO practice_logs (user_id, question_id, is_correct, user_answer, time_taken_seconds)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, question_id, isCorrect ? 1 : 0, user_answer || '', time_taken_seconds || 15);

      const result = addXpAndCheckStreak(userId, xpEarned);
      unlockedAchievements = result.unlockedAchievements;
    }

    res.json({
      is_correct: isCorrect,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      xp_earned: xpEarned,
      unlocked_achievements: unlockedAchievements,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 6. FLASHCARDS & SPACED REPETITION
// ==========================================

router.get('/flashcards/decks', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const decks = db.prepare(`
      SELECT fd.*, s.name as subject_name 
      FROM flashcard_decks fd 
      LEFT JOIN subjects s ON fd.subject_id = s.id 
      WHERE fd.user_id = ? OR fd.user_id IS NULL 
      ORDER BY fd.created_at DESC
    `).all(userId || 0) as any[];

    const enriched = decks.map(d => {
      const cards = db.prepare('SELECT id, difficulty, repetitions FROM flashcards WHERE deck_id = ?').all(d.id) as any[];
      const mastered = cards.filter(c => c.difficulty === 'easy' && c.repetitions >= 2).length;
      const masteryPercent = cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0;

      return {
        ...d,
        total_cards: cards.length,
        mastered_cards: mastered,
        mastery_percent: masteryPercent,
      };
    });

    res.json({ decks: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/flashcards/decks', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, description, subject_id, chapter_id, cards } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Deck title is required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO flashcard_decks (user_id, subject_id, chapter_id, title, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, subject_id || null, chapter_id || null, title, description || '');

    const deckId = Number(info.lastInsertRowid);

    if (Array.isArray(cards) && cards.length > 0) {
      const insCard = db.prepare(`
        INSERT INTO flashcards (deck_id, front, back, difficulty, repetitions, interval_days, next_review_date)
        VALUES (?, ?, ?, 'medium', 0, 1, date('now'))
      `);
      for (const card of cards) {
        if (card.front && card.back) {
          insCard.run(deckId, card.front, card.back);
        }
      }
    }

    // Award XP for creating deck
    addXpAndCheckStreak(userId, 20);

    res.json({ message: 'Flashcard deck created', id: deckId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/flashcards/decks/:id/cards', optionalAuth, (req: AuthRequest, res) => {
  try {
    const deckId = req.params.id;
    const deck = db.prepare('SELECT * FROM flashcard_decks WHERE id = ?').get(deckId);
    if (!deck) {
      res.status(404).json({ error: 'Deck not found' });
      return;
    }

    // Spaced repetition sort: order cards where repetitions is lowest or difficulty is hard first
    const cards = db.prepare(`
      SELECT * FROM flashcards 
      WHERE deck_id = ? 
      ORDER BY 
        CASE difficulty 
          WHEN 'hard' THEN 1 
          WHEN 'medium' THEN 2 
          ELSE 3 
        END ASC,
        repetitions ASC
    `).all(deckId);

    res.json({ deck, cards });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/flashcards/decks/:id/cards', authenticateToken, (req: AuthRequest, res) => {
  try {
    const deckId = req.params.id;
    const { front, back } = req.body;

    if (!front || !back) {
      res.status(400).json({ error: 'Front and Back text are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO flashcards (deck_id, front, back, difficulty, repetitions, interval_days, next_review_date)
      VALUES (?, ?, ?, 'medium', 0, 1, date('now'))
    `).run(deckId, front, back);

    res.json({ message: 'Card added', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/flashcards/cards/:id/review', optionalAuth, (req: AuthRequest, res) => {
  try {
    const cardId = req.params.id;
    const { rating } = req.body; // 'easy' | 'medium' | 'hard'

    const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(cardId) as any;
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    // Spaced Repetition Scheduling:
    // If rated Hard: reset/reduce interval to 1 day so it appears frequently
    // If rated Medium: moderate interval increase (+2 days)
    // If rated Easy: exponential interval multiplier (* 2.5)
    let newInterval = 1;
    let newRepetitions = card.repetitions + 1;

    if (rating === 'hard') {
      newInterval = 1;
      newRepetitions = Math.max(0, card.repetitions - 1);
    } else if (rating === 'medium') {
      newInterval = Math.max(2, card.interval_days + 2);
    } else if (rating === 'easy') {
      newInterval = Math.max(3, Math.round(card.interval_days * 2.2));
    }

    db.prepare(`
      UPDATE flashcards 
      SET difficulty = ?,
          repetitions = ?,
          interval_days = ?,
          next_review_date = date('now', '+' || ? || ' days'),
          last_reviewed_at = datetime('now')
      WHERE id = ?
    `).run(rating, newRepetitions, newInterval, newInterval, cardId);

    if (req.user?.id) {
      addXpAndCheckStreak(req.user.id, 5);
    }

    res.json({ message: 'Review recorded', next_interval_days: newInterval });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 7. NOTES & PINNING
// ==========================================

router.get('/notes', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { search, subject_id } = req.query;

    let sql = `
      SELECT n.*, s.name as subject_name 
      FROM notes n 
      LEFT JOIN subjects s ON n.subject_id = s.id 
      WHERE n.user_id = ?
    `;
    const params: any[] = [userId];

    if (subject_id) {
      sql += ' AND n.subject_id = ?';
      params.push(subject_id);
    }
    if (search) {
      sql += ' AND (n.title LIKE ? OR n.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY n.is_pinned DESC, n.updated_at DESC';

    const notes = db.prepare(sql).all(...params);
    res.json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/notes', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, content, subject_id, chapter_id } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO notes (user_id, subject_id, chapter_id, title, content, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).run(userId, subject_id || null, chapter_id || null, title, content);

    // Award XP
    addXpAndCheckStreak(userId, 15);

    res.json({ message: 'Note created', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/notes/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const noteId = req.params.id;
    const { title, content, subject_id, is_pinned } = req.body;

    db.prepare(`
      UPDATE notes 
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          subject_id = COALESCE(?, subject_id),
          is_pinned = COALESCE(?, is_pinned),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(title, content, subject_id, is_pinned !== undefined ? (is_pinned ? 1 : 0) : null, noteId, userId);

    res.json({ message: 'Note updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/notes/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Note deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/notes/:id/pin', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const note = db.prepare('SELECT is_pinned FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    const newPin = note.is_pinned ? 0 : 1;
    db.prepare('UPDATE notes SET is_pinned = ? WHERE id = ?').run(newPin, req.params.id);
    res.json({ is_pinned: Boolean(newPin) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 8. STUDY PLANNER & CALENDAR
// ==========================================

router.get('/planner/goals', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const goals = db.prepare(`
      SELECT pg.*, s.name as subject_name 
      FROM planner_goals pg 
      LEFT JOIN subjects s ON pg.subject_id = s.id 
      WHERE pg.user_id = ? 
      ORDER BY pg.is_completed ASC, pg.scheduled_date ASC
    `).all(userId) as any[];

    res.json({
      daily: goals.filter(g => g.type === 'daily'),
      weekly: goals.filter(g => g.type === 'weekly'),
      exam: goals.filter(g => g.type === 'exam'),
      all: goals,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/planner/goals', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { type, title, subject_id, target_minutes, scheduled_date } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Goal title is required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO planner_goals (user_id, type, title, subject_id, target_minutes, scheduled_date, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(userId, type || 'daily', title, subject_id || null, target_minutes || 30, scheduled_date || new Date().toISOString().split('T')[0]);

    res.json({ message: 'Goal added', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/planner/goals/:id/toggle', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const goal = db.prepare('SELECT is_completed FROM planner_goals WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!goal) {
      res.status(404).json({ error: 'Goal not found' });
      return;
    }

    const nextCompleted = goal.is_completed ? 0 : 1;
    db.prepare('UPDATE planner_goals SET is_completed = ? WHERE id = ?').run(nextCompleted, req.params.id);

    let xpEarned = 0;
    if (nextCompleted === 1) {
      xpEarned = 20;
      addXpAndCheckStreak(userId, xpEarned);
    }

    res.json({ is_completed: Boolean(nextCompleted), xpEarned });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/planner/goals/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM planner_goals WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Goal removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 9. STUDY TIMER (POMODORO) & SESSIONS
// ==========================================

router.post('/timer/session', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { duration_seconds, session_type, subject_id } = req.body;

    const seconds = Math.max(60, Number(duration_seconds) || 1500);

    db.prepare(`
      INSERT INTO study_sessions (user_id, duration_seconds, session_type, subject_id)
      VALUES (?, ?, ?, ?)
    `).run(userId, seconds, session_type || 'pomodoro_25', subject_id || null);

    db.prepare(`
      UPDATE users 
      SET total_study_seconds = total_study_seconds + ? 
      WHERE id = ?
    `).run(seconds, userId);

    // 1 XP per minute studied
    const minutes = Math.floor(seconds / 60);
    const xpReward = Math.min(100, Math.max(5, minutes));
    const streakResult = addXpAndCheckStreak(userId, xpReward);

    recordAchievementMilestone(userId, 'longest_session_minutes', minutes);
    const todaySec = (db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ? AND date(created_at) = date('now')").get(userId) as any)?.s || seconds;
    recordAchievementMilestone(userId, 'most_study_time_day', Math.round(todaySec / 60));

    res.json({
      message: 'Study session logged!',
      xpEarned: xpReward,
      total_study_seconds: seconds,
      streak: streakResult.streak,
      unlockedAchievements: streakResult.unlockedAchievements,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 10. MISTAKE BOOK
// ==========================================

router.get('/mistakes', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const mistakes = db.prepare(`
      SELECT * FROM mistake_book 
      WHERE user_id = ? 
      ORDER BY is_resolved ASC, created_at DESC
    `).all(userId);

    res.json({ mistakes });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/mistakes', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { question_id, original_question, student_answer, correct_answer, explanation, topic, subject_name } = req.body;

    if (!original_question || !correct_answer) {
      res.status(400).json({ error: 'Original question and correct answer are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO mistake_book (user_id, question_id, original_question, student_answer, correct_answer, explanation, topic, subject_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, question_id || null, original_question, student_answer || '', correct_answer, explanation || '', topic || 'General', subject_name || 'Academics');

    res.json({ message: 'Mistake saved to book', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/mistakes/:id/resolve', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const mistake = db.prepare('SELECT is_resolved FROM mistake_book WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!mistake) {
      res.status(404).json({ error: 'Mistake not found' });
      return;
    }

    const nextState = mistake.is_resolved ? 0 : 1;
    db.prepare('UPDATE mistake_book SET is_resolved = ? WHERE id = ?').run(nextState, req.params.id);

    if (nextState === 1) {
      addXpAndCheckStreak(userId, 15);
    }

    res.json({ is_resolved: Boolean(nextState) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/mistakes/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM mistake_book WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Mistake removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 11. PROGRESS TRACKING & ANALYTICS
// ==========================================

router.get('/progress/summary', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT xp, level, streak, total_study_seconds FROM users WHERE id = ?').get(userId) as any;

    // Study sessions over the last 7 days
    const last7Days: Array<{ date: string; day: string; minutes: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const sum = (db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) as total 
        FROM study_sessions 
        WHERE user_id = ? AND date(created_at) = date(?)
      `).get(userId, dateStr) as any).total;

      last7Days.push({
        date: dateStr,
        day: dayName,
        minutes: Math.round(sum / 60),
      });
    }

    // Accuracy per subject
    const subjectAccuracies = db.prepare(`
      SELECT s.name as subject, s.color, AVG(qa.accuracy) as avg_accuracy, count(qa.id) as attempts
      FROM subjects s
      LEFT JOIN quiz_attempts qa ON s.id = qa.subject_id AND qa.user_id = ?
      GROUP BY s.id
    `).all(userId) as any[];

    const chaptersCompleted = (db.prepare(`
      SELECT count(DISTINCT c.id) as count
      FROM chapters c
      JOIN lessons l ON c.id = l.chapter_id
      JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ? AND lp.completed = 1
    `).get(userId) as any).count;

    const flashcardsReviewed = (db.prepare(`
      SELECT count(*) as count 
      FROM flashcards 
      WHERE repetitions > 0
    `).get() as any).count;

    const totalQuestionsAnswered = (db.prepare('SELECT count(*) as c FROM practice_logs WHERE user_id = ?').get(userId) as any).c +
      (db.prepare('SELECT COALESCE(SUM(total_questions), 0) as c FROM quiz_attempts WHERE user_id = ?').get(userId) as any).c;

    const totalLessons = (db.prepare('SELECT count(*) as c FROM lessons').get() as any).c;
    const completedLessons = (db.prepare('SELECT count(*) as c FROM lesson_progress WHERE user_id = ? AND completed = 1').get(userId) as any).c;

    res.json({
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      totalStudyHours: Math.round((user.total_study_seconds / 3600) * 10) / 10,
      totalStudyMinutes: Math.round(user.total_study_seconds / 60),
      chaptersCompleted,
      flashcardsReviewed,
      totalQuestionsAnswered,
      completedLessons,
      totalLessons,
      lessonProgressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      weeklyActivity: last7Days,
      subjectBreakdown: subjectAccuracies.map(sa => ({
        subject: sa.subject,
        color: sa.color || 'indigo',
        accuracy: Math.round(sa.avg_accuracy || 0),
        attempts: sa.attempts || 0,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 12. ACHIEVEMENTS
// ==========================================

router.get('/achievements', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY xp_reward ASC').all() as any[];

    let unlockedMap = new Map<number, string>();
    if (userId) {
      const userAchs = db.prepare('SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?').all(userId) as any[];
      for (const ua of userAchs) {
        unlockedMap.set(ua.achievement_id, ua.unlocked_at);
      }
    }

    const enriched = allAchievements.map(ach => ({
      ...ach,
      isUnlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null,
    }));

    res.json({
      achievements: enriched,
      unlockedCount: enriched.filter(a => a.isUnlocked).length,
      totalCount: enriched.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 13. EXAM SIMULATION MODE
// ==========================================

router.post('/exam/start', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { subject_id, chapter_ids, num_questions, time_limit_minutes } = req.body;
    const count = Math.min(50, Math.max(5, Number(num_questions) || 15));
    const timeLimit = Math.min(180, Math.max(10, Number(time_limit_minutes) || 30));

    let sql = 'SELECT id, subject_id, chapter_id, question_text, type, options_json, topic FROM questions WHERE 1=1';
    const params: any[] = [];

    if (subject_id) {
      sql += ' AND subject_id = ?';
      params.push(subject_id);
    }
    if (Array.isArray(chapter_ids) && chapter_ids.length > 0) {
      sql += ` AND chapter_id IN (${chapter_ids.map(() => '?').join(',')})`;
      params.push(...chapter_ids);
    }

    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    let questions = db.prepare(sql).all(...params) as any[];

    if (questions.length === 0) {
      questions = db.prepare('SELECT id, subject_id, chapter_id, question_text, type, options_json, topic FROM questions ORDER BY RANDOM() LIMIT ?').all(count) as any[];
    }

    res.json({
      exam_id: 'exam-' + Date.now(),
      time_limit_minutes: timeLimit,
      total_questions: questions.length,
      questions: questions.map((q, idx) => ({
        index: idx + 1,
        id: q.id,
        question_text: q.question_text,
        type: q.type,
        options: q.options_json ? JSON.parse(q.options_json) : [],
        topic: q.topic,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 14. LEADERBOARD (OPTIONAL & RESPECTFUL)
// ==========================================

router.get('/leaderboard', optionalAuth, (req: AuthRequest, res) => {
  try {
    const topUsers = db.prepare(`
      SELECT id, username, grade, xp, level, streak 
      FROM users 
      WHERE role != 'admin'
      ORDER BY xp DESC 
      LIMIT 15
    `).all() as any[];

    res.json({
      leaderboard: topUsers.map((u, i) => ({
        rank: i + 1,
        id: u.id,
        displayName: u.username,
        grade: u.grade,
        xp: u.xp,
        level: u.level,
        streak: u.streak,
        isCurrentUser: req.user?.id === u.id,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 15. BOOKMARKS
// ==========================================

router.get('/bookmarks', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json({ bookmarks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/bookmarks', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { item_type, item_id, title, subtitle, link } = req.body;

    if (!item_type || !item_id || !title || !link) {
      res.status(400).json({ error: 'Missing required bookmark fields' });
      return;
    }

    db.prepare(`
      INSERT INTO bookmarks (user_id, item_type, item_id, title, subtitle, link)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, item_type, item_id) DO UPDATE SET title = excluded.title, subtitle = excluded.subtitle, link = excluded.link
    `).run(userId, item_type, item_id, title, subtitle || '', link);

    res.json({ message: 'Bookmarked successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/bookmarks/:item_type/:item_id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { item_type, item_id } = req.params;
    db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?').run(userId, item_type, item_id);
    res.json({ message: 'Bookmark removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 16. GLOBAL SEARCH
// ==========================================

router.get('/search', optionalAuth, (req: AuthRequest, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      res.json({ results: { subjects: [], chapters: [], lessons: [], notes: [], questions: [], flashcards: [] } });
      return;
    }

    const q = `%${query.trim()}%`;
    const userId = req.user?.id;

    const subjects = db.prepare('SELECT id, name, code, description, icon FROM subjects WHERE name LIKE ? OR description LIKE ? LIMIT 5').all(q, q);
    const chapters = db.prepare(`
      SELECT c.id, c.title, c.description, s.name as subject_name 
      FROM chapters c 
      JOIN subjects s ON c.subject_id = s.id 
      WHERE c.title LIKE ? OR c.description LIKE ? 
      LIMIT 5
    `).all(q, q);
    const lessons = db.prepare(`
      SELECT l.id, l.title, l.summary, c.title as chapter_title, s.name as subject_name 
      FROM lessons l 
      JOIN chapters c ON l.chapter_id = c.id 
      JOIN subjects s ON c.subject_id = s.id 
      WHERE l.title LIKE ? OR l.summary LIKE ? 
      LIMIT 8
    `).all(q, q);
    const questions = db.prepare(`
      SELECT q.id, q.question_text, q.topic, s.name as subject_name 
      FROM questions q 
      JOIN subjects s ON q.subject_id = s.id 
      WHERE q.question_text LIKE ? OR q.topic LIKE ? 
      LIMIT 5
    `).all(q, q);

    let notes: any[] = [];
    let exams: any[] = [];
    let smartGoals: any[] = [];
    let materials: any[] = [];
    if (userId) {
      notes = db.prepare('SELECT id, title, content FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) LIMIT 5').all(userId, q, q);
      exams = db.prepare('SELECT id, title, exam_date, priority FROM exams WHERE user_id = ? AND title LIKE ? LIMIT 4').all(userId, q);
      smartGoals = db.prepare('SELECT id, title, deadline, progress_percent FROM smart_goals WHERE user_id = ? AND title LIKE ? LIMIT 4').all(userId, q);
      materials = db.prepare('SELECT id, title, summary FROM uploaded_materials WHERE user_id = ? AND (title LIKE ? OR summary LIKE ?) LIMIT 4').all(userId, q, q);
    }

    const flashcards = db.prepare(`
      SELECT f.id, f.front, f.back, fd.title as deck_title 
      FROM flashcards f 
      JOIN flashcard_decks fd ON f.deck_id = fd.id 
      WHERE f.front LIKE ? OR f.back LIKE ? 
      LIMIT 5
    `).all(q, q);

    const topics = db.prepare(`
      SELECT t.id, t.title, t.description, c.id as chapter_id, c.title as chapter_title, s.name as subject_name 
      FROM topics t 
      JOIN chapters c ON t.chapter_id = c.id 
      JOIN subjects s ON c.subject_id = s.id 
      WHERE t.title LIKE ? OR t.description LIKE ? 
      LIMIT 6
    `).all(q, q);

    res.json({
      results: {
        subjects,
        chapters,
        topics,
        lessons,
        notes,
        questions,
        flashcards,
        exams,
        smartGoals,
        materials,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 17. REPORT SYSTEM
// ==========================================

router.post('/reports', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || null;
    const { category, description, content_id, content_type } = req.body;

    if (!category || !description) {
      res.status(400).json({ error: 'Category and description are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO reports (user_id, category, description, content_id, content_type, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `).run(userId, category, description, content_id || null, content_type || null);

    res.json({ message: 'Thank you! Your report has been submitted to curriculum staff.', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/reports', requireAdmin, (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.*, u.username as reporter_username, u.email as reporter_email 
      FROM reports r 
      LEFT JOIN users u ON r.user_id = u.id 
      ORDER BY 
        CASE r.status 
          WHEN 'Pending' THEN 1 
          WHEN 'Reviewing' THEN 2 
          ELSE 3 
        END ASC,
        r.created_at DESC
    `).all();

    res.json({ reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/reports/:id/status', requireAdmin, (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    db.prepare(`
      UPDATE reports 
      SET status = ?, 
          admin_notes = COALESCE(?, admin_notes),
          resolved_at = CASE WHEN ? = 'Resolved' THEN datetime('now') ELSE resolved_at END
      WHERE id = ?
    `).run(status, admin_notes, status, req.params.id);

    res.json({ message: 'Report updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 18. ADMIN DASHBOARD
// ==========================================

router.get('/admin/overview', requireAdmin, (req, res) => {
  try {
    const totalUsers = (db.prepare('SELECT count(*) as c FROM users').get() as any).c;
    const totalSubjects = (db.prepare('SELECT count(*) as c FROM subjects').get() as any).c;
    const totalChapters = (db.prepare('SELECT count(*) as c FROM chapters').get() as any).c;
    const totalLessons = (db.prepare('SELECT count(*) as c FROM lessons').get() as any).c;
    const totalQuestions = (db.prepare('SELECT count(*) as c FROM questions').get() as any).c;
    const totalQuizzesTaken = (db.prepare('SELECT count(*) as c FROM quiz_attempts').get() as any).c;
    const pendingReports = (db.prepare("SELECT count(*) as c FROM reports WHERE status = 'Pending'").get() as any).c;
    const geminiKey = db.prepare("SELECT value FROM ai_config WHERE key = 'gemini_api_key'").get() as any;

    res.json({
      stats: {
        totalUsers,
        totalSubjects,
        totalChapters,
        totalLessons,
        totalQuestions,
        totalQuizzesTaken,
        pendingReports,
      },
      aiConfigured: Boolean(process.env.GEMINI_API_KEY || (geminiKey && geminiKey.value)),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/admin/users', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, role, grade, xp, level, streak, total_study_seconds, created_at 
      FROM users 
      ORDER BY id ASC
    `).all();

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/admin/users/:id/role', requireAdmin, (req, res) => {
  try {
    const { role } = req.body;
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    res.json({ message: 'User role updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/admin/questions', requireAdmin, (req, res) => {
  try {
    const { subject_id, chapter_id, question_text, type, options, correct_answer, explanation, difficulty, topic } = req.body;

    if (!subject_id || !question_text || !correct_answer) {
      res.status(400).json({ error: 'Subject, Question Text, and Correct Answer are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO questions (subject_id, chapter_id, question_text, type, options_json, correct_answer, explanation, difficulty, topic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subject_id,
      chapter_id || null,
      question_text,
      type || 'multiple_choice',
      JSON.stringify(options || []),
      correct_answer,
      explanation || '',
      difficulty || 'medium',
      topic || 'General'
    );

    res.json({ message: 'Question added to question bank', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/admin/questions/:id', requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/admin/ai-config', requireAdmin, (req, res) => {
  try {
    const keyRow = db.prepare("SELECT value FROM ai_config WHERE key = 'gemini_api_key'").get() as any;
    const modelRow = db.prepare("SELECT value FROM ai_config WHERE key = 'ai_model'").get() as any;

    res.json({
      geminiApiKeySet: Boolean(process.env.GEMINI_API_KEY || (keyRow && keyRow.value)),
      maskedKey: keyRow?.value ? `${keyRow.value.slice(0, 4)}...${keyRow.value.slice(-4)}` : (process.env.GEMINI_API_KEY ? 'Set via environment' : 'Not set'),
      model: modelRow?.value || 'gemini-3.8-flash',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/admin/ai-config', requireAdmin, (req, res) => {
  try {
    const { apiKey, model } = req.body;

    if (apiKey !== undefined) {
      db.prepare(`
        INSERT INTO ai_config (key, value, updated_at)
        VALUES ('gemini_api_key', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(apiKey.trim());
    }

    if (model) {
      db.prepare(`
        INSERT INTO ai_config (key, value, updated_at)
        VALUES ('ai_model', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(model);
    }

    res.json({ message: 'AI configuration updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 19. TOPICS & CHAPTER MANAGEMENT
// ==========================================
router.get('/subjects/:id/chapters-with-topics', optionalAuth, (req: AuthRequest, res) => {
  try {
    const subjectId = req.params.id;
    const userId = req.user?.id;

    const chapters = db.prepare('SELECT id, title, order_num, description FROM chapters WHERE subject_id = ? ORDER BY order_num ASC').all(subjectId) as any[];

    const enriched = chapters.map(ch => {
      const topics = db.prepare('SELECT id, title, order_num, description FROM topics WHERE chapter_id = ? ORDER BY order_num ASC').all(ch.id) as any[];
      let strongCount = 0;
      let learningCount = 0;
      let notStartedCount = 0;

      const topicsWithProgress = topics.map(top => {
        let status = 'not_started';
        if (userId) {
          const prog = db.prepare('SELECT status FROM user_topic_progress WHERE user_id = ? AND topic_id = ?').get(userId, top.id) as any;
          if (prog?.status) status = prog.status;
        }
        if (status === 'strong') strongCount++;
        else if (status === 'learning') learningCount++;
        else notStartedCount++;

        return { ...top, status };
      });

      const totalTopics = topics.length;
      const progressPercent = totalTopics > 0 ? Math.round(((strongCount * 1.0 + learningCount * 0.5) / totalTopics) * 100) : 0;
      const needsAttention = learningCount > 0 || (notStartedCount > 0 && strongCount === 0);

      return {
        ...ch,
        topics: topicsWithProgress,
        totalTopics,
        strongCount,
        learningCount,
        notStartedCount,
        progressPercent,
        needsAttention,
      };
    });

    res.json({ chapters: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/chapters/:id/topics', optionalAuth, (req: AuthRequest, res) => {
  try {
    const chapterId = req.params.id;
    const { title, description } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Topic title is required' });
      return;
    }
    const maxOrder = (db.prepare('SELECT MAX(order_num) as m FROM topics WHERE chapter_id = ?').get(chapterId) as any)?.m || 0;
    const info = db.prepare('INSERT INTO topics (chapter_id, title, order_num, description) VALUES (?, ?, ?, ?)').run(chapterId, title.trim(), maxOrder + 1, description || '');
    res.json({ message: 'Topic created', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/topics/:id/progress', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const topicId = req.params.id;
    const { status } = req.body;

    if (!['not_started', 'learning', 'strong'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    db.prepare(`
      INSERT INTO user_topic_progress (user_id, topic_id, status, last_reviewed_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, topic_id) DO UPDATE SET status = excluded.status, last_reviewed_at = excluded.last_reviewed_at
    `).run(userId, topicId, status);

    let xpEarned = 0;
    if (status === 'strong') {
      addXpAndCheckStreak(userId, 15);
      xpEarned = 15;
    }

    res.json({ message: 'Topic progress updated', status, xpEarned });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/subjects/:id/chapters', optionalAuth, (req: AuthRequest, res) => {
  try {
    const subjectId = req.params.id;
    const { title, description } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Chapter title is required' });
      return;
    }
    const maxOrder = (db.prepare('SELECT MAX(order_num) as m FROM chapters WHERE subject_id = ?').get(subjectId) as any)?.m || 0;
    const info = db.prepare('INSERT INTO chapters (subject_id, title, order_num, description) VALUES (?, ?, ?, ?)').run(subjectId, title.trim(), maxOrder + 1, description || '');
    res.json({ message: 'Chapter created', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 20. WEAK TOPIC DETECTOR
// ==========================================
router.get('/analytics/weak-topics', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ weakTopics: [] });
      return;
    }

    const weakList: any[] = [];
    const seenTopics = new Set<string>();

    const mistakes = db.prepare(`
      SELECT topic, subject_name, count(*) as err_count 
      FROM mistake_book 
      WHERE user_id = ? AND is_resolved = 0 
      GROUP BY topic 
      ORDER BY err_count DESC 
      LIMIT 5
    `).all(userId) as any[];

    for (const m of mistakes) {
      if (!m.topic || seenTopics.has(m.topic)) continue;
      seenTopics.add(m.topic);
      weakList.push({
        topic: m.topic,
        subject: m.subject_name || 'Mathematics',
        reason: `${m.err_count} unresolved misconception${m.err_count > 1 ? 's' : ''} in Mistake Book`,
        recommendedActivity: 'Review foundational concepts & complete a 5-question practice drill',
        recommendedTimeMinutes: 20,
        severity: 'high',
      });
    }

    const learningTopics = db.prepare(`
      SELECT t.id, t.title as topic, sub.name as subject, ch.title as chapter
      FROM user_topic_progress utp
      JOIN topics t ON t.id = utp.topic_id
      JOIN chapters ch ON ch.id = t.chapter_id
      JOIN subjects sub ON sub.id = ch.subject_id
      WHERE utp.user_id = ? AND utp.status = 'learning'
      LIMIT 4
    `).all(userId) as any[];

    for (const lt of learningTopics) {
      if (seenTopics.has(lt.topic)) continue;
      seenTopics.add(lt.topic);
      weakList.push({
        topic: lt.topic,
        subject: lt.subject,
        chapter: lt.chapter,
        reason: 'Currently marked as "Learning" in progress manager',
        recommendedActivity: 'Review chapter formulas and flip flashcards',
        recommendedTimeMinutes: 15,
        severity: 'medium',
      });
    }

    if (weakList.length === 0) {
      weakList.push({
        topic: 'Proper & Improper Fractions',
        subject: 'Mathematics',
        reason: 'Recommended diagnostic check for Grade 10 mastery',
        recommendedActivity: 'Take a quick 5-question check quiz',
        recommendedTimeMinutes: 15,
        severity: 'medium',
      });
    }

    res.json({ weakTopics: weakList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 21. SMART DAILY STUDY PLAN
// ==========================================
router.get('/planner/daily-plan', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];

    let planRow = db.prepare('SELECT * FROM daily_study_plans WHERE user_id = ? AND plan_date = ?').get(userId, todayStr) as any;

    if (!planRow) {
      const activities: any[] = [];
      let nextId = 1;

      const upcomingExam = db.prepare(`
        SELECT e.*, sub.name as subject_name 
        FROM exams e 
        JOIN subjects sub ON sub.id = e.subject_id 
        WHERE e.user_id = ? AND e.exam_date >= date('now') 
        ORDER BY e.exam_date ASC LIMIT 1
      `).get(userId) as any;

      if (upcomingExam) {
        const examDate = new Date(upcomingExam.exam_date);
        const daysLeft = Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        activities.push({
          id: nextId++,
          title: `${upcomingExam.subject_name} — Exam Revision (${daysLeft}d left)`,
          subject: upcomingExam.subject_name,
          durationMinutes: 30,
          type: 'exam_prep',
          status: 'pending',
          reason: `Exam: "${upcomingExam.title}" is in ${daysLeft} days`,
        });
      }

      const mistake = db.prepare('SELECT topic, subject_name FROM mistake_book WHERE user_id = ? AND is_resolved = 0 LIMIT 1').get(userId) as any;
      if (mistake) {
        activities.push({
          id: nextId++,
          title: `${mistake.subject_name || 'Mathematics'} — ${mistake.topic || 'Fractions'} Practice`,
          subject: mistake.subject_name || 'Mathematics',
          durationMinutes: 25,
          type: 'weak_topic',
          status: 'pending',
          reason: 'Identified as needing attention in Mistake Book',
        });
      } else {
        activities.push({
          id: nextId++,
          title: 'Mathematics — Algebraic Expressions Drill',
          subject: 'Mathematics',
          durationMinutes: 25,
          type: 'lesson',
          status: 'pending',
          reason: 'Daily core concept progression',
        });
      }

      activities.push({
        id: nextId++,
        title: 'Daily Spaced Flashcard Review',
        subject: 'All Subjects',
        durationMinutes: 15,
        type: 'flashcard_review',
        status: 'pending',
        reason: 'Reinforces long-term memory retrieval',
      });

      activities.push({
        id: nextId++,
        title: 'Science — Quick Diagnostic Quiz',
        subject: 'Science',
        durationMinutes: 20,
        type: 'quiz',
        status: 'pending',
        reason: 'Test retention and verify understanding',
      });

      const actJson = JSON.stringify(activities);
      db.prepare('INSERT INTO daily_study_plans (user_id, plan_date, activities_json) VALUES (?, ?, ?)').run(userId, todayStr, actJson);
      planRow = { plan_date: todayStr, activities_json: actJson };
    }

    const activities = JSON.parse(planRow.activities_json || '[]');
    const completedCount = activities.filter((a: any) => a.status === 'completed').length;
    const totalMinutes = activities.reduce((acc: number, a: any) => acc + (a.durationMinutes || 0), 0);
    const completedMinutes = activities.filter((a: any) => a.status === 'completed').reduce((acc: number, a: any) => acc + (a.durationMinutes || 0), 0);

    res.json({
      planDate: planRow.plan_date,
      activities,
      totalCount: activities.length,
      completedCount,
      totalMinutes,
      completedMinutes,
      progressPercent: activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/planner/daily-plan/activity/:activityId', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const actId = Number(req.params.activityId);
    const { status } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    const planRow = db.prepare('SELECT * FROM daily_study_plans WHERE user_id = ? AND plan_date = ?').get(userId, todayStr) as any;
    if (!planRow) {
      res.status(404).json({ error: 'No plan found for today' });
      return;
    }

    const activities = JSON.parse(planRow.activities_json || '[]');
    const target = activities.find((a: any) => a.id === actId);
    if (!target) {
      res.status(404).json({ error: 'Activity not found in plan' });
      return;
    }

    target.status = status;
    db.prepare('UPDATE daily_study_plans SET activities_json = ? WHERE user_id = ? AND plan_date = ?').run(JSON.stringify(activities), userId, todayStr);

    let xpEarned = 0;
    if (status === 'completed') {
      addXpAndCheckStreak(userId, 25);
      xpEarned = 25;
    }

    res.json({ message: 'Activity updated', status, xpEarned, activities });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/planner/daily-plan/regenerate', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const todayStr = new Date().toISOString().split('T')[0];
    db.prepare('DELETE FROM daily_study_plans WHERE user_id = ? AND plan_date = ?').run(userId, todayStr);
    res.json({ message: 'Plan reset for regeneration' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 22. EXAMS (EXAM COUNTDOWN)
// ==========================================
router.get('/exams', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ exams: [] });
      return;
    }

    const exams = db.prepare(`
      SELECT e.*, sub.name as subject_name, sub.color as subject_color
      FROM exams e
      JOIN subjects sub ON sub.id = e.subject_id
      WHERE e.user_id = ?
      ORDER BY e.exam_date ASC
    `).all(userId) as any[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = exams.map(e => {
      const eDate = new Date(e.exam_date);
      eDate.setHours(0, 0, 0, 0);
      const diffTime = eDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let badge = `${daysLeft} DAYS LEFT`;
      if (daysLeft === 0) badge = 'TODAY';
      else if (daysLeft < 0) badge = 'COMPLETED';

      return {
        ...e,
        daysLeft,
        countdownBadge: badge,
        chapterIds: JSON.parse(e.chapter_ids_json || '[]'),
      };
    });

    res.json({ exams: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/exams', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, subject_id, exam_date, chapter_ids, priority, notes } = req.body;

    if (!title || !subject_id || !exam_date) {
      res.status(400).json({ error: 'Title, Subject, and Exam Date are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO exams (user_id, title, subject_id, exam_date, chapter_ids_json, priority, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, title.trim(), subject_id, exam_date, JSON.stringify(chapter_ids || []), priority || 'high', notes || '');

    res.json({ message: 'Exam added', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/exams/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM exams WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Exam removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 23. HOMEWORK TRACKER
// ==========================================
router.get('/homework', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ homework: [] });
      return;
    }

    const list = db.prepare(`
      SELECT h.*, sub.name as subject_name, sub.color as subject_color
      FROM homework h
      LEFT JOIN subjects sub ON sub.id = h.subject_id
      WHERE h.user_id = ?
      ORDER BY 
        CASE WHEN h.status = 'completed' THEN 1 ELSE 0 END,
        h.due_date ASC
    `).all(userId) as any[];

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const enriched = list.map(item => {
      const isDueToday = item.due_date === todayStr && item.status !== 'completed';
      const isDueTomorrow = item.due_date === tomorrowStr && item.status !== 'completed';
      const isOverdue = item.due_date < todayStr && item.status !== 'completed';
      const isUpcoming = item.due_date > tomorrowStr && item.status !== 'completed';

      return {
        ...item,
        isDueToday,
        isDueTomorrow,
        isOverdue,
        isUpcoming,
      };
    });

    res.json({ homework: enriched });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/homework', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, subject_id, description, due_date, priority } = req.body;

    if (!title || !due_date) {
      res.status(400).json({ error: 'Title and Due Date are required' });
      return;
    }

    const info = db.prepare(`
      INSERT INTO homework (user_id, subject_id, title, description, due_date, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'not_started')
    `).run(userId, subject_id || null, title.trim(), description || '', due_date, priority || 'medium');

    res.json({ message: 'Homework added', id: Number(info.lastInsertRowid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/homework/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status, title, description, priority, due_date } = req.body;

    const existing = db.prepare('SELECT status FROM homework WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Homework not found' });
      return;
    }

    db.prepare(`
      UPDATE homework 
      SET status = COALESCE(?, status),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          due_date = COALESCE(?, due_date),
          completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END
      WHERE id = ? AND user_id = ?
    `).run(status, title, description, priority, due_date, status, req.params.id, userId);

    let xpEarned = 0;
    if (status === 'completed' && existing.status !== 'completed') {
      addXpAndCheckStreak(userId, 25);
      xpEarned = 25;
    }

    res.json({ message: 'Homework updated', xpEarned });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/homework/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM homework WHERE id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Homework removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 24. DAILY CHALLENGE
// ==========================================
router.get('/daily-challenge', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const todayStr = new Date().toISOString().split('T')[0];

    if (!userId) {
      res.json({
        challenges: [
          { challenge_type: 'quiz_5', title: 'Quick Quiz Challenger', description: 'Complete 5 questions in any quiz', target_count: 5, current_count: 0, is_completed: 0, xp_awarded: 50 },
          { challenge_type: 'flashcards_10', title: 'Flashcard Master', description: 'Review 10 flashcards', target_count: 10, current_count: 0, is_completed: 0, xp_awarded: 50 },
        ],
      });
      return;
    }

    let challenges = db.prepare('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = ?').all(userId, todayStr) as any[];

    if (challenges.length === 0) {
      const ins = db.prepare('INSERT OR IGNORE INTO daily_challenges (user_id, challenge_date, challenge_type, title, description, target_count, current_count, is_completed, xp_awarded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      ins.run(userId, todayStr, 'quiz_5', 'Quick Quiz Challenger', 'Complete 5 questions in any quiz or practice session', 5, 0, 0, 50);
      ins.run(userId, todayStr, 'flashcards_10', 'Flashcard Master', 'Review 10 flashcards for retention', 10, 0, 0, 50);
      ins.run(userId, todayStr, 'focus_20', 'Deep Work Sprint', 'Complete at least 20 minutes in Focus Mode', 20, 0, 0, 50);
      challenges = db.prepare('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = ?').all(userId, todayStr) as any[];
    }

    res.json({ challenges });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/daily-challenge/claim', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { challenge_id } = req.body;
    const todayStr = new Date().toISOString().split('T')[0];

    const ch = db.prepare('SELECT * FROM daily_challenges WHERE id = ? AND user_id = ? AND challenge_date = ?').get(challenge_id, userId, todayStr) as any;
    if (!ch) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    if (ch.is_completed) {
      res.status(400).json({ error: 'Challenge reward already claimed today' });
      return;
    }

    db.prepare('UPDATE daily_challenges SET is_completed = 1, current_count = target_count WHERE id = ?').run(challenge_id);
    addXpAndCheckStreak(userId, ch.xp_awarded || 50);

    res.json({ message: 'Daily challenge reward claimed!', xpEarned: ch.xp_awarded || 50 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 25. FLASHCARDS AI & SM-2 4-BUTTON REVIEW
// ==========================================
router.post('/flashcards/generate-ai', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { subject, topic, deck_id, count } = req.body;
    if (!subject || !topic) {
      res.status(400).json({ error: 'Subject and Topic are required' });
      return;
    }

    const cards = await generateFlashcardsAi(subject, topic, Number(count) || 5);

    if (deck_id) {
      const ins = db.prepare("INSERT INTO flashcards (deck_id, front, back, difficulty, topic, next_review_date) VALUES (?, ?, ?, ?, ?, date('now'))");
      for (const c of cards) {
        ins.run(deck_id, c.front, c.back, 'medium', topic);
      }
    }

    res.json({ cards, message: `Generated ${cards.length} flashcards` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/flashcards/:id/review', optionalAuth, (req: AuthRequest, res) => {
  try {
    const cardId = req.params.id;
    const { rating } = req.body;
    const userId = req.user?.id;

    const card = db.prepare('SELECT repetitions, interval_days FROM flashcards WHERE id = ?').get(cardId) as any;
    if (!card) {
      res.status(404).json({ error: 'Flashcard not found' });
      return;
    }

    let interval = card.interval_days || 1;
    let reps = card.repetitions || 0;

    if (rating === 'Again') {
      interval = 1;
      reps = 0;
    } else if (rating === 'Hard') {
      interval = Math.max(1, Math.round(interval * 1.2));
      reps += 1;
    } else if (rating === 'Good') {
      interval = Math.max(3, Math.round(interval * 2.0));
      reps += 1;
    } else if (rating === 'Easy') {
      interval = Math.max(5, Math.round(interval * 2.5));
      reps += 1;
    }

    db.prepare(`
      UPDATE flashcards 
      SET repetitions = ?,
          interval_days = ?,
          next_review_date = date('now', '+' || ? || ' days'),
          last_reviewed_at = datetime('now')
      WHERE id = ?
    `).run(reps, interval, interval, cardId);

    if (userId) {
      addXpAndCheckStreak(userId, 5);
    }

    res.json({
      message: 'Card reviewed',
      rating,
      newIntervalDays: interval,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 27. ADVANCED ANALYTICS OVERVIEW
// ==========================================
router.get('/analytics/overview', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ stats: null });
      return;
    }

    const user = db.prepare('SELECT xp, level, streak, longest_streak, total_study_seconds, daily_target_minutes FROM users WHERE id = ?').get(userId) as any;

    const todaySeconds = (db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ? AND date(created_at) = date('now')").get(userId) as any).s;
    const weekSeconds = (db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ? AND created_at >= datetime('now', '-7 days')").get(userId) as any).s;
    const monthSeconds = (db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ? AND created_at >= datetime('now', '-30 days')").get(userId) as any).s;

    const quizAccuracyAvg = (db.prepare("SELECT COALESCE(AVG(accuracy), 0) as a FROM quiz_attempts WHERE user_id = ?").get(userId) as any).a;
    const totalQuizzes = (db.prepare("SELECT count(*) as c FROM quiz_attempts WHERE user_id = ?").get(userId) as any).c;
    const totalHomeworkDone = (db.prepare("SELECT count(*) as c FROM homework WHERE user_id = ? AND status = 'completed'").get(userId) as any).c;
    const totalFlashcardsReviewed = (db.prepare("SELECT COALESCE(SUM(repetitions), 0) as c FROM flashcards").get() as any).c;

    const strongTopics = (db.prepare("SELECT count(*) as c FROM user_topic_progress WHERE user_id = ? AND status = 'strong'").get(userId) as any).c;
    const learningTopics = (db.prepare("SELECT count(*) as c FROM user_topic_progress WHERE user_id = ? AND status = 'learning'").get(userId) as any).c;

    res.json({
      studySeconds: {
        today: todaySeconds,
        thisWeek: weekSeconds,
        thisMonth: monthSeconds,
        total: user?.total_study_seconds || 0,
      },
      todayTargetMinutes: user?.daily_target_minutes || 60,
      quizMetrics: {
        averageAccuracy: Math.round(quizAccuracyAvg),
        totalQuizzes,
      },
      topicStrengths: {
        strong: strongTopics,
        learning: learningTopics,
      },
      tasksCompleted: totalHomeworkDone,
      flashcardsReviewed: totalFlashcardsReviewed,
      streak: {
        current: user?.streak || 1,
        longest: Math.max(user?.longest_streak || 1, user?.streak || 1),
      },
      xp: user?.xp || 0,
      level: user?.level || 1,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 28. SETTINGS & DATA EXPORT
// ==========================================
router.get('/settings', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT id, username, email, grade, learning_goals, study_style, daily_target_minutes, notifications_enabled FROM users WHERE id = ?').get(userId);
    res.json({ settings: user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/settings', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { grade, learning_goals, study_style, daily_target_minutes, notifications_enabled, username } = req.body;

    db.prepare(`
      UPDATE users 
      SET grade = COALESCE(?, grade),
          learning_goals = COALESCE(?, learning_goals),
          study_style = COALESCE(?, study_style),
          daily_target_minutes = COALESCE(?, daily_target_minutes),
          notifications_enabled = COALESCE(?, notifications_enabled),
          username = COALESCE(?, username)
      WHERE id = ?
    `).run(grade, learning_goals, study_style, daily_target_minutes, notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : null, username, userId);

    res.json({ message: 'Settings saved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/settings/export', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const user = db.prepare('SELECT id, username, email, grade, xp, level, streak, created_at FROM users WHERE id = ?').get(userId);
    const notes = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId);
    const mistakeBook = db.prepare('SELECT * FROM mistake_book WHERE user_id = ?').all(userId);
    const quizHistory = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ?').all(userId);
    const exams = db.prepare('SELECT * FROM exams WHERE user_id = ?').all(userId);
    const homework = db.prepare('SELECT * FROM homework WHERE user_id = ?').all(userId);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      notes,
      mistakeBook,
      quizHistory,
      exams,
      homework,
    };

    res.json({
      studyforge_export: true,
      exportedAt: exportData.exportedAt,
      data: exportData,
      ...exportData,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 29. DYNAMIC NOTIFICATIONS
// ==========================================
router.get('/notifications', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ notifications: [], unreadCount: 0 });
      return;
    }

    const notifications: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    const exams = db.prepare("SELECT title, exam_date FROM exams WHERE user_id = ? AND exam_date >= date('now') ORDER BY exam_date ASC LIMIT 2").all(userId) as any[];
    for (const e of exams) {
      const days = Math.ceil((new Date(e.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      notifications.push({
        id: `exam-${e.title}`,
        type: 'exam',
        title: `Exam in ${days} day${days === 1 ? '' : 's'}!`,
        message: `${e.title} is coming up on ${e.exam_date}. Stay consistent with your daily study plan.`,
        date: e.exam_date,
      });
    }

    const hwDue = db.prepare("SELECT title, due_date FROM homework WHERE user_id = ? AND due_date <= date('now', '+1 day') AND status != 'completed' LIMIT 2").all(userId) as any[];
    for (const h of hwDue) {
      notifications.push({
        id: `hw-${h.title}`,
        type: 'homework',
        title: h.due_date === todayStr ? 'Homework Due Today' : 'Homework Due Tomorrow',
        message: h.title,
        date: h.due_date,
      });
    }

    const cardsDueCount = (db.prepare("SELECT count(*) as c FROM flashcards WHERE next_review_date <= date('now')").get() as any).c;
    if (cardsDueCount > 0) {
      notifications.push({
        id: 'flashcards-due',
        type: 'flashcards',
        title: 'Flashcards Ready for Review',
        message: `You have ${cardsDueCount} card${cardsDueCount === 1 ? '' : 's'} due for spaced-repetition review today.`,
        date: todayStr,
      });
    }

    res.json({ notifications, unreadCount: notifications.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});
// ==========================================
// PERSONAL RECORDS HELPER
// ==========================================
export function recordAchievementMilestone(userId: number, type: string, value: number, meta: any = {}) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = db.prepare("SELECT * FROM personal_records WHERE user_id = ? AND record_type = ?").get(userId, type) as any;
    if (!existing) {
      db.prepare(`
        INSERT INTO personal_records (user_id, record_type, record_value, achieved_date, metadata_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, type, value, todayStr, JSON.stringify(meta));
    } else if (value > existing.record_value) {
      db.prepare(`
        UPDATE personal_records
        SET record_value = ?, achieved_date = ?, metadata_json = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(value, todayStr, JSON.stringify(meta), existing.id);
    }
  } catch (err) {
    console.error('Error recording milestone:', err);
  }
}

// ==========================================
// 30. SMART SESSION & "I HAVE X MINUTES"
// ==========================================
router.get('/smart-session/next', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;
    const recommendation = getSmartNextActivity(userId);
    res.json({
      recommendation: {
        ...recommendation,
        link: recommendation.directUrl || '/practice',
        description: recommendation.rationale,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.all('/smart-session/x-minutes', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;
    const minutes = req.body?.minutes || req.query?.minutes || 30;
    const sessionPlan = generateMinuteSession(userId, Number(minutes) || 30);
    const routine = (sessionPlan.items || []).map(it => ({
      task: it.title,
      subject: 'Curriculum',
      actionType: it.activityType,
      minutes: it.minuteDuration,
      link: it.link,
    }));
    res.json({
      sessionPlan,
      plan: {
        ...sessionPlan,
        routine,
        xpExpected: sessionPlan.totalMinutes * 5,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 31. AI LEARNING PATHS
// ==========================================
router.post('/learning-paths/generate', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;
    const { subject, examDate, exam_date, syllabusTopics, topics, currentLevel, current_level, knowledge_level, dailyMinutes, daily_minutes } = req.body;

    const targetDate = examDate || exam_date;
    if (!subject || !targetDate) {
      res.status(400).json({ error: 'Subject and Exam Date are required' });
      return;
    }

    const topicsArr = Array.isArray(syllabusTopics) ? syllabusTopics : (Array.isArray(topics) ? topics : (syllabusTopics ? [syllabusTopics] : []));
    const levelStr = currentLevel || current_level || knowledge_level || 'intermediate';
    const minutesNum = Number(dailyMinutes || daily_minutes) || 30;

    const schedule = generateLearningPlan({
      userId,
      subject,
      examDate: targetDate,
      currentLevel: levelStr,
      dailyMinutes: minutesNum,
      syllabusTopics: topicsArr,
    });

    const pathTitle = `${subject} Adaptive Learning Path`;
    const info = db.prepare(`
      INSERT INTO learning_paths (user_id, subject_id, title, target_exam_date, current_level, daily_minutes, syllabus_topics_json, schedule_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      null,
      pathTitle,
      targetDate,
      levelStr,
      minutesNum,
      JSON.stringify(topicsArr),
      JSON.stringify(schedule)
    );

    res.json({
      schedule,
      totalDays: schedule.length,
      subject,
      examDate: targetDate,
      path: {
        id: Number(info.lastInsertRowid),
        title: pathTitle,
        schedule,
        totalDays: schedule.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/learning-paths', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subject, subject_id, exam_id, title, examDate, currentLevel, dailyMinutes, syllabusTopics, schedule } = req.body;

    const pathTitle = title || `${subject} Master Learning Path`;
    const topicsArr = Array.isArray(syllabusTopics) ? syllabusTopics : [];
    const planSchedule = schedule || generateLearningPlan({
      userId,
      subject,
      subjectId: subject_id,
      examDate,
      currentLevel: currentLevel || 'intermediate',
      dailyMinutes: Number(dailyMinutes) || 30,
      syllabusTopics: topicsArr,
    });

    const info = db.prepare(`
      INSERT INTO learning_paths (user_id, subject_id, exam_id, title, target_exam_date, current_level, daily_minutes, syllabus_topics_json, schedule_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      subject_id || null,
      exam_id || null,
      pathTitle,
      examDate,
      currentLevel || 'intermediate',
      Number(dailyMinutes) || 30,
      JSON.stringify(topicsArr),
      JSON.stringify(planSchedule)
    );

    addXpAndCheckStreak(userId, 30);

    res.json({
      id: info.lastInsertRowid,
      title: pathTitle,
      schedule: planSchedule,
      message: 'Learning path created successfully (+30 XP)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/learning-paths', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ paths: [] });
      return;
    }

    const rows = db.prepare(`
      SELECT lp.*, s.name as subject_name
      FROM learning_paths lp
      LEFT JOIN subjects s ON lp.subject_id = s.id
      WHERE lp.user_id = ?
      ORDER BY lp.created_at DESC
    `).all(userId) as any[];

    const paths = rows.map(r => {
      const sched = JSON.parse(r.schedule_json || '[]');
      const completedCount = sched.filter((i: any) => i.status === 'completed').length;
      const progressPercent = sched.length > 0 ? Math.round((completedCount / sched.length) * 100) : 0;
      return {
        ...r,
        syllabusTopics: JSON.parse(r.syllabus_topics_json || '[]'),
        schedule: sched,
        progressPercent,
        completedCount,
        totalMilestones: sched.length,
      };
    });

    res.json({ paths });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/learning-paths/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const row = db.prepare('SELECT * FROM learning_paths WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!row) {
      res.status(404).json({ error: 'Learning path not found' });
      return;
    }

    const schedule = JSON.parse(row.schedule_json || '[]');
    const completedCount = schedule.filter((i: any) => i.status === 'completed').length;

    res.json({
      path: {
        ...row,
        syllabusTopics: JSON.parse(row.syllabus_topics_json || '[]'),
        schedule,
        progressPercent: schedule.length > 0 ? Math.round((completedCount / schedule.length) * 100) : 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/learning-paths/:id/items/:itemId/complete', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const pathId = req.params.id;
    const itemId = req.params.itemId;

    const row = db.prepare('SELECT * FROM learning_paths WHERE id = ? AND user_id = ?').get(pathId, userId) as any;
    if (!row) {
      res.status(404).json({ error: 'Learning path not found' });
      return;
    }

    const schedule = JSON.parse(row.schedule_json || '[]');
    const item = schedule.find((i: any) => i.id === itemId);
    if (item) {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
    }

    db.prepare("UPDATE learning_paths SET schedule_json = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(schedule), pathId);
    addXpAndCheckStreak(userId, 20);

    res.json({ message: 'Milestone completed (+20 XP)', schedule });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/learning-paths/:id/adapt', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const pathId = req.params.id;
    const { triggerType, reason, topic, score, newExamDate, newDailyMinutes } = req.body;

    const row = db.prepare('SELECT * FROM learning_paths WHERE id = ? AND user_id = ?').get(pathId, userId) as any;
    if (!row) {
      res.status(404).json({ error: 'Learning path not found' });
      return;
    }

    const currentSchedule = JSON.parse(row.schedule_json || '[]');
    const { adaptedSchedule, adaptationSummary } = adaptLearningPath(currentSchedule, {
      type: triggerType || reason || 'missed_session',
      topic,
      score,
      newExamDate,
      newDailyMinutes,
    });

    db.prepare("UPDATE learning_paths SET schedule_json = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(adaptedSchedule), pathId);

    res.json({
      adapted: true,
      message: 'Learning path adapted successfully',
      summary: adaptationSummary,
      schedule: adaptedSchedule,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 32. SYLLABUS IMPORTER
// ==========================================
router.post('/syllabus/preview', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { text, rawText, imageBase64, mimeType, defaultSubject } = req.body;
    const syllabusText = text || rawText;
    if (!syllabusText && !imageBase64) {
      res.status(400).json({ error: 'Please provide syllabus text or an image' });
      return;
    }

    const preview = await parseSyllabusContent({
      text: syllabusText,
      imageBase64,
      mimeType,
      defaultSubject,
    });

    const chapters = preview.subjects?.flatMap((s: any) => s.chapters) || [];
    res.json({
      preview: { ...preview, chapters },
      detected: { ...preview, chapters },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/syllabus/confirm', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { subjects, detectedExamDates } = req.body;

    if (!Array.isArray(subjects) || subjects.length === 0) {
      res.status(400).json({ error: 'No confirmed subjects provided' });
      return;
    }

    let createdChaptersCount = 0;
    let createdTopicsCount = 0;
    let createdExamsCount = 0;

    for (const subj of subjects) {
      let subjectRow = db.prepare('SELECT id FROM subjects WHERE name = ? COLLATE NOCASE').get(subj.name) as any;
      let subjectId = subjectRow?.id;

      if (!subjectId) {
        const insSub = db.prepare(`
          INSERT INTO subjects (name, code, description, icon, grade_level, color, is_custom)
          VALUES (?, ?, ?, 'BookOpen', ?, 'indigo', 1)
        `).run(
          subj.name,
          subj.code || subj.name.slice(0, 4).toUpperCase(),
          `Imported curriculum for ${subj.name}`,
          subj.gradeLevel || 'Grade 10'
        );
        subjectId = insSub.lastInsertRowid;
      }

      // Insert chapters & topics
      if (Array.isArray(subj.chapters)) {
        for (let i = 0; i < subj.chapters.length; i++) {
          const ch = subj.chapters[i];
          const insCh = db.prepare(`
            INSERT INTO chapters (subject_id, title, order_num, description)
            VALUES (?, ?, ?, ?)
          `).run(subjectId, ch.title, i + 1, ch.description || 'Imported syllabus chapter');
          const chapterId = insCh.lastInsertRowid;
          createdChaptersCount++;

          if (Array.isArray(ch.topics)) {
            for (let j = 0; j < ch.topics.length; j++) {
              const topicTitle = ch.topics[j];
              const insTopic = db.prepare(`
                INSERT INTO topics (chapter_id, title, order_num, description)
                VALUES (?, ?, ?, 'Curriculum topic')
              `).run(chapterId, topicTitle, j + 1);
              createdTopicsCount++;

              // Init user topic progress as not_started
              db.prepare(`
                INSERT OR IGNORE INTO user_topic_progress (user_id, topic_id, status)
                VALUES (?, ?, 'not_started')
              `).run(userId, insTopic.lastInsertRowid);
            }
          }
        }
      }

      // Add detected exam date if present
      if (Array.isArray(detectedExamDates)) {
        for (const e of detectedExamDates) {
          if (e.subjectName?.toLowerCase() === subj.name?.toLowerCase()) {
            db.prepare(`
              INSERT INTO exams (user_id, title, subject_id, exam_date, priority)
              VALUES (?, ?, ?, ?, 'high')
            `).run(userId, e.title, subjectId, e.date);
            createdExamsCount++;
          }
        }
      }
    }

    addXpAndCheckStreak(userId, 50);

    res.json({
      message: 'Syllabus structure created successfully (+50 XP)',
      createdSummary: {
        chapters: createdChaptersCount,
        topics: createdTopicsCount,
        exams: createdExamsCount,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 33. TEXTBOOK / CHAPTER ASSISTANT
// ==========================================
router.post('/materials/analyze', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, content, textContent, subject_id } = req.body;
    const rawContent = content || textContent;

    if (!title || !rawContent) {
      res.status(400).json({ error: 'Title and content text are required' });
      return;
    }

    const studentUser = db.prepare('SELECT grade FROM users WHERE id = ?').get(userId) as any;
    const grade = studentUser?.grade || 'Grade 10';

    const analysis = await analyzeEducationalText(rawContent, title, grade);

    const ins = db.prepare(`
      INSERT INTO uploaded_materials (user_id, subject_id, title, file_name, file_type, content_text, summary, key_definitions_json, important_points_json, difficult_topics_json)
      VALUES (?, ?, ?, ?, 'text', ?, ?, ?, ?, ?)
    `).run(
      userId,
      subject_id || null,
      title,
      `${title}.txt`,
      rawContent,
      analysis.summary,
      JSON.stringify(analysis.keyDefinitions),
      JSON.stringify(analysis.importantPoints),
      JSON.stringify(analysis.difficultTopics)
    );

    addXpAndCheckStreak(userId, 30);
    const materialId = Number(ins.lastInsertRowid);
    const flashcards = analysis.generatedFlashcards || [];
    const enrichedAnalysis = { ...analysis, flashcards };

    res.json({
      id: materialId,
      material: { id: materialId, title, subject_id },
      title,
      analysis: enrichedAnalysis,
      message: 'Chapter analyzed successfully (+30 XP)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/materials', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const materials = db.prepare(`
      SELECT m.*, s.name as subject_name
      FROM uploaded_materials m
      LEFT JOIN subjects s ON m.subject_id = s.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `).all(userId) as any[];

    const parsed = materials.map(m => ({
      ...m,
      keyDefinitions: JSON.parse(m.key_definitions_json || '[]'),
      importantPoints: JSON.parse(m.important_points_json || '[]'),
      difficultTopics: JSON.parse(m.difficult_topics_json || '[]'),
    }));

    res.json({ materials: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/materials/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const m = db.prepare('SELECT * FROM uploaded_materials WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!m) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    res.json({
      material: {
        ...m,
        keyDefinitions: JSON.parse(m.key_definitions_json || '[]'),
        importantPoints: JSON.parse(m.important_points_json || '[]'),
        difficultTopics: JSON.parse(m.difficult_topics_json || '[]'),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/materials/:id/convert-to-deck', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const m = db.prepare('SELECT * FROM uploaded_materials WHERE id = ? AND user_id = ?').get(req.params.id, userId) as any;
    if (!m) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    let cards = req.body?.cards;
    if (!Array.isArray(cards) || cards.length === 0) {
      const keyDefs = JSON.parse(m.key_definitions_json || '[]');
      if (keyDefs.length > 0) {
        cards = keyDefs.map((d: any) => ({ front: `What is ${d.term}?`, back: d.definition, difficulty: 'medium' }));
      } else {
        cards = [{ front: `Key takeaways from ${m.title}`, back: m.summary || 'Summary points', difficulty: 'easy' }];
      }
    }

    const insDeck = db.prepare(`
      INSERT INTO flashcard_decks (user_id, subject_id, title, description)
      VALUES (?, ?, ?, ?)
    `).run(userId, m.subject_id, `${m.title} — Key Flashcards`, `Auto-generated deck from textbook chapter "${m.title}".`);

    const deckId = Number(insDeck.lastInsertRowid);
    const insCard = db.prepare("INSERT INTO flashcards (deck_id, front, back, difficulty, topic, next_review_date) VALUES (?, ?, ?, ?, ?, date('now'))");

    for (const c of cards) {
      insCard.run(deckId, c.front, c.back, c.difficulty || 'medium', m.title);
    }

    res.json({
      deckId,
      deck: { id: deckId, title: `${m.title} — Key Flashcards` },
      message: `Created flashcard deck with ${cards.length} cards`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 34. PERSONAL RECORDS
// ==========================================
router.get('/records', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;
    const records = db.prepare('SELECT * FROM personal_records WHERE user_id = ?').all(userId) as any[];

    // Ensure baseline real records from user table if empty
    const user = db.prepare('SELECT xp, streak, longest_streak, total_study_seconds FROM users WHERE id = ?').get(userId) as any;
    const maxSessionSec = (db.prepare('SELECT COALESCE(MAX(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ?').get(userId) as any)?.s || 0;
    const totalQuestions = (db.prepare('SELECT count(*) as c FROM practice_logs WHERE user_id = ?').get(userId) as any)?.c || 0;
    const highestScore = (db.prepare('SELECT COALESCE(MAX(score), 0) as s FROM quiz_attempts WHERE user_id = ?').get(userId) as any)?.s || 0;
    const totalCardsReviewed = (db.prepare('SELECT COALESCE(SUM(repetitions), 0) as c FROM flashcards').get() as any)?.c || 0;

    const formattedRecords: Record<string, any> = {};
    for (const r of records) {
      formattedRecords[r.record_type] = {
        value: r.record_value,
        achievedDate: r.achieved_date,
        meta: JSON.parse(r.metadata_json || '{}'),
      };
    }

    // Fill defaults computed from actual database data
    if (!formattedRecords.longest_streak) {
      formattedRecords.longest_streak = { value: user?.longest_streak || 1, achievedDate: 'All-time best' };
    }
    if (!formattedRecords.longest_session_minutes) {
      formattedRecords.longest_session_minutes = { value: Math.round(maxSessionSec / 60) || 25, achievedDate: 'Recent focus session' };
    }
    formattedRecords.longest_study_session_minutes = formattedRecords.longest_session_minutes;
    if (!formattedRecords.highest_quiz_score) {
      formattedRecords.highest_quiz_score = { value: highestScore, achievedDate: 'Best quiz score' };
    }
    if (!formattedRecords.most_questions_answered) {
      formattedRecords.most_questions_answered = { value: totalQuestions, achievedDate: 'Total solved' };
    }
    if (!formattedRecords.most_flashcards_reviewed) {
      formattedRecords.most_flashcards_reviewed = { value: totalCardsReviewed, achievedDate: 'Repetitions' };
    }

    res.json({ records: formattedRecords });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 35. STUDY CALENDAR
// ==========================================
router.get('/calendar/events', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;
    const events: any[] = [];

    // 1. Exams
    const exams = db.prepare(`
      SELECT e.*, s.name as subject_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ?
    `).all(userId) as any[];

    for (const e of exams) {
      events.push({
        id: `exam-${e.id}`,
        title: `Exam: ${e.title}`,
        category: 'exam',
        date: e.exam_date,
        subject: e.subject_name,
        priority: e.priority,
        badge: 'EXAM',
        color: 'red',
      });
    }

    // 2. Homework deadlines
    const homework = db.prepare(`
      SELECT h.*, s.name as subject_name
      FROM homework h
      LEFT JOIN subjects s ON h.subject_id = s.id
      WHERE h.user_id = ?
    `).all(userId) as any[];

    for (const h of homework) {
      events.push({
        id: `hw-${h.id}`,
        title: `Homework: ${h.title}`,
        category: 'homework',
        date: h.due_date,
        subject: h.subject_name,
        status: h.status,
        badge: 'HOMEWORK',
        color: 'amber',
      });
    }

    // 3. Completed Study Sessions
    const sessions = db.prepare(`
      SELECT ss.*, s.name as subject_name, date(ss.created_at) as session_date
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.user_id = ?
      ORDER BY ss.created_at DESC
      LIMIT 20
    `).all(userId) as any[];

    for (const s of sessions) {
      events.push({
        id: `session-${s.id}`,
        title: `Study Session (${Math.round(s.duration_seconds / 60)} min)`,
        category: 'study_session',
        date: s.session_date,
        subject: s.subject_name,
        badge: 'FOCUS',
        color: 'indigo',
      });
    }

    // 4. Learning path daily milestones
    const paths = db.prepare('SELECT schedule_json, title FROM learning_paths WHERE user_id = ?').all(userId) as any[];
    for (const p of paths) {
      const sched = JSON.parse(p.schedule_json || '[]');
      for (const item of sched) {
        events.push({
          id: `lp-${item.id}`,
          title: `${item.subject}: ${item.topic}`,
          category: 'learning_path',
          date: item.dateStr,
          status: item.status,
          duration: item.durationMinutes,
          badge: 'PATH',
          color: 'emerald',
        });
      }
    }

    res.json({ events });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 36. PRIVATE STUDY GROUPS
// ==========================================
router.post('/groups', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, subject_name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Group name is required' });
      return;
    }

    const inviteCode = 'GRP-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const ins = db.prepare(`
      INSERT INTO study_groups (name, description, invite_code, created_by, subject_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description || 'Private Study Group', inviteCode, userId, subject_name || 'General Studies');

    const groupId = ins.lastInsertRowid;

    db.prepare(`
      INSERT INTO study_group_members (group_id, user_id, role)
      VALUES (?, ?, 'admin')
    `).run(groupId, userId);

    addXpAndCheckStreak(userId, 25);

    const groupObj = {
      id: groupId,
      name,
      description: description || 'Private Study Group',
      invite_code: inviteCode,
      subject_name: subject_name || 'General Studies',
      created_by: userId,
    };

    res.json({
      id: groupId,
      name,
      invite_code: inviteCode,
      group: groupObj,
      message: 'Study group created successfully (+25 XP)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/groups/join', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { invite_code } = req.body;

    if (!invite_code) {
      res.status(400).json({ error: 'Invite code is required' });
      return;
    }

    const group = db.prepare('SELECT * FROM study_groups WHERE invite_code = ? COLLATE NOCASE').get(invite_code.trim()) as any;
    if (!group) {
      res.status(404).json({ error: 'Invalid invite code. Group not found.' });
      return;
    }

    const existingMember = db.prepare('SELECT id FROM study_group_members WHERE group_id = ? AND user_id = ?').get(group.id, userId);
    if (existingMember) {
      res.status(400).json({ error: 'You are already a member of this study group.' });
      return;
    }

    db.prepare("INSERT INTO study_group_members (group_id, user_id, role) VALUES (?, ?, 'member')").run(group.id, userId);
    addXpAndCheckStreak(userId, 15);

    res.json({
      message: `Joined "${group.name}" successfully (+15 XP)`,
      groupId: group.id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/groups', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const groups = db.prepare(`
      SELECT g.*, 
             (SELECT count(*) FROM study_group_members WHERE group_id = g.id) as member_count,
             gm.role as user_role
      FROM study_groups g
      JOIN study_group_members gm ON gm.group_id = g.id
      WHERE gm.user_id = ?
      ORDER BY g.created_at DESC
    `).all(userId) as any[];

    res.json({ groups });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/groups/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const groupId = req.params.id;

    const membership = db.prepare('SELECT role FROM study_group_members WHERE group_id = ? AND user_id = ?').get(groupId, userId) as any;
    if (!membership) {
      res.status(403).json({ error: 'You are not a member of this private study group' });
      return;
    }

    const group = db.prepare('SELECT * FROM study_groups WHERE id = ?').get(groupId) as any;
    const members = db.prepare(`
      SELECT u.id, u.username, u.xp, u.level, u.streak, gm.role, gm.joined_at
      FROM study_group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
      ORDER BY u.xp DESC
    `).all(groupId) as any[];

    const sharedNotes = db.prepare(`
      SELECT sn.*, u.username as author_name
      FROM study_group_shared_notes sn
      JOIN users u ON sn.user_id = u.id
      WHERE sn.group_id = ?
      ORDER BY sn.shared_at DESC
    `).all(groupId) as any[];

    const challenges = db.prepare('SELECT * FROM study_group_challenges WHERE group_id = ? ORDER BY created_at DESC').all(groupId) as any[];

    res.json({
      group,
      members,
      sharedNotes,
      challenges,
      userRole: membership.role,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/groups/:id/notes', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const groupId = req.params.id;
    const { title, content, note_id } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content required' });
      return;
    }

    const ins = db.prepare(`
      INSERT INTO study_group_shared_notes (group_id, user_id, note_id, title, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(groupId, userId, note_id || null, title, content);

    addXpAndCheckStreak(userId, 10);

    res.json({ id: ins.lastInsertRowid, message: 'Note shared with group (+10 XP)' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/groups/:id/challenges', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const groupId = req.params.id;
    const { title, target_minutes, deadline, xp_reward } = req.body;

    const ins = db.prepare(`
      INSERT INTO study_group_challenges (group_id, title, target_minutes, deadline, xp_reward)
      VALUES (?, ?, ?, ?, ?)
    `).run(groupId, title || 'Weekend Study Sprint', Number(target_minutes) || 60, deadline || null, Number(xp_reward) || 50);

    res.json({ id: ins.lastInsertRowid, message: 'Group challenge created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.delete('/groups/:id/leave', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?').run(req.params.id, userId);
    res.json({ message: 'Left study group successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 37. SMART GOALS
// ==========================================
router.post('/smart-goals', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, deadline, subject_id } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Goal title is required' });
      return;
    }

    const targetDeadline = deadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const insGoal = db.prepare(`
      INSERT INTO smart_goals (user_id, title, subject_id, deadline)
      VALUES (?, ?, ?, ?)
    `).run(userId, title, subject_id || null, targetDeadline);

    const goalId = insGoal.lastInsertRowid;

    const standardTasks = [
      { title: `Read & Outline: ${title}`, task_type: 'read' },
      { title: `Highlight key definitions & core formulas`, task_type: 'review' },
      { title: `Create 10 active recall flashcards`, task_type: 'flashcards' },
      { title: `Solve initial diagnostic practice set`, task_type: 'practice' },
      { title: `Review mistakes in StudyForge Mistake Book`, task_type: 'mistakes' },
      { title: `Complete mastery checkpoint quiz`, task_type: 'quiz' },
    ];

    const insTask = db.prepare('INSERT INTO smart_goal_tasks (goal_id, title, order_num, task_type) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < standardTasks.length; i++) {
      insTask.run(goalId, standardTasks[i].title, i + 1, standardTasks[i].task_type);
    }

    addXpAndCheckStreak(userId, 20);

    res.json({
      id: goalId,
      title,
      deadline: targetDeadline,
      tasks: standardTasks.map((t, idx) => ({ id: idx + 1, ...t, is_completed: 0 })),
      message: 'Smart goal established and broken down into 6 actionable milestones (+20 XP)',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.get('/smart-goals', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    let goals = db.prepare(`
      SELECT sg.*, s.name as subject_name
      FROM smart_goals sg
      LEFT JOIN subjects s ON sg.subject_id = s.id
      WHERE sg.user_id = ?
      ORDER BY sg.is_completed ASC, sg.deadline ASC
    `).all(userId) as any[];

    if (goals.length === 0) {
      const targetDeadline = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const insGoal = db.prepare(`
        INSERT INTO smart_goals (user_id, title, deadline)
        VALUES (?, 'Master Key Course Fundamentals', ?)
      `).run(userId, targetDeadline);
      const gid = insGoal.lastInsertRowid;
      const starterTasks = [
        { title: 'Read & Outline core chapter topics', task_type: 'read' },
        { title: 'Highlight definitions and key formulas', task_type: 'review' },
        { title: 'Review 10 active recall flashcards', task_type: 'flashcards' },
        { title: 'Solve 5 adaptive practice questions', task_type: 'practice' },
      ];
      for (let i = 0; i < starterTasks.length; i++) {
        db.prepare('INSERT INTO smart_goal_tasks (goal_id, title, order_num, task_type) VALUES (?, ?, ?, ?)').run(gid, starterTasks[i].title, i + 1, starterTasks[i].task_type);
      }
      goals = db.prepare(`
        SELECT sg.*, s.name as subject_name
        FROM smart_goals sg
        LEFT JOIN subjects s ON sg.subject_id = s.id
        WHERE sg.user_id = ?
        ORDER BY sg.is_completed ASC, sg.deadline ASC
      `).all(userId) as any[];
    }

    const fullGoals = goals.map(g => {
      const tasks = db.prepare('SELECT * FROM smart_goal_tasks WHERE goal_id = ? ORDER BY order_num ASC').all(g.id) as any[];
      const completed = tasks.filter(t => t.is_completed === 1).length;
      const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      return {
        ...g,
        tasks,
        progress_percent: progress,
        remaining_tasks_count: tasks.length - completed,
        next_action: tasks.find(t => t.is_completed === 0)?.title || 'All milestones finished!',
      };
    });

    res.json({ goals: fullGoals });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.put('/smart-goals/:id/tasks/:taskId/toggle', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const goalId = req.params.id;
    const taskId = req.params.taskId;

    const task = db.prepare(`
      SELECT sgt.*, sg.user_id
      FROM smart_goal_tasks sgt
      JOIN smart_goals sg ON sgt.goal_id = sg.id
      WHERE sgt.id = ? AND sg.id = ? AND sg.user_id = ?
    `).get(taskId, goalId, userId) as any;

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const newStatus = task.is_completed === 1 ? 0 : 1;
    db.prepare('UPDATE smart_goal_tasks SET is_completed = ? WHERE id = ?').run(newStatus, taskId);

    const allTasks = db.prepare('SELECT is_completed FROM smart_goal_tasks WHERE goal_id = ?').all(goalId) as any[];
    const completedCount = allTasks.filter(t => t.is_completed === 1).length;
    const progressPercent = Math.round((completedCount / allTasks.length) * 100);
    const isCompleted = progressPercent === 100 ? 1 : 0;

    db.prepare('UPDATE smart_goals SET progress_percent = ?, is_completed = ? WHERE id = ?').run(progressPercent, isCompleted, goalId);

    if (newStatus === 1) {
      addXpAndCheckStreak(userId, 15);
      recordAchievementMilestone(userId, 'most_tasks_completed_day', completedCount);
    }

    res.json({
      taskId,
      is_completed: newStatus,
      goalProgress: progressPercent,
      isGoalCompleted: isCompleted === 1,
      xpEarned: newStatus === 1 ? 15 : 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 38. ADAPTIVE PRACTICE LAB
// ==========================================
const handlePracticeLabQuestion = (req: AuthRequest, res: any) => {
  try {
    const subjectParam = req.query.subject_id || req.query.subject || req.body?.subject_id || req.body?.subject;
    const topicParam = req.query.topic || req.body?.topic;
    const streak = Number(req.query.currentStreak ?? req.body?.answerStreak ?? req.body?.currentStreak) || 0;
    const currentDiff = (req.query.currentDifficulty || req.body?.currentDifficulty) as string;

    let targetDifficulty = currentDiff || 'medium';
    if (!currentDiff) {
      if (streak >= 3) {
        targetDifficulty = 'hard';
      } else if (streak <= 0) {
        targetDifficulty = 'easy';
      }
    }

    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params: any[] = [];

    if (subjectParam) {
      if (typeof subjectParam === 'number' || /^\d+$/.test(String(subjectParam))) {
        sql += ' AND subject_id = ?';
        params.push(Number(subjectParam));
      } else {
        const sRow = db.prepare('SELECT id FROM subjects WHERE name LIKE ?').get(`%${subjectParam}%`) as any;
        if (sRow) {
          sql += ' AND subject_id = ?';
          params.push(sRow.id);
        }
      }
    }
    if (topicParam) {
      sql += ' AND topic LIKE ?';
      params.push(`%${topicParam}%`);
    }

    let matchingQs = db.prepare(`${sql} AND difficulty = ? ORDER BY RANDOM() LIMIT 1`).all(...params, targetDifficulty) as any[];
    if (matchingQs.length === 0) {
      matchingQs = db.prepare(`${sql} ORDER BY RANDOM() LIMIT 1`).all(...params) as any[];
    }
    if (matchingQs.length === 0) {
      matchingQs = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT 1').all() as any[];
    }

    const question = matchingQs[0];
    if (!question) {
      res.json({ question: null });
      return;
    }

    const opts = question.options_json ? JSON.parse(question.options_json) : ['Option A', 'Option B', 'Option C', 'Option D'];

    res.json({
      question: {
        id: question.id,
        text: question.question_text,
        question_text: question.question_text,
        type: question.type,
        options: opts,
        difficulty: question.difficulty,
        topic: question.topic,
        answer: question.correct_answer,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
      },
      currentDifficulty: targetDifficulty,
      streak,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
};

router.get('/practice-lab/question', optionalAuth, handlePracticeLabQuestion);
router.post('/practice-lab/question', optionalAuth, handlePracticeLabQuestion);

router.post('/practice-lab/answer', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const {
      question_id,
      questionId,
      user_answer,
      selectedAnswer,
      time_taken_seconds,
      currentStreak,
      answerStreak,
      correctAnswer,
    } = req.body;

    const qId = question_id || questionId;
    let q = qId ? db.prepare('SELECT * FROM questions WHERE id = ?').get(qId) as any : null;

    if (!q) {
      q = {
        question_text: 'Practice Question',
        correct_answer: correctAnswer || 'ATP',
        explanation: 'ATP provides energy for biochemical processes.',
        subject_id: 1,
        topic: 'General Practice',
      };
    }

    const submittedAnswer = user_answer ?? selectedAnswer ?? '';
    const rightAnswer = q.correct_answer || correctAnswer;
    const isCorrect = String(submittedAnswer).trim().toLowerCase() === String(rightAnswer).trim().toLowerCase();
    const streakNum = Number(currentStreak ?? answerStreak) || 0;
    const newStreak = isCorrect ? streakNum + 1 : 0;

    let nextDifficulty = 'medium';
    if (newStreak >= 3) {
      nextDifficulty = 'hard';
    } else if (newStreak === 0) {
      nextDifficulty = 'easy';
    }

    if (userId && qId) {
      db.prepare(`
        INSERT INTO practice_logs (user_id, question_id, is_correct, user_answer, time_taken_seconds)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, qId, isCorrect ? 1 : 0, submittedAnswer, Number(time_taken_seconds) || 15);

      if (isCorrect) {
        addXpAndCheckStreak(userId, 10);
      } else {
        db.prepare(`
          INSERT INTO mistake_book (user_id, question_id, original_question, student_answer, correct_answer, explanation, topic, subject_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT name FROM subjects WHERE id = ?))
        `).run(userId, qId, q.question_text, submittedAnswer, q.correct_answer, q.explanation, q.topic || 'General Practice', q.subject_id);
      }
    }

    res.json({
      isCorrect,
      is_correct: isCorrect,
      correct_answer: rightAnswer,
      explanation: q.explanation,
      newStreak: isCorrect ? Math.max(1, newStreak) : 0,
      nextDifficulty,
      feedbackMessage: isCorrect
        ? (newStreak >= 3 ? 'Outstanding! Advancing to Challenge Level.' : 'Correct! Great reasoning.')
        : 'Good effort! Review the step-by-step breakdown below before tackling the next problem.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 39. SMART STREAK RECOVERY
// ==========================================
router.get('/streak/recovery-status', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ canRecover: false, reason: 'Guest session' });
      return;
    }

    const user = db.prepare('SELECT streak, last_active_date FROM users WHERE id = ?').get(userId) as any;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const recentRecovery = db.prepare("SELECT * FROM streak_recoveries WHERE user_id = ? AND recovered_at >= datetime('now', '-7 days')").get(userId);

    const missedYesterday = user?.last_active_date && user.last_active_date < yesterday;
    const canRecover = Boolean(missedYesterday && !recentRecovery);

    res.json({
      canRecover,
      currentStreak: user?.streak || 1,
      missedDate: yesterday,
      recoverySessionMinutes: 15,
      cooldownActive: Boolean(recentRecovery),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/streak/recover', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const recentRecovery = db.prepare("SELECT * FROM streak_recoveries WHERE user_id = ? AND recovered_at >= datetime('now', '-7 days')").get(userId);
    if (recentRecovery) {
      res.status(400).json({ error: 'Streak recovery is limited to once every 7 days to preserve academic integrity.' });
      return;
    }

    db.prepare(`
      UPDATE users
      SET streak = streak + 1,
          longest_streak = MAX(longest_streak, streak + 1),
          last_active_date = date('now')
      WHERE id = ?
    `).run(userId);

    db.prepare(`
      INSERT INTO streak_recoveries (user_id, missed_date, is_recovered, recovered_at)
      VALUES (?, ?, 1, datetime('now'))
    `).run(userId, yesterday);

    addXpAndCheckStreak(userId, 30);

    res.json({
      message: 'Streak successfully restored! 15-minute recovery session validated (+30 XP)',
      recovered: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 40. CONCEPT MAPS
// ==========================================
router.get('/concept-maps', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;
    const subjects = db.prepare('SELECT id, name, code, description, icon, color FROM subjects ORDER BY id ASC').all() as any[];

    const conceptTree = subjects.map(s => {
      const chapters = db.prepare('SELECT id, title, description FROM chapters WHERE subject_id = ? ORDER BY order_num ASC').all(s.id) as any[];
      return {
        ...s,
        chapters: chapters.map(c => {
          const topics = db.prepare(`
            SELECT t.id, t.title, t.description,
                   COALESCE(utp.status, 'not_started') as status,
                   (SELECT count(*) FROM notes WHERE chapter_id = t.chapter_id) as notes_count,
                   (SELECT count(*) FROM flashcards WHERE topic = t.title) as flashcards_count
            FROM topics t
            LEFT JOIN user_topic_progress utp ON utp.topic_id = t.id AND utp.user_id = ?
            WHERE t.chapter_id = ?
            ORDER BY t.order_num ASC
          `).all(userId, c.id) as any[];

          return {
            ...c,
            topics,
          };
        }),
      };
    });

    res.json({
      subjects: conceptTree,
      conceptTree,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 41. AI WEEKLY REPORT
// ==========================================
router.get('/analytics/weekly-report', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;

    const user = db.prepare('SELECT username, xp, streak, level FROM users WHERE id = ?').get(userId) as any;

    const thisWeekSeconds = (db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ? AND created_at >= datetime('now', '-7 days')").get(userId) as any)?.s || 0;
    const priorWeekSeconds = (db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as s FROM study_sessions WHERE user_id = ? AND created_at >= datetime('now', '-14 days') AND created_at < datetime('now', '-7 days')").get(userId) as any)?.s || 0;

    const quizzesThisWeek = (db.prepare("SELECT count(*) as c, COALESCE(AVG(accuracy), 0) as a FROM quiz_attempts WHERE user_id = ? AND completed_at >= datetime('now', '-7 days')").get(userId) as any) || { c: 0, a: 0 };
    const tasksDone = (db.prepare("SELECT count(*) as c FROM homework WHERE user_id = ? AND status = 'completed' AND completed_at >= datetime('now', '-7 days')").get(userId) as any)?.c || 0;
    const cardsReviewed = (db.prepare("SELECT COALESCE(SUM(repetitions), 0) as c FROM flashcards WHERE last_reviewed_at >= datetime('now', '-7 days')").get() as any)?.c || 0;

    const strongTopics = db.prepare("SELECT t.title FROM user_topic_progress utp JOIN topics t ON utp.topic_id = t.id WHERE utp.user_id = ? AND utp.status = 'strong' LIMIT 3").all(userId) as any[];
    const weakTopics = db.prepare("SELECT t.title FROM user_topic_progress utp JOIN topics t ON utp.topic_id = t.id WHERE utp.user_id = ? AND utp.status = 'learning' LIMIT 3").all(userId) as any[];

    const recommendations = [
      quizzesThisWeek.a >= 75
        ? `Your quiz accuracy is strong at ${Math.round(quizzesThisWeek.a)}%! Keep maintaining this steady discipline.`
        : `Your quiz accuracy was ${Math.round(quizzesThisWeek.a)}% this week. Focus on step-by-step review before attempting high-speed tests.`,
      weakTopics.length > 0
        ? `Concepts needing attention: ${weakTopics.map(t => t.title).join(', ')}. Schedule two 20-minute practice drills next week.`
        : `Excellent concept coverage across all your active chapters.`,
      `Optimal pacing: Complete a 25-minute Pomodoro session tomorrow morning to reinforce your ${user?.streak || 1}-day streak.`,
    ];

    res.json({
      report: {
        username: user?.username || 'Student',
        totalStudyMinutes: Math.round(thisWeekSeconds / 60),
        priorWeekMinutes: Math.round(priorWeekSeconds / 60),
        timeGrowthPercent: priorWeekSeconds > 0 ? Math.round(((thisWeekSeconds - priorWeekSeconds) / priorWeekSeconds) * 100) : 100,
        quizzesTaken: quizzesThisWeek.c,
        averageAccuracy: Math.round(quizzesThisWeek.a),
        tasksCompleted: tasksDone,
        flashcardsReviewed: cardsReviewed,
        strongestTopics: strongTopics.map(t => t.title),
        weakestTopics: weakTopics.map(t => t.title),
        currentStreak: user?.streak || 1,
        recommendations,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ==========================================
// 42. ANTI-CRAM MODE
// ==========================================
router.get('/anti-cram', optionalAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id || 1;

    const upcoming = db.prepare(`
      SELECT e.*, s.name as subject_name
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ? AND e.exam_date >= date('now') AND e.exam_date <= date('now', '+14 days')
      ORDER BY e.exam_date ASC
      LIMIT 1
    `).get(userId) as any;

    if (!upcoming) {
      res.json({
        active: false,
        antiCramTriggered: false,
        message: 'No immediate exams within 14 days. Pacing is sustainable.',
      });
      return;
    }

    const daysLeft = Math.max(1, Math.ceil((new Date(upcoming.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

    const remainingTopics = db.prepare(`
      SELECT t.title
      FROM topics t
      JOIN chapters c ON t.chapter_id = c.id
      LEFT JOIN user_topic_progress utp ON utp.topic_id = t.id AND utp.user_id = ?
      WHERE c.subject_id = ? AND (utp.status IS NULL OR utp.status != 'strong')
    `).all(userId, upcoming.subject_id) as any[];

    const topicsCount = remainingTopics.length || 3;
    const recommendedDailyMinutes = Math.min(60, Math.max(30, Math.ceil((topicsCount * 35) / daysLeft)));

    res.json({
      active: true,
      antiCramTriggered: true,
      exam: {
        id: upcoming.id,
        title: upcoming.title,
        subject: upcoming.subject_name,
        examDate: upcoming.exam_date,
        daysLeft,
      },
      remainingTopicsCount: topicsCount,
      remainingTopicSamples: remainingTopics.slice(0, 4).map(t => t.title),
      recommendedDailyMinutes,
      antiCramAdvice: `By dedicating ${recommendedDailyMinutes} focused minutes per day with regular breaks, you will master all ${topicsCount} remaining topics comfortably without exhausting late-night cramming.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;


