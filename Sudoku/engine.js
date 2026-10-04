(function (root) {
  'use strict';
  const LEVELS = { easy: { label: '易', clues: 44 }, medium: { label: '中', clues: 35 }, hard: { label: '難', clues: 28 } };
  const row = i => Math.floor(i / 9), col = i => i % 9;
  const box = i => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);
  const peers = (a, b) => a !== b && (row(a) === row(b) || col(a) === col(b) || box(a) === box(b));
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function candidates(board, i) {
    let mask = 0x3fe;
    for (let j = 0; j < 81; j++) if (peers(i, j) && board[j]) mask &= ~(1 << board[j]);
    return Array.from({length: 9}, (_, n) => n + 1).filter(n => mask & (1 << n));
  }
  function valid(board, complete = false) {
    return Array.isArray(board) && board.length === 81 && board.every((v, i) => Number.isInteger(v) && v >= (complete ? 1 : 0) && v <= 9 && (!v || !board.some((w, j) => peers(i, j) && v === w)));
  }
  function solve(input, limit = 2, random = false) {
    if (!valid(input)) return { count: 0, solution: null };
    const board = [...input], rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
    board.forEach((n, i) => { if (n) { rows[row(i)] |= 1 << n; cols[col(i)] |= 1 << n; boxes[box(i)] |= 1 << n; } });
    let count = 0, solution = null;
    function visit() {
      let chosen = -1, options = [], minimum = 10;
      for (let i = 0; i < 81; i++) if (!board[i]) {
        const mask = 0x3fe & ~(rows[row(i)] | cols[col(i)] | boxes[box(i)]);
        const ns = []; for (let n = 1; n <= 9; n++) if (mask & (1 << n)) ns.push(n);
        if (!ns.length) return;
        if (ns.length < minimum) { chosen = i; options = ns; minimum = ns.length; if (minimum === 1) break; }
      }
      if (chosen < 0) { count++; if (!solution) solution = [...board]; return; }
      const r = row(chosen), c = col(chosen), b = box(chosen);
      for (const n of random ? shuffle(options) : options) {
        board[chosen] = n; rows[r] |= 1 << n; cols[c] |= 1 << n; boxes[b] |= 1 << n;
        visit(); board[chosen] = 0; rows[r] &= ~(1 << n); cols[c] &= ~(1 << n); boxes[b] &= ~(1 << n);
        if (count >= limit) return;
      }
    }
    visit(); return { count, solution };
  }
  function generate(level = 'easy') {
    const target = LEVELS[level]?.clues;
    if (!target) throw new Error('Unknown difficulty');
    // Each removed clue is accepted only if the puzzle still has one solution.
    for (let attempt = 0; attempt < 30; attempt++) {
      const solution = solve(Array(81).fill(0), 1, true).solution;
      const puzzle = [...solution]; let clues = 81;
      for (const i of shuffle(Array.from({length:81}, (_, i) => i))) {
        const n = puzzle[i]; puzzle[i] = 0;
        if (solve(puzzle, 2).count === 1) clues--; else puzzle[i] = n;
        if (clues === target) return { puzzle, solution, level };
      }
    }
    throw new Error('無法產生題目，請再試一次。');
  }
  const counts = board => Array.from({length:9}, (_, n) => board.filter(v => v === n + 1).length);
  function applyEntry(state, i, n, noteMode = false) {
    if (!Number.isInteger(i) || i < 0 || i > 80 || state.puzzle[i] || state.completed || !Number.isInteger(n) || n < 0 || n > 9) return false;
    if (noteMode && n) {
      if (state.board[i] || counts(state.board)[n-1] >= 9) return false;
      state.notes[i] ^= 1 << n; return true;
    }
    if (n && state.board[i] !== n && counts(state.board)[n-1] >= 9) return false;
    if (state.board[i] === n && !state.notes[i]) return false;
    state.board[i] = n; state.notes[i] = 0;
    if (n && n === state.solution[i]) for (let j = 0; j < 81; j++) if (peers(i,j)) state.notes[j] &= ~(1 << n);
    state.completed = state.board.every((v,j) => v === state.solution[j]); return true;
  }
  function createState(game) { return { ...game, board:[...game.puzzle], notes:Array(81).fill(0), history:[], elapsed:0, mistakes:0, hints:3, selected:game.puzzle.indexOf(0), noteMode:false, completed:false }; }
  const api = { LEVELS, row, col, box, peers, candidates, valid, solve, generate, counts, applyEntry, createState };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Sudoku = api;
})(typeof window !== 'undefined' ? window : globalThis);
