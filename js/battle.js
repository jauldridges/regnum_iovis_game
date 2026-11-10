// Party battle. Jupiter and up to three allies each have their own hit points, moves and turn. Every round each living ally picks
// a move in turn (and it plays out), then the enemy acts. The enemy chooses a target and shows it, so covering, healing or
// taunting it away is a real choice. Moves can miss or hit critically; moves rest for a few turns after use (cooldown).
// Enemies differ: a wolf bites twice, a captain raises his shield, Hyperion heals, Atlas hides behind a mountain, Saturn rages.
// Latin version: command buttons show Latin only. English version: English with the Latin small underneath.
var Battle = (function () {
  var B = { active: false, history: [], picks: 0 }, log = [], busy = true, done = null, S = null, lastDraw = 0, O = null, M = null, pickResolve = null;
  var EL = { caelum: '☁️', terra: '⛰️', mare: '🌊', ignis: '🔥', inferi: '💀' };
  var BEATS = { caelum: 'terra', terra: 'mare', mare: 'ignis', ignis: 'inferi', inferi: 'caelum' };

  // ---- moves (text lives in content: cmd_<id>, battle_<id>). cd = turns of rest after use. acc/crit = chance to hit / to hit hard.
  var MOVES = {
    tona:      { kind: 'dmg', amt: 2, el: 'caelum', cd: 0, fx: 'bolt', acc: 0.95, crit: 0.10 },
    nubes:     { kind: 'shield', cd: 2, fx: 'cloud' },
    fulmen:    { kind: 'dmg', amt: 5, el: 'caelum', cd: 3, fx: 'bolt', acc: 0.75, crit: 0.15 },
    neptunus:  { kind: 'dmg', amt: 3, el: 'mare', cd: 1, fx: 'wave', acc: 0.85, crit: 0.10 },
    unda:      { kind: 'dmg', amt: 2, el: 'mare', cd: 0, fx: 'wave' },
    pluto:     { kind: 'dodge', cd: 2, fx: 'ghost' },
    umbrae:    { kind: 'slow', cd: 2, fx: 'shades' },
    iuno:      { kind: 'stun', el: 'caelum', cd: 3, fx: 'fear', acc: 0.8 },
    regina:    { kind: 'rally', cd: 2, fx: 'heal' },
    ceres:     { kind: 'healall', amt: 2, cd: 3, fx: 'heal' },
    vesta:     { kind: 'dmg', amt: 3, el: 'ignis', cd: 1, fx: 'fire', acc: 0.85, crit: 0.10 },
    flamma:    { kind: 'healone', amt: 3, cd: 2, fx: 'heal' },
    amalthea:  { kind: 'healj', amt: 3, cd: 2, fx: 'heal' },
    scuta:     { kind: 'taunt', cd: 2, fx: 'shields' },
    metis:     { kind: 'weak', cd: 3, fx: 'advice' },
    cyclopes:  { kind: 'dmg', amt: 5, cd: 3, fx: 'hammer', acc: 0.8, crit: 0.15 },
    centimani: { kind: 'dmg', amt: 5, el: 'terra', cd: 3, fx: 'rocks', acc: 0.7, crit: 0.10 },
    prometheus:{ kind: 'fire', cd: 2, fx: 'fire' },
    themis:    { kind: 'stun', cd: 3, fx: 'advice', acc: 0.9 },
    victoria:  { kind: 'power', cd: 99, fx: 'heal' },
    defend:    { kind: 'defend', cd: 0, fx: 'cloud' }
  };
  // who has which moves (everyone can also cover themselves)
  var CHAR = { iuppiter: ['tona', 'nubes', 'fulmen'], neptunus: ['neptunus', 'unda'], pluto: ['pluto', 'umbrae'], iuno: ['iuno', 'regina'], ceres: ['ceres'],
               vesta: ['vesta', 'flamma'], amalthea: ['amalthea'], curetes: ['scuta'], metis: ['metis'], cyclopes: ['cyclopes'], centimani: ['centimani'],
               prometheus: ['prometheus'], themis: ['themis'], victoria: ['victoria'] };
  // Enemies: element, hit points, xp, attack strength, a cycle of intended actions, and what they look like.
  // Kinds of action: light (atk), heavy (2 x atk), double (two bites), guard (raises a shield: your next hit is halved), heal (recovers a quarter).
  var ENEMIES = {
    guard:    { name: 'name_custos', sprite: 'guard', scale: 4, el: null, hp: 6, atk: 1, xp: 25, pattern: ['light', 'light', 'heavy'], flee: true,
                ids: { light: ['intent_guard_light', 'battle_enemy_spear'], heavy: ['intent_guard_heavy', 'battle_guard_heavy'] }, win: 'battle_win_1', blocked: 'battle_blocked' },
    lupus:    { name: 'name_lupus', sprite: 'lupus', melee: true, scale: 4, el: null, hp: 7, atk: 1, xp: 30, pattern: ['double', 'light', 'double'], flee: true },
    dux:      { name: 'name_dux', sprite: 'dux', melee: true, slash: true, scale: 5, el: null, hp: 14, atk: 2, xp: 45, pattern: ['light', 'guard', 'heavy'], flee: true },
    campe:    { name: 'name_campe', sprite: 'campe', melee: true, scale: 5, el: 'inferi', hp: 16, atk: 2, xp: 90, pattern: ['light', 'heavy'] },
    hyperion: { name: 'name_hyperion', sprite: 'hyperion', proj: 'orb', scale: 5, el: 'terra', hp: 18, atk: 2, xp: 110, pattern: ['light', 'heal', 'heavy'] },
    iapetus:  { name: 'name_iapetus', sprite: 'iapetus', scale: 5, el: 'terra', hp: 20, atk: 2, xp: 130, pattern: ['light', 'heavy', 'light'] },
    atlas:    { name: 'name_atlas', sprite: 'atlas', proj: 'rock', scale: 6, el: 'terra', hp: 22, atk: 3, xp: 150, pattern: ['light', 'guard', 'heavy'] },
    saturnus: { name: 'name_saturnus', sprite: 'saturn', melee: true, slash: true, scale: 6, el: 'terra', hp: 32, atk: 3, xp: 200, pattern: ['light', 'heavy', 'light'], pattern2: ['heavy', 'double', 'heavy'] }
  };
  var KIND_GLYPH = { light: '', heavy: '⚡ ', double: '⚔️ ', guard: '🛡️ ', heal: '💚 ' };
  Object.keys(ENEMIES).forEach(function (k) {
    var e = ENEMIES[k]; e.key = k; e.size = 16 * e.scale; e.win = e.win || 'win_' + k; e.blocked = e.blocked || 'battle_blocked_g';
  });
  function eid(kind, type) {
    var d = B.def; if (d.ids && d.ids[kind]) return d.ids[kind][type];
    return (type ? 'battle_' : 'intent_') + d.key + '_' + kind;
  }

  function t(id) { return Game.line(id) || ''; }
  function nameOfId(id) { return Book.nameNom(id); }
  function withName(id, name) { return t(id).replace('{x}', Game.clean(name)); }
  function say(text) { log.push(text); B.history.push(Game.clean(text)); log = log.slice(-3); render(); }
  function sayId(id) { say(t(id)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ease(p) { return p * p * (3 - 2 * p); }
  function tween(ms, fn) {
    return new Promise(function (res) {
      var t0 = performance.now();
      (function f() { var p = Math.min(1, (performance.now() - t0) / ms); fn(p); p < 1 ? requestAnimationFrame(f) : res(); })();
    });
  }

  // ---- dice. ?luck=hit|crit|miss fixes them (for tests).
  var LUCK = new URLSearchParams(location.search).get('luck');
  function R() { return LUCK === 'hit' ? 0.5 : LUCK === 'crit' ? 0.001 : LUCK === 'miss' ? 0.999 : Math.random(); }
  function chance(id) {
    var m = M[id];
    return { acc: m.acc === undefined ? 1 : Math.min(0.98, m.acc + Prog.accBonus()), crit: m.crit === undefined ? 0 : Math.min(0.5, m.crit + Prog.critBonus()) };
  }
  B.chance = function (id) { return M ? chance(id) : null; };
  B.xpOf = function (key) { return ENEMIES[key || 'guard'].xp; };

  // ---- the team
  function member(id) { return B.team.filter(function (m) { return m.id === id; })[0]; }
  function alive() { return B.team.filter(function (m) { return !m.down; }); }
  function slotOf(m) {                                                       // Jupiter big on the right of the team, the others behind him
    var i = B.team.indexOf(m); return i === 0 ? { x: 172, y: 76, s: 80 } : [null, { x: 114, y: 54, s: 48 }, { x: 58, y: 86, s: 48 }, { x: 114, y: 122, s: 48 }][i];
  }
  function maxHpOf(id) { return Team.base(id) + Prog.hpBonus() + (Story.flags.item === 'pallium' ? 1 : 0); }
  function movesOf(m) {
    return CHAR[m.id].filter(function (id) { return id !== 'nubes' || Story.flags.nubes; }).filter(function (id) { return id !== 'fulmen' || Story.flags.fulmen; }).concat(['defend']);
  }
  B.hpOf = function (id) { var m = member(id); return m ? m.hp : null; };
  B.maxOf = function (id) { var m = member(id); return m ? m.max : null; };
  B.cdOf = function (id, mv) { var m = member(id); return m ? m.cd[mv] || 0 : null; };

  function intentKind() { return B.pattern[B.turn % B.pattern.length]; }
  function intentId() { return eid(B.plan.kind, 0); }
  // which moves answer what the enemy is about to do
  var HINTS = { heavy: ['shield', 'dodge', 'stun', 'taunt', 'slow', 'defend'], double: ['shield', 'dodge', 'stun', 'taunt', 'slow', 'defend'], heal: ['stun'], guard: ['weak', 'fire', 'rally'] };

  function render() {
    var box = document.getElementById('msg-text'), holder = document.getElementById('choices'); holder.innerHTML = '';
    var m = B.turnOf ? member(B.turnOf) : null;
    box.textContent = (m ? '▶ ' + Game.clean(nameOfId(m.id)) + '\n' : '') + log.slice(m ? -2 : -3).join('\n');
    if (!m) return;
    var hints = HINTS[B.plan.kind] || [], made = [], hurt = alive().some(function (x) { return x.hp <= x.max * 0.4; });
    movesOf(m).forEach(function (id) {
      var b = document.createElement('button'), tr = t('cmd_' + id), mv = M[id], left = m.cd[id] || 0, ch = chance(id), glyph = mv.el ? EL[mv.el] + ' ' : '';
      if (LANG === 'en') {
        b.appendChild(document.createTextNode(glyph + Game.clean(tr)));
        var small = document.createElement('small'); small.textContent = ' ' + Game.clean(Game.rawLatin('cmd_' + id)); small.style.fontSize = '.6em'; b.appendChild(small);
      } else b.appendChild(document.createTextNode(glyph + Game.clean(tr)));
      if (ch.acc < 1) { var pc = document.createElement('small'); pc.textContent = ' ' + Math.round(ch.acc * 100) + '%'; pc.style.fontSize = '.65em'; pc.style.opacity = '.75'; b.appendChild(pc); }
      if (left > 0) { var cdn = document.createElement('small'); cdn.textContent = ' ⏳' + left; cdn.style.fontSize = '.7em'; b.appendChild(cdn); }
      if (!busy && left === 0 && (hints.indexOf(mv.kind) >= 0 || (hurt && (mv.kind === 'healall' || mv.kind === 'healone' || mv.kind === 'healj')))) b.className = 'hint';
      b.disabled = busy || left > 0;
      b.onclick = function () { if (!busy && pickResolve) { var r = pickResolve; pickResolve = null; r(id); } };
      holder.appendChild(b); made.push(b);
    });
    Game.numberButtons(made);
  }

  function end(result) {
    B.active = false; B.turnOf = null; document.getElementById('msg').classList.remove('battle'); document.body.classList.remove('inbattle');
    Game.endBattle();
    if (result === 'won') Score.add('battles', Score.CFG.battle);
    if (done) done(result, B.enemyHp, B.maxEnemy);
  }

  async function effect(name, ms) { S.fx = name; await tween(ms, function (p) { S.fxp = p; }); S.fx = null; }
  function pop(txt, col, who) { S.pops.push({ txt: txt, col: col, who: who || 'e', t0: performance.now() }); }

  // ---- one move by one ally
  async function doMove(m, id) {
    var mv = M[id], ch = chance(id), name = nameOfId(m.id);
    busy = true; B.turnOf = null; render();
    S.actor = m.id;
    await tween(300, function (p) { S.ax[m.id] = 50 * ease(p); });
    await effect(mv.fx, 550);
    say(id === 'defend' ? withName('battle_defend', name) : t('battle_' + id));
    var back = tween(300, function (p) { S.ax[m.id] = 50 * (1 - ease(p)); });
    var rolled = mv.acc !== undefined, hit = !rolled || R() < ch.acc, crit = hit && ch.crit > 0 && R() < ch.crit;
    if ((mv.kind === 'dmg' || mv.kind === 'stun') && !hit) {                                         // a miss: the enemy sidesteps
      Sound.play('miss'); sayId('eff_miss'); pop('✖', '#ff8a8a');
      await Promise.all([back, tween(450, function (p) { S.gx = 30 * Math.sin(p * Math.PI); })]); S.gx = 0;
    } else if (mv.kind === 'dmg') {
      var el = B.fire ? 'ignis' : mv.el, de = B.def.el, mult = 1;
      if (el && de) mult = BEATS[el] === de ? 2 : BEATS[de] === el ? 0.5 : 1;
      var base = Math.max(1, Math.ceil(mv.amt * mult)) + (B.weak ? 2 : 0) + (B.fire ? 2 : 0) + (B.rally ? 2 : 0) + B.power + (m.id === 'iuppiter' ? Prog.boons.vis : 0);
      var dmg = crit ? base * 2 : base;
      if (B.eGuard) { if (!crit) { dmg = Math.max(1, Math.ceil(dmg / 2)); sayId('eff_guarded'); } B.eGuard = false; }          // the shield holds, or a critical blow breaks it
      B.weak = false; B.fire = false; B.rally = false; B.enemyHp = Math.max(0, B.enemyHp - dmg);
      if (mult === 2) sayId('eff_super'); else if (mult === 0.5) sayId('eff_weak');
      if (crit) { sayId('eff_crit'); S.critHit = true; }
      Sound.play(crit ? 'crit' : 'hit'); pop('-' + dmg + (crit ? ' ×2' : ''), crit ? '#ffd24a' : '#ffffff');
      await Promise.all([back, tween(crit ? 800 : 550, function (p) { S.gHit = p; })]); S.gHit = 0; S.critHit = false;
    } else if (mv.kind === 'healall' || mv.kind === 'healone' || mv.kind === 'healj') {
      var who = mv.kind === 'healall' ? alive() : mv.kind === 'healj' ? [member('iuppiter')].filter(function (x) { return !x.down; })
              : [alive().sort(function (a, b) { return a.hp / a.max - b.hp / b.max; })[0]];
      var amt = mv.amt + (mv.kind === 'healj' && Story.flags.item === 'mel' ? 1 : 0);
      who.forEach(function (x) { var g = Math.min(x.max, x.hp + amt) - x.hp; x.hp += g; if (g) pop('+' + g, '#7aff9a', x.id); });
      Sound.play('heal'); await back;
    } else if (mv.kind === 'shield') { m.st.shield = true; await back;
    } else if (mv.kind === 'dodge') { m.st.dodge = true; await back;
    } else if (mv.kind === 'defend') { m.st.defend = true; await back;
    } else if (mv.kind === 'taunt') { m.st.defend = true; B.taunt = m.id; await back;
    } else if (mv.kind === 'slow') { B.slow = true; await Promise.all([back, tween(500, function (p) { S.gHit = p * 0.5; })]); S.gHit = 0;
    } else if (mv.kind === 'stun') { B.stun = true; await Promise.all([back, tween(550, function (p) { S.gHit = p; })]); S.gHit = 0;
    } else if (mv.kind === 'rally') { B.rally = true; await back;
    } else if (mv.kind === 'weak') { B.weak = true; await back;
    } else if (mv.kind === 'fire') { B.fire = true; await back;
    } else if (mv.kind === 'power') { B.power += 1; await back; }
    // the move rests for a while (the Supply boon shortens rests)
    var rest = mv.cd > 0 ? Math.max(1, mv.cd - Prog.boons.copia) : 0; if (rest) m.cd[id] = rest;
    await wait(450);
  }

  // ---- the enemy plans (and shows) what it will do and to whom, then does it
  function pickTarget() {
    var al = alive(), t = B.taunt && member(B.taunt); if (t && !t.down) return t;
    return al[Math.floor(R() * al.length)];
  }
  function planEnemy() {
    if (B.def.pattern2 && !B.enraged && B.enemyHp <= B.maxEnemy / 2) { B.enraged = true; B.pattern = B.def.pattern2; B.turn = 0; sayId('battle_rage'); S.rageUntil = performance.now() + 900; }
    B.plan = { kind: intentKind(), target: pickTarget().id };
  }
  async function enemyPhase() {
    var kind = B.plan.kind, d = B.def; B.turn++;
    if (B.stun) { B.stun = false; sayId('battle_frozen'); await wait(1000); }
    else if (kind === 'guard') { say(t(eid(kind, 1))); B.eGuard = true; await tween(700, function (p) { S.gGuard = p; }); await wait(500); }
    else if (kind === 'heal') {
      say(t(eid(kind, 1))); var gain = Math.min(B.maxEnemy, B.enemyHp + Math.ceil(B.maxEnemy / 4)) - B.enemyHp; B.enemyHp += gain; pop('+' + gain, '#7aff9a', 'e');
      await tween(700, function (p) { S.healGlow = Math.sin(p * Math.PI); }); S.healGlow = 0; await wait(400);
    } else {
      var hits = kind === 'double' ? 2 : 1, per = kind === 'heavy' ? 2 * d.atk : d.atk, said = false, arc = kind === 'heavy' ? 44 : 30, slowed = B.slow; B.slow = false;
      if (slowed) per = Math.max(1, per - 1);
      if (!d.melee) await tween(350, function (p) { S.gx = -50 * ease(p); });                      // a wind-up for throwers
      for (var h = 0; h < hits; h++) {
        var tg = member(B.plan.target); if (tg.down) tg = pickTarget(); if (!tg) break; B.plan.target = tg.id;
        var sl = slotOf(tg), dist = 410 - d.size - (sl.x + sl.s) + 10;
        if (d.melee) await tween(h ? 220 : kind === 'heavy' ? 440 : 330, function (p) { S.gx = -dist * ease(p); S.gy = -arc * Math.sin(p * Math.PI); });   // leaps at its target
        else { S.spearY = sl.y + sl.s / 2; await tween(550, function (p) { S.spear = 360 - (360 - sl.x - sl.s) * p; }); S.spear = null; }
        if (tg.st.dodge) { if (!said) { say(t(d.blocked)); said = true; } Sound.play('miss'); pop('✖', '#9ad0ff', tg.id); await wait(250); }
        else if (tg.st.shield) { tg.st.shield = false; if (!said) { say(t(d.blocked)); said = true; } Sound.play('block'); await wait(250); }
        else {
          if (!said) { say(t(eid(kind, 1))); said = true; }
          if (kind !== 'heavy' && R() >= 0.88) { Sound.play('miss'); pop('✖', '#ff8a8a', tg.id); sayId('eff_miss'); await wait(300); }       // light attacks can miss; heavy blows do not
          else {
            var dm = tg.st.defend ? Math.max(1, Math.ceil(per / 2)) : per; tg.hp = Math.max(0, tg.hp - dm); Sound.play('hurt'); pop('-' + dm, '#ff8a8a', tg.id);
            if (d.slash) await Promise.all([tween(300, function (p) { S.slash = p; S.slashAt = tg.id; }), tween(350, function (p) { S.hit[tg.id] = p; })]); else await tween(350, function (p) { S.hit[tg.id] = p; });
            S.hit[tg.id] = 0; S.slash = 0;
            if (tg.hp <= 0) { tg.down = true; say(withName('battle_down', nameOfId(tg.id))); await tween(500, function (p) { tg.alpha = 1 - 0.7 * p; }); }
          }
        }
        if (d.melee) await tween(h === hits - 1 ? 330 : 180, function (p) { S.gx = -dist * (1 - ease(p)); S.gy = 0; });
      }
      if (!d.melee) await tween(350, function (p) { S.gx = -50 * (1 - ease(p)); });
      await wait(450);
    }
    B.team.forEach(function (m) { m.st = {}; }); B.taunt = null;                                         // cover lasts one enemy action
  }

  // ---- the battle: rounds of (each ally's turn, then the enemy's)
  async function runBattle() {
    while (true) {
      planEnemy();
      for (var i = 0; i < B.team.length; i++) {
        var m = B.team[i]; if (m.down) continue;
        B.turnOf = m.id; busy = false; render();
        var mv = await new Promise(function (res) { pickResolve = res; });
        await doMove(m, mv); B.picks++;
        Object.keys(m.cd).forEach(function (k) { if (k !== mv && m.cd[k] > 0) m.cd[k]--; });     // rests tick down on this ally's own turns
        if (B.enemyHp <= 0) return win();
      }
      B.turnOf = null; busy = true; render();
      await enemyPhase();
      if (!alive().length) { await wait(500); return end('lost'); }
    }
  }
  async function win() {
    B.turnOf = null; busy = true; render(); sayId(B.def.win);
    if (B.def.flee) await tween(800, function (p) { S.gx = 260 * ease(p); S.gAlpha = 1 - p; });   // the guard runs away
    else await tween(900, function (p) { S.gy = 40 * ease(p); S.gAlpha = 1 - p; });                // a boss falls
    await wait(300); sayId('battle_win_2'); await wait(1400);
    end('won');
  }

  // opts: { enemy, hp (optional), max, final (Victory available), team (optional list of ids) }. onEnd(result, enemyHp, enemyMax): 'won' | 'lost'.
  // Called under the screen wipe: the box appears once the battle scene is revealed.
  B.start = function (opts, onEnd) {
    O = opts || {}; B.def = ENEMIES[O.enemy || 'guard']; B.pattern = B.def.pattern; B.turn = 0;
    M = JSON.parse(JSON.stringify(MOVES));
    if (Story.flags.weapons) { M.neptunus.amt = 4; M.pluto.cd = 1; }                  // the Cyclopes' weapons
    var item = Story.flags.item;                                                      // the keepsake Ops took from the storeroom
    if (item === 'scutum') M.nubes.cd = 1; if (item === 'mel') { M.amalthea.amt = 4; M.amalthea.cd = 1; }
    var ids = O.team || Team.chosen(!!O.final);
    B.team = ids.map(function (id) { var mx = maxHpOf(id); return { id: id, hp: mx, max: mx, shown: mx, down: false, cd: {}, st: {}, alpha: 1 }; });
    B.plan = null; B.active = true; B.enemyHp = O.hp || B.def.hp; B.maxEnemy = O.max || B.def.hp;     // O.hp is lower than O.max on a retry: the enemy stays hurt
    B.shownE = B.enemyHp; B.weak = B.fire = B.stun = B.rally = B.slow = B.eGuard = B.enraged = false; B.taunt = null; B.power = 0; B.turnOf = null;
    log = []; B.history = []; B.picks = 0; busy = true; done = onEnd; S = fresh(); Game.setBusy(true);
    wait(700).then(function () {
      var box = document.getElementById('msg'); box.hidden = false; box.classList.add('battle'); document.body.classList.add('inbattle');
      document.getElementById('msg-btn').hidden = true;
      say(t('battle_intro')); return wait(1500);
    }).then(function () { runBattle(); });
  };
  function fresh() {
    var th = THEME[Game.state().map] || THEME['default'];
    return { ax: {}, hit: {}, gx: 0, gy: 0, gHit: 0, fx: null, fxp: 0, spear: null, spearY: 112, gAlpha: 1, pops: [], gGuard: 0, healGlow: 0, critHit: false, slash: 0, actor: null,
             bg: backdrop(Game.state().map), pad: th.pad, interior: !!th.interior, clouds: !THEME[Game.state().map], rageUntil: 0 };
  }

  // ---- drawing
  function shake(h) { return h > 0 && h < 1 ? Math.sin(h * 40) * 6 * (1 - h) : 0; }
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
      x.fillStyle = Art.shade(th.edge, 1.1);
      [[0, 40, 90], [90, 28, 80], [170, 46, 100], [270, 30, 90], [360, 42, 130]].forEach(function (h) { for (var k = 0; k < h[2]; k += 8) { var ht = h[1] - Math.abs(h[2] / 2 - k) * h[1] / h[2] * 0.9; x.fillRect(h[0] + k, 150 - ht, 8, ht + 2); } });
      x.fillStyle = th.ground; x.fillRect(0, 150, 480, 170);
      x.fillStyle = th.edge; for (var gy = 156; gy < 320; gy += 14) x.fillRect(0, gy, 480, 2);
    }
    if (th.interior) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, 150, 480, 2); }
    return c;
  }
  function plate(ctx, x, y, w, name, shown, max, glyph) {
    ctx.fillStyle = '#1c1830'; ctx.fillRect(x, y, w, 44); ctx.strokeStyle = '#e8c547'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, 42);
    ctx.fillStyle = '#fff'; ctx.font = '18px "Jersey 10", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(name + (glyph ? ' ' + glyph : ''), x + 8, y + 19);
    ctx.textAlign = 'right'; ctx.fillText(Math.ceil(Math.max(0, shown)) + '/' + max, x + w - 8, y + 19); ctx.textAlign = 'left';
    bar(ctx, x + 8, y + 26, shown, max, w - 20);
  }
  function bar(ctx, x, y, shown, max, w, h) {
    var f = Math.max(0, shown) / max; w = w || 100; h = h || 10;
    ctx.fillStyle = '#0c0a14'; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = f > 0.5 ? '#4c4' : f > 0.25 ? '#ec3' : '#e33'; ctx.fillRect(x, y, w * f, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x, y, w * f, Math.max(1, h / 3));
  }
  function tint(p, color) { return p > 0 && p < 1 ? { c: color, a: 0.65 * (1 - p) } : null; }

  B.draw = function (ctx) {
    var now = performance.now(), dt = lastDraw ? (now - lastDraw) / 1000 : 0; lastDraw = now;
    B.team.forEach(function (m) { m.shown += Math.max(-3 * dt, Math.min(3 * dt, m.hp - m.shown)); });          // bars move 3 points a second
    B.shownE += Math.max(-4 * dt, Math.min(4 * dt, B.enemyHp - B.shownE));
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 480, 312); ctx.drawImage(S.bg, 0, 0);
    if (S.clouds) { ctx.fillStyle = 'rgba(255,255,255,.55)'; [[40, 20, 70], [220, 34, 90], [370, 14, 60]].forEach(function (c) { var cx = (c[0] + now / 90) % 560 - 60; ctx.fillRect(cx, c[1], c[2], 14); ctx.fillRect(cx + 12, c[1] - 8, c[2] - 30, 10); }); }
    var d = B.def, sz = d.size, gx = 410 - sz + S.gx + shake(S.gHit) * (S.critHit ? 2 : 1), gy = 150 - sz + S.gy;
    // platforms
    ctx.fillStyle = S.pad;
    ctx.beginPath(); ctx.ellipse(212, 156, 56, 10, 0, 0, 6.3); ctx.fill(); ctx.beginPath(); ctx.ellipse(410 - sz / 2, 154, sz / 2 + 14, 10, 0, 0, 6.3); ctx.fill();
    [[1], [2], [3]].forEach(function (k) { if (B.team[k[0]]) { var q = slotOf(B.team[k[0]]); ctx.beginPath(); ctx.ellipse(q.x + q.s / 2, q.y + q.s, q.s / 2 + 4, 6, 0, 0, 6.3); ctx.fill(); } });
    // the team: each ally with their own hit points
    var targetId = B.plan && !B.turnOf ? B.plan.target : (B.plan ? B.plan.target : null);
    B.team.forEach(function (m) {
      var sl = slotOf(m), x = sl.x + (S.ax[m.id] || 0) + shake(S.hit[m.id] || 0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(sl.x + sl.s / 2, sl.y + sl.s - 1, sl.s / 2 - 2, 4, 0, 0, 6.3); ctx.fill();
      var tn = tint(S.hit[m.id] || 0, '#ff3030'); if (m.st.dodge) { /* faded while hidden */ }
      Art.big(ctx, Art.allySprite(m.id), 'right', x, sl.y, sl.s, tn || (m.down ? { c: '#000000', a: 0.45 } : null), m.down ? 0.4 : m.st.dodge ? 0.45 : 1);
      if (m.st.shield) { ctx.fillStyle = 'rgba(255,255,255,.55)'; [[8, 18], [24, 24], [38, 14]].forEach(function (o) { ctx.beginPath(); ctx.arc(x + o[0] * sl.s / 48, sl.y + o[1] * sl.s / 48, 9 * sl.s / 48 + 3, 0, 6.3); ctx.fill(); }); }
      if (m.st.defend) { ctx.strokeStyle = 'rgba(160,200,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + sl.s / 2, sl.y + sl.s / 2, sl.s / 2 + 2, 0, 6.3); ctx.stroke(); }
      bar(ctx, sl.x, sl.y + sl.s + 4, m.shown, m.max, sl.s, 5);
      if (B.turnOf === m.id) { var by = sl.y - 12 + Math.sin(now / 160) * 2; ctx.fillStyle = '#ffe94d'; ctx.beginPath(); ctx.moveTo(sl.x + sl.s / 2 - 6, by - 8); ctx.lineTo(sl.x + sl.s / 2 + 6, by - 8); ctx.lineTo(sl.x + sl.s / 2, by); ctx.fill(); }
      if (B.plan && B.plan.target === m.id && !m.down && !(S.actor === m.id && false)) { ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎯', sl.x + sl.s / 2, sl.y - 14); ctx.textAlign = 'left'; }
    });
    // the enemy
    var et = tint(S.gHit, S.critHit ? '#ffd24a' : S.fx === 'fear' ? '#aa55ff' : '#ffffff');
    if (!et && S.healGlow > 0) et = { c: '#55ff88', a: 0.55 * S.healGlow };
    if (!et && (B.enraged || now < S.rageUntil)) et = { c: '#ff2a2a', a: 0.3 };
    if (!et && B.eGuard) et = { c: '#6aa8ff', a: 0.16 };
    Art.big(ctx, d.sprite, 'left', gx, gy, sz, et, S.gAlpha);
    if (B.eGuard) { ctx.fillStyle = 'rgba(120,180,255,.45)'; ctx.strokeStyle = 'rgba(210,230,255,.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx + 6, gy + sz / 2, 12, sz * 0.52, 0, 0, 6.3); ctx.fill(); ctx.stroke(); }
    effects(ctx, gx, gy, sz);
    // plates: whose turn it is (or who is being attacked), and the enemy
    var focus = member(B.turnOf || (B.plan && B.plan.target) || 'iuppiter') || B.team[0];
    plate(ctx, 8, 6, 160, Game.clean(nameOfId(focus.id)), focus.shown, focus.max, '');
    plate(ctx, 176, 6, 160, Game.clean(t(d.name)), B.shownE, B.maxEnemy, d.el ? EL[d.el] : '');
    // what the enemy will do next, and to whom
    if (!S.fx && B.active && B.enemyHp > 0 && B.plan && member(B.plan.target)) {
      var ik = B.plan.kind, heavy = ik === 'heavy' || ik === 'double', tg = member(B.plan.target);
      var txt = KIND_GLYPH[ik] + Game.clean(t(intentId())) + (ik === 'guard' || ik === 'heal' ? '' : '  → ' + Game.clean(nameOfId(tg.id)));
      ctx.font = '18px "Jersey 10", sans-serif'; ctx.textAlign = 'right';
      var w = ctx.measureText(txt).width; ctx.fillStyle = 'rgba(20,16,36,.8)'; ctx.fillRect(474 - w - 10, 160, w + 14, 22);
      ctx.fillStyle = ik === 'heal' ? '#7aff9a' : ik === 'guard' ? '#9ac8ff' : heavy ? '#ffd24a' : '#fff'; ctx.fillText(txt, 470, 176); ctx.textAlign = 'left';
    }
    if (S.spear !== null) {
      var pr = d.proj || 'spear', sy = S.spearY;
      if (pr === 'orb') { ctx.fillStyle = 'rgba(255,230,90,.45)'; ctx.beginPath(); ctx.arc(S.spear, sy, 16, 0, 6.3); ctx.fill(); ctx.fillStyle = '#fff6a0'; ctx.beginPath(); ctx.arc(S.spear, sy, 9, 0, 6.3); ctx.fill(); }
      else if (pr === 'rock') { ctx.fillStyle = '#6a6a76'; ctx.fillRect(S.spear - 8, sy - 10, 22, 20); ctx.fillStyle = '#9a9aa8'; ctx.fillRect(S.spear - 8, sy - 10, 22, 6); }
      else { ctx.fillStyle = '#e8e8f0'; ctx.fillRect(S.spear, sy - 2, 40, 4); ctx.fillStyle = '#fff'; ctx.fillRect(S.spear - 6, sy - 3, 8, 6); }
    }
    if (S.slash > 0 && S.slash < 1 && S.slashAt) { var sa = slotOf(member(S.slashAt)); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - S.slash) + ')'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(sa.x + sa.s - 4, sa.y + sa.s / 2, 30, 2.4 + S.slash * 1.2, 3.6 + S.slash * 1.2); ctx.stroke(); }
    // floating numbers: damage, healing, misses
    S.pops = S.pops.filter(function (q) { return now - q.t0 < 1100; });
    S.pops.forEach(function (q) {
      var a = (now - q.t0) / 1100, sl = q.who === 'e' ? null : slotOf(member(q.who)), x = sl ? sl.x + sl.s / 2 : gx + sz / 2, y = (sl ? sl.y : gy) + 6 - 34 * a;
      ctx.globalAlpha = 1 - a * a; ctx.font = '26px "Jersey 10", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#1c1624'; ctx.strokeText(q.txt, x, y); ctx.fillStyle = q.col; ctx.fillText(q.txt, x, y);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    if (S.critHit && S.gHit > 0 && S.gHit < 0.35) { ctx.fillStyle = 'rgba(255,255,220,.35)'; ctx.fillRect(0, 0, 480, 312); }
  };

  function effects(ctx, gx, gy, sz) {
    var p = S.fxp, f = S.fx; if (!f) return;
    var am = S.actor && member(S.actor), sl = am ? slotOf(am) : { x: 150, y: 76, s: 80 }, cx0 = sl.x + sl.s / 2, cy0 = sl.y + sl.s / 2;
    if (f === 'bolt') {
      var cx = gx + sz / 2, pts = [[cx, 0], [cx - 14, 20], [cx + 10, 38], [cx - 6, gy + 10]], n = Math.max(1, Math.ceil(p * (pts.length - 1)));
      ctx.strokeStyle = '#ffe94d'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      if (p > 0.8) { ctx.fillStyle = 'rgba(255,255,200,.3)'; ctx.fillRect(0, 0, 480, 312); }
    } else if (f === 'wave') { var wx = sl.x + sl.s + p * (gx - sl.x - sl.s); ctx.fillStyle = '#4ab'; ctx.fillRect(wx, 76, 44, 76); ctx.fillStyle = '#9ad8e8'; ctx.fillRect(wx, 76, 44, 8);
    } else if (f === 'hammer') { ctx.fillStyle = '#d9822b'; ctx.fillRect(gx - 40 + p * 30, gy - 30 + p * 40, 50, 24);
    } else if (f === 'rocks') { ctx.fillStyle = '#998'; for (var k = 0; k < 6; k++) ctx.fillRect(gx + (k * 13) % 60, gy - 60 + p * 60 + (k % 3) * 8, 10, 10);
    } else if (f === 'fire') { ctx.fillStyle = p % 0.2 < 0.1 ? '#f80' : '#fc3'; ctx.fillRect(gx + 6, gy + sz - 50 * p, sz - 12, 50 * p);
    } else if (f === 'cloud' || f === 'ghost' || f === 'shields') {
      ctx.fillStyle = f === 'cloud' ? 'rgba(255,255,255,.6)' : 'rgba(120,120,140,.5)'; ctx.beginPath(); ctx.arc(cx0, cy0, sl.s * 0.4 + sl.s * 0.45 * p, 0, 6.3); ctx.fill();
    } else if (f === 'shades') { ctx.fillStyle = 'rgba(40,20,70,.55)'; for (var j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(gx + sz / 2 + Math.cos(p * 6 + j * 1.6) * 30, gy + sz / 2 + Math.sin(p * 6 + j * 1.6) * 20, 14, 0, 6.3); ctx.fill(); }
    } else if (f === 'heal') {
      ctx.fillStyle = '#5f5'; B.team.forEach(function (m) { if (m.down) return; var s2 = slotOf(m); ctx.fillRect(s2.x + s2.s / 2 - 2, s2.y - 20 * p, 4, 12); ctx.fillRect(s2.x + s2.s / 2 - 6, s2.y - 20 * p + 4, 12, 4); });
    } else if (f === 'advice') { ctx.fillStyle = '#ff4'; ctx.font = '28px sans-serif'; ctx.fillText('?', gx + sz / 2 - 6, gy - 8 - 10 * p);
    } else if (f === 'fear') { ctx.fillStyle = '#a5f'; ctx.font = '28px sans-serif'; ctx.fillText('!', gx + sz / 2 - 4, gy - 8); }
  }
  B.anim = function () { return S; };
  B.refresh = render;                                                    // redraw the buttons (used by tests)
  B.moveData = function (id) { return M && M[id] ? JSON.parse(JSON.stringify(M[id])) : null; };
  return B;
})();
