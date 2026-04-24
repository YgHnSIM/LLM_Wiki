/**
 * Main — App entry point
 */

import './style.css';
import { loadCards } from './cardLoader.js';
import { registerRoute, initRouter } from './router.js';
import { renderDeckView } from './ui/DeckView.js';
import { renderStudyView } from './ui/StudyView.js';
import { renderStatsView } from './ui/StatsView.js';
import { renderSettingsView } from './ui/SettingsView.js';
import { isSyncEnabled, pullFromGist } from './sync.js';

// Toast system
let toastTimeout = null;

export function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

export function updateSyncIndicator(state) {
  const el = document.getElementById('sync-dot');
  if (!el) return;
  el.className = 'sync-indicator';
  if (state === 'syncing') el.classList.add('syncing');
  else if (state === 'error') el.classList.add('error');
  else if (state === 'connected') { /* default green */ }
  else el.classList.add('disabled');
}

async function init() {
  // Load card data
  try {
    await loadCards();
  } catch (err) {
    document.getElementById('view-container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">카드 데이터를 불러올 수 없습니다.<br>${err.message}</div>
      </div>
    `;
    return;
  }

  // Register routes
  registerRoute('#decks', renderDeckView);
  registerRoute('#study', renderStudyView);
  registerRoute('#stats', renderStatsView);
  registerRoute('#settings', renderSettingsView);

  // Init router
  initRouter('#decks');

  // Sync on load
  updateSyncIndicator(isSyncEnabled() ? 'connected' : 'disabled');
  if (isSyncEnabled()) {
    updateSyncIndicator('syncing');
    try {
      await pullFromGist();
      updateSyncIndicator('connected');
    } catch {
      updateSyncIndicator('error');
    }
  }
}

// Boot
init();
