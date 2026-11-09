// Step 5: Glōria (points), ranks and the finale. Nothing is stored or sent.
var Score = (function () {
  var S = {};
  // All tunable numbers live here (first guesses, to be tuned after real playtests).
  var CFG = S.CFG = {
    object: 20,            // each object inspected (once)
    choice: 100,           // key choice right on the first try
    choiceRetry: 50,       // key choice right after a miss
    battle: 150,           // each battle won
    ally: 100,             // each ally recruited
    bookFirst: 50,         // book question right on the first try
    bookRetry: 25,         // book question right on the retry
    speedMax: 500,         // speed bonus, falling to nothing after speedMinutes of play
    speedMinutes: 15,
    goal: 1400,            // "Congratulations!" at or above this
    ranks: [0, 300, 700, 1100, 1800]   // thresholds for rank_1 .. rank_5
  };
  var parts = {}, playMs = 0;

  S.add = function (key, pts) {
    parts[key] = parts[key] || { n: 0, pts: 0 }; parts[key].n++; parts[key].pts += pts;
  };
  // Counts only time spent playing (not reading cards or the book).
  S.tick = function (dt, playing) { if (playing) playMs += Math.min(dt, 250); };
  S.speedBonus = function () {
    return Math.max(0, Math.round(CFG.speedMax * (1 - playMs / (CFG.speedMinutes * 60000))));
  };
  S.breakdown = function () {
    var rows = [];
    ['objects', 'choice', 'battles', 'book', 'story', 'allies'].forEach(function (k) {
      if (parts[k]) rows.push({ key: k, n: parts[k].n, pts: parts[k].pts });
    });
    rows.push({ key: 'speed', n: 0, pts: S.speedBonus() });
    return rows;
  };
  S.total = function () { return S.breakdown().reduce(function (a, r) { return a + r.pts; }, 0); };
  S.rankIndex = function (total) {
    var r = 0; CFG.ranks.forEach(function (t, i) { if (total >= t) r = i; }); return r + 1;
  };
  S.playMs = function () { return playMs; };
  return S;
})();

var Finale = (function () {
  var F = {}, IDS = ['fin_end', 'fin_win', 'fin_lose', 'fin_score', 'fin_rank', 'fin_breakdown', 'br_objects',
    'br_choice', 'br_battles', 'br_book', 'br_story', 'br_allies', 'br_speed', 'fin_again', 'fin_try', 'fin_confirm',
    'fin_yes', 'fin_no', 'rank_1', 'rank_2', 'rank_3', 'rank_4', 'rank_5'];
  F.ready = function () { return IDS.every(function (i) { return Game.line(i); }); };
  function C(id) { return Game.clean(Game.line(id)); }
  function en(id) { return Game.clean(Game.englishOf(id)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }

  F.show = async function () {
    var root = document.getElementById('finale'), total = Score.total(), won = total >= Score.CFG.goal;
    root.innerHTML = ''; root.hidden = false; Game.setBusy(true);
    var h = el('h1', C('fin_end')); root.appendChild(h);
    await wait(1500);
    root.appendChild(el('h2', C(won ? 'fin_win' : 'fin_lose'), 'verdict'));
    var line = el('div', '', 'big'); root.appendChild(line);
    await new Promise(function (res) {            // score counts up
      var t0 = performance.now(), D = 1800;
      (function f() {
        var p = Math.min(1, (performance.now() - t0) / D);
        line.textContent = C('fin_score') + ' ' + Math.round(total * p);
        p < 1 ? requestAnimationFrame(f) : res();
      })();
    });
    await wait(500);
    var rk = 'rank_' + Score.rankIndex(total), rankBox = el('div', '', 'rank');
    rankBox.appendChild(el('div', C('fin_rank') + ' ' + C(rk), 'big'));
    rankBox.appendChild(el('div', en(rk), 'sub'));      // English underneath
    root.appendChild(rankBox);
    await wait(600);
    root.appendChild(el('h3', C('fin_breakdown')));
    var ul = el('ul', '', 'rows');
    Score.breakdown().forEach(function (r) {
      var li = el('li', C('br_' + r.key) + (r.n ? ' ×' + r.n : '') + ': ' + r.pts); li.title = en('br_' + r.key); ul.appendChild(li);
    });
    root.appendChild(ul);
    // (The review of the final comprehension check goes here once that check exists.)
    var again = el('button', C(won ? 'fin_again' : 'fin_try'), 'again'); root.appendChild(again);
    again.onclick = function () { confirmRestart(root, again); };
  };

  // Play again only restarts after the student confirms: score would be lost.
  function confirmRestart(root, again) {
    again.hidden = true;
    var box = el('div', '', 'confirm');
    box.appendChild(el('div', C('fin_confirm')));
    var yes = el('button', C('fin_yes')), no = el('button', C('fin_no'));
    yes.onclick = function () { location.reload(); };
    no.onclick = function () { box.remove(); again.hidden = false; };
    box.appendChild(yes); box.appendChild(no); root.appendChild(box);
  }
  return F;
})();
