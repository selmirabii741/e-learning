import { useState, useCallback, useEffect, useRef } from 'react';
import { initBoard, legalMoves, doMove, gameStatus, SYMBOLS, toAN } from '../utils/chessEngine';
import { findBestMove } from '../utils/chessAI';

export default function useChessGame() {
  const [board, setBoard] = useState(initBoard);
  const [turn, setTurn] = useState('white');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [castling, setCastling] = useState({ white: { k: true, q: true }, black: { k: true, q: true } });
  const [enPassant, setEnPassant] = useState(null);
  const [status, setStatus] = useState('playing');
  const [history, setHistory] = useState([]);
  const [captured, setCaptured] = useState({ white: [], black: [] });
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiThinking, setAiThinking] = useState(false);
  
  // State stack for undo/redo
  const [stateStack, setStateStack] = useState([{
    board: initBoard,
    turn: 'white',
    castling: { white: { k: true, q: true }, black: { k: true, q: true } },
    enPassant: null,
    status: 'playing',
    history: [],
    captured: { white: [], black: [] }
  }]);
  const [stackIndex, setStackIndex] = useState(0);

  // Refs for AI effect to read latest state
  const stateRef = useRef();
  stateRef.current = { board, castling, enPassant, status };
  const firstRenderRef = useRef(true);

  // Save state after each move
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setStateStack(prev => {
      const newStack = prev.slice(0, stackIndex + 1);
      newStack.push({
        board, turn, castling, enPassant, status, history, captured
      });
      return newStack;
    });
    setStackIndex(prev => prev + 1);
  }, [turn]);

  // AI plays as black
  useEffect(() => {
    if (turn !== 'black' || status === 'checkmate' || status === 'stalemate') return;
    setAiThinking(true);
    const timer = setTimeout(() => {
      const { board: b, castling: ca, enPassant: ep } = stateRef.current;
      const move = findBestMove(b, ca, ep, aiDifficulty);
      if (move) {
        const piece = b[move.from[0]][move.from[1]];
        const result = doMove(b, move.from, move.to, ca, ep);
        const notation = `${SYMBOLS[piece.color][piece.type]} ${toAN(move.from[0], move.from[1])}→${toAN(move.to[0], move.to[1])}`;
        if (result.captured) setCaptured(p => ({ ...p, [result.captured.color]: [...p[result.captured.color], result.captured] }));
        setBoard(result.board);
        setCastling(result.castling);
        setEnPassant(result.enPassant);
        setHistory(p => [...p, notation]);
        setTurn('white');
        setStatus(gameStatus(result.board, 'white', result.castling, result.enPassant));
      }
      setAiThinking(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [turn, status, aiDifficulty]);

  const handleClick = useCallback((row, col) => {
    if (status === 'checkmate' || status === 'stalemate' || turn !== 'white' || aiThinking) return;
    const piece = board[row][col];
    if (piece?.color === 'white') {
      setSelected([row, col]);
      setValidMoves(legalMoves(board, row, col, castling, enPassant));
      return;
    }
    if (!selected) return;
    if (!validMoves.some(([r, c]) => r === row && c === col)) { setSelected(null); setValidMoves([]); return; }
    const fromPiece = board[selected[0]][selected[1]];
    const result = doMove(board, selected, [row, col], castling, enPassant);
    const notation = `${SYMBOLS[fromPiece.color][fromPiece.type]} ${toAN(selected[0], selected[1])}→${toAN(row, col)}`;
    if (result.captured) setCaptured(p => ({ ...p, [result.captured.color]: [...p[result.captured.color], result.captured] }));
    setBoard(result.board);
    setCastling(result.castling);
    setEnPassant(result.enPassant);
    setHistory(p => [...p, notation]);
    setSelected(null);
    setValidMoves([]);
    setTurn('black');
    setStatus(gameStatus(result.board, 'black', result.castling, result.enPassant));
  }, [board, turn, selected, validMoves, castling, enPassant, status, aiThinking]);

  const reset = useCallback(() => {
    const initialState = {
      board: initBoard(),
      turn: 'white',
      castling: { white: { k: true, q: true }, black: { k: true, q: true } },
      enPassant: null,
      status: 'playing',
      history: [],
      captured: { white: [], black: [] }
    };
    setBoard(initialState.board);
    setTurn(initialState.turn);
    setSelected(null);
    setValidMoves([]);
    setCastling(initialState.castling);
    setEnPassant(initialState.enPassant);
    setStatus(initialState.status);
    setHistory(initialState.history);
    setCaptured(initialState.captured);
    setAiThinking(false);
    setStateStack([initialState]);
    setStackIndex(0);
  }, []);

  const saveState = useCallback(() => {
    setStateStack(prev => {
      const newStack = prev.slice(0, stackIndex + 1);
      newStack.push({
        board, turn, castling, enPassant, status, history, captured
      });
      return newStack;
    });
    setStackIndex(prev => prev + 1);
  }, [board, turn, castling, enPassant, status, history, captured, stackIndex]);

  const undo = useCallback(() => {
    if (stackIndex <= 0) return;
    const newIndex = stackIndex - 1;
    const prevState = stateStack[newIndex];
    setBoard(prevState.board);
    setTurn(prevState.turn);
    setCastling(prevState.castling);
    setEnPassant(prevState.enPassant);
    setStatus(prevState.status);
    setHistory(prevState.history);
    setCaptured(prevState.captured);
    setSelected(null);
    setValidMoves([]);
    setStackIndex(newIndex);
  }, [stackIndex, stateStack]);

  const redo = useCallback(() => {
    if (stackIndex >= stateStack.length - 1) return;
    const newIndex = stackIndex + 1;
    const nextState = stateStack[newIndex];
    setBoard(nextState.board);
    setTurn(nextState.turn);
    setCastling(nextState.castling);
    setEnPassant(nextState.enPassant);
    setStatus(nextState.status);
    setHistory(nextState.history);
    setCaptured(nextState.captured);
    setSelected(null);
    setValidMoves([]);
    setStackIndex(newIndex);
  }, [stackIndex, stateStack]);

  return { board, turn, selected, validMoves, status, history, captured, aiThinking, aiDifficulty, setAiDifficulty, handleClick, reset, SYMBOLS, undo, redo, canUndo: stackIndex > 0, canRedo: stackIndex < stateStack.length - 1 };
}
