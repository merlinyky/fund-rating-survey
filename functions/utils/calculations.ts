// Rating calculation algorithms

import { STAGE3_QUESTIONS } from './stage3-config';

// Stage 2A: Option 1 scoring
const SECTOR_SCORES = {
  'Sector 1': 0.2,
  'Sector 2': 0.4,
  'Sector 3': 0.6,
};

export function calculateStage2ABaseRating(rows: Array<{ sector: string; weight: number }>): number {
  const score = rows.reduce((sum, row) => {
    const sectorScore = SECTOR_SCORES[row.sector as keyof typeof SECTOR_SCORES] || 0;
    return sum + row.weight * sectorScore;
  }, 0);

  const baseRating = Math.ceil(score * 6);
  return Math.max(1, Math.min(6, baseRating));
}

// Stage 2B: Option 2 scoring
const CATEGORY_FACTORS = {
  'Category 1': 0.8,
  'Category 2': 1.0,
  'Category 3': 1.2,
};

const SECTOR_SCORES_2B: Record<string, number> = {
  'Sector 1': 0.1,
  'Sector 2': 0.2,
  'Sector 3': 0.3,
  'Sector 4': 0.4,
  'Sector 5': 0.5,
  'Sector 6': 0.6,
  'Sector 7': 0.7,
  'Sector 8': 0.8,
  'Sector 9': 0.9,
  'Sector 10': 1.0,
};

export function calculateStage2BBaseRating(
  rows: Array<{ category: string; sector: string; weight: number }>
): number {
  const score = rows.reduce((sum, row) => {
    const categoryFactor = CATEGORY_FACTORS[row.category as keyof typeof CATEGORY_FACTORS] || 1.0;
    const sectorScore = SECTOR_SCORES_2B[row.sector] || 0;
    return sum + row.weight * categoryFactor * sectorScore;
  }, 0);

  const normalized = score / 1.2;
  const baseRating = Math.ceil(normalized * 6);
  return Math.max(1, Math.min(6, baseRating));
}

// Stage 3: Final rating calculation
export function calculateFinalRating(
  baseRating: number,
  answers: Array<{ question_no: number; choice_key: string }>
): { weighted_notch: number; final_rating: number } {
  const weightedNotch = answers.reduce((sum, answer) => {
    const question = STAGE3_QUESTIONS.find((q) => q.no === answer.question_no);
    if (!question) return sum;

    const choice = question.choices[answer.choice_key];
    if (!choice) return sum;

    return sum + question.weight * choice.notch;
  }, 0);

  const finalRating = Math.round(baseRating + weightedNotch);
  const clampedRating = Math.max(1, Math.min(6, finalRating));

  return {
    weighted_notch: Math.round(weightedNotch * 100) / 100, // Round to 2 decimals
    final_rating: clampedRating,
  };
}

// Stage 1: Route determination
export function determineRoute(q1: boolean, q2: boolean, q3: boolean): 'A' | 'B' {
  const sum = (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0);
  return sum >= 2 ? 'A' : 'B';
}

// Validate weights sum to 1.0 (with tolerance)
export function validateWeights(weights: number[]): boolean {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return Math.abs(sum - 1.0) <= 0.01;
}
