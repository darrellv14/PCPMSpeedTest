import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_SETS } from '../dist/inventory-data.js';
import { InventorySession, selectQuestions, evaluate } from '../dist/inventory-engine.js';

test('six source sets: all 210 numbers, keys, choices and explanations; 375 scale descriptions', () => {
  const expected = { 'evm-1': 30, 'evm-2': 30, 'epm-1': 50, 'epm-2': 25, 'eli-1': 50, 'eli-2': 25 };
  assert.equal(QUESTION_SETS.length, 6);
  const allIds = new Set(); let interpretations = 0;
  for (const set of QUESTION_SETS) {
    assert.equal(set.questions.length, expected[set.id]);
    assert.match(set.sourceSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(set.questions.map(q => q.number), Array.from({length: expected[set.id]}, (_, i) => i + 1));
    for (const q of set.questions) {
      assert.equal(allIds.has(q.id), false); allIds.add(q.id);
      assert.ok(q.prompt.length > 20);
      assert.deepEqual(Object.keys(q.options), set.type === 'EPM' ? ['1','2','3','4','5'] : ['A','B','C','D','E']);
      assert.ok(q.options[q.referenceAnswer]); assert.ok(q.explanation.length > 20);
      assert.ok(q.questionPage >= 1 && q.questionPage <= set.sourcePages);
      assert.ok(q.answerPage >= q.questionPage && q.answerPage <= set.sourcePages);
      if (set.type === 'EPM') { assert.equal(Object.keys(q.interpretations).length, 5); interpretations += 5; assert.ok(q.interpretations[q.referenceAnswer]); }
    }
  }
  assert.equal(allIds.size, 210); assert.equal(interpretations, 375);
});

test('combined sets preserve all items and each source numbering, including overlapping questions', () => {
  assert.equal(selectQuestions(QUESTION_SETS, 'EVM').length, 60);
  assert.equal(selectQuestions(QUESTION_SETS, 'EPM').length, 75);
  assert.equal(selectQuestions(QUESTION_SETS, 'ELI').length, 75);
  assert.equal(selectQuestions(QUESTION_SETS, 'EPM', '2').length, 25);
  const q = selectQuestions(QUESTION_SETS, 'EVM');
  assert.equal(q[29].number, 30); assert.equal(q[30].number, 1);
  assert.equal(q[30].variant, 2); assert.ok(q[30].sourceFile);
});

test('changing a response and navigating does not double-count; invalid input and out-of-range moves rejected', () => {
  let time = 1000;
  const s = new InventorySession(selectQuestions(QUESTION_SETS, 'EVM', '1'), () => time);
  assert.equal(s.answer('F'), false);
  s.answer('A'); s.answer(s.current.referenceAnswer);
  assert.equal(Object.keys(s.answers).length, 1);
  assert.equal(s.move(-1), false); assert.equal(s.move(30), false);
  s.move(2); s.answer(Object.keys(s.current.options).find(x => x !== s.current.referenceAnswer));
  time += 15000;
  const result = s.finish();
  assert.equal(result.answered, 2); assert.equal(result.matched, 1); assert.equal(result.different, 1); assert.equal(result.blank, 28); assert.equal(result.percent, 50);
  assert.equal(s.elapsed(), 15); assert.equal(s.answer('B'), false); assert.equal(s.move(0), false);
});

test('all six packages can be completed with exact reference keys; unanswered is distinct from differing', () => {
  for (const set of QUESTION_SETS) {
    const s = new InventorySession(selectQuestions(QUESTION_SETS, set.type, set.variant));
    for (let i = 0; i < s.questions.length; i++) { s.move(i); s.answer(s.current.referenceAnswer); }
    const result = s.finish(); assert.equal(result.percent, 100); assert.equal(result.blank, 0); assert.equal(result.matched, set.questions.length);
  }
  const q = selectQuestions(QUESTION_SETS, 'EPM', '2');
  assert.equal(evaluate(q, {}).percent, 0);
  assert.equal(evaluate(q, {[q[0].id]: 'A'}).blank, 25);
});
