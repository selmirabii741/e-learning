import { legalMoves, doMove, inCheck } from './chessEngine';

const PV = { pawn:100, knight:320, bishop:330, rook:500, queen:900, king:20000 };

function evaluate(board) {
  let s = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const v = PV[p.type] || 0;
      // Center control bonus
      const cb = (p.type === 'pawn' || p.type === 'knight') ? (3.5 - Math.abs(c - 3.5)) * 5 + (3.5 - Math.abs(r - 3.5)) * 3 : 0;
      s += (p.color === 'white' ? 1 : -1) * (v + cb);
    }
  return s;
}

function allMoves(board, color, castling, ep) {
  const m = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c]?.color === color)
        for (const [tr, tc] of legalMoves(board, r, c, castling, ep))
          m.push({ from: [r, c], to: [tr, tc], capture: !!board[tr][tc] });
  m.sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));
  return m;
}

function minimax(board, depth, alpha, beta, max, castling, ep) {
  if (depth === 0) return evaluate(board);
  const color = max ? 'white' : 'black';
  const moves = allMoves(board, color, castling, ep);
  if (!moves.length) return inCheck(board, color) ? (max ? -99999 : 99999) : 0;
  if (max) {
    let v = -Infinity;
    for (const m of moves) {
      const r = doMove(board, m.from, m.to, castling, ep);
      v = Math.max(v, minimax(r.board, depth - 1, alpha, beta, false, r.castling, r.enPassant));
      alpha = Math.max(alpha, v);
      if (beta <= alpha) break;
    }
    return v;
  } else {
    let v = Infinity;
    for (const m of moves) {
      const r = doMove(board, m.from, m.to, castling, ep);
      v = Math.min(v, minimax(r.board, depth - 1, alpha, beta, true, r.castling, r.enPassant));
      beta = Math.min(beta, v);
      if (beta <= alpha) break;
    }
    return v;
  }
}

export function findBestMove(board, castling, ep, diff = 'medium') {
  const depth = diff === 'easy' ? 1 : diff === 'hard' ? 3 : 2;
  const moves = allMoves(board, 'black', castling, ep);
  if (!moves.length) return null;
  if (diff === 'easy' && Math.random() < 0.3) return moves[Math.floor(Math.random() * moves.length)];
  let best = moves[0], bestVal = Infinity;
  for (const m of moves) {
    const r = doMove(board, m.from, m.to, castling, ep);
    const v = minimax(r.board, depth - 1, -Infinity, Infinity, true, r.castling, r.enPassant);
    if (v < bestVal) { bestVal = v; best = m; }
  }
  return best;
}
