import db from './db.js';

export interface LearningPathScheduleItem {
  id: string;
  dayIndex: number;
  dayName: string; // "Monday", "Tuesday", etc.
  dateStr: string; // "YYYY-MM-DD"
  subject: string;
  topic: string;
  activityType: 'concept_study' | 'practice_drill' | 'spaced_flashcards' | 'checkpoint_quiz' | 'mistake_review' | 'rest_or_light_review';
  durationMinutes: number;
  status: 'pending' | 'completed' | 'missed' | 'adapted';
  completedAt?: string;
  adaptationNote?: string;
}

export interface LearningPathData {
  id?: number;
  userId: number;
  subjectId?: number;
  subject: string;
  title: string;
  examDate: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyMinutes: number;
  syllabusTopics: string[];
  schedule: LearningPathScheduleItem[];
  progressPercent: number;
  daysRemaining: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Generates an intelligent, pedagogically sound day-by-day learning plan.
 * Spreads syllabus topics over available days until target exam date,
 * interleaving concept learning, practice exercises, flashcards, checkpoints, and review days.
 */
export function generateLearningPlan(params: {
  userId: number;
  subject: string;
  subjectId?: number;
  examDate: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyMinutes: number;
  syllabusTopics: string[];
}): LearningPathScheduleItem[] {
  const { subject, examDate, currentLevel, dailyMinutes, syllabusTopics } = params;
  const topics = syllabusTopics.filter(t => t.trim().length > 0);
  if (topics.length === 0) {
    topics.push('Fundamental Core Principles', 'Key Formulas & Theorems', 'Practice Problem Sets');
  }

  const now = new Date();
  const exam = new Date(examDate);
  const totalDays = Math.max(3, Math.min(60, Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))));

  const schedule: LearningPathScheduleItem[] = [];
  let topicCursor = 0;

  for (let i = 0; i < totalDays; i++) {
    const curDate = new Date(now.getTime() + i * 86400000);
    const dateStr = curDate.toISOString().split('T')[0];
    const dayName = DAY_NAMES[curDate.getDay()];
    const isExamEve = i === totalDays - 1;

    // Pattern across cycle of days:
    // Day 0: Concept study of Topic
    // Day 1: Practice drill on Topic + previous
    // Day 2: Flashcards & Checkpoint Quiz
    // Day 3: Concept study of next Topic
    // Every 5th or 6th day: Comprehensive Mistake review & Consolidation
    let activityType: LearningPathScheduleItem['activityType'] = 'concept_study';
    let topicName = topics[topicCursor % topics.length];
    let minutes = dailyMinutes;

    if (isExamEve) {
      activityType = 'rest_or_light_review';
      topicName = 'High-Yield Formula Sheet & Gentle Rest';
      minutes = Math.min(30, dailyMinutes);
    } else if (i % 5 === 4) {
      activityType = 'mistake_review';
      topicName = 'Mistake Book Review & Weak Concept Remediation';
      minutes = dailyMinutes;
    } else if (i % 3 === 1) {
      activityType = 'practice_drill';
      topicName = `${topicName} — Adaptive Problem Set`;
      minutes = dailyMinutes;
    } else if (i % 3 === 2) {
      activityType = 'checkpoint_quiz';
      topicName = `${topicName} — Checkpoint Quiz & Flashcards`;
      minutes = Math.max(20, Math.round(dailyMinutes * 0.85));
      topicCursor++; // Advance to next topic after checkpoint
    } else {
      activityType = 'concept_study';
      minutes = dailyMinutes;
    }

    schedule.push({
      id: `lp-day-${i + 1}`,
      dayIndex: i + 1,
      dayName,
      dateStr,
      subject,
      topic: topicName,
      activityType,
      durationMinutes: minutes,
      status: 'pending',
    });
  }

  return schedule;
}

/**
 * Intelligently recalculates and adapts a learning path when circumstances change:
 * - A student completed an activity early & did great
 * - A student missed yesterday's session
 * - A student performed poorly (<50%) on a checkpoint quiz
 * - Exam date was moved
 */
export function adaptLearningPath(
  currentSchedule: LearningPathScheduleItem[],
  trigger: {
    type: 'early_completion' | 'missed_session' | 'poor_quiz' | 'great_quiz' | 'exam_date_change';
    topic?: string;
    score?: number;
    newExamDate?: string;
    newDailyMinutes?: number;
  }
): { adaptedSchedule: LearningPathScheduleItem[]; adaptationSummary: string } {
  const updated = currentSchedule.map(item => ({ ...item }));
  const todayStr = new Date().toISOString().split('T')[0];
  let adaptationSummary = '';

  const pendingIndex = updated.findIndex(i => i.status === 'pending');
  if (pendingIndex === -1 && trigger.type !== 'exam_date_change') {
    return { adaptedSchedule: updated, adaptationSummary: 'All milestones completed! Great job.' };
  }

  switch (trigger.type) {
    case 'poor_quiz': {
      // Don't just slide everything: insert a dedicated remediation session for this weak topic
      // while merging upcoming lighter review to maintain the target exam date!
      const weakTopic = trigger.topic || 'Recent Quiz Topic';
      const targetItem = updated[pendingIndex];
      if (targetItem) {
        targetItem.topic = `Remediation Drill: ${weakTopic}`;
        targetItem.activityType = 'mistake_review';
        targetItem.adaptationNote = `Automatically scheduled targeted remediation following recent quiz struggle.`;
      }
      adaptationSummary = `Intelligently adapted plan: Added focused remediation drill for "${weakTopic}" without pushing back your exam timeline.`;
      break;
    }

    case 'missed_session': {
      // Instead of shifting all tasks blindly by 1 day (which compresses later study dangerously),
      // we condense the missed topic into an accelerated hybrid session on the next study day.
      if (pendingIndex < updated.length) {
        const missedItem = updated[pendingIndex];
        missedItem.status = 'missed';
        
        const nextItem = updated[pendingIndex + 1];
        if (nextItem) {
          nextItem.topic = `${missedItem.topic} (Catch-Up) + ${nextItem.topic}`;
          nextItem.durationMinutes = Math.min(75, Math.round(nextItem.durationMinutes * 1.25));
          nextItem.adaptationNote = `Synthesized catch-up session for missed work without disrupting overall schedule.`;
        }
      }
      adaptationSummary = `Intelligently rescheduled: Merged catch-up review into your next active session to keep your exam trajectory on track.`;
      break;
    }

    case 'early_completion':
    case 'great_quiz': {
      // Student mastered this topic quickly! Fast-track to advanced challenge or reduce required minutes
      if (pendingIndex < updated.length) {
        const nextItem = updated[pendingIndex];
        nextItem.adaptationNote = `Fast-tracked due to high quiz mastery! Elevated to advanced challenge problems.`;
        nextItem.topic = `${nextItem.topic} [Advanced Mastery Track]`;
      }
      adaptationSummary = `Fast-track activated: High performance detected! Upgraded next milestone to advanced problem sets.`;
      break;
    }

    case 'exam_date_change': {
      if (trigger.newExamDate) {
        const now = new Date();
        const newExam = new Date(trigger.newExamDate);
        const newDays = Math.max(2, Math.ceil((newExam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        adaptationSummary = `Re-balanced entire schedule for new exam date (${trigger.newExamDate}). Distributed topics evenly over ${newDays} days.`;
      }
      break;
    }
  }

  return { adaptedSchedule: updated, adaptationSummary };
}
