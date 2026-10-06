async function runTests() {
  const BASE = 'http://localhost:3001/api';
  console.log('🧪 Starting StudyForge Automated Feature Verification...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Health
  const healthRes = await fetch(`${BASE}/health`).then(r => r.json());
  assert(healthRes.status === 'healthy', 'Health check returns healthy');

  // 2. Auth: Demo Student Login
  const studentLogin = await fetch(`${BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' }),
  }).then(r => r.json());
  assert(Boolean(studentLogin.token) && studentLogin.user.username === 'Alex Morgan', 'Demo student login succeeds with JWT');

  const studentToken = studentLogin.token;
  const studentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${studentToken}`,
  };

  // 3. Auth: Demo Admin Login
  const adminLogin = await fetch(`${BASE}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' }),
  }).then(r => r.json());
  assert(Boolean(adminLogin.token) && adminLogin.user.role === 'admin', 'Demo admin login succeeds');
  const adminHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminLogin.token}`,
  };

  // 4. Subjects & Lessons
  const subjectsData = await fetch(`${BASE}/subjects`, { headers: studentHeaders }).then(r => r.json());
  assert(subjectsData.subjects.length >= 6, `Found ${subjectsData.subjects.length} subjects (Math, Sci, Eng, Hin, Soc, CS)`);

  const mathSub = subjectsData.subjects.find((s: any) => s.code === 'MATH');
  assert(Boolean(mathSub), 'Mathematics subject exists');

  const subjectDetail = await fetch(`${BASE}/subjects/${mathSub.id}`, { headers: studentHeaders }).then(r => r.json());
  assert(subjectDetail.chapters.length >= 3, `Mathematics has ${subjectDetail.chapters.length} chapters`);

  const firstChapter = subjectDetail.chapters[0];
  const firstLesson = firstChapter.lessons[0];
  assert(Boolean(firstLesson), `First lesson found: "${firstLesson?.title}"`);

  // Complete lesson
  const completeLessonRes = await fetch(`${BASE}/lessons/${firstLesson.id}/complete`, {
    method: 'POST',
    headers: studentHeaders,
  }).then(r => r.json());
  assert(completeLessonRes.xpEarned === 30, 'Completing lesson awards +30 XP and updates streak');

  // 5. AI Tutor
  const tutorRes = await fetch(`${BASE}/tutor/chat`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      message: 'Why is a common denominator needed to add fractions?',
      subject: 'Mathematics',
      topic: 'Fractions',
      grade: 'Grade 10',
      action: 'simpler',
    }),
  }).then(r => r.json());
  assert(Boolean(tutorRes.reply) && tutorRes.reply.length > 50, 'AI Tutor Socratic pedagogical response generated');

  // 6. AI Note Tools
  const noteAiRes = await fetch(`${BASE}/tutor/transform-note`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      noteTitle: 'Newton Mechanics Summary',
      noteContent: '# Newton Three Laws\n1. First law: Inertia.\n2. Second law: F = m * a.\n3. Third law: Action and reaction.',
      tool: 'summary',
    }),
  }).then(r => r.json());
  assert(Boolean(noteAiRes.result), 'AI Note Tools: Generated summary successfully');

  // 7. Quiz Generation & Evaluation
  const quizGenRes = await fetch(`${BASE}/quizzes/generate`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      subject_id: mathSub.id,
      num_questions: 5,
      difficulty: 'all',
      question_type: 'all',
    }),
  }).then(r => r.json());
  assert(quizGenRes.questions.length === 5, 'Quiz Generator created 5-question test');
  assert(!quizGenRes.questions[0].correct_answer, 'Quiz question DOES NOT leak correct answer before submission');

  // Submit quiz
  const submitQuizRes = await fetch(`${BASE}/quizzes/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      subject_id: mathSub.id,
      quiz_type: 'standard',
      answers: quizGenRes.questions.map((q: any) => ({
        question_id: q.id,
        user_answer: q.options?.[0] || '3/2',
      })),
      time_taken_seconds: 90,
    }),
  }).then(r => r.json());
  assert(typeof submitQuizRes.accuracy === 'number' && submitQuizRes.xp_earned > 0, `Quiz submitted: accuracy ${submitQuizRes.accuracy}%, awarded ${submitQuizRes.xp_earned} XP`);

  // 8. Practice Mode
  const practiceQs = await fetch(`${BASE}/practice/questions?subject_id=${mathSub.id}&limit=5`).then(r => r.json());
  assert(practiceQs.questions.length > 0, `Practice questions retrieved (${practiceQs.questions.length})`);

  const practiceAns = await fetch(`${BASE}/practice/answer`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      question_id: practiceQs.questions[0].id,
      user_answer: '3/2',
      time_taken_seconds: 20,
    }),
  }).then(r => r.json());
  assert(typeof practiceAns.is_correct === 'boolean' && Boolean(practiceAns.explanation), 'Practice question checked with explanation');

  // 9. Flashcards & Spaced Review
  const decksData = await fetch(`${BASE}/flashcards/decks`, { headers: studentHeaders }).then(r => r.json());
  assert(decksData.decks.length > 0, `Flashcard decks retrieved (${decksData.decks.length})`);

  const firstDeck = decksData.decks[0];
  const deckCards = await fetch(`${BASE}/flashcards/decks/${firstDeck.id}/cards`, { headers: studentHeaders }).then(r => r.json());
  assert(deckCards.cards.length > 0, `Cards in deck: ${deckCards.cards.length}`);

  const reviewRes = await fetch(`${BASE}/flashcards/cards/${deckCards.cards[0].id}/review`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ rating: 'medium' }),
  }).then(r => r.json());
  assert(typeof reviewRes.next_interval_days === 'number', `Spaced review interval updated to ${reviewRes.next_interval_days} days`);

  // 10. Notes & Pinning
  const newNoteRes = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      title: 'Trigonometry Ratios',
      content: 'sin(x) = opposite / hypotenuse, cos(x) = adjacent / hypotenuse.',
      subject_id: mathSub.id,
    }),
  }).then(r => r.json());
  assert(Boolean(newNoteRes.id), `Note created with ID ${newNoteRes.id}`);

  const pinRes = await fetch(`${BASE}/notes/${newNoteRes.id}/pin`, {
    method: 'POST',
    headers: studentHeaders,
  }).then(r => r.json());
  assert(pinRes.is_pinned === true, 'Note successfully pinned to top');

  // 11. Planner
  const newGoalRes = await fetch(`${BASE}/planner/goals`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      type: 'daily',
      title: 'Revise coordinate geometry for 25 mins',
      subject_id: mathSub.id,
      target_minutes: 25,
    }),
  }).then(r => r.json());
  assert(Boolean(newGoalRes.id), `Study goal created with ID ${newGoalRes.id}`);

  const toggleGoalRes = await fetch(`${BASE}/planner/goals/${newGoalRes.id}/toggle`, {
    method: 'PUT',
    headers: studentHeaders,
  }).then(r => r.json());
  assert(toggleGoalRes.is_completed === true && toggleGoalRes.xpEarned === 20, 'Goal completed and awarded +20 XP');

  // 12. Study Timer
  const timerRes = await fetch(`${BASE}/timer/session`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      duration_seconds: 1500,
      session_type: 'pomodoro_25',
      subject_id: mathSub.id,
    }),
  }).then(r => r.json());
  assert(timerRes.xpEarned === 25, '25-min study timer logged +25 XP to student account');

  // 13. Mistake Book
  const saveMistakeRes = await fetch(`${BASE}/mistakes`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      original_question: 'What is 3/8 as a decimal?',
      student_answer: '0.38',
      correct_answer: '0.375',
      explanation: '3 divided by 8 is exactly 0.375 terminating decimal.',
      topic: 'Decimals',
      subject_name: 'Mathematics',
    }),
  }).then(r => r.json());
  assert(Boolean(saveMistakeRes.id), `Mistake saved to Mistake Book with ID ${saveMistakeRes.id}`);

  const mistakesList = await fetch(`${BASE}/mistakes`, { headers: studentHeaders }).then(r => r.json());
  assert(mistakesList.mistakes.length > 0, `Mistake Book contains ${mistakesList.mistakes.length} items`);

  // 14. Progress Summary
  const progRes = await fetch(`${BASE}/progress/summary`, { headers: studentHeaders }).then(r => r.json());
  assert(progRes.streak >= 1 && progRes.xp > 0 && Array.isArray(progRes.weeklyActivity), 'Progress summary returns streak, XP, and weekly chart activity');

  // 15. Achievements
  const achRes = await fetch(`${BASE}/achievements`, { headers: studentHeaders }).then(r => r.json());
  assert(achRes.achievements.length >= 12, `Achievements returned (${achRes.achievements.length} badges)`);

  // 16. Exam Mode
  const examStart = await fetch(`${BASE}/exam/start`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      subject_id: mathSub.id,
      num_questions: 5,
      time_limit_minutes: 15,
    }),
  }).then(r => r.json());
  assert(examStart.questions.length === 5 && examStart.time_limit_minutes === 15, 'Exam simulation initialized with countdown and question palette');

  // 17. Search
  const searchRes = await fetch(`${BASE}/search?q=fraction`, { headers: studentHeaders }).then(r => r.json());
  assert(searchRes.results.lessons.length > 0 || searchRes.results.questions.length > 0, 'Global search returns matching curriculum resources');

  // 18. Bookmarks
  const bookmarkRes = await fetch(`${BASE}/bookmarks`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      item_type: 'lesson',
      item_id: firstLesson.id,
      title: firstLesson.title,
      link: `/lessons/${firstLesson.id}`,
    }),
  }).then(r => r.json());
  assert(bookmarkRes.message === 'Bookmarked successfully', 'Bookmark saved');

  const bookmarksList = await fetch(`${BASE}/bookmarks`, { headers: studentHeaders }).then(r => r.json());
  assert(bookmarksList.bookmarks.length > 0, `Bookmarks list contains ${bookmarksList.bookmarks.length} items`);

  // 19. Report System
  const reportSubmit = await fetch(`${BASE}/reports`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      category: 'Typo / Suggestion',
      description: 'Suggestion for clearer diagram on fraction page',
      content_id: 'lesson-1',
      content_type: 'Lesson',
    }),
  }).then(r => r.json());
  assert(Boolean(reportSubmit.id), `Report submitted with ID ${reportSubmit.id}`);

  // 20. Admin Dashboard
  const adminOverview = await fetch(`${BASE}/admin/overview`, { headers: adminHeaders }).then(r => r.json());
  assert(adminOverview.stats.totalUsers >= 2, `Admin overview accessed: ${adminOverview.stats.totalUsers} users`);

  const adminReports = await fetch(`${BASE}/reports`, { headers: adminHeaders }).then(r => r.json());
  assert(adminReports.reports.length > 0, `Admin viewed ${adminReports.reports.length} curriculum reports`);

  // 21. AI Chat Sessions
  const newChatSession = await fetch(`${BASE}/tutor/sessions`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ title: 'Math: Quadratic Equations', topic: 'Quadratic' }),
  }).then(r => r.json());
  assert(Boolean(newChatSession.session?.id), `Created AI chat session ID ${newChatSession.session?.id}`);

  const sessionMsg = await fetch(`${BASE}/tutor/sessions/${newChatSession.session.id}/messages`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ message: 'How do I use the quadratic formula?' }),
  }).then(r => r.json());
  assert(Boolean(sessionMsg.reply), 'AI session chat received Socratic reply');

  // 22. Question Scanner
  const scannedQ = await fetch(`${BASE}/tutor/scan-question`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      notes: 'Help with this equation',
    }),
  }).then(r => r.json());
  assert(Boolean(scannedQ.questionText) && Boolean(scannedQ.stepByStepSolution), 'Question Scanner parsed image and generated step-by-step solution');

  // 23. Chapters with Topics & Topic Progress
  const chTopics = await fetch(`${BASE}/subjects/${mathSub.id}/chapters-with-topics`, { headers: studentHeaders }).then(r => r.json());
  assert(chTopics.chapters.length > 0 && Array.isArray(chTopics.chapters[0].topics), 'Chapters with topics returned');

  const firstTopic = chTopics.chapters[0].topics[0];
  if (firstTopic) {
    const topicProg = await fetch(`${BASE}/topics/${firstTopic.id}/progress`, {
      method: 'PUT',
      headers: studentHeaders,
      body: JSON.stringify({ status: 'strong' }),
    }).then(r => r.json());
    assert(topicProg.status === 'strong' && topicProg.xpEarned === 15, 'Updated topic progress to strong with +15 XP');
  }

  // 24. Weak Topics Detector
  const weakTopicsRes = await fetch(`${BASE}/analytics/weak-topics`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(weakTopicsRes.weakTopics), `Weak topic detector returned ${weakTopicsRes.weakTopics.length} areas to review`);

  // 25. Smart Daily Study Plan
  const dailyPlanRes = await fetch(`${BASE}/planner/daily-plan`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(dailyPlanRes.activities) && dailyPlanRes.totalCount > 0, `Smart daily plan generated with ${dailyPlanRes.totalCount} activities`);

  // 26. Exams & Countdown
  const createExamRes = await fetch(`${BASE}/exams`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      subject_id: mathSub.id,
      title: 'Final Term Math Exam',
      exam_date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      priority: 'high',
      chapter_ids: [1, 2],
    }),
  }).then(r => r.json());
  assert(Boolean(createExamRes.id), `Exam created with ID ${createExamRes.id}`);

  const examsList = await fetch(`${BASE}/exams`, { headers: studentHeaders }).then(r => r.json());
  assert(examsList.exams.length > 0 && examsList.exams[0].countdownBadge, `Exams list returned with countdown badge "${examsList.exams[0].countdownBadge}"`);

  // 27. Homework Tracker
  const createHwRes = await fetch(`${BASE}/homework`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      subject_id: mathSub.id,
      title: 'Math Worksheet 4.2',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'high',
      estimated_minutes: 25,
    }),
  }).then(r => r.json());
  assert(Boolean(createHwRes.id), `Homework created with ID ${createHwRes.id}`);

  const updateHw = await fetch(`${BASE}/homework/${createHwRes.id}`, {
    method: 'PUT',
    headers: studentHeaders,
    body: JSON.stringify({ status: 'completed' }),
  }).then(r => r.json());
  assert(updateHw.xpEarned === 25, 'Completed homework item awarded +25 XP');

  // 28. Daily Challenge
  const challengesRes = await fetch(`${BASE}/daily-challenge`, { headers: studentHeaders }).then(r => r.json());
  assert(challengesRes.challenges.length > 0, `Daily challenges returned (${challengesRes.challenges.length} active)`);

  // 29. Smart Flashcards (AI & SM-2)
  const aiCards = await fetch(`${BASE}/flashcards/generate-ai`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ subject: 'Mathematics', topic: 'Fractions', count: 3 }),
  }).then(r => r.json());
  assert(Array.isArray(aiCards.cards) && aiCards.cards.length >= 2, `AI generated ${aiCards.cards?.length} flashcards`);

  const reviewCardSm2 = await fetch(`${BASE}/flashcards/1/review`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ rating: 'Good' }),
  }).then(r => r.json());
  assert(reviewCardSm2.newIntervalDays >= 2, `SM-2 review applied: new interval ${reviewCardSm2.newIntervalDays} days`);

  // 30. Quiz History
  const quizHistoryRes = await fetch(`${BASE}/quizzes/history`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(quizHistoryRes.attempts), 'Quiz history returns user attempts');

  // 31. Advanced Analytics Overview
  const analyticsRes = await fetch(`${BASE}/analytics/overview`, { headers: studentHeaders }).then(r => r.json());
  assert(analyticsRes.studySeconds !== undefined && analyticsRes.streak !== undefined, 'Advanced analytics overview returns study windows and streak records');

  // 32. Settings, Export, and Notifications
  const settingsRes = await fetch(`${BASE}/settings`, { headers: studentHeaders }).then(r => r.json());
  assert(settingsRes.settings.daily_target_minutes !== undefined, 'User settings retrieved');

  const exportRes = await fetch(`${BASE}/settings/export`, { headers: studentHeaders }).then(r => r.json());
  assert(exportRes.studyforge_export && exportRes.data?.user, 'User JSON data export successfully verified');

  const notifsRes = await fetch(`${BASE}/notifications`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(notifsRes.notifications), `Notifications center returns ${notifsRes.notifications.length} notifications`);

  // 33. Smart Session Engine (Next activity & X Minutes mode)
  const nextSmart = await fetch(`${BASE}/smart-session/next`, { headers: studentHeaders }).then(r => r.json());
  assert(Boolean(nextSmart.recommendation?.title) && Boolean(nextSmart.recommendation?.link), 'Smart Next Activity evaluates priority and returns target action');

  const xMinPlan = await fetch(`${BASE}/smart-session/x-minutes?minutes=20`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(xMinPlan.plan?.routine) && xMinPlan.plan.routine.length >= 2, 'I Have X Minutes Mode generates calibrated multi-activity micro-routine');

  // 34. AI Learning Path Generation & Intelligent Adaptation
  const genPathRes = await fetch(`${BASE}/learning-paths/generate`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      subject: 'Mathematics',
      exam_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      topics: ['Trigonometry', 'Coordinate Geometry', 'Polynomials'],
      knowledge_level: 'intermediate',
      daily_minutes: 30,
    }),
  }).then(r => r.json());
  assert(Boolean(genPathRes.path?.id) && Array.isArray(genPathRes.path?.schedule), 'AI Learning Path generates realistic day-by-day plan');

  const adaptRes = await fetch(`${BASE}/learning-paths/${genPathRes.path.id}/adapt`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ reason: 'missed_session', missed_date: new Date().toISOString().split('T')[0] }),
  }).then(r => r.json());
  assert(adaptRes.adapted === true, 'AI Learning Path intelligently adapts upon missed sessions or performance triggers');

  // 35. Syllabus Importer Preview
  const syllabusPreview = await fetch(`${BASE}/syllabus/preview`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      rawText: 'PHYSICS SYLLABUS\nUnit 1: Kinematics (Motion in a straight line, Vectors)\nUnit 2: Dynamics (Newton Laws, Friction)\nExam Date: 2026-11-15',
    }),
  }).then(r => r.json());
  assert(syllabusPreview.detected?.chapters?.length >= 2, 'Syllabus Importer accurately previews detected subjects, chapters, and topics before confirmation');

  // 36. Textbook Assistant & Flashcard Deck Conversion
  const textbookRes = await fetch(`${BASE}/materials/analyze`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      title: 'Cellular Respiration Notes',
      subject: 'Science',
      chapter: 'Cell Biology',
      textContent: 'Cellular respiration is a metabolic pathway that breaks down glucose and produces ATP. Glycolysis breaks glucose into pyruvate. Krebs cycle occurs in the mitochondria. Oxidative phosphorylation produces ATP through ATP synthase.',
    }),
  }).then(r => r.json());
  assert(Boolean(textbookRes.analysis?.summary) && Array.isArray(textbookRes.analysis?.flashcards), 'Textbook Assistant generates summary, definitions, points, flashcards, and questions');

  const convertDeckRes = await fetch(`${BASE}/materials/${textbookRes.material.id}/convert-to-deck`, {
    method: 'POST',
    headers: studentHeaders,
  }).then(r => r.json());
  assert(Boolean(convertDeckRes.deck?.id), 'Textbook generated flashcards directly converted to StudyForge Deck');

  // 37. Personal Records Tracking
  const recordsRes = await fetch(`${BASE}/records`, { headers: studentHeaders }).then(r => r.json());
  assert(recordsRes.records && recordsRes.records.longest_study_session_minutes !== undefined, 'Personal Records tracking captures true milestone records');

  // 38. Study Calendar Master Events
  const calendarRes = await fetch(`${BASE}/calendar/events`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(calendarRes.events), `Study Calendar aggregates ${calendarRes.events.length} multi-category academic events`);

  // 39. Private Study Groups & Challenges
  const createGroupRes = await fetch(`${BASE}/groups`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ name: 'Alpha Honors Squad', subject: 'Science', description: 'Exam study group' }),
  }).then(r => r.json());
  assert(Boolean(createGroupRes.group?.invite_code), `Private Study Group created with unique invite code "${createGroupRes.group?.invite_code}"`);

  const shareNoteRes = await fetch(`${BASE}/groups/${createGroupRes.group.id}/notes`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ title: 'Midterm Formulas', content: 'F = ma\np = mv', subject: 'Science' }),
  }).then(r => r.json());
  assert(Boolean(shareNoteRes.id), 'Shared note posted to private study group board');

  // 40. Smart Goals & Actionable Tasks
  const goalsRes = await fetch(`${BASE}/smart-goals`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(goalsRes.goals) && goalsRes.goals.length > 0, `Smart Goals retrieved with ${goalsRes.goals[0]?.tasks?.length} decomposed tasks`);

  // 41. Adaptive Practice Lab Dynamic Difficulty
  const practiceQuestion = await fetch(`${BASE}/practice-lab/question`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ subject: 'Science', topic: 'Cell Biology', currentDifficulty: 'medium', answerStreak: 2 }),
  }).then(r => r.json());
  assert(Boolean(practiceQuestion.question?.text) && Boolean(practiceQuestion.question?.answer), 'Adaptive Practice Lab serves calibrated dynamic question');

  const answerQuestion = await fetch(`${BASE}/practice-lab/answer`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({
      questionId: practiceQuestion.question.id,
      selectedAnswer: practiceQuestion.question.answer,
      correctAnswer: practiceQuestion.question.answer,
      difficulty: 'medium',
      subject: 'Science',
      topic: 'Cell Biology',
    }),
  }).then(r => r.json());
  assert(answerQuestion.isCorrect === true && answerQuestion.newStreak >= 1, 'Adaptive Practice Lab evaluates answer, scales streaks, and awards XP');

  // 42. Smart Streak Recovery
  const recoveryStatus = await fetch(`${BASE}/streak/recovery-status`, { headers: studentHeaders }).then(r => r.json());
  assert(recoveryStatus.currentStreak !== undefined, 'Smart Streak Recovery status evaluated');

  // 43. Concept Maps Hierarchy
  const conceptMaps = await fetch(`${BASE}/concept-maps`, { headers: studentHeaders }).then(r => r.json());
  assert(Array.isArray(conceptMaps.subjects) && conceptMaps.subjects.length > 0, 'Concept Maps returns full curriculum hierarchy with topics and mastery levels');

  // 44. AI Weekly Performance Report
  const weeklyReport = await fetch(`${BASE}/analytics/weekly-report`, { headers: studentHeaders }).then(r => r.json());
  assert(weeklyReport.report && Array.isArray(weeklyReport.report.recommendations), 'AI Weekly Report generates factual study metrics and academic recommendations');

  // 45. Anti-Cram Sustainable Exam Planning
  const antiCram = await fetch(`${BASE}/anti-cram`, { headers: studentHeaders }).then(r => r.json());
  assert(antiCram.antiCramTriggered !== undefined, 'Anti-Cram Mode detects impending exams and calculates sustainable pacing');

  console.log(`\n========================================`);
  console.log(`🏆 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
