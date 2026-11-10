const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const url = 'file://' + path.resolve(__dirname, '../index.html');
const KEY = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' };
module.exports = async function setup() {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const H = { b, p, assert, errs };
  H.st = () => p.evaluate(() => Game.state());
  // pause=0.2 shortens the 3-second reading pause and the cutscenes so the tests are quick; pass pause:null for the real 3 seconds
  H.open = async (q, o = {}) => {
    const pause = o.pause === null ? '' : '&pause=' + (o.pause || 0.2);
    await p.goto(url + '?' + q + pause); await p.waitForFunction(() => window.Game && window.Story && Game.state().map !== undefined);
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
  H.goTo = async (tx, ty) => {
    const r = await p.evaluate(`(() => { ${ROUTE} return route(${tx}, ${ty}, false); })()`);
    assert(r, `no route to ${tx},${ty}`); for (const k of r.keys) await H.key(k);
  };
  // go next to a tile, face it, press the action key
  H.useAt = async (tx, ty) => {
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
  H.bump = async k => { await p.keyboard.press(KEY[k] || k); await p.waitForTimeout(80); };       // press towards a blocked tile or an exit
  H.battleReady = async () => {
    await p.waitForFunction(() => Battle.active, null, { timeout: 10000 });
    await p.waitForSelector('#choices button:not([disabled])', { timeout: 10000 });
  };
  // press a battle command by its Latin text and wait for the turn to finish (or the battle to end)
  H.cmd = async latin => {
    await p.click(`#choices button:has-text("${latin}")`);
    await p.waitForFunction(() => !Battle.active || !document.querySelector('#choices button').disabled, null, { timeout: 15000 });
    await p.waitForTimeout(100);
  };
  return H;
};
