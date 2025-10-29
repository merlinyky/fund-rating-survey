// Configuration loader utility
// Loads survey configuration from JSON file

import configData from '../../config/survey-config.json';

export interface Choice {
  label: string;
  notch: number;
}

export interface Stage3Question {
  no: number;
  text: string;
  weight: number;
  choices: Record<string, Choice>;
}

export interface SurveyConfig {
  version: string;
  stages: {
    stage1: {
      questions: Array<{
        id: string;
        text: string;
        type: string;
        required: boolean;
      }>;
      routing: {
        description: string;
        rule: string;
        threshold: number;
      };
    };
    stage2: {
      routeA: {
        title: string;
        calculation: {
          sector_scores: Record<string, number>;
        };
      };
      routeB: {
        title: string;
        calculation: {
          normalization_divisor: number;
          category_factors: Record<string, number>;
          sector_scores: Record<string, number>;
        };
      };
    };
    stage3: {
      questions: Stage3Question[];
      validation: {
        weights_must_sum_to: number;
        tolerance: number;
      };
    };
  };
}

// Load configuration
const config: SurveyConfig = configData as SurveyConfig;

// Export specific parts for easy access
export const STAGE1_CONFIG = config.stages.stage1;
export const STAGE2A_CONFIG = config.stages.stage2.routeA;
export const STAGE2B_CONFIG = config.stages.stage2.routeB;
export const STAGE3_CONFIG = config.stages.stage3;

// Export the full config
export default config;

// Helper functions
export function getStage3Questions(): Stage3Question[] {
  return STAGE3_CONFIG.questions;
}

export function getStage3Question(questionNo: number): Stage3Question | undefined {
  return STAGE3_CONFIG.questions.find((q) => q.no === questionNo);
}

export function getSectorScoresRouteA(): Record<string, number> {
  return STAGE2A_CONFIG.calculation.sector_scores;
}

export function getCategoryFactors(): Record<string, number> {
  return STAGE2B_CONFIG.calculation.category_factors;
}

export function getSectorScoresRouteB(): Record<string, number> {
  return STAGE2B_CONFIG.calculation.sector_scores;
}

export function getNormalizationDivisor(): number {
  return STAGE2B_CONFIG.calculation.normalization_divisor;
}

export function getRoutingThreshold(): number {
  return STAGE1_CONFIG.routing.threshold;
}

// Validation
export function validateStage3Weights(): boolean {
  const weights = STAGE3_CONFIG.questions.map((q) => q.weight);
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const tolerance = STAGE3_CONFIG.validation.tolerance;
  const expected = STAGE3_CONFIG.validation.weights_must_sum_to;
  return Math.abs(sum - expected) <= tolerance;
}

// Log config info on load
console.log(`[Config] Loaded survey configuration version ${config.version}`);
console.log(`[Config] Stage 3 questions: ${STAGE3_CONFIG.questions.length}`);
console.log(`[Config] Stage 3 weights valid: ${validateStage3Weights()}`);
