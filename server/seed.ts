import bcrypt from 'bcryptjs';
import db, { initDatabase } from './db.js';

export function runSeed() {
  initDatabase();

  console.log('Seeding StudyForge database...');

  // 1. Create or verify users
  const salt = bcrypt.genSaltSync(10);
  const studentHash = bcrypt.hashSync('student123', salt);
  const adminHash = bcrypt.hashSync('admin123', salt);

  const existingStudent = db.prepare('SELECT id FROM users WHERE email = ?').get('student@studyforge.edu');
  let studentId: number;

  if (!existingStudent) {
    const info = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, grade, learning_goals, study_style, xp, level, streak, last_active_date, total_study_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?)
    `).run('Alex Morgan', 'student@studyforge.edu', studentHash, 'student', 'Grade 10', 'Master Core Concepts & Exam Prep', 'Visual & Step-by-Step', 420, 4, 5, 5400);
    studentId = Number(info.lastInsertRowid);
  } else {
    studentId = (existingStudent as { id: number }).id;
  }

  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@studyforge.edu');
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, grade, learning_goals, study_style, xp, level, streak, last_active_date, total_study_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?)
    `).run('Admin Professor', 'admin@studyforge.edu', adminHash, 'admin', 'Faculty', 'Curriculum Management', 'System Administration', 1250, 10, 14, 18000);
  }

  // 2. Achievements
  const achievements = [
    { code: 'first_lesson', title: 'First Lesson', description: 'Completed your very first lesson on StudyForge', icon: 'BookOpen', xp_reward: 50, requirement_type: 'lesson_count', requirement_value: 1 },
    { code: 'first_quiz', title: 'First Quiz', description: 'Attempted and submitted your first quiz', icon: 'Award', xp_reward: 75, requirement_type: 'quiz_count', requirement_value: 1 },
    { code: 'perfect_score', title: 'First Perfect Score', description: 'Scored 100% accuracy on a quiz or test', icon: 'Zap', xp_reward: 150, requirement_type: 'perfect_quiz', requirement_value: 1 },
    { code: 'ten_quizzes', title: '10 Quizzes Completed', description: 'Completed 10 comprehensive quizzes', icon: 'Target', xp_reward: 200, requirement_type: 'quiz_count', requirement_value: 10 },
    { code: 'hundred_questions', title: '100 Questions Answered', description: 'Answered over 100 practice and quiz questions', icon: 'CheckCircle2', xp_reward: 300, requirement_type: 'question_count', requirement_value: 100 },
    { code: 'first_deck', title: 'First Flashcard Deck', description: 'Created or studied a complete flashcard deck', icon: 'Layers', xp_reward: 50, requirement_type: 'deck_count', requirement_value: 1 },
    { code: 'streak_7', title: '7-Day Study Streak', description: 'Studied consistently for 7 straight days', icon: 'Flame', xp_reward: 250, requirement_type: 'streak_days', requirement_value: 7 },
    { code: 'streak_30', title: '30-Day Study Streak', description: 'Maintained a month of non-stop learning habits', icon: 'Trophy', xp_reward: 500, requirement_type: 'streak_days', requirement_value: 30 },
    { code: 'complete_chapter', title: 'Complete a Chapter', description: 'Finished all topics and lessons in a chapter', icon: 'Compass', xp_reward: 150, requirement_type: 'chapter_complete', requirement_value: 1 },
    { code: 'complete_subject', title: 'Complete a Subject', description: 'Mastered all chapters within a subject', icon: 'GraduationCap', xp_reward: 350, requirement_type: 'subject_complete', requirement_value: 1 },
    { code: 'study_10h', title: 'Study for 10 Hours', description: 'Accumulated 10 hours of focused study time', icon: 'Clock', xp_reward: 300, requirement_type: 'study_hours', requirement_value: 10 },
    { code: 'study_25h', title: 'Study for 25 Hours', description: 'Deep dedication: 25 hours logged on StudyForge', icon: 'Sparkles', xp_reward: 600, requirement_type: 'study_hours', requirement_value: 25 },
  ];

  const insertAch = db.prepare(`
    INSERT OR IGNORE INTO achievements (code, title, description, icon, xp_reward, requirement_type, requirement_value)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ach of achievements) {
    insertAch.run(ach.code, ach.title, ach.description, ach.icon, ach.xp_reward, ach.requirement_type, ach.requirement_value);
  }

  // Grant First Lesson and First Quiz to student user
  const firstLessonAch = db.prepare('SELECT id FROM achievements WHERE code = ?').get('first_lesson') as { id: number } | undefined;
  if (firstLessonAch) {
    db.prepare('INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(studentId, firstLessonAch.id);
  }

  // 3. Subjects
  const subjectsData = [
    {
      name: 'Mathematics',
      code: 'MATH',
      description: 'Master algebra, arithmetic, geometry, trigonometry, and analytical problem-solving.',
      icon: 'Calculator',
      grade_level: 'Grade 8 - 12',
      color: 'indigo',
    },
    {
      name: 'Science',
      code: 'SCI',
      description: 'Explore the fundamental principles of Physics, Chemistry, and Biological systems.',
      icon: 'Atom',
      grade_level: 'Grade 8 - 12',
      color: 'emerald',
    },
    {
      name: 'English',
      code: 'ENG',
      description: 'Develop mastery in grammar, rhetorical analysis, creative composition, and literature.',
      icon: 'BookOpen',
      grade_level: 'Grade 8 - 12',
      color: 'amber',
    },
    {
      name: 'Hindi',
      code: 'HIN',
      description: 'हिंदी भाषा, व्याकरण, मुहावरे, साहित्य और गद्य-पद्य का व्यापक अध्ययन।',
      icon: 'Languages',
      grade_level: 'Grade 8 - 12',
      color: 'rose',
    },
    {
      name: 'Social Science',
      code: 'SOC',
      description: 'Understand civilizations, world history, physical geography, democratic institutions, and economics.',
      icon: 'Globe2',
      grade_level: 'Grade 8 - 12',
      color: 'blue',
    },
    {
      name: 'Computer Science',
      code: 'CS',
      description: 'Learn computational thinking, Python coding, data structures, algorithms, and web technologies.',
      icon: 'Code2',
      grade_level: 'Grade 8 - 12',
      color: 'purple',
    },
  ];

  const insertSub = db.prepare(`
    INSERT OR IGNORE INTO subjects (name, code, description, icon, grade_level, color, is_custom)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);

  for (const s of subjectsData) {
    insertSub.run(s.name, s.code, s.description, s.icon, s.grade_level, s.color);
  }

  // Link subjects to student
  const allSubs = db.prepare('SELECT id FROM subjects').all() as { id: number }[];
  const insertUserSub = db.prepare('INSERT OR IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)');
  for (const sub of allSubs) {
    insertUserSub.run(studentId, sub.id);
  }

  // 4. Chapters & Lessons
  const getSubByCode = db.prepare('SELECT id FROM subjects WHERE code = ?');
  const mathSub = getSubByCode.get('MATH') as { id: number };
  const sciSub = getSubByCode.get('SCI') as { id: number };
  const engSub = getSubByCode.get('ENG') as { id: number };
  const hinSub = getSubByCode.get('HIN') as { id: number };
  const socSub = getSubByCode.get('SOC') as { id: number };
  const csSub = getSubByCode.get('CS') as { id: number };

  const insertChapter = db.prepare(`
    INSERT OR IGNORE INTO chapters (subject_id, title, order_num, description)
    VALUES (?, ?, ?, ?)
  `);

  const insertLesson = db.prepare(`
    INSERT OR IGNORE INTO lessons (chapter_id, title, summary, content_markdown, order_num, estimated_minutes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // --- Mathematics Chapters & Lessons ---
  if (mathSub) {
    const c1 = insertChapter.run(mathSub.id, 'Fractions and Decimals', 1, 'Foundational arithmetic with rational numbers, mixed fractions, decimal conversions, and percent ratios.');
    const c1Id = Number(c1.lastInsertRowid);

    insertLesson.run(
      c1Id,
      'Operations with Proper & Improper Fractions',
      'Learn how to add, subtract, multiply, and divide fractions with like and unlike denominators.',
      `# Operations with Proper and Improper Fractions

Fractions represent parts of a whole or ratios between quantities. In algebra and everyday problem solving, fractions are fundamental.

## 1. Key Definitions
- **Numerator ($a$)**: The top number indicating how many parts you have.
- **Denominator ($b$)**: The bottom number representing the total equal divisions ($b \\neq 0$).
- **Proper Fraction**: The numerator is strictly less than the denominator ($3/4, 5/8$).
- **Improper Fraction**: The numerator is greater than or equal to the denominator ($7/3, 9/4$).
- **Mixed Number**: A whole number combined with a fraction ($2\\frac{1}{3} = \\frac{7}{3}$).

## 2. Addition and Subtraction with Unlike Denominators
To add or subtract fractions with different denominators, you must find the **Least Common Denominator (LCD)**:

$$\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}$$

