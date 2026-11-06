// Step 4: party and the collection book (Liber Deōrum).
// Each page waits 3 seconds, then asks one question (see design §16).
var Book = (function () {
  var B = {}, MAXSIB = 3;
  // Story data only; all text lives in content/latin.yaml (lib_<id>, lib_<id>_q).
  var CH = { iuppiter: {}, ops: {}, saturnus: {}, neptunus: { sibling: true } };
  var unlocked = {}, recruited = {}, party = {}, results = {}, root, open = false;

  function L(id) { return Game.line(id) || ''; }
  function C(id) { return Game.clean(L(id)); }
  function ready(id) { return Game.line('lib_' + id) && Game.qline('lib_' + id + '_q'); }
  function nameOf(id) { return C('lib_' + id).split('\n')[0]; }

  B.unlock = function (id) { unlocked[id] = true; };
  B.recruit = function (id) { recruited[id] = true; unlocked[id] = true; };   // used by later chapters
  function partySize() { return Object.keys(party).length; }

  function el(tag, text, cls) {
    var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e;
  }
  function btn(text, fn, cls) { var b = el('button', text, cls); b.onclick = fn; return b; }
  function screen() { root.innerHTML = ''; return root; }

  function home() {
    var r = screen();
    r.appendChild(el('h2', C('lib_title')));
    Object.keys(CH).filter(function (id) { return unlocked[id] && ready(id); }).forEach(function (id) {
      r.appendChild(btn(nameOf(id) + (results[id] ? ' ✓' : ''), function () { card(id, 1); }, results[id] ? 'ok' : ''));
    });
    r.appendChild(el('h2', C('ui_party')));
    r.appendChild(el('div', unlocked.iuppiter ? nameOf('iuppiter') : '', 'page'));
    Object.keys(CH).filter(function (id) { return CH[id].sibling && recruited[id] && ready(id); }).forEach(function (id) {
      r.appendChild(btn(nameOf(id) + (party[id] ? ' ✓' : ''), function () {
        if (party[id]) delete party[id]; else if (partySize() < MAXSIB) party[id] = true;
        home();
      }, 'pty' + (party[id] ? ' sel' : '')));
    });
    r.appendChild(el('br'));
    r.appendChild(btn(C('ui_close'), close));
  }

  // Page text, then Continue after 3 seconds.
  function card(id, attempt) {
    var r = screen();
    r.appendChild(el('div', C('lib_' + id), 'page'));
    var cont = btn('', function () { if (results[id]) home(); else ask(id, attempt); });
    r.appendChild(cont);
    Game.pauseButtons([cont], [C('ui_continue')]);
  }

  function ask(id, attempt) {
    var q = Game.qline('lib_' + id + '_q'), r = screen();
    r.appendChild(el('div', Game.clean(q.question), 'page'));
    q.choices.forEach(function (c, i) {
      r.appendChild(btn(c, function () { answer(id, attempt, i === q.answer, q); }));
    });
  }

  function answer(id, attempt, right, q) {
    var r = screen();
    if (right) {
      results[id] = { tries: attempt, correct: true, firstTry: attempt === 1 };
      r.appendChild(el('div', C('ui_correct'), 'page'));
      r.appendChild(btn(C('ui_continue'), home));
    } else if (attempt === 1) {
      r.appendChild(el('div', C('ui_wrong'), 'page'));
      r.appendChild(btn(C('ui_continue'), function () { card(id, 2); }));   // back to re-read the text
    } else {
      results[id] = { tries: 2, correct: false, firstTry: false };
      r.appendChild(el('div', C('ui_answer_is') + ' ' + q.choices[q.answer], 'page'));
      r.appendChild(btn(C('ui_continue'), home));
    }
  }

  function show() {
    if (open || Game.state().msgOpen || Battle.active) return;
    open = true; Game.setBusy(true); root.hidden = false; home();
  }
  function close() { open = false; root.hidden = true; Game.setBusy(false); }

  B.init = function () {
    root = document.getElementById('book');
    var b = document.getElementById('bookbtn');
    b.textContent = C('lib_title'); b.hidden = !b.textContent; b.onclick = show;   // hidden while the title is a draft
    addEventListener('keydown', function (e) { if (e.key === 'b' || e.key === 'B') show(); });
  };
  B.state = function () { return { results: results, party: Object.keys(party), open: open }; };
  return B;
})();
