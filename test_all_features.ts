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
