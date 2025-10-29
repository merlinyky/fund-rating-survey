// API endpoint for Stage 3: Multiple choice questions and final rating

import { Env, jsonResponse, errorResponse, corsHeaders } from '../../utils/db';
import { calculateFinalRating } from '../../utils/calculations';
import { STAGE3_QUESTIONS } from '../../utils/stage3-config';

interface Answer {
  question_no: number;
  choice_key: string;
}

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  // Return Stage 3 configuration (questions and choices)
  return jsonResponse({
    questions: STAGE3_QUESTIONS.map((q) => ({
      no: q.no,
      text: q.text,
      weight: q.weight,
      choices: Object.entries(q.choices).map(([key, choice]) => ({
        key,
        label: choice.label,
        // Don't expose notch values to frontend
      })),
    })),
  });
}

export async function onRequestPost(context: { request: Request; env: Env; params: { id: string } }) {
  try {
    const counterpartyId = context.params.id;
    const { answers } = await context.request.json();

    // Validate inputs
    if (!Array.isArray(answers) || answers.length !== 10) {
      return errorResponse('Must provide exactly 10 answers');
    }

    // Check if counterparty exists
    const counterparty = await context.env.DB.prepare(
      'SELECT id FROM counterparty WHERE id = ?'
    ).bind(counterpartyId).first();

    if (!counterparty) {
      return errorResponse('Counterparty not found', 404);
    }

    // Get base rating from Stage 2
    const stage2Result = await context.env.DB.prepare(
      'SELECT base_rating FROM stage2_result WHERE counterparty_id = ?'
    ).bind(counterpartyId).first();

    if (!stage2Result) {
      return errorResponse('Stage 2 must be completed before Stage 3', 400);
    }

    const baseRating = stage2Result.base_rating as number;

    // Validate all answers
    for (const answer of answers) {
      if (!answer.question_no || !answer.choice_key) {
        return errorResponse('Each answer must have question_no and choice_key');
      }

      const question = STAGE3_QUESTIONS.find((q) => q.no === answer.question_no);
      if (!question) {
        return errorResponse(`Invalid question number: ${answer.question_no}`);
      }

      if (!question.choices[answer.choice_key]) {
        return errorResponse(`Invalid choice key for question ${answer.question_no}`);
      }
    }

    // Calculate final rating
    const { weighted_notch, final_rating } = calculateFinalRating(baseRating, answers);

    // Delete existing Stage 3 answers
    await context.env.DB.prepare(
      'DELETE FROM stage3_answer WHERE counterparty_id = ?'
    ).bind(counterpartyId).run();

    // Insert new answers
    for (const answer of answers) {
      await context.env.DB.prepare(
        `INSERT INTO stage3_answer (counterparty_id, question_no, choice_key)
         VALUES (?, ?, ?)`
      ).bind(counterpartyId, answer.question_no, answer.choice_key).run();
    }

    // Insert or update rating_result
    await context.env.DB.prepare(
      `INSERT INTO rating_result (counterparty_id, base_rating, weighted_notch, final_rating, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(counterparty_id) DO UPDATE SET
         base_rating = excluded.base_rating,
         weighted_notch = excluded.weighted_notch,
         final_rating = excluded.final_rating,
         updated_at = datetime('now')`
    ).bind(counterpartyId, baseRating, weighted_notch, final_rating).run();

    return jsonResponse({
      counterparty_id: counterpartyId,
      base_rating: baseRating,
      weighted_notch,
      final_rating,
    });
  } catch (error: any) {
    console.error('Error processing Stage 3:', error);
    return errorResponse(error.message || 'Failed to process Stage 3', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
