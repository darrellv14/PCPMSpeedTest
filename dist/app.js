import { Session, formatTime, validAnswer, TOTAL } from './engine.js';

const $ = id => document.getElementById(id);
let session = null;
let timerInterval = null;
let selectedModel = 1;
let inputMode = 'instant';
let pending = '';
let lastClickAt = -Infinity;

function showScreen(name) {
  for (const screen of ['home', 'test', 'result']) $(screen).hidden = screen !== name;
  $('timer-area').hidden = name !== 'test';
  document.querySelector('.header-label').hidden = name === 'test';
  window.scrollTo(0, 0);
}

function label(model) { return model === 1 ? 'Angka hilang' : 'Huruf kembar'; }

function start(model = Number(document.querySelector('[name="model"]:checked').value)) {
  selectedModel = model;
  inputMode = $('input-mode').value;
  clearInterval(timerInterval);
  session = new Session(model);
  pending = '';
  lastClickAt = -Infinity;
  $('model-tag').textContent = `MODEL 0${model}`;
  $('test-title').textContent = label(model);
  $('instruction').textContent = model === 1 ? 'Ketik angka 0–9 yang tidak ada dalam deret.' : 'Ketik huruf yang muncul dua kali dalam deret.';
  $('key-hint').textContent = inputMode === 'instant' ? 'Satu tombol langsung mengirim jawaban.' : 'Ketik satu jawaban, lalu tekan Enter untuk lanjut.';
  $('answer-preview').hidden = inputMode === 'instant';
  $('enter-actions').hidden = inputMode === 'instant';
  $('keyboard-description').textContent = model === 1 ? 'Angka 0–9' : 'Huruf A–Z';
  $('input-error').textContent = '';
  buildKeyboard();
  showScreen('test');
  renderQuestion();
  tick();
  timerInterval = setInterval(tick, 100);
  // Prevent the start/retry button from receiving subsequent Enter presses.
  document.activeElement?.blur();
}

function buildKeyboard() {
  $('keyboard').replaceChildren();
  $('keyboard').classList.toggle('numbers', selectedModel === 1);
  const rows = selectedModel === 1 ? ['1234567890'] : ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  for (const chars of rows) {
    const row = document.createElement('div');
    row.className = 'key-row';
    for (const key of chars) {
      const button = document.createElement('button');
      button.className = 'key';
      button.textContent = key;
      button.setAttribute('aria-label', `Jawab ${key}`);
      button.addEventListener('click', () => {
        // Ignore accidental mouse double-clicks in immediate-submit mode.
        const now = performance.now();
        if (inputMode === 'instant' && now - lastClickAt < 150) return;
        lastClickAt = now;
        input(key);
        button.blur();
      });
      row.append(button);
    }
    $('keyboard').append(row);
  }
}

