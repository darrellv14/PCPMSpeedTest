export function selectQuestions(sets, type, pack = 'all') {
  return sets.filter(set => set.type === type && (pack === 'all' || String(set.variant) === String(pack)))
    .flatMap(set => set.questions.map(question => ({ ...question, setId: set.id, sourceFile: set.sourceFile, variant: set.variant })));
}

export function evaluate(questions, answers) {
  const rows = questions.map(question => {
    const selected = answers[question.id] ?? null;
    const answered = selected !== null && Object.hasOwn(question.options, selected);
    return { question, selected: answered ? selected : null, status: !answered ? 'blank' : selected === question.referenceAnswer ? 'match' : 'different' };
  });
  const matched = rows.filter(row => row.status === 'match').length;
  const different = rows.filter(row => row.status === 'different').length;
  const answered = matched + different;
  return { rows, total: questions.length, answered, matched, different, blank: questions.length - answered, percent: answered ? matched / answered * 100 : 0 };
}

export class InventorySession {
  constructor(questions, now = () => Date.now()) {
    if (!questions.length) throw new Error('Paket soal kosong');
    this.questions = questions;
    this.answers = {};
    this.index = 0;
    this.now = now;
    this.startedAt = now();
    this.endedAt = null;
  }
  get active() { return this.endedAt === null; }
  get current() { return this.questions[this.index]; }
  answer(value) {
    if (!this.active || !Object.hasOwn(this.current.options, String(value))) return false;
    this.answers[this.current.id] = String(value);
    return true;
  }
  move(index) {
    if (!this.active || !Number.isInteger(index) || index < 0 || index >= this.questions.length) return false;
    this.index = index;
    return true;
  }
  finish() { if (this.active) this.endedAt = this.now(); return evaluate(this.questions, this.answers); }
  elapsed() { return Math.max(0, Math.floor(((this.endedAt ?? this.now()) - this.startedAt) / 1000)); }
}
