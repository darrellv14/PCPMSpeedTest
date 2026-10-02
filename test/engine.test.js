import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestions, Session, formatTime, TOTAL, DURATION } from '../dist/engine.js';

test('250 soal angka: 9 angka unik dan tepat satu angka hilang', () => {
  const questions = generateQuestions(1);
  assert.equal(questions.length, TOTAL);
  for (const q of questions) {
    assert.equal(q.sequence.length, 9);
    assert.equal(new Set(q.sequence).size, 9);
    const missing = [...'0123456789'].filter(x => !q.sequence.includes(x));
    assert.deepEqual(missing, [q.answer]);
  }
});

test('250 soal huruf: 10 huruf, tepat satu pasangan kembar', () => {
  for (const q of generateQuestions(2)) {
    assert.match(q.sequence, /^[A-Z]{10}$/);
    const counts = [...q.sequence].reduce((out, x) => { out[x] = (out[x] || 0) + 1; return out; }, {});
    assert.equal(Object.keys(counts).length, 9);
    assert.deepEqual(Object.entries(counts).filter(([, n]) => n === 2).map(([x]) => x), [q.answer]);
  }
});

test('jawaban kosong/tidak valid ditolak; hasil benar, salah, kosong terpisah', () => {
  let clock = 1000;
  const session = new Session(1, { now: () => clock, questions: [
    { sequence: '012346789', answer: '5' }, { sequence: '012345678', answer: '9' }, { sequence: '123456789', answer: '0' }
  ] });
  assert.equal(session.submit(''), false);
  assert.equal(session.submit('X'), false);
  clock += 2000;
  assert.equal(session.submit('5'), true);
  clock += 3000;
  session.submit('1');
  session.finish();
  assert.deepEqual(session.summary(), { total: 3, answered: 2, correct: 1, wrong: 1, unanswered: 1, seconds: 5, accuracy: 50, rate: 24, average: 2.5 });
});

test('deadline 450 detik: jawaban terlambat ditolak, waktu tidak bertambah ketika tab tertunda', () => {
  let clock = 0;
  const session = new Session(1, { now: () => clock });
  assert.equal(session.remaining(), DURATION);
  clock = 449999;
  assert.equal(session.remaining(), 1);
  clock = 470000;
  assert.equal(session.submit(session.current.answer), false);
  assert.equal(session.reason, 'timeout');
  assert.equal(session.summary().seconds, 450);
  assert.equal(session.summary().unanswered, 250);
  session.finish('complete');
  assert.equal(session.reason, 'timeout');
});

test('semua soal selesai, huruf kecil diterima, tidak ada jawaban ganda setelah selesai', () => {
  let clock = 0;
  const session = new Session(2, { now: () => clock });
  for (let i = 0; i < 250; i++) { clock += 1000; assert.equal(session.submit(session.current.answer.toLowerCase()), true); }
  assert.equal(session.reason, 'complete');
  assert.equal(session.summary().accuracy, 100);
  assert.equal(session.submit('A'), false);
  assert.equal(session.responses.length, 250);
});

test('format timer', () => {
  assert.equal(formatTime(450), '07:30');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(59.1), '01:00');
});
