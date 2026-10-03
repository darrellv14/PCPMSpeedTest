import { QUESTION_SETS } from './inventory-data.js';
import { InventorySession, selectQuestions, evaluate } from './inventory-engine.js';
import { formatTime } from './engine.js';

const $ = id => document.getElementById(id);
const titles = { EVM: 'Values Measurement', EPM: 'Personality Measurement', ELI: 'Leadership Indicator' };
let selectedType = 'EVM';
let selectedPack = 'all';
let session = null;
let interval = null;

function textElement(tag, text, className = '') {
  const el = document.createElement(tag); el.textContent = text;
  if (className) el.className = className;
  return el;
}

function notice(type) {
  return type === 'EPM'
    ? 'E-PM adalah pernyataan diri. Jawab sesuai kebiasaan dan pengalaman Anda. Referensi PDF akan ditampilkan sebagai perbandingan latihan; perbedaan respons tidak otomatis berarti kepribadian Anda salah.'
    : 'Evaluasi memakai kunci dari PDF bahan belajar yang Anda unggah. Label benar/salah berarti sesuai/tidak sesuai dengan kunci bahan latihan, bukan penilaian resmi EXPERD atau Bank Indonesia.';
}

function setup() {
  selectedType = document.querySelector('[name="inventory-type"]:checked').value;
  selectedPack = $('inventory-pack').value;
  $('inventory-count').textContent = selectQuestions(QUESTION_SETS, selectedType, selectedPack).length;
  $('inventory-instructions').textContent = selectedType === 'EPM'
    ? 'Baca pernyataan, lalu pilih 1–5: Sangat Tidak Setuju sampai Sangat Setuju. Anda dapat meninjau dan mengubah jawaban sebelum selesai. Waktu dicatat tanpa batas durasi karena PDF tidak mencantumkan durasi subtes.'
    : 'Baca situasi dan seluruh pilihan A–E. Pilih satu jawaban, lalu lanjutkan. Anda dapat meninjau dan mengubah jawaban sebelum selesai. Waktu dicatat tanpa batas durasi karena PDF tidak mencantumkan durasi subtes.';
  $('inventory-notice').textContent = notice(selectedType);
}

function show(name) {
  for (const screen of ['home', 'test', 'result']) $(`inventory-${screen}`).hidden = screen !== name;
  window.scrollTo(0, 0);
}

function start() {
  clearInterval(interval);
  session = new InventorySession(selectQuestions(QUESTION_SETS, selectedType, selectedPack));
  $('inventory-test-tag').textContent = `E-${selectedType.slice(1)} · ${selectedPack === 'all' ? 'SEMUA PAKET' : `PAKET ${selectedPack}`}`;
  $('inventory-test-title').textContent = titles[selectedType];
  $('inventory-elapsed').textContent = '00:00';
  $('inventory-progressbar').setAttribute('aria-valuemax', session.questions.length);
  show('test');
  renderQuestion();
  interval = setInterval(() => { if (session.active) $('inventory-elapsed').textContent = formatTime(session.elapsed()); }, 1000);
}

function renderQuestion() {
  const q = session.current;
  $('inventory-counter').textContent = `Soal ${session.index + 1} / ${session.questions.length}`;
  $('inventory-source').textContent = `Paket ${q.variant} · Soal asli ${q.number} · PDF halaman ${q.questionPage}`;
  $('inventory-prompt').textContent = q.prompt;
  const options = $('inventory-options');
  options.replaceChildren(textElement('legend', 'Pilih jawaban', 'sr-only'));
  for (const [value, description] of Object.entries(q.options)) {
    const label = document.createElement('label'); label.className = 'answer-option';
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'inventory-answer'; radio.value = value;
    radio.checked = session.answers[q.id] === value;
    radio.addEventListener('change', () => { if (session.answer(value)) renderProgress(); });
    label.append(radio, textElement('span', value, 'option-letter'), textElement('span', description));
    options.append(label);
  }
  $('inventory-prev').disabled = session.index === 0;
  $('inventory-next').textContent = session.index === session.questions.length - 1 ? 'Selesai & lihat hasil' : 'Berikutnya';
  renderProgress();
  // Focus the question after navigation, without revealing answers or stealing radio focus.
  $('inventory-prompt').focus({ preventScroll: true });
}

