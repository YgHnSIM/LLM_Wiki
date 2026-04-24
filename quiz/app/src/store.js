/**
 * Store — localStorage-based progress persistence
 *
 * Data shape:
 * {
 *   cardStates: { [cardId]: { repetitions, easiness, interval, dueDate } },
 *   stats: { totalReviews, reviewHistory: { [YYYY-MM-DD]: count } },
 *   settings: { dailyLimit, gistId, pat }
 * }
 */

const STORAGE_KEY = 'llm-wiki-quiz';

let _data = null;

function getDefaultData() {
  return {
    cardStates: {},
    stats: {
      totalReviews: 0,
      reviewHistory: {},
      streak: 0,
      lastStudyDate: null
    },
    settings: {
      dailyLimit: 20,
      gistId: '',
      pat: ''
    }
  };
}

function load() {
  if (_data) return _data;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _data = raw ? { ...getDefaultData(), ...JSON.parse(raw) } : getDefaultData();
  } catch {
    _data = getDefaultData();
  }
  return _data;
}

function save() {
  if (!_data) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
}

// --- Card States ---

export function getCardState(cardId) {
  const data = load();
  return data.cardStates[cardId] || null;
}

export function setCardState(cardId, state) {
  const data = load();
  data.cardStates[cardId] = state;
  save();
}

export function getAllCardStates() {
  return load().cardStates;
}

// --- Stats ---

export function recordReview() {
  const data = load();
  data.stats.totalReviews++;
  const today = new Date().toISOString().split('T')[0];
  data.stats.reviewHistory[today] = (data.stats.reviewHistory[today] || 0) + 1;

  // Update streak
  if (data.stats.lastStudyDate === today) {
    // already studied today
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (data.stats.lastStudyDate === yesterdayStr) {
      data.stats.streak++;
    } else if (data.stats.lastStudyDate !== today) {
      data.stats.streak = 1;
    }
    data.stats.lastStudyDate = today;
  }
  save();
}

export function getStats() {
  return load().stats;
}

// --- Settings ---

export function getSettings() {
  return load().settings;
}

export function updateSettings(partial) {
  const data = load();
  data.settings = { ...data.settings, ...partial };
  save();
}

// --- Bulk import/export for sync ---

export function exportData() {
  return JSON.parse(JSON.stringify(load()));
}

export function importData(incoming) {
  const current = load();

  // Merge card states: keep the one with more repetitions or later dueDate
  for (const [id, state] of Object.entries(incoming.cardStates || {})) {
    const existing = current.cardStates[id];
    if (!existing || state.repetitions > existing.repetitions) {
      current.cardStates[id] = state;
    }
  }

  // Merge stats: take the max
  if (incoming.stats) {
    current.stats.totalReviews = Math.max(
      current.stats.totalReviews,
      incoming.stats.totalReviews || 0
    );
    for (const [date, count] of Object.entries(incoming.stats.reviewHistory || {})) {
      current.stats.reviewHistory[date] = Math.max(
        current.stats.reviewHistory[date] || 0,
        count
      );
    }
    // Keep the higher streak
    if ((incoming.stats.streak || 0) > current.stats.streak) {
      current.stats.streak = incoming.stats.streak;
    }
  }

  _data = current;
  save();
}

export function resetAllData() {
  _data = getDefaultData();
  save();
}
