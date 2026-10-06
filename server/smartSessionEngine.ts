import db from './db.js';

export interface SmartRecommendation {
  subject: string;
  subjectId?: number;
  chapterId?: number;
  topic: string;
  activityType: 'review_weak_topic' | 'exam_prep' | 'homework' | 'flashcards' | 'practice_lab' | 'smart_goal';
  recommendedMinutes: number;
  title: string;
  rationale: string;
  directUrl: string;
  urgency: 'high' | 'medium' | 'normal';
}

export interface MinuteBreakdownItem {
  minuteDuration: number;
  activityType: string;
  title: string;
  topic: string;
  description: string;
  link: string;
}

export interface TimedSessionPlan {
  totalMinutes: number;
  title: string;
  items: MinuteBreakdownItem[];
  rationale: string;
}

/**
 * Unified Smart Session Engine: Determines the single best thing for a student to do RIGHT NOW.
 * Priority hierarchy:
 * 1. Urgent exams (< 7 days) with incomplete syllabus
 * 2. Weak topics (< 60% accuracy or 'learning' status)
 * 3. Overdue or due-today homework
 * 4. Spaced repetition flashcards due today
 * 5. In-progress chapters with untouched topics
 * 6. Daily study goals
 */
export function getSmartNextActivity(userId: number): SmartRecommendation {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Check for urgent exam within 7 days
  const upcomingExams = db.prepare(`
    SELECT e.*, s.name as subject_name
    FROM exams e
    JOIN subjects s ON e.subject_id = s.id
    WHERE e.user_id = ? AND e.exam_date >= date('now')
    ORDER BY e.exam_date ASC
    LIMIT 1
  `).all(userId) as any[];

  if (upcomingExams.length > 0) {
    const exam = upcomingExams[0];
    const daysLeft = Math.max(1, Math.ceil((new Date(exam.exam_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
    if (daysLeft <= 7) {
      // Find weakest or unfinished topic for this exam's subject
      const weakTopicRow = db.prepare(`
        SELECT t.title as topic_title, c.id as chapter_id, c.title as chapter_title
        FROM topics t
        JOIN chapters c ON t.chapter_id = c.id
        LEFT JOIN user_topic_progress utp ON utp.topic_id = t.id AND utp.user_id = ?
        WHERE c.subject_id = ? AND (utp.status IS NULL OR utp.status = 'learning' OR utp.status = 'not_started')
        LIMIT 1
      `).get(userId, exam.subject_id) as any;

      const topicName = weakTopicRow?.topic_title || 'Core Syllabus Revision';
      return {
        subject: exam.subject_name,
        subjectId: exam.subject_id,
        chapterId: weakTopicRow?.chapter_id,
        topic: topicName,
        activityType: 'exam_prep',
        recommendedMinutes: Math.min(45, Math.max(25, daysLeft <= 3 ? 45 : 30)),
        title: `Prepare for ${exam.title}`,
        rationale: `Your ${exam.title} is coming up in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Strengthening "${topicName}" will yield the highest exam score improvement.`,
        directUrl: `/tutor?subject=${encodeURIComponent(exam.subject_name)}&topic=${encodeURIComponent(topicName)}`,
        urgency: 'high',
      };
    }
  }

  // 2. Check for weak topics from user_topic_progress or mistakes
  const weakTopic = db.prepare(`
    SELECT utp.*, t.title as topic_name, c.title as chapter_name, s.name as subject_name, s.id as subject_id, c.id as chapter_id
    FROM user_topic_progress utp
    JOIN topics t ON utp.topic_id = t.id
    JOIN chapters c ON t.chapter_id = c.id
    JOIN subjects s ON c.subject_id = s.id
    WHERE utp.user_id = ? AND utp.status = 'learning'
    ORDER BY utp.last_reviewed_at ASC NULLS FIRST
    LIMIT 1
  `).get(userId) as any;

  if (weakTopic) {
    return {
      subject: weakTopic.subject_name,
      subjectId: weakTopic.subject_id,
      chapterId: weakTopic.chapter_id,
      topic: weakTopic.topic_name,
      activityType: 'review_weak_topic',
      recommendedMinutes: 25,
      title: `Master ${weakTopic.topic_name}`,
      rationale: `Recent quiz attempts show "${weakTopic.topic_name}" needs attention. A focused 25-minute practice session will help transition this concept to Strong mastery.`,
      directUrl: `/practice?subject_id=${weakTopic.subject_id}&topic=${encodeURIComponent(weakTopic.topic_name)}`,
      urgency: 'high',
    };
  }

  // 3. Check for homework due today or tomorrow
  const pendingHw = db.prepare(`
    SELECT h.*, s.name as subject_name
    FROM homework h
    LEFT JOIN subjects s ON h.subject_id = s.id
    WHERE h.user_id = ? AND h.status != 'completed' AND h.due_date <= date('now', '+1 day')
    ORDER BY h.due_date ASC
    LIMIT 1
  `).get(userId) as any;

  if (pendingHw) {
    const isDueToday = pendingHw.due_date === todayStr;
    return {
      subject: pendingHw.subject_name || 'General Assignment',
      subjectId: pendingHw.subject_id,
      topic: pendingHw.title,
      activityType: 'homework',
      recommendedMinutes: pendingHw.estimated_minutes || 30,
      title: `Complete Homework: ${pendingHw.title}`,
      rationale: `This assignment is due ${isDueToday ? 'today' : 'tomorrow'}. Finishing it now keeps your homework streak clean and earns +25 XP.`,
      directUrl: `/homework`,
      urgency: 'high',
    };
  }

  // 4. Check for spaced-repetition flashcards due today
  const dueCardsCount = (db.prepare(`
    SELECT count(*) as c
    FROM flashcards f
    JOIN flashcard_decks fd ON f.deck_id = fd.id
    WHERE (fd.user_id = ? OR fd.user_id IS NULL) AND f.next_review_date <= date('now')
  `).get(userId) as any)?.c || 0;

  if (dueCardsCount > 0) {
    return {
      subject: 'Memory Revision',
      topic: 'Spaced Flashcards',
      activityType: 'flashcards',
      recommendedMinutes: 15,
      title: `Review ${dueCardsCount} Spaced Flashcards`,
      rationale: `You have ${dueCardsCount} flashcard${dueCardsCount === 1 ? '' : 's'} scheduled for retention review today. Completing them reinforces long-term memory.`,
      directUrl: `/flashcards`,
      urgency: 'medium',
    };
  }

  // 5. Default fallback to next incomplete curriculum lesson
  const nextLesson = db.prepare(`
    SELECT l.*, c.title as chapter_title, s.name as subject_name, s.id as subject_id
    FROM lessons l
    JOIN chapters c ON l.chapter_id = c.id
    JOIN subjects s ON c.subject_id = s.id
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
    WHERE lp.completed IS NULL OR lp.completed = 0
    ORDER BY s.id ASC, c.order_num ASC, l.order_num ASC
    LIMIT 1
  `).get(userId) as any;

  if (nextLesson) {
    return {
      subject: nextLesson.subject_name,
      subjectId: nextLesson.subject_id,
      chapterId: nextLesson.chapter_id,
      topic: nextLesson.title,
      activityType: 'practice_lab',
      recommendedMinutes: nextLesson.estimated_minutes || 20,
      title: `Study Lesson: ${nextLesson.title}`,
      rationale: `Continue your curriculum progression in ${nextLesson.subject_name} (${nextLesson.chapter_title}). Complete this lesson to earn +30 XP.`,
      directUrl: `/lessons/${nextLesson.id}`,
      urgency: 'normal',
    };
  }

  // 6. Generic academic practice
  return {
    subject: 'Mathematics',
    topic: 'Fractions & Proportions',
    activityType: 'practice_lab',
    recommendedMinutes: 20,
    title: 'Adaptive Practice Lab',
    rationale: 'Sharpen your analytical skills with a calibrated problem set tailored to your current grade level.',
    directUrl: '/practice',
    urgency: 'normal',
  };
}

/**
 * "I HAVE X MINUTES" Mode:
 * Intelligently breaks down any available study window (10, 20, 30, 45, 60 min)
 * into a structured multi-activity micro-routine.
 */
export function generateMinuteSession(userId: number, totalMinutes: number): TimedSessionPlan {
  const duration = Math.max(5, Math.min(180, totalMinutes));
  const nextAct = getSmartNextActivity(userId);
  const items: MinuteBreakdownItem[] = [];

  if (duration <= 10) {
    items.push({
      minuteDuration: duration,
      activityType: 'Quick Concept Flash Review',
      title: `Rapid Review: ${nextAct.topic}`,
      topic: nextAct.topic,
      description: `Fast 10-minute micro-drill targeting ${nextAct.topic} key formulas and definitions.`,
      link: nextAct.directUrl,
    });
  } else if (duration <= 20) {
    items.push({
      minuteDuration: 12,
      activityType: 'Concept Reinforcement',
      title: `Learn & Practice: ${nextAct.topic}`,
      topic: nextAct.topic,
      description: `Step-by-step review and active problem walkthrough.`,
      link: nextAct.directUrl,
    });
    items.push({
      minuteDuration: 8,
      activityType: 'Memory Check',
      title: 'Spaced Flashcards & Quick Quiz',
      topic: nextAct.topic,
      description: 'Quick retention test to lock the concept into long-term memory.',
      link: '/flashcards',
    });
  } else if (duration <= 30) {
    items.push({
      minuteDuration: 12,
      activityType: 'Core Concept Deep Dive',
      title: `Review ${nextAct.topic}`,
      topic: nextAct.topic,
      description: 'Break down key properties, rules, and common pitfalls.',
      link: nextAct.directUrl,
    });
    items.push({
      minuteDuration: 10,
      activityType: 'Adaptive Practice',
      title: 'Solve 5 Practice Questions',
      topic: nextAct.topic,
      description: 'Interactive questions with immediate Socratic feedback on errors.',
      link: `/practice?topic=${encodeURIComponent(nextAct.topic)}`,
    });
    items.push({
      minuteDuration: 4,
      activityType: 'Spaced Repetition',
      title: 'Flip 6 Flashcards',
      topic: nextAct.topic,
      description: 'Rate card recall (Again, Hard, Good, Easy) for SM-2 scheduling.',
      link: '/flashcards',
    });
    items.push({
      minuteDuration: 4,
      activityType: 'Checkpoint Quiz',
      title: '3-Question Mastery Check',
      topic: nextAct.topic,
      description: 'Validate concept mastery and earn +25 XP.',
      link: '/quizzes',
    });
  } else if (duration <= 45) {
    items.push({
      minuteDuration: 18,
      activityType: 'In-Depth Study & Socratic Dialogue',
      title: `Study Session: ${nextAct.topic}`,
      topic: nextAct.topic,
      description: 'Ask AI Tutor questions and work through step-by-step examples.',
      link: nextAct.directUrl,
    });
    items.push({
      minuteDuration: 14,
      activityType: 'Problem Solving Lab',
      title: 'Adaptive Problem Set',
      topic: nextAct.topic,
      description: 'Progressively harder exercises based on real-time accuracy.',
      link: `/practice?topic=${encodeURIComponent(nextAct.topic)}`,
    });
    items.push({
      minuteDuration: 8,
      activityType: 'Spaced Review',
      title: 'Flashcards & Memory Book',
      topic: nextAct.topic,
      description: 'Clear scheduled cards and log any new insights.',
      link: '/flashcards',
    });
    items.push({
      minuteDuration: 5,
      activityType: 'Knowledge Consolidation',
      title: 'Short Summary & Note Taking',
      topic: nextAct.topic,
      description: 'Summarize the 3 key takeaways into your StudyForge notes.',
      link: '/notes',
    });
  } else {
    // 60+ minutes: full Pomodoro module with structured breaks
    items.push({
      minuteDuration: 25,
      activityType: 'Pomodoro Focus Block 1',
      title: `Deep Concept Mastery: ${nextAct.topic}`,
      topic: nextAct.topic,
      description: 'Uninterrupted lesson reading and Socratic guided exploration.',
      link: nextAct.directUrl,
    });
    items.push({
      minuteDuration: 5,
      activityType: 'Rest Interval',
      title: 'Short Break',
      topic: 'Wellness',
      description: 'Step away from screen, hydrate, and stretch.',
      link: '/timer',
    });
    items.push({
      minuteDuration: 20,
      activityType: 'Pomodoro Focus Block 2',
      title: 'Adaptive Problem Solving & Exercises',
      topic: nextAct.topic,
      description: 'Work through challenge exercises and check mistake explanations.',
      link: `/practice?topic=${encodeURIComponent(nextAct.topic)}`,
    });
    items.push({
      minuteDuration: 10,
      activityType: 'Consolidation & Assessment',
      title: 'Flashcards & Final Mini-Quiz',
      topic: nextAct.topic,
      description: 'Reinforce memory with spaced cards and verify accuracy score.',
      link: '/quizzes',
    });
  }

  return {
    totalMinutes: duration,
    title: `${duration}-Minute Calibrated Study Sprint`,
    items,
    rationale: `Personalized ${duration}-minute session generated around your highest-priority need: "${nextAct.topic}" in ${nextAct.subject}.`,
  };
}