function renderProgress() {
  const answered = Object.keys(session.answers).length;
  $('inventory-answered').textContent = answered;
  $('inventory-progress').style.width = `${answered / session.questions.length * 100}%`;
  $('inventory-progressbar').setAttribute('aria-valuenow', answered);
  const fragment = document.createDocumentFragment();
  session.questions.forEach((q, i) => {
    const button = textElement('button', String(i + 1), `number-button${session.answers[q.id] ? ' answered' : ''}`);
    if (i === session.index) button.setAttribute('aria-current', 'step');
    button.setAttribute('aria-label', `Soal ${i + 1}, paket ${q.variant}, nomor asli ${q.number}, ${session.answers[q.id] ? 'sudah' : 'belum'} dijawab`);
    button.addEventListener('click', () => { session.move(i); renderQuestion(); });
    fragment.append(button);
  });
  const scroll = $('inventory-numbers').scrollTop;
  $('inventory-numbers').replaceChildren(fragment);
  $('inventory-numbers').scrollTop = scroll;
}

function askFinish() {
  if (!session?.active) return;
  const s = evaluate(session.questions, session.answers);
  $('inventory-dialog-text').textContent = s.blank
    ? `${s.answered} dari ${s.total} soal sudah dijawab. ${s.blank} soal akan dicatat sebagai belum dijawab. Anda dapat kembali mengerjakan atau melihat hasil sekarang.`
    : `Seluruh ${s.total} soal sudah dijawab. Setelah selesai, jawaban dikunci dan pembahasan ditampilkan.`;
  $('inventory-finish-dialog').showModal();
}

function finish() {
  const result = session.finish(); clearInterval(interval);
  $('inventory-finish-dialog').close();
  const personality = selectedType === 'EPM';
  $('inventory-result-context').textContent = `E-${selectedType.slice(1)} · ${titles[selectedType]} · ${result.answered}/${result.total} dijawab · ${formatTime(session.elapsed())} terpakai`;
  $('inventory-result-notice').textContent = notice(selectedType);
  $('inventory-matched').textContent = result.matched;
  $('inventory-different').textContent = result.different;
  $('inventory-blank').textContent = result.blank;
  $('inventory-percent').textContent = `${result.percent.toFixed(1).replace('.', ',')}%`;
  $('inventory-match-label').textContent = personality ? 'Sesuai referensi PDF' : 'Benar menurut kunci PDF';
  $('inventory-different-label').textContent = personality ? 'Berbeda dari referensi PDF' : 'Salah menurut kunci PDF';
  $('inventory-review-filter').value = 'all';
  renderReview(); show('result');
  $('inventory-result-title').focus({ preventScroll: true });
}

function describeAnswer(question, value) {
  return value === null ? 'Belum dijawab' : `${value}. ${question.options[value]}`;
}

