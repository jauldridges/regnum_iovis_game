// Step 1: tile map, walking, collision, one NPC, message box with 3-second pause.
var Game = (function () {
  var T = 32, W = 15, H = 10, PAUSE = 3;
  // # wall, . floor, T throne (solid), N npc start, P player start
  var MAP = [
    '###############',
    '#.............#',
    '#....TTT......#',
    '#.............#',
    '#.........N...#',
    '#.............#',
    '#..P..........#',
    '#.............#',
    '#.............#',
    '######...######'
  ];
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
        solid[y][x] = c === '#' || c === 'T';
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
      bind(); requestAnimationFrame(loop);
    }
  }

  function blocked(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return true;
    return solid[y][x] || (x === npc.x && y === npc.y);
  }
  function step(dx, dy) {
    if (msgOpen) return;
    dir = { x: dx, y: dy };
    if (!blocked(player.x + dx, player.y + dy)) { player.x += dx; player.y += dy; }
  }
  function act() {
    if (msgOpen) return;
    if (player.x + dir.x === npc.x && player.y + dir.y === npc.y) {
      var t = line('ch1_servant_warn');
      if (t) showMessage(t);
    }
  }

  // Card pause: Continue is disabled for PAUSE seconds with a countdown.
  // Enter/Space are ignored until then because the button is disabled.
  function showMessage(text) {
    msgOpen = true;
    var box = document.getElementById('msg'), btn = document.getElementById('msg-btn');
    document.getElementById('msg-text').textContent = text;
    var label = line('ui_continue') || 'Continue';
    label = label.replace('[draft] ', '');
    box.hidden = false; btn.disabled = true;
    var left = PAUSE; btn.textContent = label + ' (' + left + ')';
    var iv = setInterval(function () {
      left--;
      if (left > 0) { btn.textContent = label + ' (' + left + ')'; return; }
      clearInterval(iv); btn.disabled = false; btn.textContent = label; btn.focus();
    }, 1000);
    btn.onclick = function () { box.hidden = true; msgOpen = false; };
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
    draw(); requestAnimationFrame(loop);
  }

  function draw() {
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var c = MAP[y][x];
      ctx.fillStyle = c === '#' ? '#4a3b2a' : c === 'T' ? '#c9a227' : '#b9a98a';
      ctx.fillRect(x * T, y * T, T, T);
    }
    ctx.fillStyle = '#6a4fa3'; ctx.fillRect(npc.x * T + 4, npc.y * T + 4, T - 8, T - 8);   // servant
    ctx.fillStyle = '#2f7fd1'; ctx.fillRect(player.x * T + 4, player.y * T + 4, T - 8, T - 8); // Ops
    ctx.fillStyle = '#fff'; ctx.fillRect(player.x * T + 14 + dir.x * 8, player.y * T + 14 + dir.y * 8, 4, 4);
  }

  return { init: init, state: function () { return { player: player, npc: npc, msgOpen: msgOpen }; } };
})();