function renderQuestion() {
  if (!session.active) { end(); return; }
  $('sequence').replaceChildren(...[...session.current.sequence].map(char => {
    const span = document.createElement('span'); span.textContent = char; return span;
  }));
  $('sequence').setAttribute('aria-label', session.current.sequence.split('').join(' '));
  $('counter').textContent = `${session.responses.length + 1} / ${TOTAL}`;
  $('answered').textContent = session.responses.length;
  $('progress').style.width = `${session.responses.length / TOTAL * 100}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', session.responses.length);
  setPending('');
}

function setPending(value) {
  pending = value;
  $('pending').textContent = value || '—';
  $('submit').disabled = !value;
}

function input(value) {
  if (!session?.active || $('stop-dialog').open) return;
  if (!session.checkTime()) { end(); return; }
  if (!validAnswer(selectedModel, value)) return;
  $('input-error').textContent = '';
  if (inputMode === 'enter') setPending(value.toUpperCase());
  else submit(value);
}

function submit(value = pending) {
  if (!session?.active || $('stop-dialog').open) return;
  if (!value) { $('input-error').textContent = 'Ketik satu jawaban terlebih dahulu.'; return; }
  session.submit(value);
  if (session.active) renderQuestion(); else end();
}

function tick() {
  if (!session?.active) return;
  session.checkTime();
  $('timer').textContent = formatTime(session.remaining());
  $('timer').classList.toggle('urgent', session.remaining() <= 60);
  if (!session.active) end();
}

function end() {
  if (!session) return;
  clearInterval(timerInterval);
  if ($('stop-dialog').open) $('stop-dialog').close();
  session.checkTime();
  session.finish();
  const s = session.summary();
  $('result-reason').textContent = { timeout: 'Waktu 7 menit 30 detik telah habis.', complete: 'Seluruh 250 soal sudah Anda jawab.', stopped: 'Anda mengakhiri latihan sebelum waktu habis.' }[session.reason];
  $('score').replaceChildren(document.createTextNode(`${s.correct} `), Object.assign(document.createElement('small'), { textContent: `/ ${s.total}` }));
  $('result-model').textContent = `Model ${selectedModel} · ${label(selectedModel)}`;
  $('accuracy').textContent = `${s.accuracy.toFixed(1).replace('.', ',')}%`;
  $('wrong').textContent = s.wrong;
  $('unanswered').textContent = s.unanswered;
  $('rate').textContent = s.rate.toFixed(1).replace('.', ',');
  $('elapsed').textContent = formatTime(s.seconds);
  $('average').textContent = s.answered ? `${s.average.toFixed(2).replace('.', ',')} detik` : '—';
  $('attempted').textContent = `${s.answered} / ${s.total}`;
  $('review-filter').value = 'mistakes';
  renderReview();
  showScreen('result');
  $('result-title').focus({ preventScroll: true });
}

function renderReview() {
  const fragment = document.createDocumentFragment();
  session.questions.forEach((q, i) => {
    const response = session.responses[i];
    if ($('review-filter').value === 'mistakes' && response?.correct) return;
    const tr = document.createElement('tr');
    [String(i + 1), q.sequence.split('').join(' '), response?.answer ?? '—', q.answer].forEach((text, j) => {
      const td = document.createElement('td'); td.textContent = text;
      if (j === 1) td.className = 'seq-cell';
      tr.append(td);
    });
    const td = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${response ? (response.correct ? 'correct' : 'wrong') : 'blank'}`;
    badge.textContent = response ? (response.correct ? 'Benar' : 'Salah') : 'Belum dijawab';
    td.append(badge); tr.append(td); fragment.append(tr);
  });
  $('review-empty').hidden = fragment.childElementCount !== 0;
  $('review-wrapper').hidden = fragment.childElementCount === 0;
  $('review').replaceChildren(fragment);
}

$('start').addEventListener('click', () => start());
$('retry').addEventListener('click', () => start(selectedModel));
$('back').addEventListener('click', () => { showScreen('home'); $('start').focus(); });
$('review-filter').addEventListener('change', renderReview);
$('submit').addEventListener('click', () => { submit(); $('submit').blur(); });
$('erase').addEventListener('click', () => { setPending(''); $('erase').blur(); });
$('stop').addEventListener('click', () => { if (session?.active) $('stop-dialog').showModal(); });
$('cancel-stop').addEventListener('click', () => $('stop-dialog').close());
$('confirm-stop').addEventListener('click', () => { session.checkTime(); session.finish(); end(); });

document.addEventListener('keydown', event => {
  if (!session?.active || $('stop-dialog').open || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
  if (event.repeat) { if (validAnswer(selectedModel, event.key) || event.key === 'Enter') event.preventDefault(); return; }
  // Preserve Tab and Enter/Space activation on focused UI controls.
  const onButton = document.activeElement?.tagName === 'BUTTON';
  if (validAnswer(selectedModel, event.key)) { event.preventDefault(); input(event.key); if (onButton) document.activeElement?.blur(); }
  else if (event.key === 'Enter' && inputMode === 'enter' && !onButton) { event.preventDefault(); submit(); }
  else if (event.key === 'Backspace' && inputMode === 'enter') { event.preventDefault(); setPending(''); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
window.addEventListener('beforeunload', event => { if (session?.active) { event.preventDefault(); event.returnValue = ''; } });
