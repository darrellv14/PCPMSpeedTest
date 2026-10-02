export const TOTAL = 250;
export const DURATION = 450;
const DIGITS = '0123456789';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function shuffle(items, random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateQuestions(model, count = TOTAL, random = Math.random) {
  if (![1, 2].includes(model)) throw new Error('Model tidak valid');
  if (!Number.isInteger(count) || count < 1) throw new Error('Jumlah soal tidak valid');
  return Array.from({ length: count }, () => {
    const pool = shuffle(model === 1 ? DIGITS : LETTERS, random);
    if (model === 1) return { sequence: pool.slice(0, 9).join(''), answer: pool[9] };
    const selected = pool.slice(0, 9);
    const answer = selected[Math.floor(random() * 9)];
    return { sequence: shuffle([...selected, answer], random).join(''), answer };
  });
}

export function validAnswer(model, value) {
  return typeof value === 'string' && (model === 1 ? /^[0-9]$/ : /^[A-Z]$/i).test(value);
}

// Deadline, rather than interval ticks, keeps time accurate in background tabs.
export class Session {
  constructor(model, { questions = generateQuestions(model), duration = DURATION, now = () => Date.now() } = {}) {
    this.model = model;
    this.questions = questions;
    this.duration = duration;
    this.now = now;
    this.startedAt = now();
    this.deadline = this.startedAt + duration * 1000;
    this.questionStartedAt = this.startedAt;
    this.responses = [];
    this.reason = null;
    this.endedAt = null;
  }
  get active() { return this.reason === null; }
  get current() { return this.questions[this.responses.length]; }
  remaining() { return Math.max(0, Math.ceil((this.deadline - this.now()) / 1000)); }
  checkTime() {
    if (this.active && this.now() >= this.deadline) this.finish('timeout', this.deadline);
    return this.active;
  }
  submit(value) {
    if (!this.checkTime() || !validAnswer(this.model, value)) return false;
    const at = this.now();
    const answer = value.toUpperCase();
    this.responses.push({ answer, correct: answer === this.current.answer, ms: at - this.questionStartedAt });
    this.questionStartedAt = at;
    if (this.responses.length === this.questions.length) this.finish('complete', at);
    return true;
  }
  finish(reason = 'stopped', at = this.now()) {
    if (!this.active) return;
    this.reason = reason;
    this.endedAt = Math.min(at, this.deadline);
  }
  summary() {
    const answered = this.responses.length;
    const correct = this.responses.filter(r => r.correct).length;
    const seconds = Math.max(0, ((this.endedAt ?? this.now()) - this.startedAt) / 1000);
    return { total: this.questions.length, answered, correct, wrong: answered - correct,
      unanswered: this.questions.length - answered, seconds,
      accuracy: answered ? correct / answered * 100 : 0,
      rate: seconds > 0 ? answered / seconds * 60 : 0,
      average: answered ? this.responses.reduce((n, r) => n + r.ms, 0) / answered / 1000 : 0 };
  }
}

export function formatTime(seconds) {
  const rounded = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}
