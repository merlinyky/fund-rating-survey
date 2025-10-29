// API endpoint for counterparty management

import { Env, jsonResponse, errorResponse, generateId, corsHeaders } from '../utils/db';

export async function onRequestPost(context: { request: Request; env: Env }) {
  try {
    const { cp_id, name } = await context.request.json();

    if (!cp_id || typeof cp_id !== 'string' || cp_id.trim().length === 0) {
      return errorResponse('Counterparty ID is required');
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Counterparty name is required');
    }

    const trimmedCpId = cp_id.trim();
    const trimmedName = name.trim();

    // Check if cp_id already exists
    const existing = await context.env.DB.prepare(
      'SELECT id FROM counterparty WHERE cp_id = ?'
    ).bind(trimmedCpId).first();

    if (existing) {
      return errorResponse('Counterparty ID already exists', 400);
    }

    const id = generateId();

    await context.env.DB.prepare(
      'INSERT INTO counterparty (id, cp_id, name) VALUES (?, ?, ?)'
    ).bind(id, trimmedCpId, trimmedName).run();

    return jsonResponse({
      id,
      cp_id: trimmedCpId,
      name: trimmedName,
      created_at: new Date().toISOString(),
    }, 201);
  } catch (error: any) {
    console.error('Error creating counterparty:', error);
    return errorResponse(error.message || 'Failed to create counterparty', 500);
  }
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  try {
    const url = new URL(context.request.url);
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT id, cp_id, name, created_at FROM counterparty';
    const params: any[] = [];

    if (search) {
      query += ' WHERE name LIKE ? OR cp_id LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = context.env.DB.prepare(query);
    const result = await stmt.bind(...params).all();

    return jsonResponse({
      counterparties: result.results || [],
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error fetching counterparties:', error);
    return errorResponse(error.message || 'Failed to fetch counterparties', 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
