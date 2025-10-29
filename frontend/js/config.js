// API Configuration

// Detect if running locally or on GitHub Pages
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API base URL - update this after deploying to Cloudflare Pages
export const API_BASE_URL = isLocal
  ? 'http://localhost:8788/api'  // Local development
  : 'https://data-collector-api.pages.dev/api';  // Production - UPDATE THIS URL

// Session storage keys
export const STORAGE_KEYS = {
  COUNTERPARTY_ID: 'current_counterparty_id',
  COUNTERPARTY_NAME: 'current_counterparty_name',
  STAGE1_ROUTE: 'stage1_route',
};
