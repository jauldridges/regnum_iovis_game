const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const url = 'file://' + path.resolve(__dirname, '../index.html');
const KEY = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' };
module.exports = async function setup() {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message + (process.env.STACK ? ' ' + e.stack : '')));
  const H = { b, p, assert, errs };
  H.st = () => p.evaluate(() => Game.state());
  // pause=0.2 shortens the 3-second reading pause and the cutscenes so the tests are quick; pass pause:null for the real 3 seconds
  H.open = async (q, o = {}) => {
    const pause = o.pause === null ? '' : '&pause=' + (o.pause || 0.2);
    await p.goto(url + '?' + q + pause + '&mute=1&luck=' + (o.luck || 'hit'));   // luck: hit (no misses or crits), crit (every hit is critical), miss; real dice if the page is opened without it
    await p.waitForFunction(() => window.Game && window.Story && Game.state().map !== undefined);
  };
  H.text = () => p.textContent('#msg-text');
  const enabled = async sel => { await p.waitForSelector(sel + ':not([disabled])', { timeout: 10000 }); };
  H.cont = async () => { await enabled('#msg-btn'); await p.click('#msg-btn'); };
  H.choose = async label => { const sel = `#choices button:has-text("${label}")`; await enabled(sel); await p.click(sel); };
  H.chooseLabel = H.choose;
  H.pcont = async () => { await enabled('#story button'); await p.click('#story button'); };   // story panels
  H.pick = async label => { await p.click(`#story button:has-text("${label}")`); };
  H.toast = async () => { await p.waitForSelector('#toast:not([hidden])', { timeout: 4000 }); return p.textContent('#toast'); };
  H.scene = async (t = 40000) => { await p.waitForFunction(() => !Game.state().scene && !Game.state().trans, null, { timeout: t }); };   // a cutscene or wipe is over
  H.finish = async name => { assert.deepEqual(errs, []); await b.close(); console.log(name + ' OK'); };

  // ---- walking by route: the helper finds its own way, so tests do not depend on the map layout
  H.key = async k => { await p.keyboard.press(k); await p.waitForFunction(() => !Game.state().moving, null, { timeout: 4000 }); };
  const ROUTE = `
    function route(tx, ty, adjacent) {
      const st = Game.state(), m = MAPS[st.map], W = 20, Hh = 13;
      const free = (x, y) => x >= 0 && y >= 0 && x < W && y < Hh && !m.exits.some(e => e.x === x && e.y === y) && !TILES[m.rows[y][x]].solid && !m.ents.some(e => e.show() && e.x === x && e.y === y);
      const goals = adjacent ? [[1,0,'ArrowLeft'],[-1,0,'ArrowRight'],[0,1,'ArrowUp'],[0,-1,'ArrowDown']].map(([dx,dy,f]) => [tx+dx, ty+dy, f]).filter(g => free(g[0], g[1]) || (g[0] === st.player.x && g[1] === st.player.y)) : [[tx, ty, null]];
      const start = [st.player.x, st.player.y], prev = {}, q = [start]; prev[start] = null; let hit = null;
      while (q.length && !hit) { const [x, y] = q.shift(); const g = goals.find(g => g[0] === x && g[1] === y); if (g) { hit = [x, y, g[2]]; break; }
        for (const [dx, dy, k] of [[0,-1,'ArrowUp'],[0,1,'ArrowDown'],[-1,0,'ArrowLeft'],[1,0,'ArrowRight']]) { const nx = x + dx, ny = y + dy;
          if (prev[[nx, ny]] !== undefined) continue; if (!(free(nx, ny) || (!adjacent && nx === tx && ny === ty))) continue; prev[[nx, ny]] = [x, y, k]; q.push([nx, ny]); } }
      if (!hit) return null; const keys = []; let c = [hit[0], hit[1]]; while (prev[c]) { keys.unshift(prev[c][2]); c = [prev[c][0], prev[c][1]]; } return { keys, face: hit[2] };
    }`;
  H.calm = async () => { await p.waitForFunction(() => !Game.state().scene && !Game.state().trans, null, { timeout: 40000 }); };
  H.goTo = async (tx, ty) => {
    await H.calm();
    const r = await p.evaluate(`(() => { ${ROUTE} return route(${tx}, ${ty}, false); })()`);
    assert(r, `no route to ${tx},${ty}`); for (const k of r.keys) await H.key(k);
  };
  // go next to a tile, face it, press the action key
  H.useAt = async (tx, ty) => {
    await H.calm();
    const r = await p.evaluate(`(() => { ${ROUTE} return route(${tx}, ${ty}, true); })()`);
    assert(r, `no route next to ${tx},${ty}`); for (const k of r.keys) await H.key(k);
    if (r.face) await H.key(r.face); await p.keyboard.press(' ');
  };
  H.entPos = id => p.evaluate(id => { const e = MAPS[Game.state().map].ents.find(e => e.id === id && e.show()); return e ? [e.x, e.y] : null; }, id);
  H.talk = async id => { const pos = await H.entPos(id); assert(pos, 'no ' + id + ' here'); await H.useAt(pos[0], pos[1]); };
  H.useChar = async ch => {
    const pos = await p.evaluate(ch => { const m = MAPS[Game.state().map]; for (let y = 0; y < 13; y++) { const x = m.rows[y].indexOf(ch); if (x >= 0) return [x, y]; } return null; }, ch);
    assert(pos, 'no tile ' + ch); await H.useAt(pos[0], pos[1]);
  };
  H.bump = async k => {
    await H.calm(); await p.keyboard.press(KEY[k] || k); await p.waitForTimeout(80); };       // press towards a blocked tile or an exit
  // a battle is won: wait for the reward (XP, the level-up scene and its boon choice) to finish; take Life if offered
  H.won = async () => {
    await p.waitForFunction(() => !Battle.active, null, { timeout: 20000 });
    let calm = 0;
    while (calm < 6) {
      await p.waitForTimeout(150);
      const choice = await p.locator('#choices button:has-text("Vīta")').count();
      if (choice) { await p.click('#choices button:has-text("Vīta")'); calm = 0; continue; }
      const s = await H.st(); calm = (s.scene || s.trans) ? 0 : calm + 1;
    }
  };
  // a god's turn has begun (a button can be pressed) -- or the battle is over
  H.turnReady = async () => {
    await p.waitForFunction(() => Battle.active, null, { timeout: 10000 });
    await p.waitForFunction(() => Battle.turnOf && document.querySelector('#choices button:not([disabled])'), null, { timeout: 20000 });
  };
  H.battleReady = H.turnReady;
  H.buttons = () => p.$$eval('#choices button', bs => bs.map(b => b.textContent + (b.disabled ? ' [off]' : '')));
  const picks = () => p.evaluate(() => Battle.picks);
  // play one turn: the named move if it is ready, otherwise cover (Sē tege); waits until the turn has been played
  H.act = async latin => {
    await H.turnReady();
    const n = await picks(), who = await p.evaluate(() => Battle.turnOf);
    let sel = `#choices button:not([disabled]):has-text("${latin}")`;
    if (!(await p.locator(sel).count())) sel = '#choices button:not([disabled]):has-text("Sē tege")';
    await p.click(sel);
    await p.waitForFunction(n => !Battle.active || Battle.picks > n, n, { timeout: 15000 });
    return who;
  };
  H.cmd = H.act;
  // keep playing, preferring the named moves in order, until the battle ends
  H.autoPlay = async (prefs = ['Fulmen', 'Tonā', 'Unda']) => {
    for (let k = 0; k < 80; k++) {
      if (!(await p.evaluate(() => Battle.active))) return;
      try { await H.turnReady(); } catch (e) { if (!(await p.evaluate(() => Battle.active))) return; throw e; }
      const n = await picks();
      let sel = null;
      for (const pr of prefs) { const s2 = `#choices button:not([disabled]):has-text("${pr}")`; if (await p.locator(s2).count()) { sel = s2; break; } }
      if (!sel) sel = '#choices button:not([disabled])';
      await p.click(sel);
      await p.waitForFunction(n => !Battle.active || Battle.picks > n, n, { timeout: 15000 });
    }
    throw new Error('battle did not end');
  };
  // after a fight starts: accept the remembered team on the pick screen if it appears (or choose names), then wait for the first turn
  H.enter = async names => {
    await p.waitForFunction(() => Battle.active || !document.getElementById('teampick').hidden, null, { timeout: 15000 });
    if (!(await p.evaluate(() => document.getElementById('teampick').hidden))) { if (names) await H.pickTeam(names); else await p.click('#teampick .go'); }
    await H.turnReady();
  };
  H.pickTeam = async names => {
    await p.waitForSelector('#teampick:not([hidden])', { timeout: 10000 });
    for (const t of await p.$$('#teampick .tile.sel:not(.fixed)')) await t.click();         // clear the remembered picks
    for (const n of names) await p.click(`#teampick .tile:has-text("${n}")`);
    await p.click('#teampick .go');
  };
  return H;
};
