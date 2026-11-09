// Party and the collection book (Liber Deōrum). Each page waits 3 seconds, then asks one question.
var Book = (function () {
  var B = {}, MAXSIB = 3;
  // Story data only; all text lives in content/latin.yaml (lib_<id>, lib_<id>_q).
  var CH = { iuppiter: {}, ops: {}, saturnus: {}, saxum: {},
             amalthea: { helper: true }, curetes: { helper: true }, metis: { helper: true },
             neptunus: { sibling: true }, pluto: { sibling: true }, iuno: { sibling: true }, ceres: { sibling: true }, vesta: { sibling: true } };
  var unlocked = {}, recruited = {}, party = [], root, open = false;

  function L(id) { return Game.line(id) || ''; }
  function C(id) { return Game.clean(L(id)); }
  function ready(id) { return Game.line('lib_' + id) && Game.qline('lib_' + id + '_q'); }
  function nameOf(id) { return C('lib_' + id).split('\n')[0]; }
  function ids(pred) { return Object.keys(CH).filter(pred); }

  B.unlock = function (id) { unlocked[id] = true; };
  // silent = no points (used when a chapter is started directly for testing or chapter select)
  B.recruit = function (id, silent) {
    if (!recruited[id] && !silent) Score.add('allies', Score.CFG.ally);
    recruited[id] = true; unlocked[id] = true;
    if (CH[id].sibling && party.indexOf(id) < 0 && party.length < MAXSIB) party.push(id);
  };
  B.partyInfo = function () { return { siblings: party.slice(), helpers: ids(function (i) { return CH[i].helper && recruited[i]; }) }; };
  B.lastSibling = function () { return party[party.length - 1] || null; };
  B.nameNom = function (id) { return nameOf(id).split(',')[0]; };

  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }
  function btn(text, fn, cls) { var b = el('button', text, cls); b.onclick = fn; return b; }

  function home() {
    root.innerHTML = '';
    root.appendChild(el('h2', C('lib_title')));
    ids(function (id) { return unlocked[id] && ready(id); }).forEach(function (id) {
      var done = Quiz.results[id];
      root.appendChild(btn(nameOf(id) + (done ? ' ✓' : ''), function () { Quiz.run(root, 'lib_' + id, 'lib_' + id + '_q', id, home); }, done ? 'ok' : ''));
    });
    root.appendChild(el('h2', C('ui_party')));
    root.appendChild(el('div', unlocked.iuppiter ? nameOf('iuppiter') : '', 'page'));
    ids(function (id) { return CH[id].helper && recruited[id] && ready(id); }).forEach(function (id) {
      root.appendChild(el('div', nameOf(id), 'page'));
    });
    ids(function (id) { return CH[id].sibling && recruited[id] && ready(id); }).forEach(function (id) {
      var inP = party.indexOf(id) >= 0;
      root.appendChild(btn(nameOf(id) + (inP ? ' ✓' : ''), function () {
        if (inP) party.splice(party.indexOf(id), 1); else if (party.length < MAXSIB) party.push(id);
        home();
      }, 'pty' + (inP ? ' sel' : '')));
    });
    root.appendChild(el('br'));
    root.appendChild(btn(C('ui_close'), close));
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
  B.state = function () { return { results: Quiz.results, party: party.slice(), open: open }; };
  return B;
})();
