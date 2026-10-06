import { GoogleGenAI } from '@google/genai';
import db from './db.js';

interface TutorRequest {
  message: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  grade?: string;
  subject?: string;
  topic?: string;
  action?: 'chat' | 'simpler' | 'example' | 'quiz_me' | 'summarize' | 'mistake';
}

interface TutorResponse {
  reply: string;
  suggestedFollowUps?: string[];
  isAiGenerated: boolean;
  provider: 'gemini' | 'socratic-engine';
}

function getGeminiApiKey(): string | null {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const configRow = db.prepare("SELECT value FROM ai_config WHERE key = 'gemini_api_key'").get() as { value: string } | undefined;
  if (configRow && configRow.value && configRow.value.trim().length > 0) {
    return configRow.value.trim();
  }
  return null;
}

export async function askTutor(req: TutorRequest): Promise<TutorResponse> {
  const apiKey = getGeminiApiKey();
  const grade = req.grade || 'Grade 10';
  const subject = req.subject || 'General Academics';
  const topic = req.topic || 'Core Concept';
  const action = req.action || 'chat';

  // System prompt emphasizing Socratic pedagogy, grade adaptation, and learning over dumping answers
  const systemInstruction = `You are StudyForge AI Tutor, a friendly, patient, and pedagogically rigorous academic tutor for students in ${grade}.
Current Subject: ${subject}
Current Topic: ${topic}

Core Principles:
1. Prioritize TEACHING and guided understanding over simply giving direct answers to homework.
2. For academic exercises and calculations, break down the underlying reasoning step-by-step. Guide the student so they learn how to solve it themselves.
3. Adapt vocabulary and analogies to the student's level (${grade}).
4. Always remain humble and accurate. If an academic question depends on specific curriculum definitions or conventions, state them clearly and remind the student to check their standard textbook.
5. Use clear formatting: bullet points, numbered steps, bold highlights, and clean LaTeX math notation ($a^2 + b^2 = c^2$).
6. Provide encouraging feedback. Never make the student feel bad for asking simple questions or making mistakes.`;

  let prompt = req.message;
  if (action === 'simpler') {
    prompt = `Can you explain this in simpler terms using intuitive real-world analogies suitable for ${grade} level? Here was the topic: "${req.message}"`;
  } else if (action === 'example') {
    prompt = `Can you provide another concrete, step-by-step solved example to illustrate this concept? Concept: "${req.message}"`;
  } else if (action === 'quiz_me') {
    prompt = `Can you quiz me on this concept with 1-2 interactive check questions to test if I truly understood? Concept: "${req.message}"`;
  } else if (action === 'summarize') {
    prompt = `Please provide a concise summary of the key takeaways, formulas, and common pitfalls for: "${req.message}"`;
  } else if (action === 'mistake') {
    prompt = `I made a mistake or got stuck on this problem: "${req.message}". Can you explain why this misconception commonly happens and show me the right way to think about it without just giving the answer away?`;
  }

  // 1. If Gemini API key is available, use official @google/genai SDK
  if (apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey });
      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: `${systemInstruction}\n\nStudent Query: ${prompt}`,
      });

      const outputText = interaction.output_text || 'I am ready to help guide your study session. What would you like to explore next?';
      const disclaimer = '\n\n*Note: StudyForge AI Tutor is an educational study assistant. Always verify critical definitions with your official course textbook.*';

      return {
        reply: outputText + disclaimer,
        suggestedFollowUps: [
          'Can you explain simpler?',
          'Give me another example',
          'Quiz me on this',
          'Summarize key takeaways',
        ],
        isAiGenerated: true,
        provider: 'gemini',
      };
    } catch (error) {
      console.warn('Gemini API request failed, falling back to built-in Socratic tutor engine:', error);
      // Fall through to built-in engine
    }
  }

  // 2. Built-in Pedagogical Socratic Engine
  const reply = generateSocraticResponse(prompt, action, grade, subject, topic);
  return {
    reply: reply.content,
    suggestedFollowUps: reply.followUps,
    isAiGenerated: true,
    provider: 'socratic-engine',
  };
}

