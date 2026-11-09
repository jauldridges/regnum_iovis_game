const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const url = 'file://' + path.resolve(__dirname, '../index.html');
module.exports = async function setup() {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const H = { b, p, assert, errs };
  H.st = () => p.evaluate(() => Game.state());
  H.tap = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(30); } };
  // pause=0.2 shortens the 3-second reading pause so the tests are quick; pass pause:null to keep the real 3 seconds
  H.open = async (q, o = {}) => {
    const pause = o.pause === null ? '' : '&pause=' + (o.pause || 0.2);
    await p.goto(url + '?' + q + pause); await p.waitForFunction(() => window.Game && window.Story);
  };
  H.text = () => p.textContent('#msg-text');
  const enabled = async sel => { await p.waitForSelector(sel + ':not([disabled])', { timeout: 8000 }); };
  H.cont = async () => { await enabled('#msg-btn'); await p.click('#msg-btn'); };
  H.choose = async i => { await enabled(`#choices button:nth-child(${i})`); await p.click(`#choices button:nth-child(${i})`); };
  H.pcont = async () => { await enabled('#story button'); await p.click('#story button'); };   // story panels
  H.pick = async label => { await p.click(`#story button:has-text("${label}")`); };
  H.finish = async name => { assert.deepEqual(errs, []); await b.close(); console.log(name + ' OK'); };
  // walk helper: sequence like 'U3 R2 D1' (U/D/L/R + count)
  H.walk = async s => {
    const K = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight' };
    for (const m of s.split(' ')) await H.tap(K[m[0]], parseInt(m.slice(1) || '1', 10));
  };
  H.act = () => H.tap(' ');
  // wait for the battle to be ready for input
  H.battleReady = async () => {
    await p.waitForFunction(() => Battle.active, null, { timeout: 8000 });
    await p.waitForSelector('#choices button:not([disabled])', { timeout: 8000 });
  };
  // press a battle command by its Latin text and wait for the turn to finish (or the battle to end)
  H.cmd = async latin => {
    await p.click(`#choices button:has-text("${latin}")`);
    await p.waitForFunction(() => !Battle.active || !document.querySelector('#choices button').disabled, null, { timeout: 15000 });
    await p.waitForTimeout(100);
  };
  return H;
};
