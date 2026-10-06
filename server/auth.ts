import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'studyforge-super-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    role: string;
  };
}

export function generateToken(user: { id: number; email: string; username: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user as AuthRequest['user'];
    next();
  });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user as AuthRequest['user'];
      }
      next();
    });
  } else {
    next();
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticateToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  });
}

// Level & XP progression system
export function calculateLevelInfo(xp: number): {
  level: number;
  title: string;
  currentFloor: number;
  nextCeiling: number;
  progressPercent: number;
} {
  // Level milestones
  // 1: 0 - 100 (Beginner)
  // 2: 101 - 250 (Novice)
  // 3: 251 - 500 (Apprentice)
  // 4: 501 - 850 (Student)
  // 5: 851 - 1300 (Learner)
  // 8: 1301 - 2200 (Practitioner)
  // 10: 2201 - 3500 (Scholar)
  // 15: 3501 - 6500 (Sage)
  // 20: 6501 - 12000 (Expert)
  // 30: 12001 - 25000 (Master)
  // 50: 25000+ (Grandmaster)

  let level = 1;
  let title = 'Beginner';
  let floor = 0;
  let ceiling = 100;

  if (xp < 100) {
    level = 1;
    title = 'Beginner';
    floor = 0;
    ceiling = 100;
  } else if (xp < 250) {
    level = 2;
    title = 'Explorer';
    floor = 100;
    ceiling = 250;
  } else if (xp < 500) {
    level = 3;
    title = 'Apprentice';
    floor = 250;
    ceiling = 500;
  } else if (xp < 850) {
    level = 4;
    title = 'Student';
    floor = 500;
    ceiling = 850;
  } else if (xp < 1400) {
    level = 5;
    title = 'Learner';
    floor = 850;
    ceiling = 1400;
  } else if (xp < 2200) {
    level = 8;
    title = 'Practitioner';
    floor = 1400;
    ceiling = 2200;
  } else if (xp < 3500) {
    level = 10;
    title = 'Scholar';
    floor = 2200;
    ceiling = 3500;
  } else if (xp < 6500) {
    level = 15;
    title = 'Sage';
    floor = 3500;
    ceiling = 6500;
  } else if (xp < 12000) {
    level = 20;
    title = 'Expert';
    floor = 6500;
    ceiling = 12000;
  } else if (xp < 25000) {
    level = 30;
    title = 'Master';
    floor = 12000;
    ceiling = 25000;
  } else {
    level = Math.min(50, 30 + Math.floor((xp - 25000) / 1000));
    title = 'Grandmaster';
    floor = 25000;
    ceiling = 50000;
  }

  const range = ceiling - floor;
  const currentIntoLevel = Math.max(0, xp - floor);
  const progressPercent = Math.min(100, Math.round((currentIntoLevel / range) * 100));

  return { level, title, currentFloor: floor, nextCeiling: ceiling, progressPercent };
}

// Add XP and check streak update
export function addXpAndCheckStreak(userId: number, xpToAdd: number): {
  newXp: number;
  newLevel: number;
  levelUp: boolean;
  streak: number;
  unlockedAchievements: Array<{ id: number; title: string; description: string; xp_reward: number; icon: string }>;
} {
  const user = db.prepare('SELECT xp, level, streak, last_active_date FROM users WHERE id = ?').get(userId) as {
    xp: number;
    level: number;
    streak: number;
    last_active_date: string | null;
  } | undefined;

  if (!user) {
    throw new Error('User not found');
  }

  const currentXp = user.xp + xpToAdd;
  const levelInfo = calculateLevelInfo(currentXp);
  const levelUp = levelInfo.level > user.level;

  // Streak calculation
  const today = new Date().toISOString().split('T')[0];
  let newStreak = user.streak || 1;

  if (!user.last_active_date) {
    newStreak = 1;
  } else if (user.last_active_date === today) {
    // Already active today, streak remains unchanged
  } else {
    const lastDate = new Date(user.last_active_date);
    const currentDate = new Date(today);
    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      // Friendly streak grace: keep at least 1
      newStreak = 1;
    }
  }

  db.prepare(`
    UPDATE users 
    SET xp = ?, level = ?, streak = ?, last_active_date = ?
    WHERE id = ?
  `).run(currentXp, levelInfo.level, newStreak, today, userId);

  // Check achievements
  const unlocked = checkUserAchievements(userId);

  return {
    newXp: currentXp,
    newLevel: levelInfo.level,
    levelUp,
    streak: newStreak,
    unlockedAchievements: unlocked,
  };
}

// Check and unlock eligible achievements
export function checkUserAchievements(userId: number): Array<{ id: number; title: string; description: string; xp_reward: number; icon: string }> {
  const user = db.prepare('SELECT streak, total_study_seconds FROM users WHERE id = ?').get(userId) as {
    streak: number;
    total_study_seconds: number;
  };

  const lessonCount = (db.prepare('SELECT count(*) as count FROM lesson_progress WHERE user_id = ? AND completed = 1').get(userId) as { count: number }).count;
  const quizCount = (db.prepare('SELECT count(*) as count FROM quiz_attempts WHERE user_id = ?').get(userId) as { count: number }).count;
  const perfectQuizCount = (db.prepare('SELECT count(*) as count FROM quiz_attempts WHERE user_id = ? AND accuracy = 100').get(userId) as { count: number }).count;
  const practiceQuestionCount = (db.prepare('SELECT count(*) as count FROM practice_logs WHERE user_id = ?').get(userId) as { count: number }).count;
  const totalQuestions = practiceQuestionCount + (db.prepare('SELECT COALESCE(SUM(total_questions), 0) as total FROM quiz_attempts WHERE user_id = ?').get(userId) as { total: number }).total;
  const deckCount = (db.prepare('SELECT count(*) as count FROM flashcard_decks WHERE user_id = ?').get(userId) as { count: number }).count;
  const studyHours = Math.floor(user.total_study_seconds / 3600);

  const allAchievements = db.prepare('SELECT * FROM achievements').all() as Array<{
    id: number;
    code: string;
    title: string;
    description: string;
    icon: string;
    xp_reward: number;
    requirement_type: string;
    requirement_value: number;
  }>;

  const userAchievements = db.prepare('SELECT achievement_id FROM user_achievements WHERE user_id = ?').all(userId) as Array<{ achievement_id: number }>;
  const unlockedIds = new Set(userAchievements.map(a => a.achievement_id));

  const newlyUnlocked: Array<{ id: number; title: string; description: string; xp_reward: number; icon: string }> = [];

  for (const ach of allAchievements) {
    if (unlockedIds.has(ach.id)) continue;

    let qualifies = false;
    switch (ach.requirement_type) {
      case 'lesson_count':
        qualifies = lessonCount >= ach.requirement_value;
        break;
      case 'quiz_count':
        qualifies = quizCount >= ach.requirement_value;
        break;
      case 'perfect_quiz':
        qualifies = perfectQuizCount >= ach.requirement_value;
        break;
      case 'question_count':
        qualifies = totalQuestions >= ach.requirement_value;
        break;
      case 'deck_count':
        qualifies = deckCount >= ach.requirement_value;
        break;
      case 'streak_days':
        qualifies = user.streak >= ach.requirement_value;
        break;
      case 'study_hours':
        qualifies = studyHours >= ach.requirement_value;
        break;
    }

    if (qualifies) {
      db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, ach.id);
      db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(ach.xp_reward, userId);
      newlyUnlocked.push({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        xp_reward: ach.xp_reward,
        icon: ach.icon,
      });
    }
  }

  return newlyUnlocked;
}
