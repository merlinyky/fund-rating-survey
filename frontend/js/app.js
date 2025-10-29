// Common application utilities

import { STORAGE_KEYS } from './config.js';

export function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  } else {
    alert(message);
  }
}

export function showSuccess(message) {
  const successDiv = document.getElementById('success-message');
  if (successDiv) {
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }
}

export function showLoading(show = true) {
  const loadingDiv = document.getElementById('loading');
  if (loadingDiv) {
    loadingDiv.style.display = show ? 'flex' : 'none';
  }
}

export function getCounterpartyId() {
  return sessionStorage.getItem(STORAGE_KEYS.COUNTERPARTY_ID);
}

export function setCounterpartyId(id) {
  sessionStorage.setItem(STORAGE_KEYS.COUNTERPARTY_ID, id);
}

export function getCounterpartyName() {
  return sessionStorage.getItem(STORAGE_KEYS.COUNTERPARTY_NAME);
}

export function setCounterpartyName(name) {
  sessionStorage.setItem(STORAGE_KEYS.COUNTERPARTY_NAME, name);
}

export function getStage1Route() {
  return sessionStorage.getItem(STORAGE_KEYS.STAGE1_ROUTE);
}

export function setStage1Route(route) {
  sessionStorage.setItem(STORAGE_KEYS.STAGE1_ROUTE, route);
}

export function clearSession() {
  sessionStorage.clear();
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
}
