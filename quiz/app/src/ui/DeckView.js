/**
 * DeckView — Deck selection and overview screen
 */

import { getDecks, getAllCards, getCardsByDeck } from '../cardLoader.js';
import { getCardState, getAllCardStates } from '../store.js';
import { isDue, getMaturity } from '../sm2.js';

export function renderDeckView() {
  const container = document.getElementById('view-container');
  const decks = getDecks();
  const allCards = getAllCards();

  // Count overall due cards
  const dueCards = allCards.filter(c => {
    const state = getCardState(c.id);
    return isDue(state);
  });

  let html = '';

  // Study All button
  if (dueCards.length > 0) {
    html += `
      <button class="study-all-btn" id="study-all-btn">
        📚 오늘의 학습 시작
        <span class="card-count">${dueCards.length}장 복습 대기</span>
      </button>
    `;
  }

  html += '<div class="deck-list">';

  for (const deck of decks) {
    const cards = getCardsByDeck(deck.source);
    const states = getAllCardStates();

    let newCount = 0, dueCount = 0, doneCount = 0;
    for (const card of cards) {
      const state = states[card.id];
      if (!state) {
        newCount++;
      } else if (isDue(state)) {
        dueCount++;
      } else {
        doneCount++;
      }
    }

    const total = cards.length;
    const progress = total > 0 ? ((doneCount / total) * 100) : 0;

    html += `
      <div class="deck-card fade-in" data-source="${deck.source}">
        <div class="deck-card-title">${deck.source}</div>
        <div class="deck-card-meta">
          <span class="deck-stat new-count">
            <span class="count">${newCount}</span> 새 카드
          </span>
          <span class="deck-stat due-count">
            <span class="count">${dueCount}</span> 복습
          </span>
          <span class="deck-stat done-count">
            <span class="count">${doneCount}</span> 완료
          </span>
        </div>
        <div class="deck-progress-bar">
          <div class="deck-progress-fill" style="width:${progress.toFixed(1)}%"></div>
        </div>
      </div>
    `;
  }

  html += '</div>';

  container.innerHTML = html;

  // Event listeners
  document.getElementById('study-all-btn')?.addEventListener('click', () => {
    window._studyDeck = null; // all decks
    window.location.hash = '#study';
  });

  container.querySelectorAll('.deck-card').forEach(el => {
    el.addEventListener('click', () => {
      window._studyDeck = el.dataset.source;
      window.location.hash = '#study';
    });
  });

  return { destroy() {} };
}
