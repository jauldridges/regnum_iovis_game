// Step 1: tile map, walking, collision, one NPC, message box with 3-second pause.
var Game = (function () {
  var T = 32, W = 15, H = 10, PAUSE = 3;
  // # wall, . floor, T throne (solid), N npc start, P player start
  var MAP = [
    '###########F###',
    '#.............#',
    '#.C..TTT......#',
    '#.............#',
    '#.........N...#',
    '#.............#',
    '#..P..........#',
    '#.............#',
    '#.............#',
    '######...######'
  ];
  var OBJ = { T: 'obj_throne', F: 'obj_sickle', C: 'obj_cradle' }, inspected = {};
  var scene = 'start', saturn = null, guard = null;
  var solid = [], npc = {}, player = {}, dir = { x: 0, y: -1 };
  var content = {}, ctx, msgOpen = false, moveTimer = 0, keys = {};

  // Text lookup: returns null unless approved (or ?drafts=1, marked [draft]).
  function line(id, field) {
    var e = content[id];
    if (!e || (e.review_status !== 'approved' && !DRAFTS)) return null;
    var t = (LANG === 'en' ? e.english : e.latin);
    return e.review_status === 'draft' ? '[draft] ' + t : t;
  }

  function init() {
    CONTENT.forEach(function (e) { content[e.id] = e; });
    MAP.forEach(function (row, y) {
      solid[y] = [];
      row.split('').forEach(function (c, x) {
        solid[y][x] = c === '#' || !!OBJ[c];
        if (c === 'N') npc = { x: x, y: y };
        if (c === 'P') player = { x: x, y: y };
      });
    });
    var title = document.getElementById('title');
    document.getElementById('btn-la').onclick = function () { LANG = 'la'; start(); };
    document.getElementById('btn-en').onclick = function () { LANG = 'en'; start(); };
    if (new URLSearchParams(location.search).has('lang')) start();
    function start() {
      title.hidden = true;
      var c = document.getElementById('game'); c.hidden = false;
      document.getElementById('pad').hidden = false;
      ctx = c.getContext('2d');
      bind(); Book.init(); requestAnimationFrame(loop);
    }
  }

  function blocked(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return true;
    return solid[y][x] || (x === npc.x && y === npc.y) || (saturn && x === saturn.x && y === saturn.y) || (guard && x === guard.x && y === guard.y);
  }
  function step(dx, dy) {
    if (msgOpen) return;
    dir = { x: dx, y: dy };
    if (!blocked(player.x + dx, player.y + dy)) { player.x += dx; player.y += dy; }
  }
  function act() {
    if (msgOpen) return;
    var fx = player.x + dir.x, fy = player.y + dir.y;
    if (guard && fx === guard.x && fy === guard.y) { Battle.start(); return; }
    if (fx === npc.x && fy === npc.y) {
      var t = line('ch1_servant_warn');
      if (t) showMessages([t], function () { if (scene === 'start') saturnScene(); });
    } else if (fx >= 0 && fy >= 0 && fx < W && fy < H && OBJ[MAP[fy][fx]]) {
      var ot = line(OBJ[MAP[fy][fx]]);
      if (ot) { inspected[OBJ[MAP[fy][fx]]] = true; showMessages([ot]); }
    }
  }

  // Saturn arrives and Ops must choose what to give him. Needs all its lines approved
  // (or ?drafts=1); otherwise the scene is skipped.
  function saturnScene() {
    var ids = ['ch1_saturn_comes', 'ch1_choice_prompt', 'ch1_choice_stone', 'ch1_choice_baby',
               'ch1_wrong', 'ch1_right_1', 'ch1_right_2', 'ch1_right_3'];
    if (ids.some(function (i) { return !line(i); })) return;
    scene = 'saturn'; saturn = { x: 7, y: 8 };
    showMessages([line('ch1_saturn_comes')], ask);
    function ask() {
      showChoice(line('ch1_choice_prompt'), [
        { label: line('ch1_choice_stone'), fn: function () {
            showMessages([line('ch1_right_1'), line('ch1_right_2'), line('ch1_right_3')],
              function () { saturn = null; scene = 'done'; ['iuppiter', 'ops', 'saturnus'].forEach(Book.unlock);
                if (Battle.ready()) guard = { x: 11, y: 6 }; }); } },
        { label: line('ch1_choice_baby'), fn: function () { showMessages([line('ch1_wrong')], ask); } }
      ]);
    }
  }

  function clean(t) { return t.replace('[draft] ', ''); }

  // Card pause: buttons are disabled for PAUSE seconds with a countdown, so
  // Enter/Space/clicks do nothing until the student has had time to read.
  function pauseButtons(btns, labels, onReady) {
    var left = PAUSE;
    btns.forEach(function (b, i) { b.disabled = true; b.textContent = labels[i] + ' (' + left + ')'; });
    var iv = setInterval(function () {
      left--;
      btns.forEach(function (b, i) { b.textContent = labels[i] + (left > 0 ? ' (' + left + ')' : ''); });
      if (left > 0) return;
      clearInterval(iv); btns.forEach(function (b) { b.disabled = false; }); btns[0].focus();
    }, 1000);
  }

  function showMessages(texts, done) {
    msgOpen = true;
    var box = document.getElementById('msg'), btn = document.getElementById('msg-btn');
    document.getElementById('choices').innerHTML = '';
    document.getElementById('msg-text').textContent = texts[0];
    box.hidden = false; btn.hidden = false;
    pauseButtons([btn], [clean(line('ui_continue') || 'Continue')]);
    btn.onclick = function () {
      if (texts.length > 1) return showMessages(texts.slice(1), done);
      box.hidden = true; msgOpen = false; if (done) done();
    };
  }

  function showChoice(prompt, opts) {
    msgOpen = true;
    var box = document.getElementById('msg'), cont = document.getElementById('msg-btn'),
        holder = document.getElementById('choices');
    document.getElementById('msg-text').textContent = prompt;
    box.hidden = false; cont.hidden = true; holder.innerHTML = '';
    var btns = opts.map(function (o) {
      var b = document.createElement('button');
      b.onclick = function () { box.hidden = true; msgOpen = false; holder.innerHTML = ''; o.fn(); };
      holder.appendChild(b); return b;
    });
    pauseButtons(btns, opts.map(function (o) { return clean(o.label); }));
  }

  function bind() {
    var map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'act', Enter: 'act' };
    addEventListener('keydown', function (e) {
      var k = map[e.key]; if (!k || msgOpen) return;
      e.preventDefault();
      if (k === 'act') { act(); return; }
      if (!keys[k]) { keys[k] = true; stepDir(k); moveTimer = performance.now(); }
    });
    addEventListener('keyup', function (e) { var k = map[e.key]; if (k) keys[k] = false; });
    document.querySelectorAll('#pad button').forEach(function (b) {
      var d = b.dataset.d;
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (d === 'act') act(); else { keys[d] = true; stepDir(d); moveTimer = performance.now(); } });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { keys[d] = false; }); });
    });
  }

  function stepDir(k) {
    if (k === 'up') step(0, -1); else if (k === 'down') step(0, 1);
    else if (k === 'left') step(-1, 0); else step(1, 0);
  }

  function loop(ts) {
    if (ts - moveTimer > 150) {
      var held = ['up', 'down', 'left', 'right'].filter(function (k) { return keys[k]; })[0];
      if (held) { stepDir(held); moveTimer = ts; }
    }
    if (Battle.active) Battle.draw(ctx); else draw();
    requestAnimationFrame(loop);
  }

  function draw() {
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var c = MAP[y][x];
      ctx.fillStyle = c === '#' ? '#4a3b2a' : c === 'T' ? '#c9a227' : c === 'F' ? '#9aa3ad' : c === 'C' ? '#e8a0b4' : '#b9a98a';
      ctx.fillRect(x * T, y * T, T, T);
    }
    if (saturn) { ctx.fillStyle = '#b02a2a'; ctx.fillRect(saturn.x * T + 2, saturn.y * T + 2, T - 4, T - 4); }
    if (guard) { ctx.fillStyle = '#b5651d'; ctx.fillRect(guard.x * T + 4, guard.y * T + 4, T - 8, T - 8); }
    ctx.fillStyle = '#6a4fa3'; ctx.fillRect(npc.x * T + 4, npc.y * T + 4, T - 8, T - 8);   // servant
    ctx.fillStyle = '#2f7fd1'; ctx.fillRect(player.x * T + 4, player.y * T + 4, T - 8, T - 8); // Ops
    ctx.fillStyle = '#fff'; ctx.fillRect(player.x * T + 14 + dir.x * 8, player.y * T + 14 + dir.y * 8, 4, 4);
  }

  // Question lookup (language-aware, same draft rule as line()).
  function qline(id) {
    var e = content[id];
    if (!e || (e.review_status !== 'approved' && !DRAFTS)) return null;
    return LANG === 'en' ? { question: e.en_question, choices: e.en_choices, answer: e.answer }
                         : { question: e.question, choices: e.choices, answer: e.answer };
  }

  function endBattle() {
    guard = null; msgOpen = false; scene = 'battled';
    document.getElementById('msg').hidden = true; document.getElementById('choices').innerHTML = '';
  }
  return { qline: qline, pauseButtons: pauseButtons, line: line, clean: clean, rawLatin: function (id) { return content[id].latin; },
           setBusy: function (b) { msgOpen = b; }, endBattle: endBattle, init: init, state: function () { return { player: player, npc: npc, msgOpen: msgOpen, guard: guard, scene: scene, inspected: inspected }; } };
})();