### Step-by-Step Example:
Evaluate $\\frac{2}{3} + \\frac{5}{6}$:
1. Find the LCM of 3 and 6: $\\text{LCM}(3, 6) = 6$.
2. Convert $\\frac{2}{3}$ to an equivalent fraction: $\\frac{2 \\times 2}{3 \\times 2} = \\frac{4}{6}$.
3. Add the numerators: $\\frac{4 + 5}{6} = \\frac{9}{6}$.
4. Simplify by dividing by $\\gcd(9,6) = 3$: $\\frac{3}{2}$ or $1\\frac{1}{2}$.

## 3. Multiplication of Fractions
Multiplying fractions is straightforward: multiply numerators across, and denominators across.
$$\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}$$
*Tip: Cross-cancel common factors before multiplying to keep numbers manageable!*

## 4. Division: The Reciprocal Rule ("Keep, Change, Flip")
To divide by a fraction, multiply by its reciprocal:
$$\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c} = \\frac{ad}{bc}$$

### Quick Check Takeaways:
- Never add denominators together!
- Always express final results in simplest irreducible form.`,
      1,
      15
    );

    insertLesson.run(
      c1Id,
      'Decimals, Repeating Decimals & Percentages',
      'Convert fluidly between decimal values, fractions, and percentage rates with real-world precision.',
      `# Decimals, Repeating Decimals and Percentages

Decimals are another notation for expressing fractional quantities using base-10 positional notation.

## 1. Place Value System
- Tenths: $0.1 = \\frac{1}{10}$
- Hundredths: $0.01 = \\frac{1}{100}$
- Thousandths: $0.001 = \\frac{1}{1000}$

## 2. Converting Fractions to Decimals
Divide the numerator by the denominator using long division:
- **Terminating Decimals**: Division ends with a remainder of 0 (e.g., $\\frac{3}{8} = 0.375$).
- **Repeating / Periodic Decimals**: A digit or block of digits repeats infinitely (e.g., $\\frac{1}{3} = 0.\\overline{3}$, $\\frac{2}{11} = 0.\\overline{18}$).

