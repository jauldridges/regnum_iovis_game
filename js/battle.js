// Side-view battle, one move (Tonā!). Each attack plays as a sequence:
// attacker moves -> the strike travels -> defender reacts -> the life bar drains.
// Latin version: command buttons show Latin only. English version: English with the Latin small underneath.
var Battle = (function () {
  var B = { active: false }, log = [], busy = false, done = null, S = null, lastDraw = 0;
  var IDS = ['guard_1', 'guard_2', 'battle_intro', 'cmd_tona', 'battle_tona', 'battle_enemy_spear',
             'battle_win_1', 'battle_win_2', 'name_iuppiter', 'name_custos'];

  function t(id) { return Game.line(id) || ''; }
  function say(id) { log.push(t(id)); log = log.slice(-3); render(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ease(p) { return p * p * (3 - 2 * p); }
  function tween(ms, fn) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function f() {
        var p = Math.min(1, (performance.now() - t0) / ms); fn(p);
        p < 1 ? requestAnimationFrame(f) : res();
      })();
    });
  }
  function fresh() { return { jx: 0, gx: 0, jHit: 0, gHit: 0, bolt: 0, spear: null, gAlpha: 1, shownJ: 3, shownE: 3 }; }

  function render() {
    document.getElementById('msg-text').textContent = log.join('\n');
    var holder = document.getElementById('choices'); holder.innerHTML = '';
    var b = document.createElement('button'), tr = Game.line('cmd_tona');
    if (LANG === 'en') {
      b.appendChild(document.createTextNode(Game.clean(tr)));
      var small = document.createElement('small'); small.textContent = ' ' + Game.clean(Game.rawLatin('cmd_tona'));
      small.style.fontSize = '.6em'; b.appendChild(small);
    } else b.textContent = Game.clean(tr);
    b.disabled = busy;
    b.onclick = function () { if (!busy) tona(); };
    holder.appendChild(b);
  }

  async function tona() {
    busy = true; render();
    // 1. Jupiter steps forward, the thunderbolt falls on the guard
    await tween(350, function (p) { S.jx = 60 * ease(p); });
    await tween(600, function (p) { S.bolt = p; }); S.bolt = 0;
    // 2. the guard reacts, Jupiter steps back, the life bar drains
    say('battle_tona'); B.enemyHp--;
    await Promise.all([tween(350, function (p) { S.jx = 60 * (1 - ease(p)); }),
                       tween(550, function (p) { S.gHit = p; })]);
    S.gHit = 0; await wait(550);
    if (B.enemyHp <= 0) {
      say('battle_win_1');
      await tween(800, function (p) { S.gx = 260 * ease(p); S.gAlpha = 1 - p; });   // the guard runs away
      await wait(300); say('battle_win_2'); await wait(1400);
      B.active = false; Score.add('battles', Score.CFG.battle); Game.endBattle(); if (done) done(); return;
    }
    // 3. the guard strikes back
    await wait(300);
    await tween(350, function (p) { S.gx = -50 * ease(p); });
    await tween(550, function (p) { S.spear = 360 - 230 * p; }); S.spear = null;
    say('battle_enemy_spear'); B.jupHp--;
    await Promise.all([tween(350, function (p) { S.gx = -50 * (1 - ease(p)); }),
                       tween(550, function (p) { S.jHit = p; })]);
    S.jHit = 0; await wait(550);
    busy = false; render();
  }

  // The guard only appears when all battle lines are approved (or ?drafts=1).
  B.ready = function () { return IDS.every(function (i) { return Game.line(i); }); };
  B.lines = function () { return [t('guard_1'), t('guard_2')]; };

  // Called under the screen wipe: the box appears once the battle scene is revealed.
  B.start = function (onEnd) {
    B.active = true; B.jupHp = 3; B.enemyHp = 3; log = []; busy = true; done = onEnd; S = fresh();
    Game.setBusy(true);
    wait(700).then(function () {
      document.getElementById('msg').hidden = false; document.getElementById('msg-btn').hidden = true;
      say('battle_intro'); return wait(1500);
    }).then(function () { busy = false; render(); });
  };

  function bar(ctx, x, y, shown) {
    var f = Math.max(0, shown) / 3;
    ctx.fillStyle = '#222'; ctx.fillRect(x - 2, y - 2, 104, 14);
    ctx.fillStyle = f > 0.5 ? '#4c4' : f > 0.25 ? '#ec3' : '#e33'; ctx.fillRect(x, y, 100 * f, 10);
  }
  function hitShake(h) { return h > 0 && h < 1 ? Math.sin(h * 40) * 6 * (1 - h) : 0; }
  function hitFlash(ctx, x, y, h, color) {
    if (h > 0 && h < 1) { ctx.globalAlpha = 0.6 * (1 - h); ctx.fillStyle = color; ctx.fillRect(x, y, 56, 56); ctx.globalAlpha = 1; }
  }

  B.draw = function (ctx) {
    var now = performance.now(), dt = lastDraw ? (now - lastDraw) / 1000 : 0; lastDraw = now;
    // life bars drain smoothly (1 point in half a second)
    S.shownJ += Math.max(-2 * dt, Math.min(2 * dt, B.jupHp - S.shownJ));
    S.shownE += Math.max(-2 * dt, Math.min(2 * dt, B.enemyHp - S.shownE));
    ctx.fillStyle = '#3a5a8c'; ctx.fillRect(0, 0, 480, 140);
    ctx.fillStyle = '#6b8e4e'; ctx.fillRect(0, 140, 480, 180);
    var jx = 70 + S.jx + hitShake(S.jHit), jy = 70, gx = 360 + S.gx + hitShake(S.gHit), gy = 55;
    ctx.fillStyle = '#2f7fd1'; ctx.fillRect(jx, jy, 56, 56); hitFlash(ctx, jx, jy, S.jHit, '#f33');
    ctx.globalAlpha = S.gAlpha; ctx.fillStyle = '#b5651d'; ctx.fillRect(gx, gy, 56, 56); ctx.globalAlpha = 1;
    hitFlash(ctx, gx, gy, S.gHit, '#fff');
    if (S.bolt > 0) {   // lightning falls from the top onto the guard
      var cx = 388, pts = [[cx, 0], [cx - 14, 20], [cx + 10, 38], [cx - 6, 55]], n = Math.max(1, Math.ceil(S.bolt * (pts.length - 1)));
      ctx.strokeStyle = '#ffe94d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      if (S.bolt > 0.8) { ctx.fillStyle = 'rgba(255,255,200,.3)'; ctx.fillRect(0, 0, 480, 320); }
    }
    if (S.spear !== null) { ctx.fillStyle = '#ddd'; ctx.fillRect(S.spear, 90, 40, 4); }
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(Game.clean(t('name_iuppiter')), 20, 20); bar(ctx, 20, 28, S.shownJ);
    ctx.fillStyle = '#fff'; ctx.fillText(Game.clean(t('name_custos')), 360, 20); bar(ctx, 360, 28, S.shownE);
  };
  B.anim = function () { return S; };
  return B;
})();
