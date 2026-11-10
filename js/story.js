// The story script: prologue, chapters 1-5 and the epilogue. Decides who says what, what is recruited,
// and when scenes change. All text comes from content/latin.yaml through Game.line(); missing lines are skipped.
// Big moments are cutscenes (Game.scene): things you watch happen, with as few words as possible.
var Story = (function () {
  var S = { flags: {} }, ch = 0, F = S.flags;
  var OBJ_SEEN = {};

  function lines(ids) { return ids.map(function (i) { return typeof i === 'string' ? Game.line(i) : i && i.raw; }).filter(Boolean); }
  function say(ids, done) { Game.showMessages(lines(ids), done); }
  function fill(id, x) { var t = Game.line(id); return t ? { raw: t.replace('{x}', Game.clean(x)) } : null; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function shuffle(a) {
    a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a;
  }
  var ICON = { mel: '🍯', scutum: '🛡️', pallium: '🧥' };

  S.ch = function () { return ch; };
  S.playerSprite = function () { return ch <= 1 ? 'ops' : 'jupiter'; };   // Ops, then Jupiter
  S.watching = function () { return ch === 1 && F.baby === 'carried' && !!F.patrolOn; };   // guards only care while Ops carries the baby

  // Full-screen story cards: [textId, questionId|null] pairs, ['map', titleId], or 'fade' for a fade to black.
  async function panels(list, done) {
    var root = document.getElementById('story'); root.hidden = false; root.className = ''; Game.setBusy(true);
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e === 'fade') { root.classList.add('black'); root.innerHTML = ''; await wait(1300); root.classList.remove('black'); continue; }
      if (e[0] === 'map') { await mapPanel(root, e[1], e[2]); continue; }
      if (e[0] === 'ask') { await new Promise(function (res) { Quiz.run(root, e[1], e[2], e[1], res, 'story', true); }); continue; }
      if (!Game.line(e[0])) continue;
      var q = e[1] && Game.qline(e[1]) ? e[1] : null;
      await new Promise(function (res) { Quiz.run(root, e[0], q, e[0], res, 'story'); });
    }
    root.hidden = true; Game.setBusy(false); if (done) done();
  }
  // A map of the Mediterranean that picks out Crete, under the chapter title
  function mapPanel(root, titleId, ship) {
    return new Promise(function (res) {
      root.innerHTML = '';
      var cv = document.createElement('canvas'); cv.width = 480; cv.height = 320; cv.className = 'mapart'; root.appendChild(cv);
      var h = document.createElement('div'); h.className = 'page maptitle'; h.textContent = Game.clean(Game.line(titleId) || ''); root.appendChild(h);
      var btn = document.createElement('button'); root.appendChild(btn);
      var cx = cv.getContext('2d'); cx.scale(2, 2);
      var L = function (id) { return Game.clean(Game.line(id) || ''); };
      var labels = [{ text: L('map_italia'), x: 43, y: 31 }, { text: L('map_graecia'), x: 63, y: 21 }, { text: L('map_asia'), x: 100, y: 23 }, { text: L('map_africa'), x: 56, y: 72 }, { text: L('map_crete'), x: 74, y: 52 }];
      if (ship) labels = [{ text: L('map_latium'), x: 38, y: 34 }, { text: L('map_graecia'), x: 63, y: 22 }, { text: L('map_italia'), x: 40, y: 20 }, { text: L('map_africa'), x: 56, y: 72 }];
      var t0 = performance.now(), stop = false;
      (function lp() { if (stop) return; Art.med(cx, performance.now() - t0, labels, ship); requestAnimationFrame(lp); })();
      Game.pauseButtons([btn], [L('ui_continue')], L(titleId));
      btn.onclick = function () { stop = true; res(); };
    });
  }

  // ---- beginning, and chapter select for testing (?ch=N)
  S.begin = function (n) {
    Prog.setLevel(n >= 6 ? 7 : n === 5 ? 5 : n === 4 ? 3 : n === 3 ? 2 : 1);
    if (n >= 6) { setupAllies(); setupCh3(); setupCh4(); setupCh5(); return epilogue(); }
    if (n === 5) { setupAllies(); setupCh3(); setupCh4(); return startCh5(true); }
    if (n === 4) { setupAllies(); setupCh3(); return startCh4(true); }
    if (n === 3) { setupAllies(); return startCh3(true); }
    if (n === 2) return startCh2(true);
    if (n === 1) return startCh1(true);
    panels([['pro_1'], ['pro_2'], ['pro_3'], ['pro_4', 'pro_4_q'], ['pro_5'], 'fade', ['pro_6', 'pro_6_q']], function () { startCh1(); });
  };
  function setupAllies() {
    ['amalthea', 'curetes'].forEach(function (a) { Book.recruit(a, true); });
    F.nubes = F.guard1 = F.wolf = F.herb = F.amalthea = F.curetes = F.amalDone = F.curDone = true;
  }
  function setupCh3() {
    Book.recruit('metis', true); ['neptunus', 'pluto', 'iuno', 'ceres', 'vesta'].forEach(function (k) { Book.recruit(k, true); });
    F.metis = F.cupDone = F.guardH = true; Book.unlock('saxum');
  }
  function setupCh4() {
    ['cyclopes', 'centimani'].forEach(function (k) { Book.recruit(k, true); });
    F.campe = F.cyclopes = F.centimani = F.fulmen = F.weapons = true; openGates();
  }
  function setupCh5() { F.styx = F.hyperion = F.prom = F.them = F.iapetus = F.atlas = true; ['styx', 'victoria', 'prometheus', 'themis'].forEach(function (k) { Book.recruit(k, true); }); }
  function refreshLvl() { Game.setLvl(ch >= 2 && ch <= 5 ? Prog.level : 0, Prog.frac()); }
  function unlockCh1Pages() { ['iuppiter', 'ops', 'saturnus'].forEach(Book.unlock); }

  // ============ Chapter 1: Saturn's hall ============
  function hud() {
    if (ch !== 1 || F.ch1Done || F.intro) return Game.setHud(null);
    Game.setHud([{ i: '👶', s: F.baby === 'hidden' ? 'done' : F.baby === 'carried' ? 'on' : 'off' }, { i: '🪨', s: F.stone ? 'on' : 'off' },
                 { i: ICON[F.item] || '🎒', s: F.item ? 'on' : 'off' }]);
  }
  function startCh1(direct) {
    ch = 1; F.baby = direct ? 'cradle' : 'none'; F.stone = false; F.item = null; F.famula = null; F.caught = 0; F.patrolOn = true; F.saturnIn = false; F.ch1Done = false; F.intro = !direct; F.patrolOn = direct;
    Game.loadMap('hall'); hud();
    if (direct) return Game.toast(Game.line('ch1_start'));
    panels([['ch1_title']], introScene);
  }
  // The opening: Saturn takes each newborn from Ops and swallows it (a cartoon gulp: the child lights up inside him). Then Jupiter is born.
  function introScene() {
    Game.scene(async function (c) {
      c.actor('sat', 'saturn', 10, 3, { dir: 'down', size: 32 }); c.face('right');
      var slots = [[0.17, 0.5], [0.5, 0.5], [0.17, 0.72], [0.5, 0.72], [0.33, 0.61]];
      await c.flash('#ffffff', 350); await c.shake(500, 2); await c.wait(500);
      for (var i = 0; i < 5; i++) {
        var f = [1, 1, 0.85, 0.72, 0.62][i];
        c.actor('b' + i, 'baby', 3, 5, { size: 16 }); await c.burst(3, 4.3, '✨', 5);
        await c.wait(500 * f);
        await c.path('sat', [[10, 6], [7, 6], [5.2, 6], [4.1, 5]], 1500 * f);
        c.set('sat', { dir: 'left' }); await c.wait(220 * f);
        await c.move('b' + i, 4.2, 4.7, 330 * f, 0.5); c.remove('b' + i);
        await c.burst(4.2, 4.4, '💨', 7);
        if (i === 0) c.caption('ch1_open_1', 2000);
        c.set('sat', { tint: { c: '#66dd66', a: 0.55 } }); await c.shake(380, 3); c.set('sat', { tint: null });
        c.actor('orb' + i, 'orb', 0, 0, { size: 10, follow: { id: 'sat', dx: 0.5 + (slots[i][0] - 0.5) * 1.33, dy: 0.1 + (slots[i][1]) * 1.2 }, pulse: i + 1 });
        await c.path('sat', [[5.2, 6], [7, 6], [10, 5], [10, 3]], 1400 * f); c.set('sat', { dir: 'down' }); await c.wait(300 * f);
      }
      c.caption('ch1_open_2', 2400); await c.wait(2700);
      F.baby = 'cradle'; hud(); await c.burst(2, 1.6, '✨', 8); c.caption('ch1_open_3', 2000); await c.wait(2000);   // Jupiter is born
      await c.shake(500, 3); await c.path('sat', [[10, 6], [10, 11.8]], 1800); c.remove('sat');
      c.caption('ch1_start', 2000); await c.wait(300);
    }, function () { F.intro = false; F.patrolOn = true; Game.resetPatrols(); hud(); });
  }

  // inspecting objects: a short caption that does not stop the game; glōria once per object
  S.inspect = function (id) {
    if (ch === 1 && id === 'obj_cradle') return cradle();
    if (id === 'obj_saxa') return takeStone();
    if (id === 'obj_mel' || id === 'obj_scutum' || id === 'obj_pallium') return keepsake(id);
    if (!Game.line(id)) return;
    if (!OBJ_SEEN[id]) { OBJ_SEEN[id] = true; Score.add('objects', Score.CFG.object); }
    if (id === 'obj_herba' && !F.herb) F.herb = true;
    Game.toast(Game.line(id));
  };
  function cradle() {
    if (F.baby === 'cradle') { F.baby = 'carried'; Game.setFollower('baby'); hud(); Game.toast(Game.line('baby_take')); }
    else Game.toast(Game.line(F.baby === 'carried' ? 'cradle_have' : 'cradle_empty'));
  }
  function takeStone() {
    if (F.stone) return Game.toast(Game.line('stone_have'));
    F.stone = true; hud(); Game.toast(Game.line('stone_take')); checkSaturn();
  }
  // one keepsake for Jupiter: it changes battles later (honey: Amalthea heals more; shield: more clouds; cloak: more hit points)
  function keepsake(id) {
    var key = { obj_mel: 'mel', obj_scutum: 'scutum', obj_pallium: 'pallium' }[id];
    if (F.item) return Game.toast(Game.line('item_full'));
    Game.showChoice(Game.line(id), [{ label: ICON[key] + ' ' + Game.line('opt_tolle'), fn: function () { F.item = key; hud(); Game.toast(Game.line('item_' + key)); Score.add('choice', 50); } },
                                   { label: Game.line('opt_relinque'), fn: function () {} }], true);
  }
  // the servant offers to carry the baby: safe now, but Saturn's guards will know
  function famula() {
    if (ch !== 1 || F.famulaGone) return;
    if (F.baby === 'carried' && !F.famula) {
      say(['fam_offer'], function () {
        Game.showChoice(Game.line('fam_choice'), shuffle([{ label: Game.line('opt_famulae'), fn: trustFamula }, { label: Game.line('opt_neminī'), fn: function () { F.famula = 'alone'; Game.toast(Game.line('fam_no')); } }]));
      });
    } else Game.toast(Game.line('fam_idle'));
  }
  function trustFamula() {
    F.famula = 'trust'; F.famulaGone = true; F.baby = 'hidden'; F.patrolOn = false; Game.setFollower(null); hud();
    Game.scene(async function (c) {
      var p = c.player(); c.actor('fam', 'servant', 8, 10, { dir: 'up' }); c.actor('baby', 'baby', p[0], p[1], { size: 16 });
      await c.move('baby', 8.2, 10, 500, 0.6); c.set('baby', { follow: { id: 'fam', dx: 0.3, dy: 0.2 } }); c.caption('fam_take', 1800);
      await c.path('fam', [[8, 7], [14, 7], [18, 9.6], [18.6, 10]], 3600);
      await terraTakes(c, 'fam');
    }, checkSaturn);
  }
  // Terra, waiting at the garden door, takes the baby
  async function terraTakes(c, carrier) {
    c.actor('terra', 'terra', 19, 9, { dir: 'left' }); await c.burst(19, 8.6, '🌿', 6); await c.wait(300); c.caption('baby_out', 2000);
    await c.move('baby', 19.1, 9.4, 450, 0.5); c.remove('baby'); if (carrier) c.remove(carrier);
    await c.burst(19, 8.8, '✨', 8); await c.wait(900); c.remove('terra');
  }
  // seen by a guard while carrying the baby: the baby goes back to the cradle and Ops is sent back too
  S.caught = function (e) {
    if (F.baby !== 'carried') return;
    F.caught = (F.caught || 0) + 1; F.baby = 'cradle'; Game.setFollower(null); hud();
    Game.scene(async function (c) {
      var p = c.player(); await c.burst(e.x, e.y - 0.4, '❗', 1, { size: 20 }); await c.shake(350, 3); c.caption('caught_1', 1400);
      c.actor('baby', 'baby', p[0], p[1], { size: 16 }); await c.move('baby', 2.1, 2.4, 800, 1.4); c.remove('baby'); c.caption('caught_2', 1600); await c.wait(1500);
      Game.teleport(3, 5); Game.resetPatrols();
    });
  };
  // the baby is out and the stone is in hand: Saturn comes
  function checkSaturn() {
    if (ch !== 1 || F.baby !== 'hidden' || !F.stone || F.saturnIn || F.ch1Done) return;
    F.saturnIn = true; F.saturnReady = false;
    Game.scene(async function (c) {
      await c.flash('#ffffff', 300); await c.shake(500, 3); c.caption('ch1_saturn_comes', 2200);
      await c.walk('saturn_in', [[10, 11], [10, 8]], 2.3); F.saturnReady = true;
    });
  }
  // Ops gives Saturn the stone. He swallows it. The baby is safe.
  function giveStone() {
    if (!F.saturnReady) return; F.saturnReady = false;
    Game.scene(async function (c) {
      var s = c.pos('saturn_in'), p = c.player();
      c.caption('ch1_right_1', 1500); c.actor('stone', 'stone', p[0], p[1], { size: 16 }); await c.move('stone', s[0] + 0.1, s[1] - 0.1, 500, 0.8); c.remove('stone');
      await c.burst(s[0], s[1] - 0.2, '💨', 7); await Promise.all([c.shake(450, 3), c.tint('saturn_in', '#66dd66', 0, 0.55, 200)]);
      c.caption('ch1_right_2', 1600); await c.tint('saturn_in', '#66dd66', 0.55, 0, 600); await c.wait(900);
      await c.walk('saturn_in', [[10, 8], [10, 11]], 2.3); c.caption('ch1_right_3', 1800); await c.wait(1800);
    }, function () {
      Score.add('choice', F.caught ? Score.CFG.choiceRetry : Score.CFG.choice);
      F.suspect = F.famula === 'trust' || F.caught > 0; F.saturnIn = false; F.ch1Done = true; hud(); startCh2();
    });
  }

  // ============ later chapters ============
  function startCh2(direct) {
    ch = 2; unlockCh1Pages();
    var go = function () { Game.loadMap('ida'); refreshLvl(); if (F.suspect) Game.toast(Game.line('ch2_extra'), 3200); };
    if (direct) go(); else panels([['ch1_end'], ['map', 'ch2_title']], go);
  }
  function startCh3(direct) {
    ch = 3; unlockCh1Pages();
    var go = function () { Game.loadMap('oceanus'); refreshLvl(); };
    if (direct) go(); else panels([['ch3_title'], ['ch3_intro']], go);
  }
  function startCh4(direct) {
    ch = 4; unlockCh1Pages();
    var go = function () { Game.loadMap('tartarus'); refreshLvl(); };
    if (direct) go(); else panels([['ch4_title'], ['ch4_intro']], go);
  }
  function startCh5(direct) {
    ch = 5; unlockCh1Pages();
    var go = function () { Game.loadMap('olympus'); refreshLvl(); };
    if (direct) go(); else panels([['ch5_title'], ['ch5_intro']], go);
  }
  // Epilogue: a short film. Every beat is a scene you watch (a line or two of text), with a question after some of them.
  function stage(mapId) {                                         // wipe to another place and wait until the wipe is over
    return new Promise(function (res) {
      Game.transition(function () { Game.loadMap(mapId); Game.setFilm(true); }, true);
      (function poll() { if (Game.state().trans) setTimeout(poll, 60); else res(); })();
    });
  }
  function film(fn) { return new Promise(function (res) { Game.scene(fn, res); }); }
  function cards(list) { return new Promise(function (res) { panels(list, res); }); }
  async function epilogue() {
    ch = 6; Book.unlock('saturnus'); Game.setHud(null); Game.setLvl(0);
    // Saturn falls to Jupiter's thunderbolt
    await stage('othrys');
    await film(async function (c) {
      c.actor('jup', 'jupiter', 10, 7, { dir: 'up' }); c.actor('sat', 'saturn', 10, 4, { dir: 'down', size: 32 });
      await c.wait(600); c.caption('war_1', 1700);
      await c.flash('#ffffff', 300); await c.shake(700, 4); await c.burst(10, 3.6, '⚡', 8);
      c.set('sat', { tint: { c: '#ffffff', a: 0.7 } }); await c.wait(300); c.set('sat', { tint: null }); c.caption('war_2', 1900);
      await Promise.all([c.move('sat', 10, 4.7, 900, 0), c.fade('sat', 0, 900)]); await c.wait(800);
    });
    // the Titans, in chains, go down to Tartarus; the Hundred-Handers stand guard
    await stage('tartarus');
    await film(async function (c) {
      c.caption('aft_1', 2600); c.actor('g1', 'centimanus', 6, 8, { dir: 'right' }); c.actor('g2', 'centimanus', 13, 8, { dir: 'left' });
      var titans = ['hyperion', 'iapetus', 'atlas', 'saturn'];
      for (var i = 0; i < titans.length; i++) {
        var id = 't' + i; c.actor(id, titans[i], 9.5, 11.6, { dir: 'up', size: titans[i] === 'saturn' ? 30 : 24 });
        await c.path(id, [[9.5, 8], [9.5, 4.5]], 1300); await c.burst(9.5, 4.2, '⛓️', 3);
        await Promise.all([c.fade(id, 0, 450), c.move(id, 9.5, 5.4, 450, 0)]); await c.burst(9.5, 4.8, '💨', 4); c.remove(id);
      }
      await c.wait(500);
    });
    // Atlas takes up the sky
    await film(async function (c) {
      c.actor('atl', 'atlas', 9.5, 8, { dir: 'down', size: 32 }); c.actor('sky', 'sky', 9.5, 0.2, { size: 48 });
      c.caption('aft_2', 2400); await c.wait(500); await c.move('sky', 9.5, 7.0, 1700, 0);
      await c.shake(600, 2); await c.burst(9.5, 6.2, '✨', 7); c.set('atl', { tint: { c: '#000000', a: 0.18 } }); await c.wait(900);
    });
    await cards([['ask', 'aft_2', 'lib_atlas_q']]);
    await cards([['ch6_title']]);
    // the three brothers draw lots for the sky, the sea and the underworld
    await stage('olympus');
    await film(async function (c) {
      c.actor('urn', 'urn', 9.6, 6.1, { size: 22 }); c.actor('j', 'jupiter', 6.5, 6, { dir: 'right' }); c.actor('n', 'neptunus', 12.8, 6, { dir: 'left' }); c.actor('p', 'pluto', 9.6, 8.4, { dir: 'up' });
      c.caption('epi_1', 3200); await c.wait(900);
      await c.burst(6.5, 5.4, '☁️', 4); await c.wait(700); await c.burst(12.8, 5.4, '🌊', 4); await c.wait(700); await c.burst(9.6, 7.8, '💀', 4); await c.wait(700);
      await c.flash('#ffe94d', 400); await c.wait(500);
    });
    await cards([['ask', 'epi_1', 'epi_1_q']]);
    // Saturn sails to Latium and hides there
    await cards([['map', 'epi_2', { path: [[63, 40], [56, 51], [46, 52], [40, 43], [40, 33]], ms: 4200 }]]);
    await cards([['ask', 'epi_2', 'epi_2_q']]);
    // he teaches the farmers: a golden age
    await stage('ida');
    await film(async function (c) {
      c.actor('sat', 'saturn', 10, 6, { dir: 'down', size: 30 });
      [[6, 5], [14, 5], [6, 8], [14, 8]].forEach(function (f, i) { c.actor('f' + i, 'servant', f[0], f[1], { dir: 'left' }); });
      c.caption('epi_3', 3000); await c.wait(500);
      for (var i = 0; i < 4; i++) { await c.burst([6, 14, 6, 14][i], [5, 5, 8, 8][i] + 1, '🌾', 4); await c.wait(500); }
      await c.flash('#ffd24a', 700); await c.burst(10, 5, '✨', 10); await c.wait(900);
    });
    // in Rome: the treasury in the temple of Saturn, and the Saturnalia
    await stage('olympus');
    await film(async function (c) {
      c.caption('epi_4', 3200); [[5, 7], [8, 8], [11, 8], [14, 7]].forEach(function (f, i) { c.actor('d' + i, 'servant', f[0], f[1], { dir: 'down' }); });
      for (var k = 0; k < 4; k++) {
        await Promise.all([c.burst(7 + k * 2, 3, '🪙', 3), c.burst(5 + k * 3, 7, '🎉', 2)]);
        for (var j = 0; j < 4; j++) c.set('d' + j, { lift: (k + j) % 2 ? 4 : 0 });
        await c.wait(650);
      }
    });
    // Juno looks across the sea: there Carthage will be
    await stage('oceanus');
    await film(async function (c) {
      c.actor('juno', 'iuno', 9.5, 6, { dir: 'up' }); c.actor('city', 'city', 9.5, 1.7, { size: 48, alpha: 0 });
      await c.wait(700); c.caption('epi_5', 3400); await c.wait(1200); await c.fade('city', 1, 1500); await c.wait(1000);
    });
    Game.setFilm(false);
    await cards(['fade']);
    Game.finish();
  }

  // ---- exits (a blocked exit shows a short hint)
  S.canExit = function (id) {
    if (id === 'garden') return F.baby === 'carried';
    if (id === 'ida_east') return !!(F.amalthea && F.curetes && F.guard1 && F.wolf && (!F.suspect || F.guard3));
    if (id === 'ocean_south') return !!F.metis;
    if (id === 'hall2_exit') return !!(F.cupDone && F.guardH);
    if (id === 'tart_exit') return !!(F.campe && F.cyclopes && F.centimani);
    if (id === 'olympus_east') return !!F.styx;
    return true;
  };
  S.exitBlocked = function (id) {
    Game.toast(Game.line({ garden: 'gate_garden', ida_east: 'gate_ch2', ocean_south: 'gate_ch3a', hall2_exit: F.cupDone ? 'gate_ch3c' : 'gate_ch3b',
                           tart_exit: 'gate_ch4', olympus_east: 'gate_ch5a' }[id]), 3000);
  };
  S.exit = function (id) {
    if (id === 'garden') {
      F.baby = 'hidden'; F.patrolOn = false; Game.setFollower(null); hud();
      Game.scene(async function (c) { var p = c.player(); c.actor('baby', 'baby', p[0] - 0.4, p[1], { size: 16 }); await terraTakes(c, null); }, checkSaturn);
    } else if (id === 'ida_east') startCh3();
    else if (id === 'ocean_south') { ch = 3; F.cupDone = false; Game.transition(function () { Game.loadMap('hall2'); }, true); }
    else if (id === 'hall2_exit') startCh4();
    else if (id === 'tart_exit') startCh5();
    else if (id === 'olympus_east') Game.transition(function () { Game.loadMap('othrys'); }, true);
  };

  // ---- talking
  S.talk = function (id) {
    if (id === 'famula') return famula();
    if (id === 'saturn_in') return giveStone();
    if (id === 'amalthea') return amalthea();
    if (id.indexOf('curetes') === 0) return curetes();
    if (id === 'guard1') return fight(id, ['guard_1', 'guard_2'], { enemy: 'guard' });
    if (id === 'wolf') return fight('wolf', ['wolf_1'], { enemy: 'lupus' });
    if (id === 'guard3') return fight('guard3', ['ch2_extra', 'guard_1'], { enemy: 'guard' });
    if (id === 'metis') return metis();
    if (id === 'saturn') return cup();
    if (id === 'campe') return fight('campe', ['campe_1', 'campe_2'], { enemy: 'campe' }, function () {
      Book.unlock('campe');
      Game.scene(async function (c) {                       // the cells burst open
        await c.flash('#ffffff', 350); await c.shake(600, 3);
        [[3, 6], [3, 7], [3, 8], [16, 6], [16, 7], [16, 8]].forEach(function (g) { c.burst(g[0], g[1], '✨', 4); }); openGates(); c.caption('campe_down', 1600); await c.wait(1700);
      });
    });
    if (id.indexOf('cyclops') === 0) return cyclopes();
    if (id.indexOf('cent') === 0) return centimani();
    if (id === 'styx' || id === 'victoria') return styx();
    if (id === 'hyperion') return fight('hyperion', ['hyp_1'], { enemy: 'hyperion' }, function () { Book.unlock('hyperion'); say(['prom_arr']); });
    if (id === 'prometheus') return titan('prom', 'prometheus', 'prom_1');
    if (id === 'themis') return titan('them', 'themis', 'them_1');
    if (id === 'iapetus') return fight('iapetus', ['iap_1'], { enemy: 'iapetus' }, function () { Book.unlock('iapetus'); });
    if (id === 'atlas') return fight('atlas', ['atl_1'], { enemy: 'atlas' }, function () { Book.unlock('atlas'); });
    if (id === 'saturn_boss') return fight('saturnBoss', ['sat_1'], { enemy: 'saturnus', final: true }, epilogue);
  };

  // A choice with one right answer (the buttons come in random order). Wrong answers have a small story
  // consequence and the choice repeats.
  // imgs (optional): { prompt: icon name, right: portrait name, wrong: portrait name } puts little pictures on the question and the buttons
  function choice(promptId, rightId, wrongId, wrongText, onRight, imgs) {
    var missed = false;
    (function ask() {
      Game.showChoice(Game.line(promptId), shuffle([
        { label: Game.line(rightId), img: imgs && Art.portrait(imgs.right, 56), fn: function () { Score.add('choice', missed ? Score.CFG.choiceRetry : Score.CFG.choice); onRight(); } },
        { label: Game.line(wrongId), img: imgs && Art.portrait(imgs.wrong, 56), fn: function () { missed = true; say(wrongText, ask); } }
      ]), false, imgs && Art.icon(imgs.prompt, 72));
    })();
  }

  // Chapter 2: the keepsake from Chapter 1 can shortcut an ally; a servant or a guard's sighting adds a guard
  function amalthea() {
    if (F.amalDone) return say(['amal_done']);
    if (F.item === 'mel') { F.amalthea = F.amalDone = true; Book.recruit('amalthea'); return say(['amal_mel', 'amal_join'], checkReady); }
    if (!F.herb) return say(['amal_hungry']);
    choice('amal_choice', 'opt_herba', 'ch1_choice_stone', ['amal_wrong'], function () {
      F.amalthea = F.amalDone = true; Book.recruit('amalthea');
      say(['amal_ate', 'amal_join'], checkReady);
    });
  }
  function curetes() {
    if (F.curDone) return say(['cur_done']);
    if (F.item === 'scutum') { F.curetes = F.curDone = F.nubes = true; Book.recruit('curetes'); return say(['cur_scutum', 'learn_nubes'], checkReady); }
    say(['cur_warn'], function () {
      choice('cur_choice', 'cur_opt_shields', 'cur_opt_sleep', ['cur_wrong'], function () {
        F.curetes = F.curDone = F.nubes = true; Book.recruit('curetes');
        say(['cur_ok', 'learn_nubes'], checkReady);
      });
    });
  }
  function checkReady() {
    if (ch === 2 && S.canExit('ida_east') && !F.readyShown) { F.readyShown = true; say(['ch2_ready']); }
    if (ch === 4 && S.canExit('tart_exit') && !F.ready4) { F.ready4 = true; say(['ch2_ready']); }
    if (ch === 5 && F.prom && F.them && !F.ready5) { F.ready5 = true; say(['ch2_ready']); }
  }

  // Chapter 3: Metis, then the cup. Jupiter gives it to Saturn, who drinks, turns green and brings it all up.
  function metis() {
    if (F.metis) return say(['metis_2']);
    say(['metis_1', 'metis_2'], function () { F.metis = true; Book.recruit('metis'); });
  }
  function cup() {
    say(['cup_2'], function () {
      choice('cup_choice', 'opt_saturno', 'opt_custodi', ['cup_wrong'], function () {
        Game.scene(cupScene, function () { fight('guardH', [], { enemy: 'dux' }, guardsFlee); });   // the first battle of the war: the guards Saturn sent in
      });
    });
  }
  async function cupScene(c) {
    var s = c.pos('saturn'), p = c.player(), order = ['neptunus', 'pluto', 'iuno', 'ceres', 'vesta'], i;
    c.caption('cup_right', 1500); c.actor('cup', 'cup', p[0], p[1], { size: 16 }); await c.move('cup', s[0] + 0.1, s[1] + 0.3, 500, 0.7);
    await c.wait(600); c.remove('cup'); await c.burst(s[0], s[1], '💧', 5); c.caption('cup_drink', 1800);
    await c.tint('saturn', '#55dd55', 0, 0.6, 1000); await c.shake(900, 2); await c.burst(s[0], s[1] - 0.3, '🤢', 3);
    c.actor('stone', 'stone', s[0], s[1] + 0.4, { size: 16 }); await c.move('stone', 13, 6, 800, 2.4);       // the stone comes up first
    c.remove('stone'); F.stoneOut = true; Book.unlock('saxum'); await c.burst(13, 6, '✨', 6); c.caption('out_saxum', 1500); await c.wait(1200);
    for (i = 0; i < order.length; i++) {                                                                      // then the five, in reverse order
      var k = order[i], x = 4 + 3 * i;
      await Promise.all([c.shake(300, 2), c.burst(s[0], s[1] + 0.3, '💦', 5)]);
      c.actor(k, k, s[0], s[1] + 0.4, { size: 24 }); await c.move(k, x, 7, 650, 1.4); await c.burst(x, 7, '✨', 5);
      c.caption('out_' + k, 1400); Book.recruit(k); await c.wait(900);
    }
    c.tint('saturn', '#ff3030', 0.2, 0.55, 300); await c.flash('#ff0000', 350); await c.shake(800, 3); c.caption('cup_end', 1700); await c.wait(1800);
    order.forEach(function (k) { c.remove(k); });                                                               // the five join Jupiter
    c.caption('cup_order', 1700); F.cupWar = true;                                                              // Saturn orders the guards in and retreats
    await Promise.all([c.walk('saturn', [[10, 3], [17, 2]], 3), c.walk('gH1', [[9, 11], [8, 7]], 3.4), c.walk('gH2', [[10, 11], [10, 8]], 3.4), c.walk('gH3', [[11, 11], [12, 7]], 3.4)]);
    c.untint('saturn'); F.cupDone = true; await c.wait(300);
  }
  // after the battle the guards run for the doors
  function guardsFlee() {
    Game.scene(async function (c) {
      c.caption('cup_flee', 1700);
      await Promise.all([c.walk('gH1', [[8, 7], [9, 11]], 3.6), c.walk('gH2', [[10, 8], [10, 11]], 3.6), c.walk('gH3', [[12, 7], [11, 11]], 3.6)]);
      F.guardsGone = true; await c.wait(400);
    });
  }

  // Chapter 4: Campe's cells. Gates open when Campe falls.
  function openGates() {
    var rows = MAPS.tartarus.rows;
    for (var y = 0; y < rows.length; y++) rows[y] = rows[y].replace(/G/g, 'd');
  }
  // The Cyclopes' gifts: three datives. Each right answer is a gift; the sentence is the key line of the chapter.
  function cyclopes() {
    if (F.cyclopes) return say(['cyc_done']);
    if (F.campe !== true) return;
    say(['cyc_free'], function () {
      choice('q_fulmen', 'opt_iovi', 'opt_plutoni', ['cyc_wrong'], function () {
        say(['cyc_gift1'], function () {
          choice('q_tridens', 'opt_neptuno', 'opt_iovi', ['cyc_wrong'], function () {
            say(['cyc_gift2'], function () {
              choice('q_galea', 'opt_plutoni', 'opt_neptuno', ['cyc_wrong'], function () {
                F.cyclopes = F.fulmen = F.weapons = true; Book.recruit('cyclopes'); Book.unlock('cyclopes');
                say(['cyc_gift3', 'cyc_join', 'learn_fulmen'], checkReady);
              }, { prompt: 'helmet', right: 'pluto', wrong: 'neptunus' });
            });
          }, { prompt: 'trident', right: 'neptunus', wrong: 'jupiter' });
        });
      }, { prompt: 'bolt', right: 'jupiter', wrong: 'pluto' });
    });
  }
  function centimani() {
    if (F.centimani) return say(['cent_done']);
    if (F.campe !== true) return;
    say(['cent_1', 'cent_2'], function () { F.centimani = true; Book.recruit('centimani'); checkReady(); });
  }

  // Chapter 5
  function styx() {
    if (F.styx) return say(['styx_done']);
    say(['styx_1', 'styx_2'], function () { F.styx = true; Book.recruit('styx'); Book.recruit('victoria'); });
  }
  function titan(flag, book, lineId) {                       // two Titans switch sides
    if (F[flag]) return say([lineId]);
    say([lineId], function () { F[flag] = true; Book.recruit(book); checkReady(); });
  }

  // ---- battles: the speaker says why we fight, the screen wipes, then the battle
  var held = [];                                              // siblings an enemy has seized, freed when the battle is won
  var ALIAS = { guardH: 'gH2', saturnBoss: 'saturn_boss' };
  function fight(entId, pre, opts, after) {
    function run() { Game.transition(function () { Battle.start(opts, result); }); }
    function result(res, hpLeft, hpMax) {
      if (res === 'won') { F[entId] = true; reward(opts.enemy, function () { freeHeld(function () { if (after) after(); else checkReady(); }); }); }
      else if (res === 'lost') { opts.max = hpMax; opts.hp = Math.max(1, hpLeft); lose(run, entId); }   // the enemy stays hurt for the next try
    }
    say(pre, run);
  }
  // XP, and a choice of boon at every level
  function reward(key, done) {
    var xp = Battle.xpOf(key), ups = Prog.gain(xp);
    Game.toast('★ +' + xp, 1800); refreshLvl();
    (function next(i) {
      if (i >= ups.length) return done();
      Game.scene(async function (c) { var p = c.player(); await c.flash('#ffe94d', 350); await c.burst(p[0], p[1] - 0.3, '⭐', 9); c.caption('lvl_up', 1500); await c.wait(1300); },
                 function () { boonChoice(function () { refreshLvl(); next(i + 1); }); });
    })(0);
  }
  function boonChoice(done) {
    var opts = [['vita', '❤️'], ['vis', '💪'], ['fortuna', '🍀'], ['copia', '🎒']].map(function (b) {
      return { label: b[1] + ' ' + Game.line('opt_' + b[0]), fn: function () { Prog.boons[b[0]]++; done(); } };
    });
    Game.showChoice(Game.line('lvl_choice'), opts, true);
  }
  function enemyPos(c, entId) { return c.pos(ALIAS[entId] || entId); }   // where the enemy stands (the player's place if it is not on the map)
  // Losing changes the story: before chapter 3 the guards find the cave; after, the enemy seizes your latest sibling (you see it)
  // and the battle starts again without them. Win, and they are freed.
  function lose(again, entId) {
    var sib = ch >= 3 ? Book.lastSibling() : null;
    if (!sib) return Game.scene(async function (c) { c.caption('lose_ch2_1', 1800); await c.wait(1900); c.caption('lose_ch2_2', 1800); await c.wait(1900); }, again);
    Book.hold(sib); held.push(sib);
    Game.scene(async function (c) {
      var p = c.player(), at = enemyPos(c, entId);
      c.actor('sib', sib, p[0], p[1], { size: 24 }); await c.move('sib', at[0], at[1], 600, 1); c.remove('sib');
      await c.burst(at[0], at[1] - 0.3, '🔗', 5); await c.shake(300, 2);
      var t = fill('lose_seize', Game.line('acc_' + sib)); if (t) { Game.toast(t.raw, 2000); } await c.wait(1900);
    }, again);
  }
  function freeHeld(done) {
    if (!held.length) return done();
    var list = held.slice(); held = [];
    Game.scene(async function (c) {
      for (var i = 0; i < list.length; i++) {
        var sib = list[i], p = c.player();
        c.actor('sib', sib, p[0] + 1 + i, p[1] - 1, { size: 24 }); await c.burst(p[0] + 1 + i, p[1] - 1, '✨', 6); Book.release(sib);
        var t = fill('freed', Book.nameNom(sib)); if (t) Game.toast(t.raw, 1500); await c.wait(1400); c.remove('sib');
      }
    }, done);
  }
  S.lose = lose; S.startCh1 = startCh1; S.reward = reward;   // also used by the tests
  return S;
})();
