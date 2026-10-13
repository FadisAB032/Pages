'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const S = require('../engine.js');
const fs = require('node:fs');
const path = require('node:path');

test('expert offers 24 clues and every difficulty is selectable in the UI', () => {
  assert.equal(S.LEVELS.expert.clues,24);
  assert.ok(S.LEVELS.expert.clues < S.LEVELS.hard.clues);
  const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const levels = [...html.matchAll(/data-level="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(levels,Object.keys(S.LEVELS));
});

for (const level of Object.keys(S.LEVELS)) test(`${level}: 30 randomized puzzles have expected clues and a unique valid solution`, () => {
  const identities = new Set();
  for (let run = 0; run < 30; run++) {
    const game = S.generate(level), result = S.solve(game.puzzle);
    assert.equal(game.puzzle.filter(Boolean).length,S.LEVELS[level].clues);
    assert.ok(S.valid(game.solution,true)); assert.equal(result.count,1);
    assert.deepEqual(result.solution,game.solution);
    assert.ok(game.puzzle.every((n,i) => !n || n===game.solution[i]));
    identities.add(game.puzzle.join(''));
  }
  assert.ok(identities.size>1);
});

test('solver rejects invalid boards, finds ambiguity, and leaves inputs unchanged',()=>{
  const empty = Array(81).fill(0), copy=[...empty]; assert.equal(S.solve(empty).count,2); assert.deepEqual(empty,copy);
  empty[0]=1; empty[1]=1; assert.equal(S.solve(empty).count,0);
  assert.equal(S.valid(Array(80).fill(0)),false); assert.equal(S.valid(Array(81).fill(10)),false);
  assert.throws(()=>S.generate('invalid'));
});

test('peers include same row, column, and box without including unrelated or selected cells',()=>{
  assert.ok(S.peers(0,8)); assert.ok(S.peers(0,72)); assert.ok(S.peers(0,10));
  assert.equal(S.peers(0,0),false); assert.equal(S.peers(0,40),false);
  assert.equal(Array.from({length:81},(_,i)=>i).filter(i=>S.peers(40,i)).length,20);
});

test('givens are immutable; completion accepts only the solution',()=>{
  const state=S.createState(S.generate('easy')), given=state.puzzle.findIndex(Boolean);
  assert.equal(S.applyEntry(state,given,0),false); assert.deepEqual(state.board,state.puzzle);
  for(let i=0;i<81;i++) if(!state.puzzle[i]) assert.equal(S.applyEntry(state,i,state.solution[i]),true);
  assert.equal(state.completed,true); assert.ok(S.valid(state.board,true)); assert.equal(S.applyEntry(state,0,0),false);
});

test('the ninth occurrence disables an entry; clearing enables it; notes do not count',()=>{
  const solution=S.generate().solution, state=S.createState({puzzle:Array(81).fill(0),solution,level:'easy'});
  const locations=solution.flatMap((n,i)=>n===1?[i]:[]), extra=solution.findIndex(n=>n!==1);
  for(const i of locations) assert.equal(S.applyEntry(state,i,1),true);
  assert.equal(S.counts(state.board)[0],9); assert.equal(S.applyEntry(state,extra,1),false);
  assert.equal(S.applyEntry(state,locations[0],0),true); assert.equal(S.counts(state.board)[0],8);
  assert.equal(S.applyEntry(state,extra,1,true),true); assert.equal(S.counts(state.board)[0],8);
  assert.equal(S.applyEntry(state,extra,1,true),true); assert.equal(state.notes[extra],0);
  assert.equal(S.applyEntry(state,locations[0],1),true); assert.equal(S.counts(state.board)[0],9);
});

test('correct entries remove peer notes, incorrect entries preserve them, and erasing clears notes',()=>{
  const solution=S.generate().solution, state=S.createState({puzzle:Array(81).fill(0),solution,level:'easy'});
  const n=solution[0]; state.notes[1]=1<<n; state.notes[40]=1<<n;
  assert.equal(S.applyEntry(state,0,n%9+1),true); assert.equal(state.notes[1],1<<n);
  assert.equal(S.applyEntry(state,0,n),true); assert.equal(state.notes[1],0); assert.equal(state.notes[40],1<<n);
  assert.equal(S.applyEntry(state,40,0),true); assert.equal(state.notes[40],0);
  assert.equal(S.applyEntry(state,0,4,true),false); assert.equal(S.applyEntry(state,-1,2),false); assert.equal(S.applyEntry(state,81,2),false);
});
