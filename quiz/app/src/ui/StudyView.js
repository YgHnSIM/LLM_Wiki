/**
 * StudyView — Card study screen with flip animation and SM-2 rating
 */

import { getAllCards, getCardsByDeck } from '../cardLoader.js';
import { getCardState, setCardState, recordReview, getSettings } from '../store.js';
import { calculateSM2, isDue } from '../sm2.js';
import { pushToGist, isSyncEnabled } from '../sync.js';
import { navigate } from '../router.js';
import { showToast } from '../main.js';

let sessionCards = [];
let currentIndex = 0;
let isFlipped = false;
let sessionStats = { reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 };

export function renderStudyView() {
  const container = document.getElementById('view-container');
  const deckSource = window._studyDeck || null;
  const dailyLimit = getSettings().dailyLimit || 20;

  // Gather due cards
  const pool = deckSource ? getCardsByDeck(deckSource) : getAllCards();
  sessionCards = pool.filter(c => isDue(getCardState(c.id)));

  // Limit to daily limit
  if (sessionCards.length > dailyLimit) {
    // Prioritize: due reviews first, then new cards
    const reviews = sessionCards.filter(c => getCardState(c.id));
    const newCards = sessionCards.filter(c => !getCardState(c.id));
    sessionCards = [...reviews, ...newCards].slice(0, dailyLimit);
  }

  // Shuffle
  sessionCards = shuffle(sessionCards);

  currentIndex = 0;
  isFlipped = false;
  sessionStats = { reviewed: 0, again: 0, hard: 0, good: 0, easy: 0 };

  if (sessionCards.length === 0) {
    renderEmpty(container);
    return { destroy() {} };
  }

  renderCard(container);

  return {
    destroy() {
      sessionCards = [];
      currentIndex = 0;
    }
  };
}

function renderCard(container) {
  if (currentIndex >= sessionCards.length) {
    renderComplete(container);
    return;
  }

  const card = sessionCards[currentIndex];
  const total = sessionCards.length;
  const progress = ((currentIndex / total) * 100).toFixed(1);

  container.innerHTML = `
    <div class="fade-in">
      <div class="study-header">
        <button class="study-back-btn" id="study-back">← 돌아가기</button>
        <span class="study-progress">${currentIndex + 1} / ${total}</span>
      </div>
      <div class="study-progress-bar">
        <div class="study-progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="flashcard-container">
        <div class="flashcard" id="flashcard">
          <div class="flashcard-face flashcard-front">
            <span class="card-type-badge ${card.type}">${getTypeName(card.type)}</span>
            <div class="flashcard-question">${card.type === 'cloze' ? formatCloze(escapeHtml(card.front), false) : escapeHtml(card.front)}</div>
            <span class="tap-hint">탭하여 정답 확인</span>
          </div>
          <div class="flashcard-face flashcard-back">
            <span class="card-type-badge ${card.type}">${getTypeName(card.type)}</span>
            <div class="flashcard-answer-label">Answer</div>
            ${card.type === 'cloze' ? `<div class="flashcard-cloze-context">${formatCloze(escapeHtml(card.front), true)}</div>` : ''}
            <div class="flashcard-answer">${escapeHtml(card.back)}</div>
          </div>
        </div>
      </div>

      <div class="rating-buttons" id="rating-buttons" style="visibility:hidden">
        <button class="rating-btn again" data-quality="0">
          다시
          <span class="interval">1일</span>
        </button>
        <button class="rating-btn hard" data-quality="3">
          어려움
          <span class="interval">${getPreviewInterval(card, 3)}</span>
        </button>
        <button class="rating-btn good" data-quality="4">
          보통
          <span class="interval">${getPreviewInterval(card, 4)}</span>
        </button>
        <button class="rating-btn easy" data-quality="5">
          쉬움
          <span class="interval">${getPreviewInterval(card, 5)}</span>
        </button>
      </div>
    </div>
  `;

  isFlipped = false;

  // Back button
  document.getElementById('study-back').addEventListener('click', () => navigate('#decks'));

  // Flashcard tap to flip
  document.getElementById('flashcard').addEventListener('click', () => {
    toggleFlip();
  });

  // Rating buttons
  document.getElementById('rating-buttons').querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const quality = parseInt(e.currentTarget.dataset.quality);
      handleRating(card, quality, container);
    });
  });
}

