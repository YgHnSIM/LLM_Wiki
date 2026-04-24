/**
 * CardLoader — loads card-index.json and provides card access utilities
 */

let _cardIndex = null;

/**
 * Load the card index from the bundled JSON.
 */
export async function loadCards() {
  if (_cardIndex) return _cardIndex;

  const base = import.meta.env.BASE_URL || '/';
  const res = await fetch(`${base}card-index.json`);
  if (!res.ok) throw new Error('카드 데이터를 불러올 수 없습니다.');
  _cardIndex = await res.json();
  return _cardIndex;
}

/**
 * Get all cards as a flat array.
 */
export function getAllCards() {
  if (!_cardIndex) return [];
  return _cardIndex.decks.flatMap(deck =>
    deck.cards.map(card => ({ ...card, deckSource: deck.source }))
  );
}

/**
 * Get all deck summaries.
 */
export function getDecks() {
  if (!_cardIndex) return [];
  return _cardIndex.decks.map(d => ({
    fileName: d.fileName,
    source: d.source,
    cardCount: d.cardCount,
    created: d.created
  }));
}

/**
 * Get cards for a specific deck source.
 */
export function getCardsByDeck(source) {
  if (!_cardIndex) return [];
  const deck = _cardIndex.decks.find(d => d.source === source);
  return deck ? deck.cards.map(c => ({ ...c, deckSource: source })) : [];
}

/**
 * Get unique tags across all cards.
 */
export function getAllTags() {
  const tags = new Set();
  getAllCards().forEach(card => {
    (card.tags || []).forEach(t => tags.add(t));
  });
  return [...tags].sort();
}