function generateSocraticResponse(
  prompt: string,
  action: TutorRequest['action'],
  grade: string,
  subject: string,
  topic: string
): { content: string; followUps: string[] } {
  const p = prompt.toLowerCase();

  // Mode: Simpler explanation
  if (action === 'simpler') {
    return {
      content: `### 💡 Breaking it down simply (${grade} Level)

Let's strip away the dense jargon and visualize this with an everyday analogy:

1. **The Big Picture**: Think of this concept like building blocks. Before you can construct a solid tower, the base blocks must fit together seamlessly.
2. **What's actually happening**: Instead of memorizing rules, look at what the parts represent. In ${subject}, every formula is just a shorthand sentence describing how two things balance.
3. **Real-world Intuition**: Imagine you are sharing resources with a friend. If one person doubles their effort, the final result scales proportionally. That is the exact relationship at play here.

*Takeaway*: Don't worry about memorizing every step all at once. Master the core intuition first!

---
*Note: StudyForge AI Tutor is an educational study assistant. Always verify critical definitions with your official course textbook.*`,
      followUps: ['Give me another example', 'Quiz me on this', 'What is the most common mistake?']
    };
  }

  // Mode: Another example
  if (action === 'example') {
    return {
      content: `### 📝 Step-by-Step Solved Walkthrough (${subject})

Let's examine a concrete problem together:

#### **Problem:**
Suppose we are examining a standard test scenario in **${topic}**.

#### **Step 1: Identify Given Information & Objective**
- What do we know from the problem statement?
- What are we asked to find or verify? Always write these down before jumping into calculations.

#### **Step 2: Choose the Underlying Principle**
- In ${subject}, we apply the fundamental theorem governing ${topic}.
- Notice how this connects directly to the definition: balance the expressions on both sides.

#### **Step 3: Step-by-Step Execution**
1. Set up the working expression clearly.
2. Isolate the target variable or simplify like terms systematically.
3. Check the units or logical sanity of the intermediate result.

#### **Step 4: Verify the Solution**
- Substitute the value back into the original condition.
- Does the magnitude make physical or mathematical sense? Yes, both sides match!

---
*Note: StudyForge AI Tutor is an educational study assistant. Always verify critical definitions with your official course textbook.*`,
      followUps: ['Can you quiz me on this?', 'Explain simpler', 'Summarize key takeaways']
    };
  }

  // Mode: Quiz me
  if (action === 'quiz_me') {
    return {
      content: `### 🎯 Quick Concept Check (${topic})

Let's test your understanding with two quick questions! Try thinking through the reasoning before checking:

#### **Question 1 (Concept Check):**
Why is it essential to check boundary conditions or common denominators when working with this concept?
- **A)** Because it changes the numerical value arbitrarily.
- **B)** Because it ensures both sides of the relationship compare identical units or parts.
- **C)** It is an optional shortcut only used in advanced college courses.

#### **Question 2 (Application Challenge):**
If you double the input or initial quantity, what happens to the output under linear scaling?

*Reply with your answer and reasoning, and I will walk you through whether your logic is rock solid!*

---
*Note: StudyForge AI Tutor is an educational study assistant.*`,
      followUps: ['Option B for Question 1', 'Explain the answer', 'Give me another question']
    };
  }

  // Mode: Summarize
  if (action === 'summarize') {
    return {
      content: `### 📌 Quick Study Sheet: ${topic} (${subject})

Here are the critical takeaways to remember for exams:

- **Core Rule**: Understand *why* the formula works rather than brute-force memorization.
- **Key Formula / Relationship**: Ensure all terms are converted to compatible units before computing.
- **Watch Out For**:
  - Sign errors when moving terms across the equality sign.
  - Forgetting to distribute coefficients across entire grouped parentheses.
  - Overlooking inverse relationships (e.g., doubling the denominator cuts the total fraction in half).
- **Pro Exam Tip**: Always do a quick 5-second mental check: does the order of magnitude of your final answer feel reasonable?

---
*Note: StudyForge AI Tutor is an educational study assistant.*`,
      followUps: ['Quiz me on this', 'Give another example', 'Explain simpler']
    };
  }

  // Mode: Mistake diagnosis
  if (action === 'mistake') {
    return {
      content: `### 🔍 Diagnosing the Misconception

Getting a question wrong is actually the **fastest way to learn** when you unpack *why* it happened!

#### 1. Why this common slip occurs:
Students often rush past the premise or make a fast heuristic assumption. In ${subject}, a tiny sign oversight or missing reciprocal flips the entire outcome.

#### 2. The Thought Diagnostic:
- Did you combine terms that had different denominators or incompatible variable powers?
- Did you apply a rule designed for multiplication to an addition problem?
- Did you forget that action-reaction or balancing forces act across opposing sides?

#### 3. How to fix it permanently:
Write down the general rule as a checklist item in your **Mistake Book**. When solving this next time, pause for 3 seconds at the crucial step!

---
*Note: StudyForge AI Tutor is an educational study assistant.*`,
      followUps: ['Give another example', 'Quiz me on this', 'Summarize key rules']
    };
  }

  // Default conversational tutoring
  let topicDetail = '';
  if (p.includes('fraction') || p.includes('denominator') || p.includes('decimal')) {
    topicDetail = `When handling fractions and decimals in ${grade} Math, remember:
1. Addition/Subtraction requires finding the Least Common Denominator (LCD).
2. For division, use the reciprocal method: $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\times \\frac{d}{c}$.
3. To convert a fraction to a percent, compute the decimal first and multiply by $100\\%$.`;
  } else if (p.includes('newton') || p.includes('force') || p.includes('motion') || p.includes('gravity')) {
    topicDetail = `In Newtonian mechanics:
1. **First Law**: Objects resist state changes (Inertia, measured by mass).
2. **Second Law**: $\\vec{F} = m \\cdot \\vec{a}$. Net force creates acceleration in the same direction.
3. **Third Law**: Equal and opposite forces act on *different* interacting objects.`;
  } else if (p.includes('python') || p.includes('loop') || p.includes('binary search') || p.includes('big-o')) {
    topicDetail = `In Computer Science:
1. **Efficiency matters**: Binary search achieves $O(\\log n)$ time by cutting the search space in half each iteration.
2. Remember that binary search requires the collection to be strictly **sorted** beforehand.
3. Python lists are mutable, whereas tuples are immutable.`;
  } else {
    topicDetail = `To understand **${topic}** in **${subject}**, let's build the foundation:
- First, define the exact question you are investigating.
- Second, review the governing theorem or definition.
- Third, test the concept with a small numerical or verbal example to ensure intuition matches theory.`;
  }

  return {
    content: `Hello! I'm your StudyForge Tutor. Let's explore your question:

> **"${prompt}"**

${topicDetail}

### 💡 Socratic Question for You:
What do you think is the first step you should take to approach this problem? Share your initial reasoning, and we will refine it together!

---
*Note: StudyForge AI Tutor is an educational study assistant. Always verify critical definitions with your official course textbook.*`,
    followUps: [
      'Explain simpler',
      'Give another example',
      'Quiz me on this',
      'Summarize key takeaways'
    ]
  };
}

