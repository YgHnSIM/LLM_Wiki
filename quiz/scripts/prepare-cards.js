// prepare-cards.js
// Merges all quiz/cards/*.json files into a single card-index.json for the app

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cardsDir = join(__dirname, '..', 'cards');
const outputDir = join(__dirname, '..', 'app', 'public');
const outputFile = join(outputDir, 'card-index.json');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const files = readdirSync(cardsDir).filter(f => f.endsWith('.json'));
const allDecks = [];

for (const file of files) {
  const raw = readFileSync(join(cardsDir, file), 'utf-8');
  try {
    const deck = JSON.parse(raw);
    allDecks.push({
      fileName: file,
      source: deck.source,
      created: deck.created,
      cardCount: deck.cards.length,
      cards: deck.cards
    });
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
  }
}

const index = {
  version: new Date().toISOString(),
  totalCards: allDecks.reduce((sum, d) => sum + d.cardCount, 0),
  decks: allDecks
};

writeFileSync(outputFile, JSON.stringify(index, null, 2), 'utf-8');
console.log(`✅ Prepared ${index.totalCards} cards from ${allDecks.length} decks → ${outputFile}`);
