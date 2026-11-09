const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const url = 'file://' + path.resolve(__dirname, '../index.html');
module.exports = async function setup() {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const H = {
    b, p, assert, errs,
    st: () => p.evaluate(() => Game.state()),
    tap: async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(30); } },
    open: async q => { await p.goto(url + q); await p.waitForFunction(() => window.Game); },
    text: () => p.textContent('#msg-text'),
    cont: async () => { assert(await p.isDisabled('#msg-btn')); await p.waitForTimeout(3200); await p.click('#msg-btn'); },
    choose: async i => { await p.waitForTimeout(3200); await p.click(`#choices button:nth-child(${i})`); },
    finish: async name => { assert.deepEqual(errs, []); await b.close(); console.log(name + ' OK'); },
  };
  // Chapter 1 hall: objects, servant, Saturn, stone-or-baby. Ends with the player at (11,4).
  H.chapter1 = async () => {
    const { tap, text, cont, choose, st } = H;
    await tap('ArrowUp', 3); await tap('ArrowRight', 2); await tap('ArrowUp'); await tap(' ');
    assert((await text()).includes('sella Saturnī')); await p.keyboard.press(' ');
    assert((await st()).msgOpen, 'pause holds'); await cont();
    await tap('ArrowLeft', 3); await tap('ArrowUp'); await tap(' ');
    assert((await text()).includes('dormit')); await cont();
    await tap('ArrowRight', 9); await tap('ArrowUp', 3); await tap(' ');
    assert((await text()).includes('falx')); await cont();
    const s = await st(); assert(s.inspected.obj_throne && s.inspected.obj_cradle && s.inspected.obj_sickle);
    await tap('ArrowDown', 3); await tap('ArrowLeft'); await tap(' ');
    assert((await text()).includes('Cēlā')); await cont();
    assert((await text()).includes('poscit')); await cont();
    assert((await text()).includes('Quid Ops'));
    assert(await p.isDisabled('#choices button:nth-child(1)'), 'choices wait for the pause');
    await choose(2);
    assert((await text()).includes('retrahit')); await cont();
    assert((await text()).includes('Quid Ops'), 'choice comes around again');
    await choose(1);
    assert((await text()).includes('Ops saxum Saturnō dat')); await cont();
    assert((await text()).includes('dēvorat')); await cont();
    assert((await text()).includes('salvus')); await cont();
    const e = await st(); assert.equal(e.scene, 'done'); assert(!e.msgOpen); assert(e.guard, 'guard appears');
  };
  return H;
};
