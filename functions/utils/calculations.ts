// Rating calculation algorithms
// Updated to use JSON configuration

import {
  getStage3Questions,
  getSectorScoresRouteA,
  getCategoryFactors,
  getSectorScoresRouteB,
  getNormalizationDivisor,
  getRoutingThreshold,
} from './config-loader';

// Stage 2A: Option 1 scoring
export function calculateStage2ABaseRating(rows: Array<{ sector: string; weight: number }>): number {
  const SECTOR_SCORES = getSectorScoresRouteA();

  const score = rows.reduce((sum, row) => {
    const sectorScore = SECTOR_SCORES[row.sector] || 0;
    return sum + row.weight * sectorScore;
  }, 0);

  const baseRating = Math.ceil(score * 6);
  return Math.max(1, Math.min(6, baseRating));
}

// Stage 2B: Option 2 scoring
export function calculateStage2BBaseRating(
  rows: Array<{ category: string; sector: string; weight: number }>
): number {
  const CATEGORY_FACTORS = getCategoryFactors();
  const SECTOR_SCORES_2B = getSectorScoresRouteB();
  const NORMALIZATION_DIVISOR = getNormalizationDivisor();

  const score = rows.reduce((sum, row) => {
    const categoryFactor = CATEGORY_FACTORS[row.category] || 1.0;
    const sectorScore = SECTOR_SCORES_2B[row.sector] || 0;
    return sum + row.weight * categoryFactor * sectorScore;
  }, 0);

  const normalized = score / NORMALIZATION_DIVISOR;
  const baseRating = Math.ceil(normalized * 6);
  return Math.max(1, Math.min(6, baseRating));
}

// Stage 3: Final rating calculation
export function calculateFinalRating(
  baseRating: number,
  answers: Array<{ question_no: number; choice_key: string }>
): { weighted_notch: number; final_rating: number } {
  const STAGE3_QUESTIONS = getStage3Questions();

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
  const THRESHOLD = getRoutingThreshold();
  const sum = (q1 ? 1 : 0) + (q2 ? 1 : 0) + (q3 ? 1 : 0);
  return sum >= THRESHOLD ? 'A' : 'B';
}

// Validate weights sum to 1.0 (with tolerance)
export function validateWeights(weights: number[]): boolean {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  return Math.abs(sum - 1.0) <= 0.01;
}
