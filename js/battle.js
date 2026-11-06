// Step 3: side-view battle, one move (Tonā!), narrated in the battle log.
// Latin version: command buttons show Latin only. English version: English with the Latin small underneath.
var Battle = (function () {
  var B = { active: false }, log = [], fx = null, fxUntil = 0, busy = false, done = null;

  function t(id) { return Game.line(id) || ''; }
  function say(id) { log.push(t(id)); log = log.slice(-3); render(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function flash(name, ms) { fx = name; fxUntil = performance.now() + ms; }

  function render() {
    document.getElementById('msg-text').textContent = log.join('\n');
    var holder = document.getElementById('choices'); holder.innerHTML = '';
    var b = document.createElement('button');
    var tr = Game.line('cmd_tona');
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
    B.enemyHp--; flash('thunder', 700); say('battle_tona'); await wait(1300);
    if (B.enemyHp <= 0) {
      say('battle_win_1'); await wait(1300); say('battle_win_2'); await wait(1500);
      B.active = false; Game.endBattle(); if (done) done(); return;
    }
    flash('spear', 600); say('battle_enemy_spear'); B.jupHp--; await wait(1300);
    busy = false; render();
  }

  // The guard only appears when all battle lines are approved (or ?drafts=1).
  B.ready = function () {
    return ['battle_intro', 'cmd_tona', 'battle_tona', 'battle_enemy_spear', 'battle_win_1',
            'battle_win_2', 'name_iuppiter', 'name_custos'].every(function (i) { return Game.line(i); });
  };

  B.start = function (onEnd) {
    B.active = true; B.jupHp = 3; B.enemyHp = 3; log = []; busy = true; done = onEnd;
    var box = document.getElementById('msg');
    box.hidden = false; document.getElementById('msg-btn').hidden = true;
    Game.setBusy(true); say('battle_intro');
    wait(1500).then(function () { busy = false; render(); });
  };

  function hearts(ctx, x, y, n, max) {
    for (var i = 0; i < max; i++) { ctx.fillStyle = i < n ? '#d33' : '#533'; ctx.fillRect(x + i * 18, y, 14, 14); }
  }

  B.draw = function (ctx) {
    var now = performance.now();
    ctx.fillStyle = '#3a5a8c'; ctx.fillRect(0, 0, 480, 140);
    ctx.fillStyle = '#6b8e4e'; ctx.fillRect(0, 140, 480, 180);
    // Jupiter (left) and the guard (right): placeholder squares
    ctx.fillStyle = '#2f7fd1'; ctx.fillRect(70, 70, 56, 56);
    var gx = 360, gy = 55;
    if (fx === 'thunder' && now < fxUntil) gx += (Math.floor(now / 50) % 2) * 6;   // enemy shakes (stunned)
    ctx.fillStyle = '#b5651d'; ctx.fillRect(gx, gy, 56, 56);
    if (fx === 'thunder' && now < fxUntil) {
      ctx.strokeStyle = '#ffe94d'; ctx.lineWidth = 5; ctx.beginPath();
      ctx.moveTo(388, 0); ctx.lineTo(375, 25); ctx.lineTo(395, 45); ctx.lineTo(380, 70); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,200,.35)'; ctx.fillRect(0, 0, 480, 320);
    }
    if (fx === 'spear' && now < fxUntil) {
      ctx.fillStyle = '#ddd'; var sx = 350 - (1 - (fxUntil - now) / 600) * 220; ctx.fillRect(sx, 90, 40, 4);
    }
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif';
    ctx.fillText(Game.clean(t('name_iuppiter')), 20, 20); hearts(ctx, 20, 28, B.jupHp, 3);
    ctx.fillStyle = '#fff'; ctx.fillText(Game.clean(t('name_custos')), 380, 20); hearts(ctx, 380, 28, Math.max(B.enemyHp, 0), 3);
  };
  return B;
})();