function toggleFlip() {
  isFlipped = !isFlipped;
  const cardEl = document.getElementById('flashcard');
  if (isFlipped) {
    cardEl.classList.add('flipped');
    document.getElementById('rating-buttons').style.visibility = 'visible';
  } else {
    cardEl.classList.remove('flipped');
  }
}

function handleRating(card, quality, container) {
  const currentState = getCardState(card.id) || { repetitions: 0, easiness: 2.5, interval: 0 };
  const newState = calculateSM2(currentState, quality);
  setCardState(card.id, newState);
  recordReview();

  // Track session stats
  sessionStats.reviewed++;
  if (quality === 0) sessionStats.again++;
  else if (quality === 3) sessionStats.hard++;
  else if (quality === 4) sessionStats.good++;
  else if (quality === 5) sessionStats.easy++;

  currentIndex++;
  renderCard(container);
}

function getPreviewInterval(card, quality) {
  const state = getCardState(card.id) || { repetitions: 0, easiness: 2.5, interval: 0 };
  const preview = calculateSM2(state, quality);
  return formatInterval(preview.interval);
}

function formatInterval(days) {
  if (days <= 0) return '즉시';
  if (days === 1) return '1일';
  if (days < 30) return `${days}일`;
  if (days < 365) return `${Math.round(days / 30)}개월`;
  return `${(days / 365).toFixed(1)}년`;
}

function renderEmpty(container) {
  container.innerHTML = `
    <div class="empty-state fade-in">
      <div class="empty-state-icon">🎉</div>
      <div class="empty-state-text">
        오늘의 복습을 모두 완료했습니다!<br>
        내일 다시 만나요.
      </div>
      <button class="btn btn-primary" style="margin-top:24px" onclick="location.hash='#decks'">돌아가기</button>
    </div>
  `;
}

async function renderComplete(container) {
  container.innerHTML = `
    <div class="session-complete fade-in">
      <div class="session-complete-icon">✨</div>
      <h2>학습 완료!</h2>
      <p>이번 세션에서 ${sessionStats.reviewed}장의 카드를 학습했습니다.</p>

      <div class="session-stats">
        <div class="stat-card">
          <div class="stat-value" style="-webkit-text-fill-color:var(--accent-red)">${sessionStats.again}</div>
          <div class="stat-label">다시</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="-webkit-text-fill-color:var(--accent-green)">${sessionStats.good + sessionStats.easy}</div>
          <div class="stat-label">정답</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="-webkit-text-fill-color:var(--accent-amber)">${sessionStats.hard}</div>
          <div class="stat-label">어려움</div>
        </div>
      </div>

      <button class="btn btn-primary" style="width:100%" onclick="location.hash='#decks'">돌아가기</button>
    </div>
  `;

  // Sync after session
  if (isSyncEnabled()) {
    try {
      await pushToGist();
      showToast('☁️ 동기화 완료');
    } catch {
      showToast('⚠️ 동기화 실패');
    }
  }
}

function getTypeName(type) {
  const map = {
    definition: 'Definition',
    causal: 'Cause & Effect',
    cloze: 'Fill in the Blank',
    comparison: 'Compare',
    timeline: 'Timeline',
    person: 'Person'
  };
  return map[type] || type;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function formatCloze(text, isFlipped) {
  const clozeRegex = /\{\{(.+?)\}\}/g;
  if (isFlipped) {
    return text.replace(clozeRegex, (match, p1) => `<span class="cloze-reveal">${p1}</span>`);
  } else {
    return text.replace(clozeRegex, '<span class="cloze-placeholder">[...]</span>');
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
