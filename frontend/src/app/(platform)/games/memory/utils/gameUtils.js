// ============================================================
// MEMORY GAME — Pure utility functions (no React)
// ============================================================

import { CARD_SETS, SCORE } from "./constants";

/**
 * Build a shuffled deck of card-pairs for the given difficulty.
 * Returns an array of card objects: { id, emoji, isFlipped, isMatched }
 */
export function buildDeck(pairs, cardSet = "science") {
  const pool = [...CARD_SETS[cardSet]];
  const selected = pool.slice(0, pairs);

  // Duplicate each emoji to create a pair, then shuffle
  const deck = [...selected, ...selected].map((emoji, idx) => ({
    id: idx,
    emoji,
    pairId: selected.indexOf(emoji),   // shared between the two twins
    isFlipped: false,
    isMatched: false,
  }));

  return shuffle(deck);
}

/**
 * Fisher-Yates shuffle — O(n), no mutation of original.
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Calculate the final score when the game is won.
 * @param {number} moves     — total flips / 2 (pairs attempted)
 * @param {number} pairs     — total pairs in the deck
 * @param {number} timeLeft  — seconds remaining
 */
export function calculateScore(moves, pairs, timeLeft) {
  const baseScore = pairs * SCORE.matchBonus;
  const timeBonus = Math.max(0, timeLeft) * SCORE.timeBonus;
  const perfectBonus = moves === pairs ? SCORE.perfectBonus : 0;
  const movePenalty = Math.max(0, (moves - pairs) * 5);

  return Math.max(0, baseScore + timeBonus + perfectBonus - movePenalty);
}

/**
 * Format seconds as MM:SS string.
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}