## 3. Connecting to Percentages
A percentage simply means "per hundred":
$$\\text{Percent} = \\text{Decimal} \\times 100\\%$$
- Example: $0.625 = 62.5\\% = \\frac{625}{1000} = \\frac{5}{8}$.

### Real-World Application:
When calculating a $15\\%$ tip on a \\$48 bill:
$$\\text{Tip} = 48 \\times 0.15 = 48 \\times \\frac{3}{20} = \\$7.20$$
Total amount = $\\$48 + \\$7.20 = \\$55.20$.`,
      2,
      12
    );

    const c2 = insertChapter.run(mathSub.id, 'Algebra & Linear Equations', 2, 'Solving single and multi-variable equations, isolating terms, graphing linear slopes, and real-world modeling.');
    const c2Id = Number(c2.lastInsertRowid);

    insertLesson.run(
      c2Id,
      'Solving Linear Equations in One Variable',
      'Understand balance method, inverse operations, and algebraic transposition.',
      `# Solving Linear Equations in One Variable

A linear equation in one variable is an equality of the general form:
$$ax + b = c \\quad (a \\neq 0)$$

## 1. The Principle of Golden Balance
Whatever operation you perform on the left-hand side (LHS) of the equals sign, you must simultaneously perform on the right-hand side (RHS).

## 2. Standard 4-Step Strategy
1. **Clear Fractions or Parentheses**: Use the distributive property: $a(b + c) = ab + ac$.
2. **Combine Like Terms**: Group variable terms and constant terms on their respective sides.
3. **Isolate the Variable Term**: Add or subtract constants across the equality.
4. **Isolate the Variable**: Multiply or divide by the coefficient of $x$.

### Walkthrough Example:
Solve $4(2x - 3) + 7 = 3x + 20$:
- Expand brackets: $8x - 12 + 7 = 3x + 20$
- Combine constants: $8x - 5 = 3x + 20$
- Subtract $3x$ from both sides: $5x - 5 = 20$
- Add 5 to both sides: $5x = 25$
- Divide by 5: $x = 5$

**Check your answer:**
LHS: $4(2(5) - 3) + 7 = 4(7) + 7 = 28 + 7 = 35$.
RHS: $3(5) + 20 = 15 + 20 = 35$. Both match!`,
      1,
      18
    );

    const c3 = insertChapter.run(mathSub.id, 'Geometry & Coordinate Plane', 3, 'Geometric theorems, angles, Cartesian coordinate systems, and distance/slope formulas.');
    const c3Id = Number(c3.lastInsertRowid);

    insertLesson.run(
      c3Id,
      'Pythagorean Theorem and Distance Formula',
      'Connecting Euclidean geometry triangles to Cartesian coordinate distance calculations.',
      `# Pythagorean Theorem & The Coordinate Distance Formula

For any right-angled triangle with perpendicular legs $a$ and $b$, and hypotenuse $c$:
$$a^2 + b^2 = c^2$$

## 1. Pythagorean Triples
Memorizing common integer triplets saves valuable exam time:
- $(3, 4, 5)$
- $(5, 12, 13)$
- $(8, 15, 17)$
- $(7, 24, 25)$

## 2. Deriving the Distance Formula
In a 2D Cartesian plane between two points $P_1(x_1, y_1)$ and $P_2(x_2, y_2)$:
- Horizontal distance $\\Delta x = x_2 - x_1$
- Vertical distance $\\Delta y = y_2 - y_1$

By the Pythagorean theorem:
$$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$`,
      1,
      15
    );
  }

  // --- Science Chapters & Lessons ---
  if (sciSub) {
    const sc1 = insertChapter.run(sciSub.id, 'Physics: Laws of Motion & Energy', 1, 'Newtonian mechanics, inertia, acceleration, friction, kinetic and potential energy conservation.');
    const sc1Id = Number(sc1.lastInsertRowid);

    insertLesson.run(
      sc1Id,
      "Newton's Three Laws of Motion",
      'A deep dive into inertia, force vectors ($F = ma$), and reciprocal action-reaction forces.',
      `# Newton's Three Laws of Motion

Isaac Newton formulated three universal laws of motion in 1687 that form the foundation of classical mechanics.

## 1. First Law: The Law of Inertia
> *An object at rest stays at rest, and an object in uniform motion remains in motion along a straight line unless acted upon by an external net unbalanced force.*

- **Inertia** is the natural tendency of an object to resist changes in its state of motion.
- Mass is the quantitative measure of inertia (higher mass = higher inertia).

## 2. Second Law: Force and Acceleration
> *The net acceleration of an object is directly proportional to the net force acting upon it and inversely proportional to its mass.*

$$\\vec{F}_{\\text{net}} = m \\cdot \\vec{a}$$

- Units: Force in Newtons ($N = \\text{kg} \\cdot \\text{m/s}^2$).
- If mass is constant, doubling the applied force doubles the acceleration.

## 3. Third Law: Action and Reaction
> *For every action force, there is an equal in magnitude and opposite in direction reaction force.*

$$\\vec{F}_{A \\rightarrow B} = -\\vec{F}_{B \\rightarrow A}$$

*Crucial Concept:* Action and reaction forces act on **two different objects**, which is why they never cancel each other out!`,
      1,
      18
    );

    const sc2 = insertChapter.run(sciSub.id, 'Chemistry: Periodic Table & Chemical Bonding', 2, 'Atomic structure, electron shells, periodic trends, ionic vs covalent bonds, and stoichiometry.');
    const sc2Id = Number(sc2.lastInsertRowid);

    insertLesson.run(
      sc2Id,
      'Atomic Structure and Electron Configurations',
      'Protons, neutrons, electrons, valence shells, and the octet rule.',
      `# Atomic Structure and Electron Configurations

