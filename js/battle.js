// Side-view battle with a party. Each move plays as a sequence:
// attacker moves -> the effect travels -> the defender reacts -> the life bar drains.
// Latin version: command buttons show Latin only. English version: English with the Latin small underneath.
var Battle = (function () {
  var B = { active: false }, log = [], busy = false, done = null, S = null, lastDraw = 0, O = null;
  // Move data (text lives in content: cmd_<id>, battle_<id>). kind: dmg | heal | shield | dodge | stun | weak | escape
  var MOVES = {
    tona:     { who: 'iuppiter', kind: 'dmg', amt: 1, uses: Infinity, fx: 'bolt', log: 'battle_tona' },
    nubes:    { who: 'iuppiter', kind: 'shield', uses: 2, fx: 'cloud' },
    neptunus: { kind: 'dmg', amt: 2, uses: 2, fx: 'wave' },
    pluto:    { kind: 'dodge', uses: 2, fx: 'ghost' },
    iuno:     { kind: 'stun', uses: 2, fx: 'fear' },
    ceres:    { kind: 'heal', amt: 2, uses: 2, fx: 'heal' },
    vesta:    { kind: 'dmg', amt: 2, uses: 2, fx: 'fire' },
    amalthea: { kind: 'heal', amt: 1, uses: 2, fx: 'heal' },
    curetes:  { kind: 'escape', uses: 1, fx: 'shields' },
    metis:    { kind: 'weak', uses: 1, fx: 'advice' }
  };
  var COLORS = { iuppiter: '#2f7fd1', neptunus: '#2aa6c9', pluto: '#555', iuno: '#c9a2e8', ceres: '#e0b84a', vesta: '#e0622e',
                 amalthea: '#f0f0f0', curetes: '#8a8a99', metis: '#5ac8c8' };
  var TEAM_HP = 4;

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
    return { ax: {}, gx: 0, aHit: 0, gHit: 0, fx: null, fxp: 0, spear: null, gAlpha: 1, shownT: TEAM_HP, shownE: O.hp, up: null };
  }

  // The commands on offer: Jupiter's moves, siblings in the party, recruited helpers.
  function commands() {
    var info = Book.partyInfo(), ids = ['tona'];
    if (Story.flags.nubes) ids.push('nubes');
    return ids.concat(info.siblings, info.helpers).filter(function (id) { return MOVES[id]; });
  }
  function render() {
    document.getElementById('msg-text').textContent = log.join('\n');
    var holder = document.getElementById('choices'); holder.innerHTML = '';
    commands().forEach(function (id) {
      var b = document.createElement('button'), tr = t('cmd_' + id), left = B.uses[id], suffix = left === Infinity ? '' : ' ×' + left;
      if (LANG === 'en') {
        b.appendChild(document.createTextNode(Game.clean(tr) + suffix));
        var small = document.createElement('small'); small.textContent = ' ' + Game.clean(Game.rawLatin('cmd_' + id));
        small.style.fontSize = '.6em'; b.appendChild(small);
      } else b.textContent = Game.clean(tr) + suffix;
      b.disabled = busy || left <= 0;
      b.onclick = function () { if (!busy) doMove(id); };
      holder.appendChild(b);
    });
  }

  function end(result) {
    B.active = false; document.getElementById('msg').classList.remove('battle'); document.body.classList.remove('inbattle'); Game.endBattle();
    if (result === 'won') Score.add('battles', Score.CFG.battle);
    if (done) done(result);
  }

  async function effect(name, ms) { S.fx = name; await tween(ms, function (p) { S.fxp = p; }); S.fx = null; }

  async function doMove(id) {
    var m = MOVES[id], actor = m.who || id;
    busy = true; if (m.uses !== Infinity) B.uses[id]--; render();
    // 1. the actor steps forward and the effect plays
    await tween(350, function (p) { S.ax[actor] = 60 * ease(p); });
    await effect(m.fx, 600);
    // 2. the result: the log line, the reaction, the life bar
    say(m.log || 'battle_' + id);
    var back = tween(350, function (p) { S.ax[actor] = 60 * (1 - ease(p)); });
    if (m.kind === 'dmg') {
      var dmg = m.amt + (B.weak ? 1 : 0); B.weak = false; B.enemyHp -= dmg;
      await Promise.all([back, tween(550, function (p) { S.gHit = p; })]); S.gHit = 0;
    } else if (m.kind === 'heal') {
      B.teamHp = Math.min(TEAM_HP, B.teamHp + m.amt); await back;
    } else if (m.kind === 'shield' || m.kind === 'dodge') {
      B.up = m.kind; await back;
    } else if (m.kind === 'stun') {
      B.stun = true; await Promise.all([back, tween(550, function (p) { S.gHit = p; })]); S.gHit = 0;
    } else if (m.kind === 'weak') {
      B.weak = true; await back;
    } else if (m.kind === 'escape') {
      await back; await wait(900); return end('escaped');
    }
    await wait(550);
    if (B.enemyHp <= 0) {
      say('battle_win_1');
      await tween(800, function (p) { S.gx = 260 * ease(p); S.gAlpha = 1 - p; });   // the guard runs away
      await wait(300); say('battle_win_2'); await wait(1400);
      return end('won');
    }
    // 3. the enemy's turn
    await wait(300);
    if (B.stun) { B.stun = false; say('battle_enemy_frozen'); await wait(1000); }
    else {
      await tween(350, function (p) { S.gx = -50 * ease(p); });
      await tween(550, function (p) { S.spear = 360 - 230 * p; }); S.spear = null;
      if (B.up) {                                           // shield or helmet: the spear strikes nothing
        say('battle_blocked'); B.up = null;
        await tween(350, function (p) { S.gx = -50 * (1 - ease(p)); });
      } else {
        say('battle_enemy_spear'); B.teamHp -= O.dmg || 1;
        await Promise.all([tween(350, function (p) { S.gx = -50 * (1 - ease(p)); }),
                           tween(550, function (p) { S.aHit = p; })]); S.aHit = 0;
      }
      await wait(550);
      if (B.teamHp <= 0) return end('lost');
    }
    busy = false; render();
  }

  // opts: { hp: enemy hit points, dmg: damage per enemy hit }. onEnd(result): 'won' | 'lost' | 'escaped'.
  // Called under the screen wipe: the box appears once the battle scene is revealed.
  B.start = function (opts, onEnd) {
    O = opts || { hp: 3 }; B.active = true; B.teamHp = TEAM_HP; B.enemyHp = O.hp; B.weak = false; B.stun = false; B.up = null;
    B.uses = {}; Object.keys(MOVES).forEach(function (k) { B.uses[k] = MOVES[k].uses; });
    log = []; busy = true; done = onEnd; S = fresh(); Game.setBusy(true);
    wait(700).then(function () {
      document.getElementById('msg').hidden = false; document.getElementById('msg').classList.add('battle'); document.body.classList.add('inbattle'); document.getElementById('msg-btn').hidden = true;
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
    var info = Book.partyInfo(), others = info.siblings.concat(info.helpers), pos = {};
    var jx = 90 + (S.ax.iuppiter || 0) + shake(S.aHit), jy = 70;
    pos.iuppiter = [jx, jy, 56];
    others.forEach(function (id, i) { pos[id] = [24 + (i % 2) * 30 + (S.ax[id] || 0), 50 + Math.floor(i / 2) * 32, 24]; });
    ctx.globalAlpha = B.up === 'dodge' ? 0.4 : 1;
    Object.keys(pos).forEach(function (id) { var p = pos[id]; ctx.fillStyle = COLORS[id]; ctx.fillRect(p[0], p[1], p[2], p[2]); });
    ctx.globalAlpha = 1;
    flash(ctx, jx, jy, 56, 56, S.aHit, '#f33');
    var gx = 360 + S.gx + shake(S.gHit), gy = 55;
    ctx.globalAlpha = S.gAlpha; ctx.fillStyle = '#b5651d'; ctx.fillRect(gx, gy, 56, 56); ctx.globalAlpha = 1;
    flash(ctx, gx, gy, 56, 56, S.gHit, S.fx === 'fear' ? '#a5f' : '#fff');
    if (B.up === 'shield') { ctx.fillStyle = 'rgba(255,255,255,.55)'; [[0, 0], [30, 8], [14, -14], [40, -10]].forEach(function (o) { ctx.beginPath(); ctx.arc(jx + o[0], jy + 20 + o[1], 16, 0, 6.3); ctx.fill(); }); }
    effects(ctx, pos, gx, gy);
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(Game.clean(t('name_iuppiter')), 20, 20); bar(ctx, 20, 28, S.shownT, TEAM_HP);
    ctx.fillStyle = '#fff'; ctx.fillText(Game.clean(t('name_custos')), 360, 20); bar(ctx, 360, 28, S.shownE, O.hp);
    if (S.spear !== null) { ctx.fillStyle = '#ddd'; ctx.fillRect(S.spear, 90, 40, 4); }
  };

  function effects(ctx, pos, gx, gy) {
    var p = S.fxp, f = S.fx; if (!f) return;
    if (f === 'bolt') {
      var cx = gx + 28, pts = [[cx, 0], [cx - 14, 20], [cx + 10, 38], [cx - 6, 55]], n = Math.max(1, Math.ceil(p * (pts.length - 1)));
      ctx.strokeStyle = '#ffe94d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      if (p > 0.8) { ctx.fillStyle = 'rgba(255,255,200,.3)'; ctx.fillRect(0, 0, 480, 320); }
    } else if (f === 'wave') { ctx.fillStyle = '#4ab'; ctx.fillRect(120 + p * 230, 60, 40, 80);
    } else if (f === 'fire') { ctx.fillStyle = p % 0.2 < 0.1 ? '#f80' : '#fc3'; ctx.fillRect(gx + 6, gy + 56 - 50 * p, 44, 50 * p);
    } else if (f === 'cloud' || f === 'ghost' || f === 'shields') {
      ctx.fillStyle = f === 'cloud' ? 'rgba(255,255,255,.6)' : 'rgba(120,120,140,.5)';
      ctx.beginPath(); ctx.arc(pos.iuppiter[0] + 28, pos.iuppiter[1] + 28, 20 + 30 * p, 0, 6.3); ctx.fill();
    } else if (f === 'heal') {
      ctx.fillStyle = '#5f5'; Object.keys(pos).forEach(function (id) { ctx.fillRect(pos[id][0] + pos[id][2] / 2 - 2, pos[id][1] - 20 * p, 4, 12); ctx.fillRect(pos[id][0] + pos[id][2] / 2 - 6, pos[id][1] - 20 * p + 4, 12, 4); });
    } else if (f === 'advice') { ctx.fillStyle = '#ff4'; ctx.font = '28px sans-serif'; ctx.fillText('?', gx + 22, gy - 8 - 10 * p);
    } else if (f === 'fear') { ctx.fillStyle = '#a5f'; ctx.font = '28px sans-serif'; ctx.fillText('!', gx + 24, gy - 8); }
  }
  B.anim = function () { return S; };
  return B;
})();