function renderReview() {
  const rows = evaluate(session.questions, session.answers).rows;
  const filter = $('inventory-review-filter').value;
  const personality = selectedType === 'EPM';
  const fragment = document.createDocumentFragment();
  let visible = 0;
  for (const [index, row] of rows.entries()) {
    if (filter === 'match' && row.status !== 'match') continue;
    if (filter === 'different' && row.status === 'match') continue;
    visible++;
    const q = row.question;
    const article = document.createElement('article'); article.className = 'review-question';
    const heading = document.createElement('div'); heading.className = 'review-question-header';
    heading.append(textElement('strong', `Soal ${index + 1} · Paket ${q.variant} · Nomor asli ${q.number}`));
    const label = row.status === 'blank' ? 'Belum dijawab' : row.status === 'match'
      ? (personality ? 'Sesuai referensi PDF' : 'Benar menurut kunci PDF')
      : (personality ? 'Berbeda dari referensi PDF' : 'Salah menurut kunci PDF');
    heading.append(textElement('span', label, `badge ${row.status === 'match' ? 'correct' : row.status === 'blank' || personality ? 'blank' : 'wrong'}`));
    article.append(heading, textElement('span', `${q.sourceFile} · Soal hlm. ${q.questionPage} · Pembahasan hlm. ${q.answerPage}`, 'question-source'), textElement('h3', q.prompt));
    const comparison = document.createElement('div'); comparison.className = 'answer-comparison';
    for (const [title, answer] of [['Jawaban Anda', row.selected], [personality ? 'Jawaban referensi PDF' : 'Kunci bahan latihan', q.referenceAnswer]]) {
      const box = document.createElement('div'); box.append(textElement('span', title), textElement('strong', describeAnswer(q, answer))); comparison.append(box);
    }
    article.append(comparison);
    if (personality) {
      if (row.selected) {
        article.append(textElement('p', 'Uraian pilihan Anda menurut PDF', 'explanation-label'), textElement('p', q.interpretations[row.selected], 'explanation-text'));
      }
      article.append(textElement('p', 'Uraian jawaban referensi menurut PDF', 'explanation-label'), textElement('p', q.interpretations[q.referenceAnswer], 'explanation-text'));
      const details = document.createElement('details'); details.className = 'scale-details';
      details.append(textElement('summary', 'Lihat seluruh pembahasan skala 1–5'));
      const dl = document.createElement('dl');
      for (const [value, description] of Object.entries(q.interpretations)) dl.append(textElement('dt', value), textElement('dd', description));
      details.append(dl); article.append(details);
      article.append(textElement('p', row.status === 'match' ? 'Respons Anda sama dengan referensi bahan belajar. Kesamaan ini bukan bukti bahwa respons tersebut harus dipilih dalam tes kepribadian.' : row.status === 'different' ? 'Respons Anda berbeda dari referensi bahan belajar. Perbedaan ini tidak otomatis berarti salah; nilai apakah respons tersebut menggambarkan diri Anda secara jujur.' : 'Belum ada respons yang dapat dibandingkan dengan referensi.', 'comparison-reason'));
    } else {
      article.append(textElement('p', 'Alasan kunci menurut PDF', 'explanation-label'), textElement('p', q.explanation, 'explanation-text'));
      article.append(textElement('p', row.status === 'match' ? 'Pilihan Anda sama dengan kunci bahan latihan. Pembahasan di atas menjelaskan pertimbangan yang digunakan oleh materi.' : row.status === 'different' ? 'Pilihan Anda berbeda dari kunci bahan latihan. Bandingkan tindakan dalam pilihan Anda dengan pertimbangan pada pembahasan di atas. PDF memberikan alasan untuk opsi kunci, bukan alasan khusus untuk setiap opsi lain.' : 'Soal ini belum dijawab. Pelajari tindakan yang dipilih kunci beserta pertimbangannya.', 'comparison-reason'));
      const allOptions = document.createElement('details'); allOptions.className = 'review-all-options'; allOptions.append(textElement('summary', 'Lihat kembali semua pilihan A–E'));
      for (const [value, description] of Object.entries(q.options)) allOptions.append(textElement('p', `${value}. ${description}`));
      article.append(allOptions);
    }
    fragment.append(article);
  }
  $('inventory-review-empty').hidden = visible !== 0;
  $('inventory-review').replaceChildren(fragment);
}

for (const set of QUESTION_SETS) {
  const item = document.createElement('div'); item.className = 'source-item';
  item.append(textElement('strong', set.sourceFile), textElement('span', `${set.questions.length} soal · ${set.questions.length} jawaban rujukan · ${set.questions.length} pembahasan${set.type === 'EPM' ? ` · ${set.questions.length * 5} uraian skala` : ''}`));
  $('source-list').append(item);
}
document.querySelectorAll('[name="inventory-type"]').forEach(radio => radio.addEventListener('change', setup));
$('inventory-pack').addEventListener('change', setup);
$('inventory-start').addEventListener('click', start);
$('inventory-prev').addEventListener('click', () => { session.move(session.index - 1); renderQuestion(); });
$('inventory-next').addEventListener('click', () => { if (session.index === session.questions.length - 1) askFinish(); else { session.move(session.index + 1); renderQuestion(); } });
$('inventory-finish').addEventListener('click', askFinish);
$('inventory-cancel-finish').addEventListener('click', () => $('inventory-finish-dialog').close());
$('inventory-confirm-finish').addEventListener('click', finish);
$('inventory-review-filter').addEventListener('change', renderReview);
$('inventory-back').addEventListener('click', () => { show('home'); $('inventory-start').focus(); });
$('inventory-retry').addEventListener('click', start);
window.addEventListener('beforeunload', event => { if (session?.active) { event.preventDefault(); event.returnValue = ''; } });
setup();
