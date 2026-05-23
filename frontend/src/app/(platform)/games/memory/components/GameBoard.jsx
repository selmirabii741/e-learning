"use client";
import MemoryCard from "./MemoryCard";
import { DIFFICULTIES } from "../utils/constants";

export default function GameBoard({ cards, flippedCards, matchedCardIds, onCardClick, isGameStarted, isGameOver, difficulty }) {
  const cols = DIFFICULTIES[difficulty]?.cols || 4;
  const disabled = flippedCards.length >= 2 || isGameOver || !isGameStarted;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '12px',
      maxWidth: `${cols * 95}px`,
      margin: '28px auto',
      padding: '0 12px',
    }}>
      {cards.map((card) => (
        <MemoryCard
          key={card.id}
          card={card}
          onClick={() => onCardClick(card.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}