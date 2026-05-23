import { useState, useCallback, useEffect } from 'react';
import { buildDeck, shuffle, calculateScore, formatTime } from '../utils/gameUtils';
import { CARD_SETS, DIFFICULTIES, FLIP_BACK_DELAY, SCORE } from '../utils/constants';

const useMemoryGame = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCardIds, setMatchedCardIds] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timerId, setTimerId] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [cardSet, setCardSet] = useState('science');
  const [score, setScore] = useState(0);

  // Initialize the game
  const initializeGame = useCallback((diff = 'medium', set = 'science') => {
    setDifficulty(diff);
    setCardSet(set);

    const pairs = DIFFICULTIES[diff].pairs;
    const initialCards = buildDeck(pairs, set);
    setCards(initialCards);
    setFlippedCards([]);
    setMatchedCardIds(new Set());
    setMoves(0);
    setTimeElapsed(0);
    setIsGameOver(false);
    setIsGameStarted(true);
    setScore(0);

    if (timerId) {
      clearInterval(timerId);
    }

    // Start timer
    const id = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    setTimerId(id);
  }, [timerId]);

  // Flip a card
  const flipCard = useCallback((cardId) => {
    // If game is not started or already over, do nothing
    if (!isGameStarted || isGameOver) return;

    const cardIndex = cards.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return;

    const card = cards[cardIndex];
    if (card.isFlipped || card.isMatched) return;

    // Flip the card
    setFlippedCards(prev => [...prev, cardId]);

    // Update card state
    const newCards = cards.map(c =>
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    // If we have two flipped cards, check for match
    if (flippedCards.length === 1) {
      const [firstId] = flippedCards;
      const firstCard = cards.find(c => c.id === firstId);

      // Increment moves (each pair of flips counts as one move)
      setMoves(prev => prev + 1);

      // Check if cards match
      if (firstCard.pairId === card.pairId) {
        // Match!
        setMatchedCardIds(prev => {
          const newSet = new Set(prev);
          newSet.add(firstId);
          newSet.add(cardId);
          return newSet;
        });
        // Update cards to be matched
        setCards(prev => prev.map(c =>
          c.id === firstId || c.id === cardId ? { ...c, isMatched: true } : c
        ));
        // Reset flipped cards
        setFlippedCards([]);
        // Check if game is over
        if (matchedCardIds.size + 2 === DIFFICULTIES[difficulty].pairs * 2) {
          setIsGameOver(true);
          if (timerId) {
            clearInterval(timerId);
          }
          // Calculate final score
          const timeLeft = DIFFICULTIES[difficulty].time - timeElapsed;
          const finalScore = calculateScore(moves + 1, DIFFICULTIES[difficulty].pairs, Math.max(0, timeLeft));
          setScore(finalScore);
        }
      } else {
        // Not a match, flip back after a delay
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === cardId ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, FLIP_BACK_DELAY);
      }
    }
  }, [cards, flippedCards, isGameStarted, isGameOver, matchedCardIds, timerId, difficulty, timeElapsed, moves]);

  // Reset the game
  const resetGame = useCallback(() => {
    if (timerId) {
      clearInterval(timerId);
    }
    initializeGame(difficulty, cardSet);
  }, [initializeGame, timerId, difficulty, cardSet]);

  // Start the game (alias for resetGame)
  const startGame = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // Toggle settings
  const toggleSettings = useCallback(() => {
    setSettingsOpen(prev => !prev);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [timerId]);

  return {
    cards,
    flippedCards,
    matchedCardIds,
    moves,
    timeElapsed,
    isGameOver,
    isGameStarted,
    settingsOpen,
    difficulty,
    cardSet,
    score,
    flipCard,
    resetGame,
    startGame,
    toggleSettings,
    setDifficulty: (diff) => setDifficulty(diff),
    setCardSet: (set) => setCardSet(set),
    setSettingsOpen: (open) => setSettingsOpen(open),
    formatTime: (seconds) => formatTime(seconds)
  };
};

export default useMemoryGame;