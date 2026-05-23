export const TILE_SCORES = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

export const TILE_COUNTS = {A:9,B:2,C:2,D:4,E:12,F:2,G:3,H:2,I:9,J:1,K:1,L:4,M:2,N:6,O:8,P:2,Q:1,R:6,S:4,T:6,U:4,V:2,W:2,X:1,Y:2,Z:1,'_':2};

// Premium square map for 15x15 board (only store one quadrant, mirror it)
// TW=triple word, DW=double word, TL=triple letter, DL=double letter
const PREMIUM_MAP = {
  '0,0':'TW','0,7':'TW','7,0':'TW',
  '1,1':'DW','2,2':'DW','3,3':'DW','4,4':'DW','7,7':'DW',
  '1,5':'TL','5,1':'TL','5,5':'TL',
  '0,3':'DL','2,6':'DL','3,0':'DL','3,7':'DL','6,2':'DL','6,6':'DL','7,3':'DL',
};

export function getPremium(r, c) {
  // Mirror to all 4 quadrants
  const mr = r > 7 ? 14 - r : r;
  const mc = c > 7 ? 14 - c : c;
  return PREMIUM_MAP[`${mr},${mc}`] || null;
}

export function createTileBag() {
  const bag = [];
  for (const [letter, count] of Object.entries(TILE_COUNTS)) {
    for (let i = 0; i < count; i++) bag.push(letter);
  }
  // Shuffle
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function drawTiles(bag, count) {
  const drawn = bag.splice(0, Math.min(count, bag.length));
  return drawn;
}

export function createEmptyBoard() {
  return Array(15).fill(null).map(() => Array(15).fill(null));
}

export function calcWordScore(letters, positions, board) {
  let wordMul = 1;
  let score = 0;
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const [r, c] = positions[i];
    let letterScore = letter === '_' ? 0 : (TILE_SCORES[letter] || 0);
    const prem = board[r][c] ? null : getPremium(r, c); // premium only on first use
    if (prem === 'DL') letterScore *= 2;
    if (prem === 'TL') letterScore *= 3;
    if (prem === 'DW') wordMul *= 2;
    if (prem === 'TW') wordMul *= 3;
    score += letterScore;
  }
  return score * wordMul;
}

export const PREMIUM_COLORS = {
  TW: { bg: '#c0392b', label: '3W' },
  DW: { bg: '#e8a0bf', label: '2W' },
  TL: { bg: '#2980b9', label: '3L' },
  DL: { bg: '#5dade2', label: '2L' },
};
