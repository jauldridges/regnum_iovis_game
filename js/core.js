// Engine: tile maps, smooth walking with collision, patrolling guards, message boxes (3-second pause), choices, toasts,
// screen wipe. Story logic (who says what) lives in story.js; all text lives in content/latin.yaml.
// The screen is 480 x 312 logical pixels (20 x 13 tiles of 24), drawn at twice that size.
var Game = (function () {
  var T = 24, W = 20, H = 13, LW = 480, LH = 312, STEP_MS = 150;
  var params = new URLSearchParams(location.search);
  var PAUSE = params.has('pause') ? parseFloat(params.get('pause')) : 3;   // seconds; the ?pause= override is for testing only
  var content = {}, ctx, map = null, mapId = '', player = { x: 0, y: 0 }, dir = { x: 0, y: -1 };
  var msgOpen = false, sceneOn = false, sc = { actors: {}, parts: [], shakeUntil: 0, shakeAmp: 0, flash: null }, TS = Math.max(0.05, PAUSE / 3), held = [], lastTs = 0, trans = null, mv = null, pendingExit = null, follower = null, trail = [], caughtUntil = 0, toastTimer = null;

  function locked() { return msgOpen || sceneOn; }

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
      c.width = LW * 2; c.height = LH * 2;
      ctx = c.getContext('2d'); ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.imageSmoothingEnabled = false;
      bind(); Book.init(); requestAnimationFrame(loop);
      Story.begin(params.has('ch') ? parseInt(params.get('ch'), 10) : 0);
    }
  }

  // ---- maps
  function loadMap(id, x, y) {
    map = MAPS[id]; mapId = id;
    player = { x: x == null ? map.start.x : x, y: y == null ? map.start.y : y }; dir = { x: 0, y: -1 };
    mv = null; pendingExit = null; trail = [{ x: player.x, y: player.y }, { x: player.x, y: player.y }]; held = [];
    map.ents.forEach(function (e) { if (e.patrol) resetEnt(e); });
  }
  function resetEnt(e) {
    var p = e.patrol; e.x = p.path[0][0]; e.y = p.path[0][1]; e.rx = e.x; e.ry = e.y; p.i = 1; p.dirn = 1; p.wait = 0; p.done = false; e.face = 'down'; e.walking = false;
  }
  function entAt(x, y) {
    return map.ents.filter(function (e) { return e.x === x && e.y === y && e.show(); })[0] || null;
  }
  function exitAt(x, y) { return map.exits.filter(function (e) { return e.x === x && e.y === y; })[0] || null; }
  function tileAt(x, y) { return TILES[map.rows[y][x]]; }
  function inside(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }

  // ---- walking: one tile takes STEP_MS, and the next step starts at once if a key is still held
  function startStep(dx, dy, at) {
    dir = { x: dx, y: dy };
    var nx = player.x + dx, ny = player.y + dy;
    if (!inside(nx, ny) || entAt(nx, ny)) return false;
    var ex = exitAt(nx, ny);
    if (ex && !Story.canExit(ex.id)) { Story.exitBlocked(ex.id); return false; }
    if (!ex && tileAt(nx, ny).solid) return false;
    mv = { fx: player.x, fy: player.y, t0: at };
    player.x = nx; player.y = ny; trail.push({ x: nx, y: ny }); if (trail.length > 4) trail.shift();
    if (ex) pendingExit = ex.id;
    return true;
  }
  function turn(dx, dy) { dir = { x: dx, y: dy }; }
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function press(k) {
    if (held.indexOf(k) < 0) held.push(k);
    if (!mv && !locked()) { var d = DIRS[k]; if (!startStep(d[0], d[1], performance.now())) turn(d[0], d[1]); }
  }
  function release(k) { var i = held.indexOf(k); if (i >= 0) held.splice(i, 1); }
  function act() {
    if (locked() || mv || !map) return;
    var fx = player.x + dir.x, fy = player.y + dir.y;
    if (!inside(fx, fy)) return;
    var e = entAt(fx, fy);
    if (e) return Story.talk(e.id);
    var o = tileAt(fx, fy).obj;
    if (o) Story.inspect(o);
  }
  function updateWalk(ts) {
    if (mv) {
      if (ts - mv.t0 < STEP_MS) return;
      var carry = ts - mv.t0 - STEP_MS; mv = null;
      if (pendingExit) { var id = pendingExit; pendingExit = null; held = []; Story.exit(id); return; }
      if (!locked() && held.length) { var d = DIRS[held[held.length - 1]]; if (!startStep(d[0], d[1], ts - Math.min(carry, 30))) turn(d[0], d[1]); }
    } else if (!locked() && held.length) {
      var d2 = DIRS[held[held.length - 1]]; if (!startStep(d2[0], d2[1], ts)) turn(d2[0], d2[1]);
    }
  }

  // ---- patrolling guards: they walk their path, and see in a line ahead of them
  function updatePatrols(dt) {
    map.ents.forEach(function (e) {
      var P = e.patrol; if (!P || !e.show() || P.done) return;
      if (P.wait > 0) { P.wait -= dt; e.walking = false; return; }
      var tg = P.path[P.i], dx = tg[0] - e.rx, dy = tg[1] - e.ry, dist = Math.sqrt(dx * dx + dy * dy), step = P.speed * dt / 1000;
      if (dist <= step) {
        e.rx = tg[0]; e.ry = tg[1]; e.x = tg[0]; e.y = tg[1]; P.wait = P.pause || 0; e.walking = false;
        if (P.mode === 'once') { if (P.i >= P.path.length - 1) { P.done = true; if (P.onEnd) { var f = P.onEnd; P.onEnd = null; f(); } } else P.i++; }
        else if (P.mode === 'pingpong') { if (P.i + P.dirn < 0 || P.i + P.dirn >= P.path.length) P.dirn = -P.dirn; P.i += P.dirn; }
        else P.i = (P.i + 1) % P.path.length;
      } else {
        e.rx += dx / dist * step; e.ry += dy / dist * step; e.x = Math.round(e.rx); e.y = Math.round(e.ry); e.walking = true;
        e.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      }
    });
  }
  var FACE = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  function sightLine(e) {
    var cells = [], d = FACE[e.face || 'down'], v = e.patrol.vision || 3;
    for (var i = 1; i <= v; i++) {
      var x = e.x + d[0] * i, y = e.y + d[1] * i;
      if (!inside(x, y) || tileAt(x, y).solid) break;
      cells.push([x, y]);
    }
    return cells;
  }
  function checkSight(now) {
    if (locked() || now < caughtUntil || !Story.watching()) return;
    for (var k = 0; k < map.ents.length; k++) {
      var e = map.ents[k]; if (!e.patrol || !e.show() || e.patrol.mode === 'once') continue;
      var c = sightLine(e);
      for (var j = 0; j < c.length; j++) {
        var here = c[j][0] === player.x && c[j][1] === player.y, from = mv && c[j][0] === mv.fx && c[j][1] === mv.fy;
        if (here || from) { caughtUntil = now + 2500; held = []; Story.caught(e); return; }
      }
    }
  }
  function teleport(x, y) { player.x = x; player.y = y; mv = null; pendingExit = null; held = []; trail = [{ x: x, y: y }, { x: x, y: y }]; }
  function resetPatrols() { map.ents.forEach(function (e) { if (e.patrol) resetEnt(e); }); }
  function walkEnt(id, path, speed, onEnd) {
    var e = map.ents.filter(function (q) { return q.id === id; })[0]; if (!e) return;
    e.patrol = { path: path, mode: 'once', speed: speed || 2.4, vision: 0, pause: 0, onEnd: onEnd }; resetEnt(e);
  }

  // ---- messages and choices. Buttons stay disabled for PAUSE seconds with a countdown.
  // `key` is the text being read: once its pause has been served it never waits again (kept in memory only; a reload starts fresh)
  var seen = {};
  // a button's label is its last text node, so a picture on the button stays
  function setLabel(b, text) { var n = b.lastChild; if (n && n.nodeType === 3) n.nodeValue = text; else b.appendChild(document.createTextNode(text)); }
  function pauseButtons(btns, labels, key) {
    if (key && seen[key]) { btns.forEach(function (b, i) { b.disabled = false; setLabel(b, labels[i]); }); btns[0].focus(); return; }
    var end = performance.now() + PAUSE * 1000;
    btns.forEach(function (b, i) { b.disabled = true; setLabel(b, labels[i] + ' (' + Math.ceil(PAUSE) + ')'); });
    var iv = setInterval(function () {
      var ms = end - performance.now();
      if (ms > 0) { btns.forEach(function (b, i) { setLabel(b, labels[i] + ' (' + Math.ceil(ms / 1000) + ')'); }); return; }
      clearInterval(iv); if (key) seen[key] = true; btns.forEach(function (b, i) { b.disabled = false; setLabel(b, labels[i]); }); btns[0].focus();
    }, 100);
  }
  function showMessages(texts, done) {
    if (!texts.length) { if (done) done(); return; }
    msgOpen = true; held = [];
    var box = document.getElementById('msg'), btn = document.getElementById('msg-btn');
    document.getElementById('choices').innerHTML = '';
    document.getElementById('msg-text').textContent = texts[0];
    box.hidden = false; btn.hidden = false;
    pauseButtons([btn], [clean(line('ui_continue') || '')], clean(texts[0]));
    document.getElementById('msg-art').innerHTML = '';
    btn.onclick = function () {
      if (texts.length > 1) return showMessages(texts.slice(1), done);
      box.hidden = true; msgOpen = false; if (done) done();
    };
  }
  // nopause: for small, low-stakes choices (which shelf item to take) the buttons work at once
  function showChoice(prompt, opts, nopause, promptImg) {
    msgOpen = true; held = [];
    var box = document.getElementById('msg'), cont = document.getElementById('msg-btn'), holder = document.getElementById('choices');
    document.getElementById('msg-text').textContent = prompt;
    var art = document.getElementById('msg-art'); art.innerHTML = ''; if (promptImg) art.appendChild(promptImg);
    box.hidden = false; cont.hidden = true; holder.innerHTML = '';
    var btns = opts.map(function (o) {
      var b = document.createElement('button');
      b.onclick = function () { box.hidden = true; msgOpen = false; holder.innerHTML = ''; art.innerHTML = ''; o.fn(); };
      if (o.img) { b.appendChild(o.img); b.classList.add('withimg'); }
      holder.appendChild(b); return b;
    });
    if (nopause) btns.forEach(function (b, i) { var tn = document.createTextNode(clean(opts[i].label)); b.appendChild(tn); }); else pauseButtons(btns, opts.map(function (o) { return clean(o.label); }), clean(prompt));
  }
  // a short note that does not stop the game (the player keeps walking)
  function toast(text, ms) {
    if (!text) return;
    var t = document.getElementById('toast'); t.textContent = clean(text); t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, ms || 2600);
  }
  // the level: a star, the number, and a thin bar to the next level
  function setLvl(level, frac) {
    var h = document.getElementById('lvl'); if (!level) { h.hidden = true; return; }
    h.innerHTML = ''; var st = document.createElement('span'); st.textContent = '★ ' + level; var bar = document.createElement('i'), fill = document.createElement('b');
    fill.style.width = Math.round(Math.max(0, Math.min(1, frac)) * 100) + '%'; bar.appendChild(fill); h.appendChild(st); h.appendChild(bar); h.hidden = false;
  }
  // film mode (the epilogue): no player, no characters of the map, no buttons over the picture
  var film = false;
  function setFilm(on) { film = on; document.body.classList.toggle('film', on); }
  // the quest tracker: small icons, no words
  function setHud(items) {
    var h = document.getElementById('hud'); h.innerHTML = '';
    if (!items) { h.hidden = true; return; }
    items.forEach(function (it) { var s = document.createElement('span'); s.className = 'hudi ' + it.s; s.textContent = it.i; h.appendChild(s); });
    h.hidden = false;
  }

  // ---- cutscenes: things that happen on screen. fn(c) is an async script; c has wait, caption, say, walk, actor, move,
  // arc, tint, shake, flash, burst. Timings are scaled with ?pause= so tests run quickly.
  function ms(n) { return Math.max(16, n * TS); }
  function scene(fn, done) {
    sceneOn = true; held = []; sc.actors = {}; sc.parts = [];
    var P = function (t) { return new Promise(function (r) { setTimeout(r, ms(t)); }); };
    function tween(t, f) { return new Promise(function (res) { var t0 = performance.now(), d = ms(t); (function g() { var p = Math.min(1, (performance.now() - t0) / d); f(p); p < 1 ? requestAnimationFrame(g) : res(); })(); }); }
    var c = {
      wait: P,
      caption: function (id, t) { var tx = line(id); toast(tx, ms(t || 2000) + 200); if (tx) seen[clean(tx)] = true; return P(t || 2000); },
      say: function (ids) { return new Promise(function (r) { var tx = ids.map(function (i) { return typeof i === 'string' ? line(i) : i && i.raw; }).filter(Boolean); showMessages(tx, r); }); },
      walk: function (id, path, speed) { return new Promise(function (r) { walkEnt(id, path, speed, r); }); },
      actor: function (id, spr, x, y, o) { sc.actors[id] = Object.assign({ spr: spr, x: x, y: y, dir: 'down', size: 24, alpha: 1, lift: 0 }, o || {}); },
      set: function (id, o) { if (sc.actors[id]) Object.assign(sc.actors[id], o); },
      remove: function (id) { delete sc.actors[id]; },
      fade: function (id, to, t) { var a = sc.actors[id]; if (!a) return P(0); var a0 = a.alpha === undefined ? 1 : a.alpha; return tween(t, function (p) { a.alpha = a0 + (to - a0) * p; }); },
      move: function (id, x, y, t, lift) { var a = sc.actors[id], x0 = a.x, y0 = a.y; if (Math.abs(x - x0) + Math.abs(y - y0) > 0.05) a.dir = Math.abs(x - x0) > Math.abs(y - y0) ? (x > x0 ? 'right' : 'left') : (y > y0 ? 'down' : 'up'); return tween(t, function (p) { a.x = x0 + (x - x0) * p; a.y = y0 + (y - y0) * p - (lift || 0) * Math.sin(p * Math.PI); a.walk = p < 1; }); },
      path: async function (id, pts, t) { var a = sc.actors[id], tot = 0, cur = [a.x, a.y], i; pts.forEach(function (q) { tot += Math.abs(q[0] - cur[0]) + Math.abs(q[1] - cur[1]); cur = q; });
        for (i = 0; i < pts.length; i++) { var d = Math.abs(pts[i][0] - a.x) + Math.abs(pts[i][1] - a.y); await c.move(id, pts[i][0], pts[i][1], t * d / Math.max(0.01, tot)); } },
      face: function (d) { var v = DIRS[d]; dir = { x: v[0], y: v[1] }; },
      tint: function (id, color, a0, a1, t) { var e = map.ents.filter(function (q) { return q.id === id; })[0]; if (!e) return P(0); return tween(t, function (p) { e.tint = { c: color, a: a0 + (a1 - a0) * p }; }); },
      untint: function (id) { var e = map.ents.filter(function (q) { return q.id === id; })[0]; if (e) e.tint = null; },
      shake: function (t, amp) { sc.shakeUntil = performance.now() + ms(t); sc.shakeAmp = amp || 2; return P(t); },
      flash: function (color, t) { var t0 = performance.now(), d = ms(t || 400); sc.flash = { c: color, t0: t0, d: d }; return P(t || 400); },
      burst: function (x, y, ch, n, o) { o = o || {}; for (var i = 0; i < (n || 6); i++) sc.parts.push({ x: x + 0.5, y: y + 0.3, vx: (Math.random() - 0.5) * (o.spread || 2.2), vy: -(o.up || 1.2) - Math.random() * 1.2, t0: performance.now(), life: ms(o.life || 900), ch: ch, size: o.size || 12 }); return P(0); },
      pos: function (id) { var e = map.ents.filter(function (q) { return q.id === id; })[0]; return e ? [e.rx !== undefined ? e.rx : e.x, e.ry !== undefined ? e.ry : e.y] : [player.x, player.y]; },
      player: function () { return [player.x, player.y]; },
      ts: TS
    };
    fn(c).then(function () { sceneOn = false; sc.actors = {}; sc.parts = []; if (done) done(); }, function (e) { sceneOn = false; sc.actors = {}; sc.parts = []; console.error(e); if (done) done(); });
  }
  function drawScene(now) {
    Object.keys(sc.actors).forEach(function (id) {
      var a = sc.actors[id]; if (a.follow) { var f = sc.actors[a.follow.id]; if (!f) { delete sc.actors[id]; return; } a.x = f.x + a.follow.dx; a.y = f.y + a.follow.dy; }
      if (a.pulse) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now / 160 + a.pulse);
      if (a.spr === 'orb') { ctx.fillStyle = 'rgba(255,240,120,.35)'; ctx.beginPath(); ctx.arc(a.x * T + a.size / 2, a.y * T + a.size / 2, a.size * 0.9, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; ctx.drawImage(Art.sprite('orb', 'down', 0), 0, 0, 16, 16, a.x * T, a.y * T, a.size, a.size); return; }
      if (a.alpha !== undefined) ctx.globalAlpha = a.alpha * (a.pulse ? 1 : 1);
      Art.char(ctx, a.spr, a.x * T, a.y * T - a.lift, a.dir, a.walk ? 1 + (Math.floor(now / 110) % 2) : 0, now, 3, a.size, a.tint); ctx.globalAlpha = 1;
    });
    sc.parts = sc.parts.filter(function (q) { return now - q.t0 < q.life; });
    sc.parts.forEach(function (q) { var a = (now - q.t0) / q.life, tt = (now - q.t0) / 1000; ctx.globalAlpha = 1 - a * a; ctx.font = q.size + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(q.ch, (q.x + q.vx * tt * 0.6) * T, (q.y + q.vy * tt * 0.6 + 1.2 * tt * tt) * T); });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }

  // ---- screen wipe: bars close over the scene, `mid` runs while it is covered, then the bars open
  function ease(p) { return p * p * (3 - 2 * p); }
  function transition(mid, unlock) { msgOpen = true; held = []; trans = { t0: performance.now(), d1: 900, d2: 700, mid: mid, fired: false, unlock: unlock }; }
  function drawTrans(now) {
    if (!trans) return;
    var e = now - trans.t0, p, N = 10, h = LH / N;
    if (e < trans.d1) p = e / trans.d1;
    else {
      if (!trans.fired) { trans.fired = true; trans.mid(); }
      var e2 = e - trans.d1; if (e2 >= trans.d2) { if (trans.unlock) msgOpen = false; trans = null; return; }
      p = 1 - e2 / trans.d2;
    }
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * p) + ')'; ctx.fillRect(0, 0, LW, LH);
    ctx.fillStyle = '#000';
    for (var i = 0; i < N; i++) {
      var w = LW * ease(Math.max(0, Math.min(1, p * 1.5 - (i / N) * 0.5)));
      if (i % 2) ctx.fillRect(LW - w, i * h, w, h + 1); else ctx.fillRect(0, i * h, w, h + 1);
    }
  }

  // ---- input
  function bind() {
    var km = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    addEventListener('keydown', function (e) {
      if (locked() && !km[e.key]) return;
      if (km[e.key]) { e.preventDefault(); if (!locked() && !e.repeat) press(km[e.key]); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!locked()) act(); }
    });
    addEventListener('keyup', function (e) { if (km[e.key]) release(km[e.key]); });
    addEventListener('blur', function () { held = []; });
    document.querySelectorAll('#pad button').forEach(function (b) {
      var d = b.dataset.d;
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); if (d === 'act') act(); else if (!locked()) press(d); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { if (d !== 'act') release(d); }); });
    });
  }

  // ---- loop and drawing
  function loop(ts) {
    var dt = lastTs ? Math.min(ts - lastTs, 100) : 0;
    if (lastTs) Score.tick(ts - lastTs, (!msgOpen || Battle.active) && !Book.state().open && !trans);
    lastTs = ts;
    if (map && !Battle.active) {
      updateWalk(ts);
      if (!locked() && !trans) { updatePatrols(dt); checkSight(ts); } else if (sceneOn && !msgOpen) updatePatrols(dt);
    }
    if (Battle.active) Battle.draw(ctx); else if (map) draw(ts);
    drawTrans(performance.now());
    requestAnimationFrame(loop);
  }
  // which way a character faces: towards the player when close, otherwise down
  function facing(e) {
    var dx = player.x - e.x, dy = player.y - e.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) return 'down';
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  function draw(now) {
    ctx.clearRect(0, 0, LW, LH); ctx.save();
    if (now < sc.shakeUntil) ctx.translate(Math.round((Math.random() - 0.5) * 2 * sc.shakeAmp), Math.round((Math.random() - 0.5) * 2 * sc.shakeAmp));
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var ch = map.rows[y][x], nb = ch === 'T' ? (map.rows[y][x - 1] === 'T' ? 'l' : '') + (map.rows[y][x + 1] === 'T' ? 'r' : '') : '';
      ctx.drawImage(Art.tile(ch, mapId, now, (x * 7 + y * 3) % 4, nb), x * T, y * T, T, T);
    }
    map.exits.forEach(function (e) {
      ctx.drawImage(Art.tile('E', mapId, now), e.x * T, e.y * T, T, T);
      if (!Story.canExit(e.id)) { ctx.fillStyle = 'rgba(30,20,10,.6)'; ctx.fillRect(e.x * T, e.y * T, T, T); }
      else { ctx.fillStyle = 'rgba(255,255,200,' + (0.12 + 0.1 * Math.sin(now / 300)) + ')'; ctx.fillRect(e.x * T, e.y * T, T, T); }
    });
    (map.deco || []).forEach(function (d) { if (d.show()) Art.char(ctx, d.spr, d.x * T, d.y * T, 'down', 0, now, 0, d.size); });
    // where the guards can see, while it matters
    if (Story.watching()) map.ents.forEach(function (e) {
      if (!e.patrol || !e.show() || e.patrol.mode === 'once') return;
      ctx.fillStyle = 'rgba(255,225,90,.20)'; sightLine(e).forEach(function (c) { ctx.fillRect(c[0] * T, c[1] * T, T, T); });
    });
    // characters, back to front so lower ones overlap higher ones
    var p = mv ? Math.min(1, (now - mv.t0) / STEP_MS) : 1, fr = mv ? 1 + (Math.floor(now / 110) % 2) : 0;
    var prx = mv ? mv.fx + (player.x - mv.fx) * p : player.x, pry = mv ? mv.fy + (player.y - mv.fy) * p : player.y;
    var chars = (film ? [] : map.ents).filter(function (e) { return e.show(); }).map(function (e) {
      var ex = e.rx !== undefined ? e.rx : e.x, ey = e.ry !== undefined ? e.ry : e.y;
      return { y: ey, draw: function () { Art.char(ctx, Art.entSprite(e.id), ex * T, ey * T, e.patrol && e.face ? e.face : facing(e), e.walking ? 1 + (Math.floor(now / 130) % 2) : 0, now, e.x * 3 + e.y, 24, e.tint); } };
    });
    if (!film) chars.push({ y: pry, draw: function () { Art.char(ctx, Story.playerSprite(), prx * T, pry * T, dir.y < 0 ? 'up' : dir.y > 0 ? 'down' : dir.x < 0 ? 'left' : 'right', fr, now, 0); } });
    if (follower && !film) {                                      // the baby follows one step behind
      var a = trail[Math.max(0, trail.length - 3)], b = trail[Math.max(0, trail.length - 2)], fx = a.x + (b.x - a.x) * p, fy = a.y + (b.y - a.y) * p;
      chars.push({ y: fy - 0.01, draw: function () { Art.char(ctx, follower, fx * T, fy * T, 'down', 0, now, 5, 16); } });
    }
    chars.sort(function (a, b) { return a.y - b.y; }).forEach(function (c) { c.draw(); });
    drawScene(now);
    Art.light(ctx, mapId); ctx.restore();
    if (sc.flash) { var fa = 1 - (now - sc.flash.t0) / sc.flash.d; if (fa <= 0) sc.flash = null; else { ctx.globalAlpha = fa * 0.8; ctx.fillStyle = sc.flash.c; ctx.fillRect(0, 0, LW, LH); ctx.globalAlpha = 1; } }
  }

  function endBattle() {
    msgOpen = false;
    document.getElementById('msg').hidden = true; document.getElementById('choices').innerHTML = '';
  }
  function finish() { if (Finale.ready()) Finale.show(); }   // the game ends here until later chapters exist

  return {
    line: line, clean: clean, qline: qline, init: init, loadMap: loadMap, showMessages: showMessages,
    showChoice: showChoice, scene: scene, toast: toast, setHud: setHud, setLvl: setLvl, setFilm: setFilm, markSeen: function (t) { if (t) seen[clean(t)] = true; }, pauseButtons: pauseButtons, transition: transition, endBattle: endBattle,
    finish: finish, face: function (d) { var v = DIRS[d]; dir = { x: v[0], y: v[1] }; }, teleport: teleport, resetPatrols: resetPatrols, walkEnt: walkEnt, setFollower: function (n) { follower = n; },
    rawLatin: function (id) { return content[id].latin; },
    englishOf: function (id) { return content[id].english; },
    setBusy: function (b) { msgOpen = b; },
    state: function () { return { player: player, map: mapId, msgOpen: msgOpen, moving: !!mv, scene: sceneOn, flags: Story.flags, ch: Story.ch(), trans: !!trans }; }
  };
})();
