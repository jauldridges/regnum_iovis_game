// Side-view battle with a party. Each move plays as a sequence:
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
    tona:      { who: 'iuppiter', kind: 'dmg', amt: 1, el: 'caelum', uses: Infinity, fx: 'bolt' },
    nubes:     { who: 'iuppiter', kind: 'shield', uses: 2, fx: 'cloud' },
    fulmen:    { who: 'iuppiter', kind: 'dmg', amt: 3, el: 'caelum', uses: 2, fx: 'bolt' },
    neptunus:  { kind: 'dmg', amt: 2, el: 'mare', uses: 2, fx: 'wave' },
    pluto:     { kind: 'dodge', uses: 2, fx: 'ghost' },
    iuno:      { kind: 'stun', el: 'caelum', uses: 2, fx: 'fear' },
    ceres:     { kind: 'heal', amt: 2, uses: 2, fx: 'heal' },
    vesta:     { kind: 'dmg', amt: 2, el: 'ignis', uses: 2, fx: 'fire' },
    amalthea:  { kind: 'heal', amt: 1, uses: 2, fx: 'heal' },
    curetes:   { kind: 'escape', uses: 1, fx: 'shields' },
    metis:     { kind: 'weak', uses: 1, fx: 'advice' },
    cyclopes:  { kind: 'dmg', amt: 3, uses: 1, fx: 'hammer' },
    centimani: { kind: 'dmg', amt: 3, el: 'terra', uses: 1, fx: 'rocks' },
    prometheus:{ kind: 'fire', uses: 2, fx: 'fire' },
    themis:    { kind: 'stun', uses: 1, fx: 'advice' },
    victoria:  { kind: 'power', uses: 1, fx: 'heal' }
  };
  var COLORS = { iuppiter: '#2f7fd1', neptunus: '#2aa6c9', pluto: '#555', iuno: '#c9a2e8', ceres: '#e0b84a', vesta: '#e0622e',
                 amalthea: '#f0f0f0', curetes: '#8a8a99', metis: '#5ac8c8', cyclopes: '#d9822b', centimani: '#c0c0e0',
                 prometheus: '#f08030', themis: '#b070d0', victoria: '#f5d76e' };
  // Enemies: element, hit points, the cycle of intended actions, and their lines (content ids).
  var ENEMIES = {
    guard:    { name: 'name_custos', color: '#b5651d', size: 56, el: null, hp: 3, pattern: ['light', 'light', 'heavy'], flee: true,
                light: 'battle_enemy_spear', heavy: 'battle_guard_heavy', iLight: 'intent_guard_light', iHeavy: 'intent_guard_heavy', win: 'battle_win_1', blocked: 'battle_blocked' },
    campe:    { name: 'name_campe', color: '#7a2a5a', size: 72, el: 'inferi', hp: 8, pattern: ['light', 'heavy'] },
    hyperion: { name: 'name_hyperion', color: '#f0c040', size: 72, el: 'terra', hp: 8, pattern: ['light', 'light', 'heavy'] },
    iapetus:  { name: 'name_iapetus', color: '#8a6a4a', size: 72, el: 'terra', hp: 9, pattern: ['light', 'heavy', 'light'] },
    atlas:    { name: 'name_atlas', color: '#5a5a6a', size: 80, el: 'terra', hp: 10, pattern: ['light', 'light', 'heavy'] },
    saturnus: { name: 'name_saturnus', color: '#b02a2a', size: 80, el: 'terra', hp: 14, pattern: ['light', 'heavy', 'light', 'heavy'] }
  };
  Object.keys(ENEMIES).forEach(function (k) {
    var e = ENEMIES[k]; if (k === 'guard') return;
    e.light = 'battle_' + k + '_light'; e.heavy = 'battle_' + k + '_heavy'; e.iLight = 'intent_' + k + '_light';
    e.iHeavy = 'intent_' + k + '_heavy'; e.win = 'win_' + k; e.blocked = 'battle_blocked_g';
  });

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
    return { ax: {}, gx: 0, gy: 0, aHit: 0, gHit: 0, fx: null, fxp: 0, spear: null, gAlpha: 1, shownT: maxHp, shownE: B.enemyHp };
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
  function intentId() { return B.def[B.pattern[B.turn % B.pattern.length] === 'heavy' ? 'iHeavy' : 'iLight']; }
  function render() {
    document.getElementById('msg-text').textContent = log.join('\n');
    var holder = document.getElementById('choices'); holder.innerHTML = '';
    commands().forEach(function (id) {
      var b = document.createElement('button'), tr = t('cmd_' + id), left = B.uses[id], m = M[id];
      var suffix = left === Infinity ? '' : ' ×' + left, glyph = m.el ? EL[m.el] + ' ' : '';
      if (LANG === 'en') {
        b.appendChild(document.createTextNode(glyph + Game.clean(tr) + suffix));
        var small = document.createElement('small'); small.textContent = ' ' + Game.clean(Game.rawLatin('cmd_' + id));
        small.style.fontSize = '.6em'; b.appendChild(small);
      } else b.textContent = glyph + Game.clean(tr) + suffix;
      b.disabled = busy || left <= 0;
      b.onclick = function () { if (!busy) doMove(id); };
      holder.appendChild(b);
    });
  }

  function end(result) {
    B.active = false; document.getElementById('msg').classList.remove('battle'); document.body.classList.remove('inbattle');
    Game.endBattle();
    if (result === 'won') Score.add('battles', Score.CFG.battle);
    if (done) done(result);
  }

  async function effect(name, ms) { S.fx = name; await tween(ms, function (p) { S.fxp = p; }); S.fx = null; }

  async function doMove(id) {
    var m = M[id], actor = m.who || id;
    busy = true; if (m.uses !== Infinity) B.uses[id]--; render();
    // 1. the actor steps forward and the effect plays
    await tween(350, function (p) { S.ax[actor] = 60 * ease(p); });
    await effect(m.fx, 600);
    // 2. the result: the log line, the reaction, the life bar
    say('battle_' + id);
    var back = tween(350, function (p) { S.ax[actor] = 60 * (1 - ease(p)); });
    if (m.kind === 'dmg') {
      var el = B.fire ? 'ignis' : m.el, de = B.def.el, mult = 1;
      if (el && de) mult = BEATS[el] === de ? 2 : BEATS[de] === el ? 0.5 : 1;
      var dmg = Math.max(1, Math.ceil(m.amt * mult)) + (B.weak ? 1 : 0) + (B.fire ? 1 : 0) + B.power;
      B.weak = false; B.fire = false; B.enemyHp -= dmg;
      if (mult === 2) say('eff_super'); else if (mult === 0.5) say('eff_weak');
      await Promise.all([back, tween(550, function (p) { S.gHit = p; })]); S.gHit = 0;
    } else if (m.kind === 'heal') {
      B.teamHp = Math.min(maxHp, B.teamHp + m.amt); await back;
    } else if (m.kind === 'shield' || m.kind === 'dodge') {
      B.up = m.kind; await back;
    } else if (m.kind === 'stun') {
      B.stun = true; await Promise.all([back, tween(550, function (p) { S.gHit = p; })]); S.gHit = 0;
    } else if (m.kind === 'weak') { B.weak = true; await back;
    } else if (m.kind === 'fire') { B.fire = true; await back;
    } else if (m.kind === 'power') { B.power += 1; await back;
    } else if (m.kind === 'escape') { await back; await wait(900); return end('escaped'); }
    await wait(550);
    if (B.enemyHp <= 0) {
      say(B.def.win);
      if (B.def.flee) await tween(800, function (p) { S.gx = 260 * ease(p); S.gAlpha = 1 - p; });   // the guard runs away
      else await tween(900, function (p) { S.gy = 40 * ease(p); S.gAlpha = 1 - p; });                // a boss falls
      await wait(300); say('battle_win_2'); await wait(1400);
      return end('won');
    }
    // 3. the enemy does what it announced (unless stopped)
    await wait(300);
    var kind = B.pattern[B.turn % B.pattern.length]; B.turn++;
    if (B.stun) { B.stun = false; say('battle_frozen'); await wait(1000); }
    else {
      await tween(350, function (p) { S.gx = -50 * ease(p); });
      await tween(550, function (p) { S.spear = 360 - 230 * p; }); S.spear = null;
      if (B.up) {                                           // shield or helmet: the attack strikes nothing
        say(B.def.blocked); B.up = null;
        await tween(350, function (p) { S.gx = -50 * (1 - ease(p)); });
      } else {
        say(kind === 'heavy' ? B.def.heavy : B.def.light); B.teamHp -= (kind === 'heavy' ? 2 : 1) * (O.dmg || 1);
        await Promise.all([tween(350, function (p) { S.gx = -50 * (1 - ease(p)); }),
                           tween(550, function (p) { S.aHit = p; })]); S.aHit = 0;
      }
      await wait(550);
      if (B.teamHp <= 0) return end('lost');
    }
    busy = false; render();
  }

  // opts: { enemy: 'guard' | 'campe' | ..., hp (optional), final (Victoria available) }. onEnd(result): 'won' | 'lost' | 'escaped'.
  // Called under the screen wipe: the box appears once the battle scene is revealed.
  B.start = function (opts, onEnd) {
    O = opts || {}; B.def = ENEMIES[O.enemy || 'guard']; B.pattern = B.def.pattern; B.turn = 0;
    M = JSON.parse(JSON.stringify(MOVES, function (k, v) { return v === Infinity ? 'inf' : v; }), function (k, v) { return v === 'inf' ? Infinity : v; });
    if (Story.flags.weapons) { M.neptunus.amt = 3; M.pluto.uses = 3; }       // the Cyclopes' weapons
    maxHp = 4 + Math.max(0, Story.ch() - 3);
    B.active = true; B.teamHp = maxHp; B.enemyHp = O.hp || B.def.hp; B.maxEnemy = B.enemyHp;
    B.weak = false; B.fire = false; B.stun = false; B.up = null; B.power = 0;
    B.uses = {}; Object.keys(M).forEach(function (k) { B.uses[k] = M[k].uses; });
    log = []; busy = true; done = onEnd; S = fresh(); Game.setBusy(true);
    wait(700).then(function () {
      var box = document.getElementById('msg'); box.hidden = false; box.classList.add('battle'); document.body.classList.add('inbattle');
      document.getElementById('msg-btn').hidden = true;
      say('battle_intro'); return wait(1500);
    }).then(function () { busy = false; render(); });
  };

  function bar(ctx, x, y, shown, max) {
    var f = Math.max(0, shown) / max;
    ctx.fillStyle = '#222'; ctx.fillRect(x - 2, y - 2, 104, 14);
    ctx.fillStyle = f > 0.5 ? '#4c4' : f > 0.25 ? '#ec3' : '#e33'; ctx.fillRect(x, y, 100 * f, 10);
  }
  function shake(h) { return h > 0 && h < 1 ? Math.sin(h * 40) * 6 * (1 - h) : 0; }
  function flash(ctx, x, y, w, h, p, color) {
    if (p > 0 && p < 1) { ctx.globalAlpha = 0.6 * (1 - p); ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
  }

  B.draw = function (ctx) {
    var now = performance.now(), dt = lastDraw ? (now - lastDraw) / 1000 : 0; lastDraw = now;
    S.shownT += Math.max(-2 * dt, Math.min(2 * dt, B.teamHp - S.shownT));   // bars move 2 points a second
    S.shownE += Math.max(-2 * dt, Math.min(2 * dt, B.enemyHp - S.shownE));
    ctx.fillStyle = '#3a5a8c'; ctx.fillRect(0, 0, 480, 140);
    ctx.fillStyle = '#6b8e4e'; ctx.fillRect(0, 140, 480, 180);
    // allies: Jupiter big, the rest small behind him
    var others = allies(), pos = {};
    var jx = 112 + (S.ax.iuppiter || 0) + shake(S.aHit), jy = 70;
    pos.iuppiter = [jx, jy, 56];
    others.forEach(function (id, i) { pos[id] = [14 + (i % 3) * 28 + (S.ax[id] || 0), 48 + Math.floor(i / 3) * 30, 24]; });
    ctx.globalAlpha = B.up === 'dodge' ? 0.4 : 1;
    Object.keys(pos).forEach(function (id) { var p = pos[id]; ctx.fillStyle = COLORS[id] || '#999'; ctx.fillRect(p[0], p[1], p[2], p[2]); });
    ctx.globalAlpha = 1;
    flash(ctx, jx, jy, 56, 56, S.aHit, '#f33');
    var sz = B.def.size, gx = 400 - sz + S.gx + shake(S.gHit), gy = 112 - sz + S.gy;
    ctx.globalAlpha = S.gAlpha; ctx.fillStyle = B.def.color; ctx.fillRect(gx, gy, sz, sz); ctx.globalAlpha = 1;
    flash(ctx, gx, gy, sz, sz, S.gHit, S.fx === 'fear' ? '#a5f' : '#fff');
    if (B.up === 'shield') { ctx.fillStyle = 'rgba(255,255,255,.55)'; [[0, 0], [30, 8], [14, -14], [40, -10]].forEach(function (o) { ctx.beginPath(); ctx.arc(jx + o[0], jy + 20 + o[1], 16, 0, 6.3); ctx.fill(); }); }
    effects(ctx, pos, gx, gy, sz);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(Game.clean(t('name_iuppiter')) + ' ' + EL.caelum, 20, 20); bar(ctx, 20, 28, S.shownT, maxHp);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.fillText(Game.clean(t(B.def.name)) + (B.def.el ? ' ' + EL[B.def.el] : ''), 466, 20);
    ctx.textAlign = 'left'; bar(ctx, 360, 28, S.shownE, B.maxEnemy);
    // what the enemy will do next
    if (!S.fx && B.active && B.enemyHp > 0) {
      var heavy = B.pattern[B.turn % B.pattern.length] === 'heavy';
      ctx.textAlign = 'right'; ctx.font = (heavy ? 'bold ' : '') + '13px sans-serif'; ctx.fillStyle = heavy ? '#ffd24a' : '#fff';
      ctx.fillText((heavy ? '⚡ ' : '') + Game.clean(t(intentId())), 470, 134);
      ctx.textAlign = 'left';
    }
    if (S.spear !== null) { ctx.fillStyle = '#ddd'; ctx.fillRect(S.spear, 90, 40, 4); }
  };

  function effects(ctx, pos, gx, gy, sz) {
    var p = S.fxp, f = S.fx; if (!f) return;
    if (f === 'bolt') {
      var cx = gx + sz / 2, pts = [[cx, 0], [cx - 14, 20], [cx + 10, 38], [cx - 6, gy + 10]], n = Math.max(1, Math.ceil(p * (pts.length - 1)));
      ctx.strokeStyle = '#ffe94d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      if (p > 0.8) { ctx.fillStyle = 'rgba(255,255,200,.3)'; ctx.fillRect(0, 0, 480, 320); }
    } else if (f === 'wave') { ctx.fillStyle = '#4ab'; ctx.fillRect(120 + p * 230, 60, 40, 80);
    } else if (f === 'hammer') { ctx.fillStyle = '#d9822b'; ctx.fillRect(gx - 40 + p * 30, gy - 30 + p * 40, 50, 24);
    } else if (f === 'rocks') { ctx.fillStyle = '#998'; for (var k = 0; k < 6; k++) ctx.fillRect(gx + (k * 13) % 60, gy - 60 + p * 60 + (k % 3) * 8, 10, 10);
    } else if (f === 'fire') { ctx.fillStyle = p % 0.2 < 0.1 ? '#f80' : '#fc3'; ctx.fillRect(gx + 6, gy + sz - 50 * p, sz - 12, 50 * p);
    } else if (f === 'cloud' || f === 'ghost' || f === 'shields') {
      ctx.fillStyle = f === 'cloud' ? 'rgba(255,255,255,.6)' : 'rgba(120,120,140,.5)';
      ctx.beginPath(); ctx.arc(pos.iuppiter[0] + 28, pos.iuppiter[1] + 28, 20 + 30 * p, 0, 6.3); ctx.fill();
    } else if (f === 'heal') {
      ctx.fillStyle = '#5f5'; Object.keys(pos).forEach(function (id) { ctx.fillRect(pos[id][0] + pos[id][2] / 2 - 2, pos[id][1] - 20 * p, 4, 12); ctx.fillRect(pos[id][0] + pos[id][2] / 2 - 6, pos[id][1] - 20 * p + 4, 12, 4); });
    } else if (f === 'advice') { ctx.fillStyle = '#ff4'; ctx.font = '28px sans-serif'; ctx.fillText('?', gx + sz / 2 - 6, gy - 8 - 10 * p);
    } else if (f === 'fear') { ctx.fillStyle = '#a5f'; ctx.font = '28px sans-serif'; ctx.fillText('!', gx + sz / 2 - 4, gy - 8); }
  }
  B.anim = function () { return S; };
  B.moves = MOVES;
  return B;
})();
