/**
 * StatsView — Learning statistics dashboard
 */

import { getStats, getAllCardStates } from '../store.js';
import { getAllCards } from '../cardLoader.js';
import { getMaturity } from '../sm2.js';
import { daysAgo } from '../utils/dateUtils.js';

export function renderStatsView() {
  const container = document.getElementById('view-container');
  const stats = getStats();
  const allStates = getAllCardStates();
  const allCards = getAllCards();

  // Maturity distribution
  let newCount = 0, learningCount = 0, matureCount = 0;
  for (const card of allCards) {
    const state = allStates[card.id];
    const maturity = getMaturity(state);
    if (maturity === 'new') newCount++;
    else if (maturity === 'learning') learningCount++;
    else matureCount++;
  }
  const total = allCards.length || 1;

  // Heatmap: last 28 days
  const heatmapCells = [];
  for (let i = 27; i >= 0; i--) {
    const date = daysAgo(i);
    const count = stats.reviewHistory[date] || 0;
    let level = 0;
    if (count > 0) level = 1;
    if (count >= 5) level = 2;
    if (count >= 15) level = 3;
    if (count >= 30) level = 4;
    heatmapCells.push({ date, count, level });
  }

  container.innerHTML = `
    <div class="fade-in">
      <!-- Summary Stats -->
      <div class="stats-section">
        <div class="stats-section-title">학습 현황</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${stats.totalReviews}</div>
            <div class="stat-label">총 복습 횟수</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stats.streak}</div>
            <div class="stat-label">🔥 연속 일수</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${allCards.length}</div>
            <div class="stat-label">전체 카드</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${matureCount}</div>
            <div class="stat-label">체화 완료</div>
          </div>
        </div>
      </div>

      <!-- Maturity Distribution -->
      <div class="stats-section">
        <div class="stats-section-title">카드 성숙도 분포</div>
        <div class="maturity-bar">
          <div class="maturity-segment new" style="width:${(newCount/total*100).toFixed(1)}%"></div>
          <div class="maturity-segment learning" style="width:${(learningCount/total*100).toFixed(1)}%"></div>
          <div class="maturity-segment mature" style="width:${(matureCount/total*100).toFixed(1)}%"></div>
        </div>
        <div class="maturity-legend">
          <span><span class="legend-dot new"></span>새 카드 ${newCount}</span>
          <span><span class="legend-dot learning"></span>학습 중 ${learningCount}</span>
          <span><span class="legend-dot mature"></span>체화 ${matureCount}</span>
        </div>
      </div>

      <!-- Heatmap -->
      <div class="stats-section">
        <div class="stats-section-title">최근 28일 학습 기록</div>
        <div class="heatmap">
          ${heatmapCells.map(c => `<div class="heatmap-cell level-${c.level}" title="${c.date}: ${c.count}회"></div>`).join('')}
        </div>
      </div>
    </div>
  `;

  return { destroy() {} };
}
