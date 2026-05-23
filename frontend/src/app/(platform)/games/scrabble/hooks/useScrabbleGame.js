import { useState, useCallback } from 'react';
import { createTileBag, drawTiles, createEmptyBoard, TILE_SCORES } from '../utils/scrabbleUtils';

export default function useScrabbleGame() {
  const [bag, setBag] = useState(() => createTileBag());
  const [board, setBoard] = useState(createEmptyBoard);
  const [players, setPlayers] = useState(() => {
    const b = createTileBag();
    const p1 = b.splice(0, 7);
    const p2 = b.splice(0, 7);
    return { rack: [p1, p2], scores: [0, 0], bag: b };
  });
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [selectedTile, setSelectedTile] = useState(null); // index in rack
  const [placedTiles, setPlacedTiles] = useState([]); // [{r,c,letter,rackIdx}]
  const [gameOver, setGameOver] = useState(false);
  const [passCount, setPassCount] = useState(0);

  const rack = players.rack[currentPlayer];

  const selectTile = useCallback((idx) => {
    setSelectedTile(prev => prev === idx ? null : idx);
  }, []);

  const placeTile = useCallback((r, c) => {
    if (selectedTile === null || board[r][c] || placedTiles.some(t => t.r === r && t.c === c)) return;
    const letter = rack[selectedTile];
    if (!letter) return;
    setPlacedTiles(prev => [...prev, { r, c, letter, rackIdx: selectedTile }]);
    setSelectedTile(null);
  }, [selectedTile, board, placedTiles, rack]);

  const removePlaced = useCallback((idx) => {
    setPlacedTiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const submitWord = useCallback(() => {
    if (placedTiles.length === 0) return;

    // Calculate simple score
    let score = 0;
    placedTiles.forEach(({ letter }) => {
      score += letter === '_' ? 0 : (TILE_SCORES[letter] || 0);
    });
    // Bonus for using all 7 tiles
    if (placedTiles.length === 7) score += 50;

    // Place tiles on board
    const newBoard = board.map(row => [...row]);
    placedTiles.forEach(({ r, c, letter }) => { newBoard[r][c] = letter; });

    // Remove used tiles from rack and draw new ones
    const usedIndices = new Set(placedTiles.map(t => t.rackIdx));
    const newRack = rack.filter((_, i) => !usedIndices.has(i));
    const needed = 7 - newRack.length;
    const drawn = players.bag.splice(0, needed);
    newRack.push(...drawn);

    const newPlayers = { ...players };
    newPlayers.rack = [...newPlayers.rack];
    newPlayers.rack[currentPlayer] = newRack;
    newPlayers.scores = [...newPlayers.scores];
    newPlayers.scores[currentPlayer] += score;

    setBoard(newBoard);
    setPlayers(newPlayers);
    setPlacedTiles([]);
    setPassCount(0);

    // Check game over
    if (newRack.length === 0 && players.bag.length === 0) {
      setGameOver(true);
    } else {
      setCurrentPlayer(prev => 1 - prev);
    }
  }, [placedTiles, board, rack, players, currentPlayer]);

  const passTurn = useCallback(() => {
    setPlacedTiles([]);
    setSelectedTile(null);
    const newPass = passCount + 1;
    if (newPass >= 4) { setGameOver(true); return; }
    setPassCount(newPass);
    setCurrentPlayer(prev => 1 - prev);
  }, [passCount]);

  const exchangeTiles = useCallback(() => {
    if (selectedTile === null || players.bag.length === 0) return;
    const newBag = [...players.bag];
    const newRack = [...rack];
    const old = newRack[selectedTile];
    const drawn = newBag.splice(0, 1);
    newRack[selectedTile] = drawn[0] || old;
    newBag.push(old);
    // Shuffle bag
    for (let i = newBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }
    const newPlayers = { ...players, bag: newBag };
    newPlayers.rack = [...newPlayers.rack];
    newPlayers.rack[currentPlayer] = newRack;
    setPlayers(newPlayers);
    setSelectedTile(null);
    setCurrentPlayer(prev => 1 - prev);
  }, [selectedTile, rack, players, currentPlayer]);

  const reset = useCallback(() => {
    const b = createTileBag();
    const p1 = b.splice(0, 7);
    const p2 = b.splice(0, 7);
    setPlayers({ rack: [p1, p2], scores: [0, 0], bag: b });
    setBoard(createEmptyBoard());
    setCurrentPlayer(0);
    setSelectedTile(null);
    setPlacedTiles([]);
    setGameOver(false);
    setPassCount(0);
  }, []);

  return {
    board, rack, currentPlayer, selectedTile, placedTiles,
    scores: players.scores, tilesLeft: players.bag.length, gameOver,
    selectTile, placeTile, removePlaced, submitWord, passTurn, exchangeTiles, reset,
  };
}
