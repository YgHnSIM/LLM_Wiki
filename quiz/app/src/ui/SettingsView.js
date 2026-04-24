/**
 * SettingsView — App settings and sync configuration
 */

import { getSettings, updateSettings, resetAllData, exportData, importData } from '../store.js';
import { sync, validatePAT, isSyncEnabled, getSyncLog } from '../sync.js';
import { showToast, updateSyncIndicator } from '../main.js';

export function renderSettingsView() {
  const container = document.getElementById('view-container');
  const settings = getSettings();

  container.innerHTML = `
    <div class="fade-in">
      <!-- Sync Settings -->
      <div class="settings-group">
        <div class="settings-group-title">☁️ GitHub Gist 동기화</div>

        <div class="setting-row" style="flex-direction:column; align-items:flex-start">
          <div>
            <div class="setting-label">Personal Access Token (PAT)</div>
            <div class="setting-desc">GitHub → Settings → Developer settings → Tokens (classic) → gist 권한</div>
          </div>
          <input type="password" class="setting-input" id="pat-input"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value="${settings.pat || ''}" />
        </div>

        <div class="setting-row" style="flex-direction:column; align-items:flex-start">
          <div>
            <div class="setting-label">Gist ID</div>
            <div class="setting-desc">처음 동기화 시 자동 생성되거나, 기존 Gist를 자동 검색합니다</div>
          </div>
          <input type="text" class="setting-input" id="gist-id-input"
            placeholder="자동 생성 / 자동 검색"
            value="${settings.gistId || ''}"
            style="color:var(--text-muted);font-size:.75rem" />
          <div class="setting-desc" style="margin-top:4px">
            다른 기기의 Gist ID를 수동 입력할 수도 있습니다
          </div>
        </div>

        <div style="display:flex; gap:8px; margin-top:12px">
          <button class="btn btn-primary" id="save-pat-btn" style="flex:1">저장 & 연결</button>
          <button class="btn btn-ghost" id="sync-now-btn" ${!isSyncEnabled() ? 'disabled style="opacity:.4"' : ''}>지금 동기화</button>
        </div>

        <!-- Sync Log -->
        <div id="sync-log-container" style="margin-top:12px; display:none">
          <div class="setting-desc" style="margin-bottom:6px">동기화 로그:</div>
          <div id="sync-log" style="
            background:var(--bg-primary);
            border:1px solid rgba(255,255,255,.08);
            border-radius:var(--radius-sm);
            padding:10px;
            font-size:.65rem;
            font-family:'Consolas','Monaco',monospace;
            color:var(--text-secondary);
            max-height:200px;
            overflow-y:auto;
            line-height:1.6;
            white-space:pre-wrap;
            word-break:break-all;
          "></div>
        </div>
      </div>

      <!-- Study Settings -->
      <div class="settings-group">
        <div class="settings-group-title">📖 학습 설정</div>

        <div class="setting-row">
          <div>
            <div class="setting-label">일일 카드 수</div>
            <div class="setting-desc">하루에 복습할 최대 카드 수</div>
          </div>
          <input type="number" class="setting-input" id="daily-limit-input"
            value="${settings.dailyLimit || 20}" min="5" max="100" step="5" />
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-group">
        <div class="settings-group-title">🗄️ 데이터 관리</div>

        <div class="setting-row" style="flex-direction:column; align-items:flex-start; gap:10px">
          <div>
            <div class="setting-label">학습 데이터 내보내기/가져오기</div>
            <div class="setting-desc">JSON 파일로 백업/복원할 수 있습니다</div>
          </div>
          <div style="display:flex; gap:8px; width:100%">
            <button class="btn btn-ghost" id="export-btn" style="flex:1">📤 내보내기</button>
            <button class="btn btn-ghost" id="import-btn" style="flex:1">📥 가져오기</button>
          </div>
          <input type="file" id="import-file" accept=".json" style="display:none" />
        </div>

        <div class="setting-row" style="margin-top:8px">
          <div>
            <div class="setting-label" style="color:var(--accent-red)">모든 데이터 초기화</div>
            <div class="setting-desc">학습 진행 상황이 모두 삭제됩니다</div>
          </div>
          <button class="btn btn-danger" id="reset-btn">초기화</button>
        </div>
      </div>

      <!-- App Info -->
      <div class="settings-group" style="text-align:center; color:var(--text-muted); font-size:.7rem">
        LLM Wiki Quiz v1.1<br>
        SM-2 Spaced Repetition Algorithm<br>
        Built with Vite · Deployed via GitHub Pages
      </div>
    </div>
  `;

  function updateSyncLog() {
    const logEl = document.getElementById('sync-log');
    const logContainer = document.getElementById('sync-log-container');
    const entries = getSyncLog();
    if (entries.length > 0) {
      logContainer.style.display = 'block';
      logEl.textContent = entries.join('\n');
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  // --- Event Listeners ---

  // Save PAT
  document.getElementById('save-pat-btn').addEventListener('click', async () => {
    const pat = document.getElementById('pat-input').value.trim();
    const manualGistId = document.getElementById('gist-id-input').value.trim();

    if (!pat) {
      showToast('⚠️ PAT를 입력해주세요');
      return;
    }

    showToast('🔑 PAT 검증 중...');
    const valid = await validatePAT(pat);

    if (!valid) {
      showToast('❌ 유효하지 않은 PAT입니다');
      return;
    }

    // Save PAT and optional manual Gist ID
    const newSettings = { pat };
    if (manualGistId && manualGistId.length > 10) {
      newSettings.gistId = manualGistId;
    }
    updateSettings(newSettings);

    showToast('✅ PAT 저장 완료. 동기화 시작...');
    updateSyncIndicator('syncing');

    try {
      await sync();
      updateSyncIndicator('connected');
      showToast('☁️ 동기화 성공!');
      document.getElementById('gist-id-input').value = getSettings().gistId || '';
    } catch (err) {
      updateSyncIndicator('error');
      showToast('⚠️ 동기화 실패: ' + err.message);
    }

    updateSyncLog();
  });

  // Sync now
  document.getElementById('sync-now-btn').addEventListener('click', async () => {
    updateSyncIndicator('syncing');
    showToast('☁️ 동기화 중...');

    try {
      await sync();
      updateSyncIndicator('connected');
      showToast('✅ 동기화 완료!');
      document.getElementById('gist-id-input').value = getSettings().gistId || '';
    } catch (err) {
      updateSyncIndicator('error');
      showToast('⚠️ 동기화 실패: ' + err.message);
    }

    updateSyncLog();
  });

  // Daily limit
  document.getElementById('daily-limit-input').addEventListener('change', (e) => {
    const val = parseInt(e.target.value) || 20;
    updateSettings({ dailyLimit: Math.max(5, Math.min(100, val)) });
    showToast('✅ 일일 카드 수 변경');
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-wiki-quiz-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 데이터 내보내기 완료');
  });

  // Import
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importData(data);
        showToast('📥 데이터 가져오기 완료');
        renderSettingsView();
      } catch {
        showToast('❌ 유효하지 않은 파일입니다');
      }
    };
    reader.readAsText(file);
  });

  // Reset
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('정말로 모든 학습 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      resetAllData();
      showToast('🗑️ 모든 데이터가 초기화되었습니다');
      renderSettingsView();
    }
  });

  // Show existing log if available
  updateSyncLog();

  return { destroy() {} };
}
