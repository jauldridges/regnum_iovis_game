// Engine: tile maps, walking with collision, message boxes (3-second pause), choices, screen wipe.
// Story logic (who says what) lives in story.js; all text lives in content/latin.yaml.
var Game = (function () {
  var T = 32, W = 15, H = 10;
  var params = new URLSearchParams(location.search);
  var PAUSE = params.has('pause') ? parseFloat(params.get('pause')) : 3;   // seconds; the ?pause= override is for testing only
  var content = {}, ctx, map = null, mapId = '', player = { x: 0, y: 0 }, dir = { x: 0, y: -1 };
  var msgOpen = false, keys = {}, moveTimer = 0, lastTs = 0, trans = null, walkUntil = 0;

  // ---- text lookup: approved lines only (or drafts, marked, with ?drafts=1)
  function line(id) {
    var e = content[id];
    if (!e || (e.review_status !== 'approved' && !DRAFTS)) { if (!e || !DRAFTS) console.warn('line not available:', id); return null; }
    var t = LANG === 'en' ? e.english : e.latin;
    return e.review_status === 'draft' ? '[draft] ' + t : t;
  }
  function clean(t) { return (t || '').replace('[draft] ', ''); }
  function qline(id) {
    var e = content[id];
    if (!e || (e.review_status !== 'approved' && !DRAFTS)) return null;
    return LANG === 'en' ? { question: e.en_question, choices: e.en_choices, answer: e.answer }
                         : { question: e.question, choices: e.choices, answer: e.answer };
  }

  // ---- start
  function init() {
    CONTENT.forEach(function (e) { content[e.id] = e; });
    var title = document.getElementById('title');
    var tctx = document.getElementById('titleart').getContext('2d');
    (function tloop(ts) { if (title.hidden) return; Art.title(tctx, ts); requestAnimationFrame(tloop); })(0);
    document.getElementById('btn-la').onclick = function () { LANG = 'la'; start(); };
    document.getElementById('btn-en').onclick = function () { LANG = 'en'; start(); };
    if (params.has('lang')) start();
    function start() {
      title.hidden = true;
      var c = document.getElementById('game'); c.hidden = false;
      document.getElementById('pad').hidden = false;
      ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      bind(); Book.init(); requestAnimationFrame(loop);
      Story.begin(params.has('ch') ? parseInt(params.get('ch'), 10) : 0);
    }
  }

  // ---- maps
  function loadMap(id, x, y) {
    map = MAPS[id]; mapId = id;
    player = { x: x == null ? map.start.x : x, y: y == null ? map.start.y : y }; dir = { x: 0, y: -1 };
    Object.keys(keys).forEach(function (k) { keys[k] = false; });
  }
  function entAt(x, y) {
    return map.ents.filter(function (e) { return e.x === x && e.y === y && e.show(); })[0] || null;
  }
  function exitAt(x, y) { return map.exits.filter(function (e) { return e.x === x && e.y === y; })[0] || null; }
  function tileAt(x, y) { return TILES[map.rows[y][x]]; }
  function inside(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

  function step(dx, dy) {
    if (msgOpen || !map) return;
    dir = { x: dx, y: dy };
    var nx = player.x + dx, ny = player.y + dy;
    if (!inside(nx, ny) || entAt(nx, ny)) return;
    var ex = exitAt(nx, ny);
    if (ex) {
      if (Story.canExit(ex.id)) { player.x = nx; player.y = ny; Story.exit(ex.id); }
      else Story.exitBlocked(ex.id);
      return;
    }
    if (!tileAt(nx, ny).solid) { player.x = nx; player.y = ny; walkUntil = performance.now() + 220; }
  }
  function stepDir(k) {
    if (k === 'up') step(0, -1); else if (k === 'down') step(0, 1);
    else if (k === 'left') step(-1, 0); else step(1, 0);
  }
  function act() {
    if (msgOpen || !map) return;
    var fx = player.x + dir.x, fy = player.y + dir.y;
    if (!inside(fx, fy)) return;
    var e = entAt(fx, fy);
    if (e) return Story.talk(e.id);
    var o = tileAt(fx, fy).obj;
    if (o) Story.inspect(o);
  }

  // ---- messages and choices. Buttons stay disabled for PAUSE seconds with a countdown.
  function pauseButtons(btns, labels) {
    var end = performance.now() + PAUSE * 1000;
    btns.forEach(function (b, i) { b.disabled = true; b.textContent = labels[i] + ' (' + Math.ceil(PAUSE) + ')'; });
    var iv = setInterval(function () {
      var ms = end - performance.now();
      if (ms > 0) { btns.forEach(function (b, i) { b.textContent = labels[i] + ' (' + Math.ceil(ms / 1000) + ')'; }); return; }
      clearInterval(iv); btns.forEach(function (b, i) { b.disabled = false; b.textContent = labels[i]; }); btns[0].focus();
    }, 100);
  }

  function showMessages(texts, done) {
    if (!texts.length) { if (done) done(); return; }
    msgOpen = true;
    var box = document.getElementById('msg'), btn = document.getElementById('msg-btn');
    document.getElementById('choices').innerHTML = '';
    document.getElementById('msg-text').textContent = texts[0];
    box.hidden = false; btn.hidden = false;
    pauseButtons([btn], [clean(line('ui_continue') || '')]);
    btn.onclick = function () {
      if (texts.length > 1) return showMessages(texts.slice(1), done);
      box.hidden = true; msgOpen = false; if (done) done();
    };
  }
  function showChoice(prompt, opts) {
    msgOpen = true;
    var box = document.getElementById('msg'), cont = document.getElementById('msg-btn'), holder = document.getElementById('choices');
    document.getElementById('msg-text').textContent = prompt;
    box.hidden = false; cont.hidden = true; holder.innerHTML = '';
    var btns = opts.map(function (o) {
      var b = document.createElement('button');
      b.onclick = function () { box.hidden = true; msgOpen = false; holder.innerHTML = ''; o.fn(); };
      holder.appendChild(b); return b;
    });
    pauseButtons(btns, opts.map(function (o) { return clean(o.label); }));
  }

  // ---- screen wipe: bars close over the scene, `mid` runs while it is covered, then the bars open
  function ease(p) { return p * p * (3 - 2 * p); }
  // unlock: give control back when the wipe ends (for a plain change of map; battles and the finale keep it locked)
  function transition(mid, unlock) { msgOpen = true; trans = { t0: performance.now(), d1: 900, d2: 700, mid: mid, fired: false, unlock: unlock }; }
  function drawTrans(now) {
    if (!trans) return;
    var e = now - trans.t0, p, N = 10, h = 320 / N;
    if (e < trans.d1) p = e / trans.d1;
    else {
      if (!trans.fired) { trans.fired = true; trans.mid(); }
      var e2 = e - trans.d1; if (e2 >= trans.d2) { if (trans.unlock) msgOpen = false; trans = null; return; }
      p = 1 - e2 / trans.d2;
    }
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * p) + ')'; ctx.fillRect(0, 0, 480, 320);
    ctx.fillStyle = '#000';
    for (var i = 0; i < N; i++) {
      var w = 480 * ease(Math.max(0, Math.min(1, p * 1.5 - (i / N) * 0.5)));
      if (i % 2) ctx.fillRect(480 - w, i * h, w, h); else ctx.fillRect(0, i * h, w, h);
    }
  }

  // ---- input
  function bind() {
    var km = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
               w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'act', Enter: 'act' };
    addEventListener('keydown', function (e) {
      var k = km[e.key]; if (!k || msgOpen) return;
      e.preventDefault();
      if (k === 'act') { act(); return; }
      if (!keys[k]) { keys[k] = true; stepDir(k); moveTimer = performance.now(); }
    });
    addEventListener('keyup', function (e) { var k = km[e.key]; if (k) keys[k] = false; });
    document.querySelectorAll('#pad button').forEach(function (b) {
      var d = b.dataset.d;
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); if (d === 'act') act(); else { keys[d] = true; stepDir(d); moveTimer = performance.now(); }
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { keys[d] = false; }); });
    });
  }

  // ---- loop and drawing
  function loop(ts) {
    if (lastTs) Score.tick(ts - lastTs, (!msgOpen || Battle.active) && !Book.state().open && !trans);
    lastTs = ts;
    if (ts - moveTimer > 150) {
      var held = ['up', 'down', 'left', 'right'].filter(function (k) { return keys[k]; })[0];
      if (held) { stepDir(held); moveTimer = ts; }
    }
    if (Battle.active) Battle.draw(ctx); else if (map) draw();
    drawTrans(performance.now());
    requestAnimationFrame(loop);
  }
  // which way a character faces: towards the player when close, otherwise down
  function facing(e) {
    var dx = player.x - e.x, dy = player.y - e.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) return 'down';
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  function draw() {
    var now = performance.now();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var ch = map.rows[y][x], nb = ch === 'T' ? (map.rows[y][x - 1] === 'T' ? 'l' : '') + (map.rows[y][x + 1] === 'T' ? 'r' : '') : '';
      ctx.drawImage(Art.tile(ch, mapId, now, (x * 7 + y * 3) % 4, nb), x * T, y * T);
    }
    map.exits.forEach(function (e) {
      ctx.drawImage(Art.tile('E', mapId, now), e.x * T, e.y * T);
      if (!Story.canExit(e.id)) { ctx.fillStyle = 'rgba(30,20,10,.6)'; ctx.fillRect(e.x * T, e.y * T, T, T); }
      else { ctx.fillStyle = 'rgba(255,255,200,' + (0.12 + 0.1 * Math.sin(now / 300)) + ')'; ctx.fillRect(e.x * T, e.y * T, T, T); }
    });
    // characters, back to front so lower ones overlap higher ones
    var chars = map.ents.filter(function (e) { return e.show(); }).map(function (e) { return { y: e.y, draw: function () { Art.char(ctx, Art.entSprite(e.id), e.x * T, e.y * T, facing(e), 0, now, e.x * 3 + e.y); } }; });
    var walking = now < walkUntil, fr = walking ? 1 + (Math.floor(now / 110) % 2) : 0;
    chars.push({ y: player.y, draw: function () { Art.char(ctx, Story.playerSprite(), player.x * T, player.y * T, dir.y < 0 ? 'up' : dir.y > 0 ? 'down' : dir.x < 0 ? 'left' : 'right', fr, now, 0); } });
    chars.sort(function (a, b) { return a.y - b.y; }).forEach(function (c) { c.draw(); });
    Art.light(ctx, mapId);
  }

  function endBattle() {
    msgOpen = false;
    document.getElementById('msg').hidden = true; document.getElementById('choices').innerHTML = '';
  }
  function finish() { if (Finale.ready()) Finale.show(); }   // the game ends here until later chapters exist

  return {
    line: line, clean: clean, qline: qline, init: init, loadMap: loadMap, showMessages: showMessages,
    showChoice: showChoice, pauseButtons: pauseButtons, transition: transition, endBattle: endBattle, finish: finish,
    rawLatin: function (id) { return content[id].latin; },
    englishOf: function (id) { return content[id].english; },
    setBusy: function (b) { msgOpen = b; },
    state: function () { return { player: player, map: mapId, msgOpen: msgOpen, flags: Story.flags, ch: Story.ch(), trans: !!trans }; }
  };
})();