All matter consists of atoms — the basic units of chemical elements.

## 1. Subatomic Particles
- **Proton ($p^+$)**: Relative mass $\\approx 1$, charge $+1$, located in nucleus.
- **Neutron ($n^0$)**: Relative mass $\\approx 1$, charge $0$, located in nucleus.
- **Electron ($e^-$)**: Relative mass $\\approx 1/1836$, charge $-1$, located in orbitals.

## 2. Atomic Number ($Z$) and Mass Number ($A$)
- **Atomic Number ($Z$)**: Number of protons in the nucleus (defines the element identity).
- **Mass Number ($A$)**: Sum of protons and neutrons ($A = Z + N$).

## 3. The Octet Rule
Atoms tend to gain, lose, or share electrons to achieve a stable valence shell of 8 electrons (mimicking noble gas electron configurations).
- **Covalent Bonding**: Mutual sharing of electron pairs (e.g., $H_2O, CO_2$).
- **Ionic Bonding**: Complete transfer of electrons yielding cations ($+$) and anions ($-$) (e.g., $NaCl$).`,
      1,
      16
    );

    const sc3 = insertChapter.run(sciSub.id, 'Biology: Cell Biology & Genetics', 3, 'Organelles, membrane transport, DNA double-helix structure, mitosis, and Mendelian inheritance.');
    const sc3Id = Number(sc3.lastInsertRowid);

    insertLesson.run(
      sc3Id,
      'Cellular Architecture: Plant vs Animal Cells',
      'Nucleus, mitochondria, chloroplasts, ribosomes, and the semi-permeable cell membrane.',
      `# Cellular Architecture: Plant vs Animal Cells

The cell is the structural and functional unit of all living organisms.

## 1. Shared Organelles
- **Nucleus**: Houses chromatin (DNA) and directs synthesis of RNA and proteins.
- **Mitochondria**: The powerhouse of the cell; produces ATP via aerobic cellular respiration.
- **Ribosomes**: Protein factories translating mRNA into peptide chains.
- **Endoplasmic Reticulum (Rough & Smooth)**: Protein folding and lipid synthesis.
- **Golgi Apparatus**: Packages, modifies, and sorts macromolecules for transport.

## 2. Key Differences
| Feature | Plant Cell | Animal Cell |
|---|---|---|
| Cell Wall | Present (Cellulose) | Absent |
| Chloroplasts | Present (Photosynthesis) | Absent |
| Vacuole | Large central vacuole | Small, temporary vacuoles |
| Centrioles | Absent in most | Present (Aids cell division) |`,
      1,
      15
    );
  }

  // --- Computer Science Chapters & Lessons ---
  if (csSub) {
    const cs1 = insertChapter.run(csSub.id, 'Python Programming Foundations', 1, 'Syntax, variables, conditionals, loops, functions, lists, dictionaries, and debugging.');
    const cs1Id = Number(cs1.lastInsertRowid);

    insertLesson.run(
      cs1Id,
      'Control Flow, Loops, and Functions in Python',
      'Master indentation, if-elif-else branching, for/while loops, and modular function definitions.',
      `# Control Flow, Loops, and Functions in Python

Python is celebrated for its clean, human-readable syntax and powerful expressive semantics.

