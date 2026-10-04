(() => {
  'use strict';
  const S = window.Sudoku, $ = id => document.getElementById(id), STORAGE = 'sudoku-studio-v1';
  let state, paused = false, busy = false, requestedLevel = 'easy', lastTick = Date.now(), lastSave = 0;
  const cells = [], keys = [];
  const say = text => { $('game-message').textContent = text; };
  const blocked = () => paused || busy || !state || state.completed;
  const formatTime = value => { const seconds = Math.floor(value); return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`; };
  for (let r = 0; r < 9; r++) {
    const row = document.createElement('div'); row.className = 'board-row'; row.setAttribute('role','row');
    for (let c = 0; c < 9; c++) {
      const i = r*9+c, cell = document.createElement('button');
      cell.className = 'cell'; cell.setAttribute('role','gridcell'); cell.setAttribute('aria-rowindex',r+1); cell.setAttribute('aria-colindex',c+1);
      cell.addEventListener('click',() => { if (!paused && !busy) { state.selected = i; render(); save(); } });
      row.append(cell); cells.push(cell);
    }
    $('board').append(row);
  }
  for (let n = 1; n <= 9; n++) {
    const key = document.createElement('button'); key.innerHTML = `${n}<small></small>`;
    key.addEventListener('click',() => enter(n)); $('number-pad').append(key); keys.push(key);
  }
  function tick() {
    const now = Date.now();
    if (state && !blocked() && !document.hidden && !document.querySelector('dialog[open]')) state.elapsed += Math.max(0,(now-lastTick)/1000);
    lastTick = now;
    if (state) $('timer').textContent = formatTime(state.elapsed);
    if (now-lastSave > 5000) { save(); lastSave = now; }
  }
  function save() {
    if (!state) return;
    try { localStorage.setItem(STORAGE, JSON.stringify({version:1,state})); }
    catch { $('save-note').textContent = '此瀏覽器無法儲存進度，請保持頁面開啟。'; }
  }
  function validSnapshot(snapshot, puzzle) {
    return snapshot && Array.isArray(snapshot.board) && snapshot.board.length === 81 && snapshot.board.every((n,i) => Number.isInteger(n) && n>=0 && n<=9 && (!puzzle[i] || puzzle[i]===n)) && Array.isArray(snapshot.notes) && snapshot.notes.length === 81 && snapshot.notes.every(n => Number.isInteger(n) && n>=0 && n<=1022);
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE)); if (saved?.version !== 1) return false;
      const s = saved.state;
      if (!s || !S.LEVELS[s.level] || !S.valid(s.puzzle) || !S.valid(s.solution,true) || !s.puzzle.every((n,i) => !n || n===s.solution[i]) || !validSnapshot(s,s.puzzle)) return false;
      const result = S.solve(s.puzzle); if (result.count !== 1 || !result.solution.every((n,i)=>n===s.solution[i])) return false;
      if (!Number.isFinite(s.elapsed) || s.elapsed<0 || !Number.isInteger(s.mistakes) || s.mistakes<0 || !Number.isInteger(s.hints) || s.hints<0 || s.hints>3) return false;
      s.selected = Number.isInteger(s.selected) && s.selected>=0 && s.selected<81 ? s.selected : 0;
      s.history = Array.isArray(s.history) ? s.history.filter(h => validSnapshot(h,s.puzzle)).slice(-100) : [];
      s.noteMode = Boolean(s.noteMode); s.completed = s.board.every((n,i) => n===s.solution[i]);
      state = s; requestedLevel = s.level; say(s.completed ? '這一局已完成。準備好再開啟新的挑戰。' : '已接續上次的進度。歡迎回來，繼續你的專注時光。'); return true;
    } catch { return false; }
  }
  function render() {
    if (!state) return;
    const selected = state.selected, chosen = state.board[selected], counts = S.counts(state.board);
    cells.forEach((cell,i) => {
      const n = state.board[i];
      cell.className = ['cell',state.puzzle[i]?'given':'',S.peers(selected,i)?'peer':'',chosen && n===chosen?'same':'',selected===i?'selected':'',n && n!==state.solution[i]?'invalid':''].filter(Boolean).join(' ');
      cell.tabIndex = selected===i?0:-1; cell.setAttribute('aria-selected',selected===i);
      cell.setAttribute('aria-readonly',Boolean(state.puzzle[i])); cell.setAttribute('aria-invalid',Boolean(n && n!==state.solution[i]));
      const noteValues = Array.from({length:9},(_,k)=>k+1).filter(v => state.notes[i] & (1<<v));
      cell.setAttribute('aria-label',`第 ${S.row(i)+1} 行，第 ${S.col(i)+1} 列，${n || '空白'}${state.puzzle[i]?'，題目給定':''}${!n && noteValues.length?'，筆記 '+noteValues.join('、'):''}`);
      if (n) cell.textContent = n;
      else if (state.notes[i]) { cell.innerHTML = '<span class="notes" aria-hidden="true">'+Array.from({length:9},(_,k)=>`<span>${state.notes[i] & (1<<(k+1)) ? k+1 : ''}</span>`).join('')+'</span>'; }
      else cell.textContent = '';
    });
    keys.forEach((key,i) => { const remaining = Math.max(0,9-counts[i]); key.disabled = counts[i]>=9 || blocked(); key.querySelector('small').textContent = counts[i]>=9?'✓':`剩 ${remaining}`; key.setAttribute('aria-label',`${i+1}，${counts[i]>=9?'已填滿 9 格':`剩餘 ${remaining} 格`}`); });
    document.querySelectorAll('[data-level]').forEach(button => { button.setAttribute('aria-pressed',button.dataset.level===state.level); button.disabled = busy; });
    const filled = state.board.filter(Boolean).length;
    $('progress-label').textContent = `已填入 ${filled} / 81 格`; $('progress-bar').style.width = `${filled/81*100}%`;
    $('mistakes-label').textContent = `錯誤 ${state.mistakes} 次`; $('timer').textContent = formatTime(state.elapsed);
    $('notes-button').setAttribute('aria-pressed',state.noteMode); $('notes-badge').textContent = state.noteMode?'ON':'OFF';
    $('undo-button').disabled = !state.history.length || blocked(); $('erase-button').disabled = blocked() || !!state.puzzle[selected] || (!state.board[selected] && !state.notes[selected]);
    $('hint-button').disabled = blocked() || state.hints===0; $('hints-label').textContent = state.hints; $('notes-button').disabled = blocked(); $('new-button').disabled = busy;
    $('pause-button').disabled = busy || state.completed; $('pause-button').textContent = paused?'▷':'Ⅱ'; $('pause-button').setAttribute('aria-label',paused?'繼續遊戲':'暫停遊戲');
    $('board').inert = paused || busy;
    $('board').setAttribute('aria-hidden',paused || busy);
    $('board-overlay').hidden = !paused && !busy;
    $('overlay-title').textContent = busy?'正在準備新挑戰':'休息一下'; $('overlay-message').textContent = busy?'為你產生一張只有唯一解的數獨。':'你的進度已保留，準備好再繼續。'; $('resume-button').hidden = busy;
  }
  function snapshot() { return {board:[...state.board],notes:[...state.notes]}; }
  function enter(n, hint = false) {
    if (blocked()) return;
    const i = state.selected;
    if (state.puzzle[i]) { say('這是題目給定的數字，請選擇空白格。'); return; }
    const before = snapshot();
    if (!S.applyEntry(state,i,n,hint?false:state.noteMode)) { say(n && S.counts(state.board)[n-1]>=9?'這個數字已填入 9 格，請先清除需要修改的數字。':state.noteMode && state.board[i]?'先清除這一格的數字，才能加入筆記。':'選擇一格空白，再填入你的答案。'); return; }
    state.history.push(before); state.history = state.history.slice(-100);
    if (hint) { state.hints--; say(`提示：第 ${S.row(i)+1} 行、第 ${S.col(i)+1} 列的答案是 ${n}。`); }
    else if (!state.noteMode && n && n!==state.solution[i]) { state.mistakes++; say('這個答案還不正確。試著觀察同行、同列和同宮的線索。'); }
    else say(state.noteMode && n?'已更新候選筆記。按 N 或「筆記」可回到填答模式。':n?'很好，繼續尋找下一個線索。':'已清除這一格。');
    render(); save();
    if (state.completed) { $('win-stats').textContent = `${S.LEVELS[state.level].label}難度 · 用時 ${formatTime(state.elapsed)} · 錯誤 ${state.mistakes} 次 · 提示 ${3-state.hints} 次`; $('win-dialog').showModal(); say('恭喜完成！每行、每列、每宮都符合數獨規則。'); }
  }
  async function start(level) {
    if (busy) return;
    busy = true; paused = false; render();
    await new Promise(resolve => setTimeout(resolve,50));
    try { state = S.createState(S.generate(level)); requestedLevel = level; lastTick = Date.now(); say('先選一格，再選數字。慢慢來，你有的是時間。'); }
    catch (error) { say(error.message); }
    finally { busy = false; render(); save(); }
  }
  function requestNew(level) {
    requestedLevel = level;
    if (state && !state.completed && (state.history.length || state.board.some((n,i)=>n!==state.puzzle[i]) || state.notes.some(Boolean))) $('new-dialog').showModal();
    else start(level);
  }
  function togglePause() { if (busy || state.completed) return; tick(); paused = !paused; lastTick = Date.now(); render(); save(); }
  function undo() {
    if (blocked() || !state.history.length) return;
    const previous = state.history.pop(); state.board = previous.board; state.notes = previous.notes; render(); save(); say('已復原上一步。');
  }
  function toggleNotes() { if (blocked()) return; state.noteMode = !state.noteMode; render(); save(); say(state.noteMode?'筆記模式已開啟，數字鍵將記下候選數字。':'填答模式已開啟。'); }
  $('new-button').addEventListener('click',() => requestNew(state.level));
  document.querySelectorAll('[data-level]').forEach(button => button.addEventListener('click',() => { if (!busy && button.dataset.level!==state.level) requestNew(button.dataset.level); }));
  $('confirm-new').addEventListener('click',() => { $('new-dialog').close(); start(requestedLevel); });
  $('win-new').addEventListener('click',() => { $('win-dialog').close(); start(state.level); });
  $('undo-button').addEventListener('click',undo); $('erase-button').addEventListener('click',() => enter(0)); $('notes-button').addEventListener('click',toggleNotes);
  $('pause-button').addEventListener('click',togglePause); $('resume-button').addEventListener('click',togglePause);
  $('hint-button').addEventListener('click',() => {
    if (blocked() || !state.hints) return;
    const target = !state.puzzle[state.selected] && state.board[state.selected]!==state.solution[state.selected] ? state.selected : state.board.findIndex((n,i)=>n!==state.solution[i]);
    if (target<0) return; state.selected = target; enter(state.solution[target],true);
  });
  $('rules-button').addEventListener('click',() => $('rules-dialog').showModal());
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => { dialog.addEventListener('close',()=>{ lastTick=Date.now(); }); dialog.addEventListener('cancel',()=>{ lastTick=Date.now(); }); });
  document.addEventListener('keydown',event => {
    if (!state || busy || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if (event.code==='Space' && event.target.tagName!=='BUTTON') { event.preventDefault(); togglePause(); return; }
    if (blocked()) return;
    if (/^[1-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey) { event.preventDefault(); enter(Number(event.key)); }
    else if (['Backspace','Delete','0'].includes(event.key)) { event.preventDefault(); enter(0); }
    else if (event.key.toLowerCase()==='n' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); toggleNotes(); }
    else if ((event.ctrlKey||event.metaKey) && event.key.toLowerCase()==='z') { event.preventDefault(); undo(); }
    else if (event.key.startsWith('Arrow')) {
      event.preventDefault(); let r=S.row(state.selected),c=S.col(state.selected);
      if (event.key==='ArrowUp') r=(r+8)%9; if(event.key==='ArrowDown') r=(r+1)%9; if(event.key==='ArrowLeft') c=(c+8)%9; if(event.key==='ArrowRight') c=(c+1)%9;
      state.selected=r*9+c; render(); cells[state.selected].focus(); save();
    } else if (event.code==='Space' && cells.includes(event.target)) { event.preventDefault(); togglePause(); }
  });
  document.addEventListener('visibilitychange',()=>{ lastTick=Date.now(); save(); });
  window.addEventListener('pagehide',save);
  if (!restore()) { state=S.createState(S.generate('easy')); save(); }
  render(); setInterval(tick,500);
})();
