// Stage 3 question configuration
// IMPORTANT: Notch values must be fixed (not random) to ensure consistent ratings

export interface Choice {
  label: string;
  notch: number; // Range: -3 (worst) to +3 (best)
}

export interface Question {
  no: number;
  text: string;
  weight: number; // Must sum to 1.0 across all questions
  choices: Record<string, Choice>;
}

// 10 questions with varying number of choices (2-10)
// Notch values create a logical progression from worst to best within each question
export const STAGE3_QUESTIONS: Question[] = [
  {
    no: 1,
    text: 'Question 1: How would you rate the overall risk profile?',
    weight: 0.15,
    choices: {
      'A': { label: 'Q1 Choice 1', notch: -2 },
      'B': { label: 'Q1 Choice 2', notch: 0 },
      'C': { label: 'Q1 Choice 3', notch: 2 },
    },
  },
  {
    no: 2,
    text: 'Question 2: What is the fund\'s investment strategy?',
    weight: 0.12,
    choices: {
      'A': { label: 'Q2 Choice 1', notch: -2 },
      'B': { label: 'Q2 Choice 2', notch: -1 },
      'C': { label: 'Q2 Choice 3', notch: 1 },
      'D': { label: 'Q2 Choice 4', notch: 2 },
    },
  },
  {
    no: 3,
    text: 'Question 3: How diversified is the portfolio?',
    weight: 0.10,
    choices: {
      'A': { label: 'Q3 Choice 1', notch: -2 },
      'B': { label: 'Q3 Choice 2', notch: -1 },
      'C': { label: 'Q3 Choice 3', notch: 0 },
      'D': { label: 'Q3 Choice 4', notch: 1 },
      'E': { label: 'Q3 Choice 5', notch: 2 },
    },
  },
  {
    no: 4,
    text: 'Question 4: What is the management team\'s track record?',
    weight: 0.13,
    choices: {
      'A': { label: 'Q4 Choice 1', notch: -3 },
      'B': { label: 'Q4 Choice 2', notch: -2 },
      'C': { label: 'Q4 Choice 3', notch: -1 },
      'D': { label: 'Q4 Choice 4', notch: 0 },
      'E': { label: 'Q4 Choice 5', notch: 1 },
      'F': { label: 'Q4 Choice 6', notch: 3 },
    },
  },
  {
    no: 5,
    text: 'Question 5: How liquid are the fund\'s assets?',
    weight: 0.08,
    choices: {
      'A': { label: 'Q5 Choice 1', notch: -1 },
      'B': { label: 'Q5 Choice 2', notch: 1 },
    },
  },
  {
    no: 6,
    text: 'Question 6: What is the fund\'s leverage ratio?',
    weight: 0.11,
    choices: {
      'A': { label: 'Q6 Choice 1', notch: -3 },
      'B': { label: 'Q6 Choice 2', notch: -2 },
      'C': { label: 'Q6 Choice 3', notch: -1 },
      'D': { label: 'Q6 Choice 4', notch: 0 },
      'E': { label: 'Q6 Choice 5', notch: 1 },
      'F': { label: 'Q6 Choice 6', notch: 2 },
      'G': { label: 'Q6 Choice 7', notch: 3 },
    },
  },
  {
    no: 7,
    text: 'Question 7: How transparent is the reporting?',
    weight: 0.09,
    choices: {
      'A': { label: 'Q7 Choice 1', notch: -2 },
      'B': { label: 'Q7 Choice 2', notch: -1 },
      'C': { label: 'Q7 Choice 3', notch: 1 },
      'D': { label: 'Q7 Choice 4', notch: 2 },
    },
  },
  {
    no: 8,
    text: 'Question 8: What is the fund\'s historical performance?',
    weight: 0.10,
    choices: {
      'A': { label: 'Q8 Choice 1', notch: -3 },
      'B': { label: 'Q8 Choice 2', notch: -2 },
      'C': { label: 'Q8 Choice 3', notch: -1 },
      'D': { label: 'Q8 Choice 4', notch: 0 },
      'E': { label: 'Q8 Choice 5', notch: 1 },
      'F': { label: 'Q8 Choice 6', notch: 2 },
      'G': { label: 'Q8 Choice 7', notch: 2 },
      'H': { label: 'Q8 Choice 8', notch: 3 },
    },
  },
  {
    no: 9,
    text: 'Question 9: How strong is the risk management framework?',
    weight: 0.07,
    choices: {
      'A': { label: 'Q9 Choice 1', notch: -3 },
      'B': { label: 'Q9 Choice 2', notch: -2 },
      'C': { label: 'Q9 Choice 3', notch: -2 },
      'D': { label: 'Q9 Choice 4', notch: -1 },
      'E': { label: 'Q9 Choice 5', notch: 0 },
      'F': { label: 'Q9 Choice 6', notch: 1 },
      'G': { label: 'Q9 Choice 7', notch: 2 },
      'H': { label: 'Q9 Choice 8', notch: 2 },
      'I': { label: 'Q9 Choice 9', notch: 3 },
    },
  },
  {
    no: 10,
    text: 'Question 10: What is the regulatory compliance status?',
    weight: 0.05,
    choices: {
      'A': { label: 'Q10 Choice 1', notch: -3 },
      'B': { label: 'Q10 Choice 2', notch: -3 },
      'C': { label: 'Q10 Choice 3', notch: -2 },
      'D': { label: 'Q10 Choice 4', notch: -1 },
      'E': { label: 'Q10 Choice 5', notch: -1 },
      'F': { label: 'Q10 Choice 6', notch: 0 },
      'G': { label: 'Q10 Choice 7', notch: 1 },
      'H': { label: 'Q10 Choice 8', notch: 2 },
      'I': { label: 'Q10 Choice 9', notch: 2 },
      'J': { label: 'Q10 Choice 10', notch: 3 },
    },
  },
];
