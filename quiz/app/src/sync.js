/**
 * Sync — GitHub Gist-based cross-device synchronization
 *
 * Uses a private Gist to store/load learning progress.
 * User provides a Personal Access Token (PAT) with `gist` scope.
 */

import { exportData, importData, getSettings, updateSettings } from './store.js';

const GIST_FILENAME = 'llm-wiki-quiz-progress.json';
const API_BASE = 'https://api.github.com';

// Sync log for debugging — visible in Settings UI
let _syncLog = [];

export function getSyncLog() {
  return _syncLog;
}

function log(msg) {
  const timestamp = new Date().toLocaleTimeString();
  const entry = `[${timestamp}] ${msg}`;
  _syncLog.push(entry);
  if (_syncLog.length > 30) _syncLog.shift();
  console.log(`[sync] ${msg}`);
}

function makeHeaders(pat) {
  const token = pat || getSettings().pat;
  return {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28'
  };
}

/**
 * Check if sync is configured (PAT exists).
 */
export function isSyncEnabled() {
  const { pat } = getSettings();
  return !!(pat && pat.trim());
}

/**
 * Search user's existing Gists for our progress file.
 */
async function discoverGist() {
  log('🔍 기존 Gist 검색 중...');

  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`${API_BASE}/gists?per_page=30&page=${page}`, {
      headers: makeHeaders()
    });

    if (!res.ok) {
      log(`❌ Gist 목록 조회 실패: ${res.status}`);
      return null;
    }

    const gists = await res.json();
    log(`  페이지 ${page}: ${gists.length}개의 Gist 확인`);

    if (gists.length === 0) break;

    for (const gist of gists) {
      if (gist.files && gist.files[GIST_FILENAME]) {
        log(`✅ 기존 Gist 발견! ID: ${gist.id.slice(0, 8)}...`);
        return gist.id;
      }
    }
  }

  log('ℹ️ 기존 Gist를 찾지 못했습니다');
  return null;
}

/**
 * Create a new private Gist.
 */
async function createGist(data) {
  log('📝 새 Gist 생성 중...');

  const res = await fetch(`${API_BASE}/gists`, {
    method: 'POST',
    headers: { ...makeHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'LLM Wiki Quiz — Learning Progress (auto-synced)',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    log(`❌ Gist 생성 실패: ${res.status} — ${text.slice(0, 100)}`);
    throw new Error(`Gist 생성 실패: ${res.status}`);
  }

  const gist = await res.json();
  log(`✅ 새 Gist 생성 완료: ${gist.id.slice(0, 8)}...`);
  return gist.id;
}

/**
 * Read progress data from the Gist.
 */
async function readGist(gistId) {
  log(`📖 Gist 데이터 읽기: ${gistId.slice(0, 8)}...`);

  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: makeHeaders()
  });

  if (!res.ok) {
    log(`❌ Gist 읽기 실패: ${res.status}`);
    return null;
  }

  const gist = await res.json();
  const file = gist.files[GIST_FILENAME];

  if (!file || !file.content) {
    log('⚠️ Gist에 데이터 파일이 없습니다');
    return null;
  }

  try {
    const data = JSON.parse(file.content);
    const cardCount = Object.keys(data.cardStates || {}).length;
    const reviews = data.stats?.totalReviews || 0;
    log(`✅ Gist 읽기 성공 — 카드 상태 ${cardCount}개, 총 복습 ${reviews}회`);
    return data;
  } catch (e) {
    log(`❌ Gist 데이터 파싱 실패: ${e.message}`);
    return null;
  }
}

/**
 * Write progress data to the Gist.
 */
async function writeGist(gistId, data) {
  log(`📤 Gist에 데이터 쓰기: ${gistId.slice(0, 8)}...`);

  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: { ...makeHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    })
  });

  if (!res.ok) {
    const text = await res.text();
    log(`❌ Gist 쓰기 실패: ${res.status} — ${text.slice(0, 100)}`);
    throw new Error(`Gist 업데이트 실패: ${res.status}`);
  }

  log('✅ Gist 쓰기 성공');
}

/**
 * Resolve a valid Gist ID: use stored → discover existing → create new.
 */
async function resolveGistId() {
  let { gistId } = getSettings();

  if (gistId) {
    log(`ℹ️ 저장된 Gist ID 사용: ${gistId.slice(0, 8)}...`);
    // Quick check if it still exists
    const res = await fetch(`${API_BASE}/gists/${gistId}`, {
      method: 'HEAD',
      headers: makeHeaders()
    });
    if (res.ok) return gistId;
    log('⚠️ 저장된 Gist가 존재하지 않습니다. 재검색합니다.');
    updateSettings({ gistId: '' });
  }

  // Search for existing Gist from another device
  const discovered = await discoverGist();
  if (discovered) {
    updateSettings({ gistId: discovered });
    return discovered;
  }

  // Create a brand new Gist
  const localData = getLocalSyncData();
  const newId = await createGist(localData);
  updateSettings({ gistId: newId });
  return newId;
}

/**
 * Get local data prepared for sync (without settings).
 */
function getLocalSyncData() {
  const data = exportData();
  delete data.settings;
  return data;
}

/**
 * Full sync: resolve Gist → pull & merge → push updated data.
 * Single coherent operation to avoid redundant API calls.
 */
export async function sync() {
  _syncLog = [];
  log('🔄 동기화 시작');

  if (!isSyncEnabled()) {
    log('⚠️ PAT가 설정되지 않았습니다');
    return;
  }

  // Step 1: Resolve Gist ID
  const gistId = await resolveGistId();
  log(`📌 사용할 Gist: ${gistId.slice(0, 8)}...`);

  // Step 2: Read remote data
  const remoteData = await readGist(gistId);

  // Step 3: Merge remote → local
  if (remoteData) {
    const beforeCount = Object.keys(exportData().cardStates || {}).length;
    importData(remoteData);
    const afterCount = Object.keys(exportData().cardStates || {}).length;
    log(`🔀 병합 완료 — 로컬 카드 상태: ${beforeCount} → ${afterCount}`);
  } else {
    log('ℹ️ 원격 데이터 없음, 로컬 데이터만 사용');
  }

  // Step 4: Push merged local data back to Gist
  const mergedData = getLocalSyncData();
  await writeGist(gistId, mergedData);

  const finalCardCount = Object.keys(mergedData.cardStates || {}).length;
  const finalReviews = mergedData.stats?.totalReviews || 0;
  log(`✅ 동기화 완료 — 카드 상태 ${finalCardCount}개, 총 복습 ${finalReviews}회`);
}

/**
 * Quick push — used after study sessions.
 */
export async function pushToGist() {
  if (!isSyncEnabled()) return;

  const { gistId } = getSettings();
  if (!gistId) return;

  const data = getLocalSyncData();
  await writeGist(gistId, data);
}

/**
 * Quick pull — used on app load.
 */
export async function pullFromGist() {
  if (!isSyncEnabled()) return;

  const { gistId } = getSettings();
  if (!gistId) {
    // No gistId saved locally — try discovery
    const discovered = await discoverGist();
    if (discovered) {
      updateSettings({ gistId: discovered });
    } else {
      return;
    }
  }

  const finalGistId = getSettings().gistId;
  const remoteData = await readGist(finalGistId);
  if (remoteData) {
    importData(remoteData);
  }
}

/**
 * Validate PAT by checking gist access.
 */
export async function validatePAT(pat) {
  try {
    const res = await fetch(`${API_BASE}/gists`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${pat}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}
