/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo-2 algorithm by Piotr Wozniak (1987)
 *
 * Tracks per card: repetitions, easiness, interval, dueDate
 * Quality rating: 0 (total blackout) to 5 (perfect)
 */

/**
 * Calculate the next review state for a card based on the user's quality rating.
 * @param {Object} cardState - Current card state { repetitions, easiness, interval }
 * @param {number} quality - User rating 0-5
 * @returns {Object} Updated state { repetitions, easiness, interval, dueDate }
 */
export function calculateSM2(cardState, quality) {
  let { repetitions = 0, easiness = 2.5, interval = 0 } = cardState;

  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, quality));

  if (quality < 3) {
    // Failed: reset repetitions, review again soon
    return {
      repetitions: 0,
      easiness,
      interval: 1,
      dueDate: addDays(new Date(), 1)
    };
  }

  // Update easiness factor (minimum 1.3)
  easiness = Math.max(
    1.3,
    easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Update interval
  if (repetitions === 0) {
    interval = 1;
  } else if (repetitions === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * easiness);
  }

  repetitions++;

  return {
    repetitions,
    easiness,
    interval,
    dueDate: addDays(new Date(), interval)
  };
}

/**
 * Determine the maturity level of a card.
 * @param {Object} cardState
 * @returns {'new'|'learning'|'mature'}
 */
export function getMaturity(cardState) {
  if (!cardState || cardState.repetitions === 0) return 'new';
  if (cardState.interval < 21) return 'learning';
  return 'mature';
}

/**
 * Check if a card is due for review.
 * @param {Object} cardState
 * @returns {boolean}
 */
export function isDue(cardState) {
  if (!cardState || !cardState.dueDate) return true; // new cards are always due
  return new Date(cardState.dueDate) <= new Date();
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0]; // YYYY-MM-DD
}
