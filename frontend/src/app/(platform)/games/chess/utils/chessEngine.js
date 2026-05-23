export const SYMBOLS = {
  white: { king:'♔', queen:'♕', rook:'♖', bishop:'♗', knight:'♘', pawn:'♙' },
  black: { king:'♚', queen:'♛', rook:'♜', bishop:'♝', knight:'♞', pawn:'♟' },
};

export function initBoard() {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const order = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: order[c], color: 'black' };
    b[1][c] = { type: 'pawn', color: 'black' };
    b[6][c] = { type: 'pawn', color: 'white' };
    b[7][c] = { type: order[c], color: 'white' };
  }
  return b;
}

const ok = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const clone = b => b.map(r => r.map(c => c ? { ...c } : null));

function findKing(b, color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (b[r][c]?.type === 'king' && b[r][c]?.color === color) return [r, c];
  return null;
}

function rawMoves(b, row, col, ep) {
  const p = b[row][col];
  if (!p) return [];
  const { type, color } = p;
  const moves = [];
  const enemy = color === 'white' ? 'black' : 'white';

  const tryAdd = (r, c) => {
    if (!ok(r, c) || b[r][c]?.color === color) return false;
    moves.push([r, c]);
    return !b[r][c];
  };
  const slide = (dr, dc) => { for (let i = 1; i < 8; i++) if (!tryAdd(row + dr * i, col + dc * i)) break; };

  if (type === 'pawn') {
    const dir = color === 'white' ? -1 : 1;
    const start = color === 'white' ? 6 : 1;
    if (ok(row + dir, col) && !b[row + dir][col]) {
      moves.push([row + dir, col]);
      if (row === start && !b[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
    }
    for (const dc of [-1, 1]) {
      const nr = row + dir, nc = col + dc;
      if (ok(nr, nc) && b[nr][nc]?.color === enemy) moves.push([nr, nc]);
      if (ep && ep[0] === nr && ep[1] === nc) moves.push([nr, nc]);
    }
  } else if (type === 'rook') {
    slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1);
  } else if (type === 'bishop') {
    slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1);
  } else if (type === 'queen') {
    slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1);
    slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1);
  } else if (type === 'knight') {
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) tryAdd(row + dr, col + dc);
  } else if (type === 'king') {
    for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) tryAdd(row + dr, col + dc);
  }
  return moves;
}

export function inCheck(b, color) {
  const kp = findKing(b, color);
  if (!kp) return false;
  const enemy = color === 'white' ? 'black' : 'white';
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (b[r][c]?.color === enemy && rawMoves(b, r, c, null).some(([mr, mc]) => mr === kp[0] && mc === kp[1]))
        return true;
  return false;
}

export function legalMoves(b, row, col, castling, ep) {
  const piece = b[row][col];
  if (!piece) return [];
  const moves = rawMoves(b, row, col, ep).filter(([tr, tc]) => {
    const nb = clone(b);
    if (piece.type === 'pawn' && ep && tr === ep[0] && tc === ep[1])
      nb[piece.color === 'white' ? tr + 1 : tr - 1][tc] = null;
    nb[tr][tc] = nb[row][col];
    nb[row][col] = null;
    return !inCheck(nb, piece.color);
  });

  if (piece.type === 'king' && !inCheck(b, piece.color)) {
    const r = piece.color === 'white' ? 7 : 0;
    if (row === r && col === 4) {
      if (castling[piece.color]?.k && !b[r][5] && !b[r][6] && b[r][7]?.type === 'rook' && b[r][7]?.color === piece.color) {
        const b1 = clone(b); b1[r][5] = b1[r][4]; b1[r][4] = null;
        const b2 = clone(b); b2[r][6] = b2[r][4]; b2[r][4] = null;
        if (!inCheck(b1, piece.color) && !inCheck(b2, piece.color)) moves.push([r, 6]);
      }
      if (castling[piece.color]?.q && !b[r][3] && !b[r][2] && !b[r][1] && b[r][0]?.type === 'rook' && b[r][0]?.color === piece.color) {
        const b1 = clone(b); b1[r][3] = b1[r][4]; b1[r][4] = null;
        const b2 = clone(b); b2[r][2] = b2[r][4]; b2[r][4] = null;
        if (!inCheck(b1, piece.color) && !inCheck(b2, piece.color)) moves.push([r, 2]);
      }
    }
  }
  return moves;
}

export function doMove(b, from, to, castling, ep) {
  const nb = clone(b);
  const piece = { ...nb[from[0]][from[1]] };
  const captured = nb[to[0]][to[1]];
  let newEp = null;
  const nc = JSON.parse(JSON.stringify(castling));

  if (piece.type === 'pawn' && ep && to[0] === ep[0] && to[1] === ep[1])
    nb[piece.color === 'white' ? to[0] + 1 : to[0] - 1][to[1]] = null;
  if (piece.type === 'pawn' && Math.abs(to[0] - from[0]) === 2)
    newEp = [(from[0] + to[0]) / 2, from[1]];
  if (piece.type === 'king') {
    nc[piece.color] = { k: false, q: false };
    if (Math.abs(to[1] - from[1]) === 2) {
      if (to[1] === 6) { nb[to[0]][5] = nb[to[0]][7]; nb[to[0]][7] = null; }
      else { nb[to[0]][3] = nb[to[0]][0]; nb[to[0]][0] = null; }
    }
  }
  if (piece.type === 'rook') {
    if (from[0] === 7 && from[1] === 0) nc.white.q = false;
    if (from[0] === 7 && from[1] === 7) nc.white.k = false;
    if (from[0] === 0 && from[1] === 0) nc.black.q = false;
    if (from[0] === 0 && from[1] === 7) nc.black.k = false;
  }
  if (piece.type === 'pawn' && (to[0] === 0 || to[0] === 7)) piece.type = 'queen';

  nb[to[0]][to[1]] = piece;
  nb[from[0]][from[1]] = null;
  return { board: nb, castling: nc, enPassant: newEp, captured };
}

export function gameStatus(b, turn, castling, ep) {
  let hasMove = false;
  for (let r = 0; r < 8 && !hasMove; r++)
    for (let c = 0; c < 8 && !hasMove; c++)
      if (b[r][c]?.color === turn && legalMoves(b, r, c, castling, ep).length > 0) hasMove = true;
  if (!hasMove) return inCheck(b, turn) ? 'checkmate' : 'stalemate';
  return inCheck(b, turn) ? 'check' : 'playing';
}

export const toAN = (r, c) => String.fromCharCode(97 + c) + (8 - r);
