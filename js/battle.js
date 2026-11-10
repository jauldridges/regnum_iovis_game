// Side-view battle with a party. Moves can miss or hit critically; enemies differ (a wolf bites twice, a captain raises his
// shield, Hyperion heals, Atlas hides behind a mountain, Saturn rages at half health). Each move plays as a sequence:
// attacker moves -> the effect travels -> the defender reacts -> the life bar drains.
// New in step 7: the enemy shows what it will do next (so a shield or dodge is a real choice), heavy attacks,
// and the type chart (sky > earth > sea > fire > underworld > sky), shown with icons only.
// Latin version: command buttons show Latin only. English version: English with the Latin small underneath.
var Battle = (function () {
  var B = { active: false }, log = [], busy = false, done = null, S = null, lastDraw = 0, O = null, M = null, maxHp = 4;
  var EL = { caelum: '☁️', terra: '⛰️', mare: '🌊', ignis: '🔥', inferi: '💀' };
  var BEATS = { caelum: 'terra', terra: 'mare', mare: 'ignis', ignis: 'inferi', inferi: 'caelum' };

  // Move data (text lives in content: cmd_<id>, battle_<id>). kind: dmg | heal | shield | dodge | stun | weak | fire | power | escape
  var MOVES = {
    tona:      { who: 'iuppiter', kind: 'dmg', amt: 1, el: 'caelum', uses: Infinity, fx: 'bolt', acc: 0.95, crit: 0.10 },
    nubes:     { who: 'iuppiter', kind: 'shield', uses: 2, fx: 'cloud' },
    fulmen:    { who: 'iuppiter', kind: 'dmg', amt: 3, el: 'caelum', uses: 2, fx: 'bolt', acc: 0.75, crit: 0.15 },
    neptunus:  { kind: 'dmg', amt: 2, el: 'mare', uses: 2, fx: 'wave', acc: 0.85, crit: 0.10 },
    pluto:     { kind: 'dodge', uses: 2, fx: 'ghost' },
    iuno:      { kind: 'stun', el: 'caelum', uses: 2, fx: 'fear', acc: 0.8 },
    ceres:     { kind: 'heal', amt: 2, uses: 2, fx: 'heal' },
    vesta:     { kind: 'dmg', amt: 2, el: 'ignis', uses: 2, fx: 'fire', acc: 0.85, crit: 0.10 },
    amalthea:  { kind: 'heal', amt: 1, uses: 2, fx: 'heal' },
    metis:     { kind: 'weak', uses: 1, fx: 'advice' },
    cyclopes:  { kind: 'dmg', amt: 3, uses: 1, fx: 'hammer', acc: 0.8, crit: 0.15 },
    centimani: { kind: 'dmg', amt: 3, el: 'terra', uses: 1, fx: 'rocks', acc: 0.7, crit: 0.10 },
    prometheus:{ kind: 'fire', uses: 2, fx: 'fire' },
    themis:    { kind: 'stun', uses: 1, fx: 'advice', acc: 0.9 },
    victoria:  { kind: 'power', uses: 1, fx: 'heal' }
  };
  var COLORS = { iuppiter: '#2f7fd1', neptunus: '#2aa6c9', pluto: '#555', iuno: '#c9a2e8', ceres: '#e0b84a', vesta: '#e0622e',
                 amalthea: '#f0f0f0', metis: '#5ac8c8', cyclopes: '#d9822b', centimani: '#c0c0e0',
                 prometheus: '#f08030', themis: '#b070d0', victoria: '#f5d76e' };
  // Enemies: element, hit points, xp, a cycle of intended actions, and what they look like.
  // Kinds of action: light (1), heavy (2), double (two bites), guard (raises a shield: your next hit is halved), heal (recovers 2).
  var ENEMIES = {
    guard:    { name: 'name_custos', sprite: 'guard', scale: 4, el: null, hp: 3, xp: 25, pattern: ['light', 'light', 'heavy'], flee: true,
                ids: { light: ['intent_guard_light', 'battle_enemy_spear'], heavy: ['intent_guard_heavy', 'battle_guard_heavy'] }, win: 'battle_win_1', blocked: 'battle_blocked' },
    lupus:    { name: 'name_lupus', sprite: 'lupus', scale: 4, el: null, hp: 4, xp: 30, pattern: ['double', 'light', 'double'], flee: true },
    dux:      { name: 'name_dux', sprite: 'dux', scale: 5, el: null, hp: 7, xp: 45, pattern: ['light', 'guard', 'heavy'], flee: true },
    campe:    { name: 'name_campe', sprite: 'campe', scale: 5, el: 'inferi', hp: 8, xp: 90, pattern: ['light', 'heavy'] },
    hyperion: { name: 'name_hyperion', sprite: 'hyperion', scale: 5, el: 'terra', hp: 8, xp: 110, pattern: ['light', 'heal', 'heavy'] },
    iapetus:  { name: 'name_iapetus', sprite: 'iapetus', scale: 5, el: 'terra', hp: 9, xp: 130, pattern: ['light', 'heavy', 'light'] },
    atlas:    { name: 'name_atlas', sprite: 'atlas', scale: 6, el: 'terra', hp: 10, xp: 150, pattern: ['light', 'guard', 'heavy'] },
    saturnus: { name: 'name_saturnus', sprite: 'saturn', scale: 6, el: 'terra', hp: 14, xp: 200, pattern: ['light', 'heavy', 'light'], pattern2: ['heavy', 'double', 'heavy'] }
  };
  var KIND_GLYPH = { light: '', heavy: '⚡ ', double: '⚔️ ', guard: '🛡️ ', heal: '💚 ' };
  Object.keys(ENEMIES).forEach(function (k) {
    var e = ENEMIES[k]; e.key = k; e.size = 16 * e.scale;
    e.win = e.win || 'win_' + k; e.blocked = e.blocked || 'battle_blocked_g';
  });
  // the content id of an enemy's intent line (type 0) or battle line (type 1) for an action
  function eid(kind, type) {
    var d = B.def; if (d.ids && d.ids[kind]) return d.ids[kind][type];
    return (type ? 'battle_' : 'intent_') + d.key + '_' + kind;
  }

  function t(id) { return Game.line(id) || ''; }
  function say(id) { log.push(t(id)); log = log.slice(-3); render(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ease(p) { return p * p * (3 - 2 * p); }
  function tween(ms, fn) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function f() { var p = Math.min(1, (performance.now() - t0) / ms); fn(p); p < 1 ? requestAnimationFrame(f) : res(); })();
    });
  }
  function fresh() {
    var th = THEME[Game.state().map] || THEME['default'];
    return { ax: {}, gx: 0, gy: 0, aHit: 0, gHit: 0, fx: null, fxp: 0, spear: null, gAlpha: 1, pops: [], gGuard: 0, healGlow: 0, critHit: false, shownT: maxHp, shownE: B.enemyHp, bg: backdrop(Game.state().map), pad: th.pad, interior: !!th.interior, clouds: !THEME[Game.state().map] };
  }

  // The allies on screen and on the command list: Jupiter's moves, siblings in the party, recruited helpers.
  function allies() {
    var info = Book.partyInfo();
    return info.siblings.concat(info.helpers).filter(function (id) { return M[id] && (id !== 'victoria' || O.final); });
  }
  function commands() {
    var ids = ['tona'];
    if (Story.flags.nubes) ids.push('nubes');
    if (Story.flags.fulmen) ids.push('fulmen');
    return ids.concat(allies());
  }
  function intentKind() { return B.pattern[B.turn % B.pattern.length]; }
  function intentId() { return eid(intentKind(), 0); }
  // chance of a hit and of a critical hit (luck boons add to both); ?luck=hit|crit|miss fixes the dice for tests
  var LUCK = new URLSearchParams(location.search).get('luck');
  function R() { return LUCK === 'hit' ? 0.5 : LUCK === 'crit' ? 0.001 : LUCK === 'miss' ? 0.999 : Math.random(); }
  function chance(id) {
    var m = M[id];
    return { acc: m.acc === undefined ? 1 : Math.min(0.98, m.acc + Prog.accBonus()), crit: m.crit === undefined ? 0 : Math.min(0.5, m.crit + Prog.critBonus()) };
  }
  B.chance = function (id) { if (!M) return null; return chance(id); };
  B.xpOf = function (key) { return ENEMIES[key || 'guard'].xp; };
  // which of the player's buttons answer what the enemy is about to do
  var HINTS = { heavy: ['shield', 'dodge', 'stun'], double: ['shield', 'dodge', 'stun'], heal: ['stun'], guard: ['weak', 'fire'] };
  function render() {
    document.getElementById('msg-text').textContent = log.join('\n');
    var holder = document.getElementById('choices'); holder.innerHTML = '';
    var hints = HINTS[intentKind()] || [];
    commands().forEach(function (id) {
      var b = document.createElement('button'), tr = t('cmd_' + id), left = B.uses[id], m = M[id], ch = chance(id);
      var suffix = left === Infinity ? '' : ' ×' + left, glyph = m.el ? EL[m.el] + ' ' : '';
      if (LANG === 'en') {
        b.appendChild(document.createTextNode(glyph + Game.clean(tr) + suffix));
        var small = document.createElement('small'); small.textContent = ' ' + Game.clean(Game.rawLatin('cmd_' + id));
        small.style.fontSize = '.6em'; b.appendChild(small);
      } else b.appendChild(document.createTextNode(glyph + Game.clean(tr) + suffix));
      if (ch.acc < 1) { var pc = document.createElement('small'); pc.textContent = ' ' + Math.round(ch.acc * 100) + '%'; pc.style.fontSize = '.65em'; pc.style.opacity = '.75'; b.appendChild(pc); }
      if (!busy && left > 0 && (hints.indexOf(m.kind) >= 0 || (B.teamHp <= 2 && m.kind === 'heal'))) b.className = 'hint';
      b.disabled = busy || left <= 0;
      b.onclick = function () { if (!busy) doMove(id); };
      holder.appendChild(b);
    });
  }

  function end(result) {
    B.active = false; document.getElementById('msg').classList.remove('battle'); document.body.classList.remove('inbattle');
    Game.endBattle();
    if (result === 'won') Score.add('battles', Score.CFG.battle);
    if (done) done(result, B.enemyHp, B.maxEnemy);
  }

  async function effect(name, ms) { S.fx = name; await tween(ms, function (p) { S.fxp = p; }); S.fx = null; }

  function pop(txt, col, who) { S.pops.push({ txt: txt, col: col, who: who || 'e', t0: performance.now() }); }

  async function doMove(id) {
    var m = M[id], actor = m.who || id, ch = chance(id);
    busy = true; if (m.uses !== Infinity) B.uses[id]--; render();
    // 1. the actor steps forward and the effect plays
    await tween(350, function (p) { S.ax[actor] = 60 * ease(p); });
    await effect(m.fx, 600);
    // 2. the result: the dice, the log line, the reaction, the life bar
    say('battle_' + id);
    var back = tween(350, function (p) { S.ax[actor] = 60 * (1 - ease(p)); });
    var hit = m.acc === undefined || R() < ch.acc, crit = hit && ch.crit > 0 && R() < ch.crit;
    if ((m.kind === 'dmg' || m.kind === 'stun') && !hit) {                                         // a miss: the enemy sidesteps
      say('eff_miss'); pop('✖', '#ff8a8a');
      await Promise.all([back, tween(450, function (p) { S.gx = 30 * Math.sin(p * Math.PI); })]); S.gx = 0;
    } else if (m.kind === 'dmg') {
      var el = B.fire ? 'ignis' : m.el, de = B.def.el, mult = 1;
      if (el && de) mult = BEATS[el] === de ? 2 : BEATS[de] === el ? 0.5 : 1;
      var base = Math.max(1, Math.ceil(m.amt * mult)) + (B.weak ? 1 : 0) + (B.fire ? 1 : 0) + B.power + (m.who === 'iuppiter' ? Prog.boons.vis : 0);
      var dmg = crit ? base * 2 : base;
      if (B.eGuard) { if (!crit) { dmg = Math.max(1, Math.ceil(dmg / 2)); say('eff_guarded'); } B.eGuard = false; }          // the shield holds, or a critical blow breaks it
      B.weak = false; B.fire = false; B.enemyHp -= dmg;
      if (mult === 2) say('eff_super'); else if (mult === 0.5) say('eff_weak');
      if (crit) { say('eff_crit'); S.critHit = true; }
      pop('-' + dmg + (crit ? ' ×2' : ''), crit ? '#ffd24a' : '#ffffff');
      await Promise.all([back, tween(crit ? 800 : 550, function (p) { S.gHit = p; })]); S.gHit = 0; S.critHit = false;
    } else if (m.kind === 'heal') {
      var healed = Math.min(maxHp, B.teamHp + m.amt) - B.teamHp; B.teamHp += healed; pop('+' + healed, '#7aff9a', 'a'); await back;
    } else if (m.kind === 'shield' || m.kind === 'dodge') {
      B.up = m.kind; await back;
    } else if (m.kind === 'stun') {
      B.stun = true; await Promise.all([back, tween(550, function (p) { S.gHit = p; })]); S.gHit = 0;
    } else if (m.kind === 'weak') { B.weak = true; await back;
    } else if (m.kind === 'fire') { B.fire = true; await back;
    } else if (m.kind === 'power') { B.power += 1; await back;
    }
    await wait(550);
    if (B.enemyHp <= 0) {
      say(B.def.win);
      if (B.def.flee) await tween(800, function (p) { S.gx = 260 * ease(p); S.gAlpha = 1 - p; });   // the guard runs away
      else await tween(900, function (p) { S.gy = 40 * ease(p); S.gAlpha = 1 - p; });                // a boss falls
      await wait(300); say('battle_win_2'); await wait(1400);
      return end('won');
    }
    // 3. the enemy does what it announced (unless stopped). At half health Saturn changes his pattern.
    await wait(300);
    if (B.def.pattern2 && !B.enraged && B.enemyHp <= B.maxEnemy / 2) {
      B.enraged = true; B.pattern = B.def.pattern2; B.turn = 0; say('battle_rage');
      await tween(700, function (p) { S.gHit = p; }); S.gHit = 0; await wait(500);
    }
    var kind = intentKind(); B.turn++;
    if (B.stun) { B.stun = false; say('battle_frozen'); await wait(1000); }
    else if (kind === 'guard') {
      say(eid(kind, 1)); B.eGuard = true; await tween(700, function (p) { S.gHit = 0; S.fx = null; S.gGuard = p; }); await wait(500);
    } else if (kind === 'heal') {
      say(eid(kind, 1)); var gain = Math.min(B.maxEnemy, B.enemyHp + 2) - B.enemyHp; B.enemyHp += gain; pop('+' + gain, '#7aff9a', 'e');
      await tween(700, function (p) { S.healGlow = Math.sin(p * Math.PI); }); S.healGlow = 0; await wait(400);
    } else {
      var hits = kind === 'double' ? 2 : 1, each = kind === 'heavy' ? 2 : 1;
      await tween(350, function (p) { S.gx = -50 * ease(p); });
      await tween(550, function (p) { S.spear = 360 - 230 * p; }); S.spear = null;
      if (B.up) {                                           // shield or helmet: the attack strikes nothing
        say(B.def.blocked); B.up = null;
        await tween(350, function (p) { S.gx = -50 * (1 - ease(p)); });
      } else {
        say(eid(kind, 1)); var landed = 0;
        for (var h = 0; h < hits; h++) {
          if (kind !== 'heavy' && R() >= 0.88) { pop('✖', '#ff8a8a', 'a'); say('eff_miss'); await wait(300); continue; }   // light bites can miss; heavy blows do not
          var dm = each * (O.dmg || 1); B.teamHp -= dm; landed++; pop('-' + dm, '#ff8a8a', 'a');
          await tween(350, function (p) { S.aHit = p; }); S.aHit = 0;
        }
        await tween(350, function (p) { S.gx = -50 * (1 - ease(p)); });
      }
      await wait(550);
      if (B.teamHp <= 0) return end('lost');
    }
    busy = false; render();
  }

  // opts: { enemy: 'guard' | 'lupus' | 'dux' | 'campe' | ..., hp (optional), max, final (Victoria available) }. onEnd(result, enemyHp, enemyMax): 'won' | 'lost'.
  // Called under the screen wipe: the box appears once the battle scene is revealed.
  B.start = function (opts, onEnd) {
    O = opts || {}; B.def = ENEMIES[O.enemy || 'guard']; B.pattern = B.def.pattern; B.turn = 0;
    M = JSON.parse(JSON.stringify(MOVES, function (k, v) { return v === Infinity ? 'inf' : v; }), function (k, v) { return v === 'inf' ? Infinity : v; });
    if (Story.flags.weapons) { M.neptunus.amt = 3; M.pluto.uses = 3; }       // the Cyclopes' weapons
    var item = Story.flags.item;                                             // the keepsake Ops took from the storeroom
    if (item === 'scutum') M.nubes.uses += 1; if (item === 'mel') { M.amalthea.amt = 2; M.amalthea.uses = 3; }
    Object.keys(M).forEach(function (k) { if (M[k].uses !== Infinity) M[k].uses += Prog.boons.copia; });   // the Supply boon
    maxHp = 4 + Prog.hpBonus() + (item === 'pallium' ? 1 : 0);
    B.active = true; B.teamHp = maxHp; B.enemyHp = O.hp || B.def.hp; B.maxEnemy = O.max || B.enemyHp;   // O.hp is lower than O.max on a retry: the enemy stays hurt
    B.weak = false; B.fire = false; B.stun = false; B.up = null; B.power = 0; B.eGuard = false; B.enraged = false;
    B.uses = {}; Object.keys(M).forEach(function (k) { B.uses[k] = M[k].uses; });
    log = []; busy = true; done = onEnd; S = fresh(); Game.setBusy(true);
    wait(700).then(function () {
      var box = document.getElementById('msg'); box.hidden = false; box.classList.add('battle'); document.body.classList.add('inbattle');
      document.getElementById('msg-btn').hidden = true;
      say('battle_intro'); return wait(1500);
    }).then(function () { busy = false; render(); });
  };

  function shake(h) { return h > 0 && h < 1 ? Math.sin(h * 40) * 6 * (1 - h) : 0; }
  // a backdrop for each place, painted once per battle
  var THEME = { tartarus: { sky: ['#1c1430', '#4a3560'], ground: '#3d3550', edge: '#2a2440', pad: '#2e2840' },
                othrys: { sky: ['#6a2f45', '#f0b27a'], ground: '#7a5a46', edge: '#5e4434', pad: '#684c3a' },
                hall2: { interior: true, ground: '#b8a883', pad: '#9a8a68' },
                default: { sky: ['#4f86d4', '#cfe8ff'], ground: '#6fa24e', edge: '#5a8a3e', pad: '#5a8a3e' } };
  function backdrop(mapId) {
    var th = THEME[mapId] || THEME['default'], c = document.createElement('canvas'); c.width = 480; c.height = 320; var x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    if (th.interior) {
      for (var ty = 0; ty < 7; ty++) for (var tx = 0; tx < 20; tx++) x.drawImage(Art.tile('#', mapId, 0, (tx + ty) % 4), tx * 24, ty * 24, 24, 24);
      for (var fy = 7; fy < 13; fy++) for (var fx = 0; fx < 20; fx++) x.drawImage(Art.tile('.', mapId, 0, (fx * 7 + fy * 3) % 4), fx * 24, fy * 24, 24, 24);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, 480, 160);
    } else {
      var n = 10, a = th.sky[0], b = th.sky[1];
      function mix(i) { var h1 = [1, 3, 5].map(function (k) { return parseInt(a.substr(k, 2), 16); }), h2 = [1, 3, 5].map(function (k) { return parseInt(b.substr(k, 2), 16); });
        return 'rgb(' + h1.map(function (v, j) { return Math.round(v + (h2[j] - v) * i / (n - 1)); }).join(',') + ')'; }
      for (var i = 0; i < n; i++) { x.fillStyle = mix(i); x.fillRect(0, i * 15, 480, 16); }
      x.fillStyle = Art.shade(th.edge, 1.1);                                  // distant hills, in steps
      [[0, 40, 90], [90, 28, 80], [170, 46, 100], [270, 30, 90], [360, 42, 130]].forEach(function (h) { for (var k = 0; k < h[2]; k += 8) { var ht = h[1] - Math.abs(h[2] / 2 - k) * h[1] / h[2] * 0.9; x.fillRect(h[0] + k, 150 - ht, 8, ht + 2); } });
      x.fillStyle = th.ground; x.fillRect(0, 150, 480, 170);
      x.fillStyle = th.edge; for (var gy = 156; gy < 320; gy += 14) x.fillRect(0, gy, 480, 2);
    }
    if (th.interior) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 150, 480, 2); }
    return c;
  }
  function plate(ctx, x, y, w, name, shown, max, glyph, right) {
    ctx.fillStyle = '#1c1830'; ctx.fillRect(x, y, w, 44); ctx.strokeStyle = '#e8c547'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, 42);
    ctx.fillStyle = '#fff'; ctx.font = '18px "Jersey 10", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(name + (glyph ? ' ' + glyph : ''), x + 8, y + 19);
    bar(ctx, x + 8, y + 26, shown, max, w - 20);
  }
  function bar(ctx, x, y, shown, max, w) {
    var f = Math.max(0, shown) / max; w = w || 100;
    ctx.fillStyle = '#0c0a14'; ctx.fillRect(x - 2, y - 2, w + 4, 14);
    ctx.fillStyle = f > 0.5 ? '#4c4' : f > 0.25 ? '#ec3' : '#e33'; ctx.fillRect(x, y, w * f, 10);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w * f, 3);
  }
  function tint(p, color) { return p > 0 && p < 1 ? { c: color, a: 0.65 * (1 - p) } : null; }

  B.draw = function (ctx) {
    var now = performance.now(), dt = lastDraw ? (now - lastDraw) / 1000 : 0; lastDraw = now;
    S.shownT += Math.max(-2 * dt, Math.min(2 * dt, B.teamHp - S.shownT));   // bars move 2 points a second
    S.shownE += Math.max(-2 * dt, Math.min(2 * dt, B.enemyHp - S.shownE));
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 480, 312); ctx.drawImage(S.bg, 0, 0);
    if (S.clouds) { ctx.fillStyle = 'rgba(255,255,255,.55)'; [[40, 20, 70], [220, 34, 90], [370, 14, 60]].forEach(function (c) { var cx = (c[0] + now / 90) % 560 - 60; ctx.fillRect(cx, c[1], c[2], 14); ctx.fillRect(cx + 12, c[1] - 8, c[2] - 30, 10); }); }
    // allies: Jupiter big, the others small behind him
    var others = allies(), pos = {}, sz = B.def.size;
    var jx = 150 + (S.ax.iuppiter || 0) + shake(S.aHit), jy = 76;
    pos.iuppiter = [jx, jy, 80];
    others.forEach(function (id, i) { pos[id] = [10 + (i % 3) * 34 + (S.ax[id] || 0), 66 + Math.floor(i / 3) * 36, 32]; });
    var gx = 410 - sz + S.gx + shake(S.gHit) * (S.critHit ? 2 : 1), gy = 150 - sz + S.gy;
    ctx.fillStyle = S.pad;                                                        // platforms
    ctx.beginPath(); ctx.ellipse(jx + 40 - (S.ax.iuppiter || 0), 154, 52, 10, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.ellipse(410 - sz / 2, 154, sz / 2 + 14, 10, 0, 0, 6.3); ctx.fill();
    Object.keys(pos).forEach(function (id) {
      var p = pos[id]; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p[0] + p[2] / 2, p[1] + p[2] - 1, p[2] / 2 - 2, 4, 0, 0, 6.3); ctx.fill();
      Art.big(ctx, Art.allySprite(id), 'right', p[0], p[1], p[2], id === 'iuppiter' ? tint(S.aHit, '#ff3030') : null, id === 'iuppiter' && B.up === 'dodge' ? 0.4 : 1);
    });
    var et = tint(S.gHit, S.critHit ? '#ffd24a' : S.fx === 'fear' ? '#aa55ff' : '#ffffff');
    if (!et && S.healGlow > 0) et = { c: '#55ff88', a: 0.55 * S.healGlow };
    if (!et && B.enraged) et = { c: '#ff2a2a', a: 0.3 };
    if (!et && B.eGuard) et = { c: '#6aa8ff', a: 0.16 };
    Art.big(ctx, B.def.sprite, 'left', gx, gy, sz, et, S.gAlpha);
    if (B.eGuard) { ctx.fillStyle = 'rgba(120,180,255,.45)'; ctx.strokeStyle = 'rgba(210,230,255,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx + 6, gy + sz / 2, 12, sz * 0.52, 0, 0, 6.3); ctx.fill(); ctx.stroke(); }
    if (B.up === 'shield') { ctx.fillStyle = 'rgba(255,255,255,.6)'; [[10, 30], [40, 40], [64, 28], [30, 8], [52, 12]].forEach(function (o) { ctx.beginPath(); ctx.arc(jx + o[0], jy + o[1], 14, 0, 6.3); ctx.fill(); }); }
    effects(ctx, pos, gx, gy, sz);
    plate(ctx, 8, 6, 160, Game.clean(t('name_iuppiter')), S.shownT, maxHp, EL.caelum);
    plate(ctx, 176, 6, 160, Game.clean(t(B.def.name)), S.shownE, B.maxEnemy, B.def.el ? EL[B.def.el] : '');
    // what the enemy will do next
    if (!S.fx && B.active && B.enemyHp > 0) {
      var ik = intentKind(), heavy = ik === 'heavy' || ik === 'double', txt = KIND_GLYPH[ik] + Game.clean(t(intentId()));
      ctx.font = '18px "Jersey 10", sans-serif'; ctx.textAlign = 'right';
      var w = ctx.measureText(txt).width; ctx.fillStyle = 'rgba(20,16,36,.8)'; ctx.fillRect(474 - w - 10, 160, w + 14, 22);
      ctx.fillStyle = ik === 'heal' ? '#7aff9a' : ik === 'guard' ? '#9ac8ff' : heavy ? '#ffd24a' : '#fff'; ctx.fillText(txt, 470, 176); ctx.textAlign = 'left';
    }
    // floating numbers: damage, healing, misses
    S.pops = S.pops.filter(function (q) { return now - q.t0 < 1100; });
    S.pops.forEach(function (q) {
      var a = (now - q.t0) / 1100, x = q.who === 'e' ? gx + sz / 2 : jx + 40, y = (q.who === 'e' ? gy : jy) + 6 - 34 * a;
      ctx.globalAlpha = 1 - a * a; ctx.font = '26px "Jersey 10", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1c1624'; ctx.strokeText(q.txt, x, y); ctx.fillStyle = q.col; ctx.fillText(q.txt, x, y);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    if (S.critHit && S.gHit > 0 && S.gHit < 0.35) { ctx.fillStyle = 'rgba(255,255,220,.35)'; ctx.fillRect(0, 0, 480, 312); }
    if (S.spear !== null) { ctx.fillStyle = '#e8e8f0'; ctx.fillRect(S.spear, 112, 40, 4); ctx.fillStyle = '#fff'; ctx.fillRect(S.spear - 6, 111, 8, 6); }
  };

  function effects(ctx, pos, gx, gy, sz) {
    var p = S.fxp, f = S.fx; if (!f) return;
    if (f === 'bolt') {
      var cx = gx + sz / 2, pts = [[cx, 0], [cx - 14, 20], [cx + 10, 38], [cx - 6, gy + 10]], n = Math.max(1, Math.ceil(p * (pts.length - 1)));
      ctx.strokeStyle = '#ffe94d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      if (p > 0.8) { ctx.fillStyle = 'rgba(255,255,200,.3)'; ctx.fillRect(0, 0, 480, 320); }
    } else if (f === 'wave') { ctx.fillStyle = '#4ab'; ctx.fillRect(170 + p * 190, 76, 44, 76); ctx.fillStyle = '#9ad8e8'; ctx.fillRect(170 + p * 190, 76, 44, 8);
    } else if (f === 'hammer') { ctx.fillStyle = '#d9822b'; ctx.fillRect(gx - 40 + p * 30, gy - 30 + p * 40, 50, 24);
    } else if (f === 'rocks') { ctx.fillStyle = '#998'; for (var k = 0; k < 6; k++) ctx.fillRect(gx + (k * 13) % 60, gy - 60 + p * 60 + (k % 3) * 8, 10, 10);
    } else if (f === 'fire') { ctx.fillStyle = p % 0.2 < 0.1 ? '#f80' : '#fc3'; ctx.fillRect(gx + 6, gy + sz - 50 * p, sz - 12, 50 * p);
    } else if (f === 'cloud' || f === 'ghost' || f === 'shields') {
      ctx.fillStyle = f === 'cloud' ? 'rgba(255,255,255,.6)' : 'rgba(120,120,140,.5)';
      ctx.beginPath(); ctx.arc(pos.iuppiter[0] + 40, pos.iuppiter[1] + 40, 30 + 36 * p, 0, 6.3); ctx.fill();
    } else if (f === 'heal') {
      ctx.fillStyle = '#5f5'; Object.keys(pos).forEach(function (id) { ctx.fillRect(pos[id][0] + pos[id][2] / 2 - 2, pos[id][1] - 20 * p, 4, 12); ctx.fillRect(pos[id][0] + pos[id][2] / 2 - 6, pos[id][1] - 20 * p + 4, 12, 4); });
    } else if (f === 'advice') { ctx.fillStyle = '#ff4'; ctx.font = '28px sans-serif'; ctx.fillText('?', gx + sz / 2 - 6, gy - 8 - 10 * p);
    } else if (f === 'fear') { ctx.fillStyle = '#a5f'; ctx.font = '28px sans-serif'; ctx.fillText('!', gx + sz / 2 - 4, gy - 8); }
  }
  B.anim = function () { return S; };
  B.moves = MOVES;
  return B;
})();
