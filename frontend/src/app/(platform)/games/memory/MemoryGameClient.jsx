"use client";
import GameBoard from "./components/GameBoard";
import GameHUD from "./components/GameHUD";
import GameSettings from "./components/GameSettings";
import GameOverlay from "./components/GameOverlay";
import useMemoryGame from "./hooks/useMemoryGame";

export default function MemoryGameClient() {
  const {
    cards, flippedCards, matchedCardIds, moves, timeElapsed,
    isGameOver, isGameStarted, difficulty, cardSet, score,
    flipCard, resetGame, startGame, toggleSettings, settingsOpen,
    setDifficulty, setCardSet, setSettingsOpen, formatTime
  } = useMemoryGame();

  return (
    <div style={{ minHeight: '100vh', background: '#0A0E18', padding: '24px 16px', fontFamily: "'Inter', sans-serif" }}>
      {/* 3D flip animation styles */}
      <style>{`
        .card-inner { transition: transform 0.5s; transform-style: preserve-3d; }
        .card-inner.flipped { transform: rotateY(180deg); }
        .card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .card-front { transform: rotateY(180deg); }
        .memory-card:hover .card-inner:not(.flipped) { transform: scale(1.05); }
        @keyframes matchPulse { 0%,100%{box-shadow:0 0 0 rgba(34,197,94,0)} 50%{box-shadow:0 0 20px rgba(34,197,94,0.3)} }
      `}</style>

      <GameHUD
        moves={moves} timeElapsed={timeElapsed}
        matchedPairs={matchedCardIds.size / 2} score={score}
        isGameStarted={isGameStarted} isGameOver={isGameOver}
        onToggleSettings={toggleSettings} settingsOpen={settingsOpen}
        difficulty={difficulty} cardSet={cardSet}
      />
      <GameBoard
        cards={cards} flippedCards={flippedCards}
        matchedCardIds={matchedCardIds} onCardClick={flipCard}
        isGameStarted={isGameStarted} isGameOver={isGameOver}
        difficulty={difficulty}
      />
      <GameSettings
        isOpen={settingsOpen} onClose={toggleSettings}
        onReset={resetGame} onStart={startGame}
        difficulty={difficulty} cardSet={cardSet}
        setDifficulty={setDifficulty} setCardSet={setCardSet}
      />
      <GameOverlay
        isGameOver={isGameOver} isGameStarted={isGameStarted}
        onReset={resetGame} onStart={startGame}
        moves={moves} timeElapsed={timeElapsed}
        score={score} formatTime={formatTime}
      />
    </div>
  );
}