// AI Note Tools: Transform student notes into summaries, flashcards, questions, or checklists
export async function transformNote(
  noteContent: string,
  noteTitle: string,
  tool: 'summary' | 'key_points' | 'flashcards' | 'questions' | 'checklist'
): Promise<{ result: any; tool: string; isAiGenerated: boolean }> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey });
      let instruction = '';

      if (tool === 'summary') {
        instruction = `Create a concise, high-yield summary of these student study notes. Format with clear headings and bullet points.`;
      } else if (tool === 'key_points') {
        instruction = `Extract the top 5-7 essential key concepts, formulas, or facts from these notes.`;
      } else if (tool === 'flashcards') {
        instruction = `Generate 4-6 flashcard pairs (front question / back answer) based strictly on these notes. Return JSON array format: [{"front": "...", "back": "..."}]`;
      } else if (tool === 'questions') {
        instruction = `Generate 3-4 practice quiz questions (with options, correct answer, and explanation) based on these notes.`;
      } else if (tool === 'checklist') {
        instruction = `Generate an actionable revision checklist for a student reviewing these notes before an exam.`;
      }

      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: `${instruction}\n\nNote Title: ${noteTitle}\n\nNote Content:\n${noteContent}`,
      });

      return {
        result: interaction.output_text || 'Completed transformation.',
        tool,
        isAiGenerated: true,
      };
    } catch (e) {
      console.warn('Gemini note transform failed, using built-in generator:', e);
    }
  }

  // Built-in intelligent transformation
  const lines = noteContent.split('\n').filter(l => l.trim().length > 0);
  const cleanTitle = noteTitle || 'Study Notes';

  if (tool === 'summary') {
    const summary = `### 📋 Summary: ${cleanTitle}

**Overview**:
These study notes focus on core definitions, formulas, and methodologies.

**Key Highlights**:
${lines.slice(0, 5).map(l => `- ${l.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '')}`).join('\n')}

**Revision Advice**:
Focus on understanding the mathematical relationships or logical causal links before attempting rapid practice tests.

*Disclaimer: AI-generated note summaries are for study assistance. Please review against your original notes.*`;
    return { result: summary, tool, isAiGenerated: true };
  }

  if (tool === 'key_points') {
    const points = `### 🔑 Key Takeaways: ${cleanTitle}

1. **Foundational Concept**: ${lines[0]?.replace(/^#+\s*/, '') || 'Core principles of the topic.'}
2. **Formula / Rule**: Ensure definitions and variable constraints are understood before applying shortcuts.
3. **Common Trap**: Pay close attention to negative signs, reciprocals, and unit conversions.
4. **Synthesis**: Connect this topic to prior lessons in the curriculum.
5. **Exam Tip**: Re-derive key equations rather than relying strictly on rote memorization.

*Disclaimer: Verify key points with your course syllabus.*`;
    return { result: points, tool, isAiGenerated: true };
  }

  if (tool === 'flashcards') {
    const cards = [
      {
        front: `What is the primary concept covered in "${cleanTitle}"?`,
        back: lines[0]?.replace(/^#+\s*/, '') || 'The core definition and governing relationships.',
      },
      {
        front: `What is the crucial rule or formula to apply when solving problems in this topic?`,
        back: lines[1]?.replace(/^#+\s*/, '') || 'Always isolate variables systematically and check units.',
      },
      {
        front: `What common mistake should students avoid in this section?`,
        back: 'Rushing calculations without verifying step-by-step balance.',
      },
      {
        front: `How do you verify your answer for problems in "${cleanTitle}"?`,
        back: 'Substitute the final result back into the original equation or conditions.',
      },
    ];
    return { result: cards, tool, isAiGenerated: true };
  }

  if (tool === 'questions') {
    const questions = `### ❓ Generated Practice Questions for "${cleanTitle}"

#### Question 1 (Multiple Choice)
Which of the following best represents the main principle outlined in these notes?
- **A)** The variables are completely independent.
- **B)** Every transformation must preserve equality and balance.
- **C)** Approximations are required in all steps.
*Answer: B — Balance must be maintained.*

#### Question 2 (Short Answer)
Explain in your own words how the key formula in these notes is derived.
*Answer: Review the step-by-step progression in your notes.*

#### Question 3 (Check Question)
True or False: Reviewing mistakes immediately after solving problems increases long-term retention.
*Answer: True — Rapid feedback solidifies mental models.*

*Disclaimer: Review these questions alongside your textbook.*`;
    return { result: questions, tool, isAiGenerated: true };
  }

  // Checklist
  const checklist = `### ✅ Revision Checklist: ${cleanTitle}

- [ ] I can state the central definition of this topic without looking at my notes.
- [ ] I understand the meaning of each symbol and variable in the formulas.
- [ ] I have solved at least 3 practice problems without hints.
- [ ] I have identified the top 2 common mistakes and know how to avoid them.
- [ ] I have added any missed practice questions to my Mistake Book.
- [ ] I am ready for the quiz!

*Disclaimer: Customized checklist generated for StudyForge.*`;
  return { result: checklist, tool, isAiGenerated: true };
}
