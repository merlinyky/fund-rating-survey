// API Client

import { API_BASE_URL } from './config.js';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const API = {
  // Counterparties
  createCounterparty: (cp_id, name) =>
    fetchAPI('/counterparties', {
      method: 'POST',
      body: JSON.stringify({ cp_id, name }),
    }),

  searchCounterparties: (search = '', limit = 50, offset = 0) =>
    fetchAPI(`/counterparties?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`),

  // Stage 1
  submitStage1: (id, answers) =>
    fetchAPI(`/stage1/${id}`, {
      method: 'POST',
      body: JSON.stringify(answers),
    }),

  getStage1: (id) =>
    fetchAPI(`/stage1/${id}`),

  // Stage 2
  submitStage2: (id, data) =>
    fetchAPI(`/stage2/${id}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getStage2: (id) =>
    fetchAPI(`/stage2/${id}`),

  // Stage 3
  getStage3Config: (id) =>
    fetchAPI(`/stage3/${id}`),

  submitStage3: (id, answers) =>
    fetchAPI(`/stage3/${id}`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Summary & Dashboard
  getSummary: (id) =>
    fetchAPI(`/summary/${id}`),

  getDashboard: (search = '', limit = 50, offset = 0) =>
    fetchAPI(`/dashboard?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`),
};