## 1. Conditional Logic
\`\`\`python
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
else:
    grade = "C"

print(f"Student grade: {grade}")
\`\`\`

## 2. Iteration: For and While Loops
\`\`\`python
# Iterating over sequences
topics = ["Algebra", "Kinematics", "Syntax"]
for index, topic in enumerate(topics, start=1):
    print(f"Topic {index}: {topic}")

# While loop with counter
countdown = 3
while countdown > 0:
    print(countdown)
    countdown -= 1
\`\`\`

## 3. Defining Functions
Functions promote the DRY (*Don't Repeat Yourself*) engineering principle:
\`\`\`python
def calculate_grade_xp(correct_answers: int, total_questions: int) -> int:
    """Calculates reward XP scaled to accuracy percentage."""
    if total_questions == 0:
        return 0
    accuracy = correct_answers / total_questions
    base_xp = 50
    return int(base_xp * (1 + accuracy))
\`\`\`

### Best Practices:
- Always use type hints for clarity.
- Write descriptive docstrings.
- Keep functions small and single-responsibility.`,
      1,
      20
    );

    const cs2 = insertChapter.run(csSub.id, 'Algorithms & Data Structures', 2, 'Big-O notation, linear search, binary search, sorting algorithms, and complexity analysis.');
    const cs2Id = Number(cs2.lastInsertRowid);

    insertLesson.run(
      cs2Id,
      'Binary Search and Asymptotic Complexity (Big-O)',
      'Understanding logarithmic time efficiency $O(\\log n)$ versus linear scanning $O(n)$.',
      `# Binary Search & Big-O Complexity

When designing software, execution efficiency determines scalability.

## 1. What is Big-O Notation?
Big-O characterizes how runtime or memory consumption scales as input size $n$ grows toward infinity:
- $O(1)$: Constant time (Dictionary key lookup)
- $O(\\log n)$: Logarithmic time (Binary Search)
- $O(n)$: Linear time (Single loop scan)
- $O(n \\log n)$: Linearithmic time (Merge Sort, Timsort)
- $O(n^2)$: Quadratic time (Nested loops, Bubble Sort)

## 2. Binary Search Algorithm
Binary search operates on **already sorted** arrays by repeatedly halving the search interval:

\`\`\`python
def binary_search(arr: list[int], target: int) -> int:
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        guess = arr[mid]
        
        if guess == target:
            return mid # Found index
        elif guess < target:
            low = mid + 1 # Search right half
        else:
            high = mid - 1 # Search left half
            
    return -1 # Not found
\`\`\`

For an array of $1,000,000$ sorted elements, linear search takes up to $1,000,000$ comparisons; binary search takes at most $\\approx 20$ comparisons!`,
      1,
      18
    );
  }

  // --- English Chapters & Lessons ---
  if (engSub) {
    const e1 = insertChapter.run(engSub.id, 'Grammar, Style & Rhetoric', 1, 'Sentence syntax, active vs passive voice, parallel structure, and persuasive writing techniques.');
    const e1Id = Number(e1.lastInsertRowid);

    insertLesson.run(
      e1Id,
      'Active vs Passive Voice & Precise Sentence Structure',
      'Strengthen academic and argumentative essays by transforming sluggish passive phrasing.',
      `# Active vs. Passive Voice in Academic Writing

In English syntax, the choice of voice dictates sentence energy, clarity, and accountability.

## 1. The Active Voice
In active voice, the subject performs the action expressed by the verb:
- **Formula**: Subject + Verb + Object
- *Example*: "The biologist discovered a novel enzyme." (Crisp, direct, vigorous).

## 2. The Passive Voice
In passive voice, the subject receives the action:
- **Formula**: Object + form of 'to be' + Past Participle (+ by Agent)
- *Example*: "A novel enzyme was discovered by the biologist."

## When to Use Which?
- **Active Voice**: Ideal for narrative clarity, thesis assertions, and persuasive arguments.
- **Passive Voice**: Legitimate when the agent of action is unknown or unimportant (e.g., "The sample was sterilized at 120°C").`,
      1,
      14
    );
  }

  // --- Hindi Chapters & Lessons ---
  if (hinSub) {
    const h1 = insertChapter.run(hinSub.id, 'हिंदी व्याकरण एवं भाषा ज्ञान', 1, 'संज्ञा, सर्वनाम, विशेषण, संधि, समास, मुहावरे और लोकोक्तियों का गहन अभ्यास।');
    const h1Id = Number(h1.lastInsertRowid);

    insertLesson.run(
      h1Id,
      'संधि एवं समास: नियम एवं उदाहरण',
      'स्वर, व्यंजन एवं विसर्ग संधि के मूलभूत नियम तथा समास के छह प्रमुख भेद।',
      `# संधि एवं समास के मूलभूत नियम

हिंदी भाषा में शब्दों की रचना और संक्षेपण के लिए संधि और समास दो अत्यंत महत्वपूर्ण प्रक्रियाएँ हैं।

## 1. संधि (Sandhi)
दो वर्णों के परस्पर मेल से जो विकार (परिवर्तन) उत्पन्न होता है, उसे **संधि** कहते हैं।
- **स्वर संधि**: दो स्वरों का मेल (जैसे: हिम + आलय = हिमालय)
- **व्यंजन संधि**: व्यंजन का स्वर या व्यंजन से मेल (जैसे: सत् + जन = सज्जन)
- **विसर्ग संधि**: विसर्ग के साथ स्वर या व्यंजन का मेल (जैसे: मनः + रथ = मनोरथ)

## 2. समास (Samas)
दो या दो से अधिक शब्दों के मेल से नए सार्थक शब्द बनाने की क्रिया को **समास** कहते हैं।
- **तत्पुरुष समास**: उत्तरपद प्रधान (जैसे: राजपुत्र = राजा का पुत्र)
- **द्वंद्व समास**: दोनों पद समान प्रधान (जैसे: माता-पिता, दिन-रात)
- **द्विगु समास**: प्रथम पद संख्यावाचक (जैसे: त्रिफला, चौराहा)
- **बहुव्रीहि समास**: कोई अन्य अर्थ प्रधान (जैसे: दशानन = रावण)

### परीक्षा हेतु उपयोगी बिंदु:
संधि में दो वर्णों का मेल होता है, जबकि समास में दो शब्दों का संक्षिप्तिकरण होता है।`,
      1,
      16
    );
  }

  // --- Social Science Chapters & Lessons ---
  if (socSub) {
    const s1 = insertChapter.run(socSub.id, 'World History & Modern Civilizations', 1, 'The Industrial Revolution, Democratic revolutions, World Wars, and global diplomacy.');
    const s1Id = Number(s1.lastInsertRowid);

    insertLesson.run(
      s1Id,
      'The Industrial Revolution & Global Transformation',
      'Steam power, urbanization, labor movements, and the shifts in global manufacturing.',
      `# The Industrial Revolution & Global Transformation

Beginning in Britain during the mid-18th century, the Industrial Revolution fundamentally restructured human society, work, and geopolitics.

## 1. Technological Catalysts
- **James Watt's Steam Engine**: Liberated factories from river locations, allowing urban industrial clustering.
- **Textile Mechanization**: Hargreaves' Spinning Jenny and Arkwright's Water Frame multiplied output tenfold.
- **Railroads & Locomotive Transit**: Slashed shipping overhead and unified national markets.

## 2. Socio-Economic Impacts
- **Urbanization**: Mass migration from agrarian villages to dense manufacturing cities like Manchester.
- **Labor Conditions**: Emergence of trade unions, minimum wage laws, and compulsory childhood education statutes.`,
      1,
      15
    );
  }

  // Mark first lesson as completed by student
  const firstL = db.prepare('SELECT id FROM lessons LIMIT 1').get() as { id: number } | undefined;
  if (firstL) {
    db.prepare(`
      INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id, completed, completed_at)
      VALUES (?, ?, 1, datetime('now'))
    `).run(studentId, firstL.id);
  }

  // 5. Questions Bank (Rich question bank for Quizzes and Practice Mode)
  const mathChapter = db.prepare('SELECT id FROM chapters WHERE subject_id = ? LIMIT 1').get(mathSub.id) as { id: number };
  const sciChapter = db.prepare('SELECT id FROM chapters WHERE subject_id = ? LIMIT 1').get(sciSub.id) as { id: number };
  const csChapter = db.prepare('SELECT id FROM chapters WHERE subject_id = ? LIMIT 1').get(csSub.id) as { id: number };
  const engChapter = db.prepare('SELECT id FROM chapters WHERE subject_id = ? LIMIT 1').get(engSub.id) as { id: number };

  const insertQ = db.prepare(`
    INSERT INTO questions (subject_id, chapter_id, question_text, type, options_json, correct_answer, explanation, difficulty, topic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const existingQCount = (db.prepare('SELECT count(*) as count FROM questions').get() as { count: number }).count;

  if (existingQCount === 0) {
    // Math questions
    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'What is the result of 2/3 + 5/6 expressed in simplest form?',
      'multiple_choice',
      JSON.stringify(['7/9', '3/2', '9/6', '1/2']),
      '3/2',
      'The common denominator is 6. 2/3 is equivalent to 4/6. Adding gives 4/6 + 5/6 = 9/6 = 3/2.',
      'easy',
      'Fractions'
    );

    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'Convert the fraction 3/8 into an exact decimal.',
      'multiple_choice',
      JSON.stringify(['0.375', '0.38', '0.325', '0.425']),
      '0.375',
      'Dividing 3 by 8 yields 0.375 terminating decimal.',
      'easy',
      'Decimals'
    );

    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'Solve for x in the linear equation: 4(2x - 3) + 7 = 3x + 20',
      'multiple_choice',
      JSON.stringify(['x = 3', 'x = 4', 'x = 5', 'x = 6']),
      'x = 5',
      '8x - 12 + 7 = 3x + 20 => 8x - 5 = 3x + 20 => 5x = 25 => x = 5.',
      'medium',
      'Algebra'
    );

    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'True or False: The Pythagorean theorem a^2 + b^2 = c^2 applies to all triangles regardless of angles.',
      'true_false',
      JSON.stringify(['True', 'False']),
      'False',
      'The Pythagorean theorem only holds strictly for right-angled triangles where one angle is 90 degrees.',
      'easy',
      'Geometry'
    );

    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'In a right triangle with legs of length 6 and 8, what is the length of the hypotenuse?',
      'fill_blank',
      JSON.stringify([]),
      '10',
      'By the Pythagorean theorem: sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10.',
      'easy',
      'Geometry'
    );

    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'What is the slope of the line passing through points (2, 3) and (6, 11)?',
      'short_answer',
      JSON.stringify([]),
      '2',
      'Slope m = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.',
      'medium',
      'Coordinate Geometry'
    );

    insertQ.run(
      mathSub.id,
      mathChapter?.id || null,
      'If 3x + 2y = 12 and y = 3, what is the value of x?',
      'multiple_choice',
      JSON.stringify(['1', '2', '3', '4']),
      '2',
      'Substitute y = 3: 3x + 2(3) = 12 => 3x + 6 = 12 => 3x = 6 => x = 2.',
      'easy',
      'Linear Systems'
    );

    // Science questions
    insertQ.run(
      sciSub.id,
      sciChapter?.id || null,
      "According to Newton's Second Law, if you double the net force on an object of fixed mass, what happens to its acceleration?",
      'multiple_choice',
      JSON.stringify(['It remains unchanged', 'It is cut in half', 'It doubles', 'It quadruples']),
      'It doubles',
      'F = m * a. Since acceleration a = F/m, doubling F doubles a when mass m is constant.',
      'easy',
      'Physics: Mechanics'
    );

    insertQ.run(
      sciSub.id,
      sciChapter?.id || null,
      'True or False: Action and reaction force pairs cancel each other out because they are equal and opposite.',
      'true_false',
      JSON.stringify(['True', 'False']),
      'False',
      'Action and reaction forces act on two entirely distinct bodies, so they cannot cancel each other.',
      'medium',
      'Physics: Dynamics'
    );

    insertQ.run(
      sciSub.id,
      sciChapter?.id || null,
      'Which cellular organelle is responsible for synthesizing ATP through aerobic cellular respiration?',
      'multiple_choice',
      JSON.stringify(['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Lysosome']),
      'Mitochondria',
      'Mitochondria are the primary biochemical power plants of eukaryotic cells producing ATP.',
      'easy',
      'Biology: Cell Structure'
    );

    insertQ.run(
      sciSub.id,
      sciChapter?.id || null,
      'What type of chemical bond is formed when one atom completely transfers valence electrons to another?',
      'multiple_choice',
      JSON.stringify(['Covalent bond', 'Ionic bond', 'Hydrogen bond', 'Metallic bond']),
      'Ionic bond',
      'Ionic bonding occurs when electrons are transferred from a metal to a nonmetal, forming oppositely charged ions.',
      'easy',
      'Chemistry: Bonding'
    );

    insertQ.run(
      sciSub.id,
      sciChapter?.id || null,
      'What is the chemical symbol for Potassium?',
      'fill_blank',
      JSON.stringify([]),
      'K',
      'The chemical symbol for Potassium is K, derived from the Neo-Latin word Kalium.',
      'easy',
      'Chemistry: Periodic Table'
    );

    // Computer Science questions
    insertQ.run(
      csSub.id,
      csChapter?.id || null,
      'What is the worst-case time complexity of Binary Search on a sorted array of size n?',
      'multiple_choice',
      JSON.stringify(['O(1)', 'O(log n)', 'O(n)', 'O(n^2)']),
      'O(log n)',
      'Binary search halves the candidate search window on each iteration, achieving logarithmic O(log n) time.',
      'easy',
      'Algorithms'
    );

    insertQ.run(
      csSub.id,
      csChapter?.id || null,
      'In Python, which built-in data structure stores key-value pairs with O(1) average lookup time?',
      'multiple_choice',
      JSON.stringify(['list', 'tuple', 'dict', 'set']),
      'dict',
      'Python dictionaries (dict) use hash tables internally to provide O(1) average time complexity for lookups.',
      'easy',
      'Python Data Structures'
    );

    insertQ.run(
      csSub.id,
      csChapter?.id || null,
      'True or False: Python lists are immutable data structures.',
      'true_false',
      JSON.stringify(['True', 'False']),
      'False',
      'Python lists are mutable (elements can be appended, modified, or removed). Tuples are immutable.',
      'easy',
      'Python Basics'
    );

    insertQ.run(
      csSub.id,
      csChapter?.id || null,
      'What keyword is used to define a function in Python?',
      'fill_blank',
      JSON.stringify([]),
      'def',
      'The def keyword introduces a function definition in Python.',
      'easy',
      'Python Syntax'
    );

    // English questions
    insertQ.run(
      engSub.id,
      engChapter?.id || null,
      'Identify the voice used in the sentence: "The novel was written by Gabriel García Márquez."',
      'multiple_choice',
      JSON.stringify(['Active Voice', 'Passive Voice', 'Imperative Voice', 'Subjunctive Voice']),
      'Passive Voice',
      'The subject (the novel) receives the action performed by the agent (Gabriel García Márquez).',
      'easy',
      'Grammar & Syntax'
    );

    insertQ.run(
      engSub.id,
      engChapter?.id || null,
      'What rhetorical device involves a direct comparison using "like" or "as"?',
      'multiple_choice',
      JSON.stringify(['Metaphor', 'Simile', 'Hyperbole', 'Personification']),
      'Simile',
      'A simile explicitly compares two different concepts using connecting words like "like" or "as".',
      'easy',
      'Literary Devices'
    );
  }

  // 6. Flashcard Decks & Cards
  const mathDeck = db.prepare(`
    INSERT INTO flashcard_decks (user_id, subject_id, title, description)
    VALUES (?, ?, ?, ?)
  `).run(null, mathSub.id, 'Essential Math Formulas & Rules', 'Master fractions, algebraic properties, and coordinate plane formulas.');
  const mathDeckId = Number(mathDeck.lastInsertRowid);

  const insertCard = db.prepare(`
    INSERT INTO flashcards (deck_id, front, back, difficulty, repetitions, interval_days, next_review_date, last_reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, date('now'), datetime('now'))
  `);

  insertCard.run(mathDeckId, 'Least Common Denominator (LCD) of 3 and 6?', '6', 'easy', 2, 3);
  insertCard.run(mathDeckId, 'Pythagorean Theorem formula?', 'a² + b² = c² (for right triangles)', 'easy', 3, 5);
  insertCard.run(mathDeckId, 'Distance formula between (x₁, y₁) and (x₂, y₂)?', 'd = √[(x₂ - x₁)² + (y₂ - y₁)²]', 'medium', 1, 1);
  insertCard.run(mathDeckId, 'Slope formula (m) between two points?', 'm = (y₂ - y₁) / (x₂ - x₁)', 'easy', 2, 2);
  insertCard.run(mathDeckId, 'Reciprocal rule for fraction division (a/b ÷ c/d)?', 'a/b × d/c = ad/bc ("Keep, Change, Flip")', 'medium', 1, 1);

  const csDeck = db.prepare(`
    INSERT INTO flashcard_decks (user_id, subject_id, title, description)
    VALUES (?, ?, ?, ?)
  `).run(null, csSub.id, 'Python & Big-O Quick Review', 'Fundamental complexity classes, built-in types, and methods.');
  const csDeckId = Number(csDeck.lastInsertRowid);

  insertCard.run(csDeckId, 'Binary Search Time Complexity?', 'O(log n) in both average and worst cases.', 'easy', 2, 3);
  insertCard.run(csDeckId, 'Difference between List and Tuple in Python?', 'Lists are mutable [1, 2]; Tuples are immutable (1, 2).', 'medium', 1, 1);
  insertCard.run(csDeckId, 'Time complexity of dict key lookup in Python?', 'O(1) average time via hash table indexing.', 'easy', 3, 5);

  // 7. Student Notes
  const existingNotes = (db.prepare('SELECT count(*) as count FROM notes WHERE user_id = ?').get(studentId) as { count: number }).count;
  if (existingNotes === 0) {
    db.prepare(`
      INSERT INTO notes (user_id, subject_id, chapter_id, title, content, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(
      studentId,
      mathSub.id,
      mathChapter?.id || null,
      'Summary Notes: Fractions & Decimals Review',
      `## Key Formulae to Remember for the Test:
- **Adding fractions with different denominators**: Find LCD first. Never add denominators directly!
- **Keep Change Flip**: $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}$
- **Common conversions**:
  - $1/4 = 0.25 = 25\\%$
  - $1/2 = 0.50 = 50\\%$
  - $3/4 = 0.75 = 75\\%$
  - $1/8 = 0.125 = 12.5\\%$
  - $3/8 = 0.375 = 37.5\\%$

### Study Goal:
Review practice problems for algebraic equations tomorrow before the quiz!`
    );

    db.prepare(`
      INSERT INTO notes (user_id, subject_id, chapter_id, title, content, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
    `).run(
      studentId,
      csSub.id,
      csChapter?.id || null,
      'Python Big-O and Algorithm Cheatsheet',
      `### Asymptotic Hierarchy
- $O(1)$: Instant hash lookup
- $O(\\log n)$: Binary search (halves space every step)
- $O(n)$: Single for loop scan
- $O(n \\log n)$: Optimal comparison sorts (Merge sort, Tim sort)
- $O(n^2)$: Nested loop brute force

Remember: Arrays MUST be sorted before binary search can work!`
    );
  }

  // 8. Planner Goals
  const existingGoals = (db.prepare('SELECT count(*) as count FROM planner_goals WHERE user_id = ?').get(studentId) as { count: number }).count;
  if (existingGoals === 0) {
    const insertGoal = db.prepare(`
      INSERT INTO planner_goals (user_id, type, title, subject_id, target_minutes, scheduled_date, is_completed)
      VALUES (?, ?, ?, ?, ?, date('now'), ?)
    `);

    insertGoal.run(studentId, 'daily', 'Study for 30 minutes', mathSub.id, 30, 1);
    insertGoal.run(studentId, 'daily', 'Complete 1 lesson in Science', sciSub.id, 20, 0);
    insertGoal.run(studentId, 'daily', 'Complete 10 practice questions', csSub.id, 15, 0);
    insertGoal.run(studentId, 'daily', 'Review 15 flashcards', mathSub.id, 10, 1);
    insertGoal.run(studentId, 'weekly', 'Master Linear Equations Chapter', mathSub.id, 120, 0);
    insertGoal.run(studentId, 'exam', 'Midterm Prep: Science & Math', sciSub.id, 300, 0);
  }

  // 9. Mistake Book Entry (To demonstrate Mistake Book functionality immediately)
  const existingMistakes = (db.prepare('SELECT count(*) as count FROM mistake_book WHERE user_id = ?').get(studentId) as { count: number }).count;
  if (existingMistakes === 0) {
    db.prepare(`
      INSERT INTO mistake_book (user_id, question_id, original_question, student_answer, correct_answer, explanation, topic, subject_name, is_resolved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      studentId,
      null,
      'What is the voice used in: "The discovery was announced yesterday"?',
      'Active Voice',
      'Passive Voice',
      'The subject ("The discovery") is receiving the action, not executing it. The agent who made the announcement is omitted.',
      'Grammar & Syntax',
      'English'
    );
  }

  // 10. Study Sessions (Past week study sessions for charts)
  const existingSessions = (db.prepare('SELECT count(*) as count FROM study_sessions WHERE user_id = ?').get(studentId) as { count: number }).count;
  if (existingSessions === 0) {
    const insertSession = db.prepare(`
      INSERT INTO study_sessions (user_id, duration_seconds, session_type, subject_id, created_at)
      VALUES (?, ?, ?, ?, datetime('now', ?))
    `);

    insertSession.run(studentId, 1800, 'pomodoro_25', mathSub.id, '-4 days');
    insertSession.run(studentId, 2400, 'pomodoro_50', sciSub.id, '-3 days');
    insertSession.run(studentId, 1500, 'lesson', csSub.id, '-2 days');
    insertSession.run(studentId, 2100, 'practice', mathSub.id, '-1 day');
    insertSession.run(studentId, 1800, 'pomodoro_25', engSub.id, '-0 day');
  }

  // 11. Sample Quiz Attempt
  const existingAttempts = (db.prepare('SELECT count(*) as count FROM quiz_attempts WHERE user_id = ?').get(studentId) as { count: number }).count;
  if (existingAttempts === 0) {
    db.prepare(`
      INSERT INTO quiz_attempts (user_id, subject_id, chapter_id, quiz_type, total_questions, correct_count, score, accuracy, time_taken_seconds, topics_to_improve_json, answers_json)
      VALUES (?, ?, ?, 'standard', 5, 4, 80, 80.0, 180, ?, ?)
    `).run(
      studentId,
      mathSub.id,
      mathChapter?.id || null,
      JSON.stringify(['Coordinate Geometry']),
      JSON.stringify([
        { question: 'What is 2/3 + 5/6?', userAnswer: '3/2', correctAnswer: '3/2', isCorrect: true },
        { question: 'Convert 3/8 to decimal', userAnswer: '0.375', correctAnswer: '0.375', isCorrect: true },
        { question: 'Solve 4(2x-3)+7=3x+20', userAnswer: 'x = 5', correctAnswer: 'x = 5', isCorrect: true },
        { question: 'Pythagorean applies to all triangles?', userAnswer: 'False', correctAnswer: 'False', isCorrect: true },
        { question: 'Slope through (2,3) and (6,11)?', userAnswer: '4', correctAnswer: '2', isCorrect: false }
      ])
    );
  }

  console.log('Seeding completed successfully!');
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
