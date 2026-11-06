// Run: python3 tools/build_content.py && node tests/run.js
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const url = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const st = () => p.evaluate(() => Game.state());
  const tap = async (k, n = 1) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(30); } };
  const open = async q => { await p.goto(url + q); await p.waitForFunction(() => window.Game); };
  const text = () => p.textContent('#msg-text');
  const cont = async () => { assert(await p.isDisabled('#msg-btn')); await p.waitForTimeout(3200); await p.click('#msg-btn'); };
  const choose = async i => { await p.waitForTimeout(3200); await p.click(`#choices button:nth-child(${i})`); };

  // --- Student mode: approved lines only
  await open('?lang=la');
  await tap('ArrowUp', 3); await tap('ArrowRight', 2); await tap('ArrowUp'); await tap(' ');
  assert(!(await st()).msgOpen, 'draft object line leaked to students');
  await tap('ArrowLeft', 12); assert.equal((await st()).player.x, 1, 'wall collision');
  await tap('ArrowDown'); await tap('ArrowRight', 12); await tap(' ');
  let s;
  s = await st(); assert.equal(s.player.x, s.npc.x - 1, 'NPC blocks'); assert(s.msgOpen, 'servant speaks (approved)');
  await cont();
  assert.equal((await st()).scene, 'start', 'Saturn scene skipped: its lines are still drafts');

  // --- Draft mode: full Chapter 1 flow
  await open('?lang=la&drafts=1');
  await tap('ArrowUp', 3); await tap('ArrowRight', 2); await tap('ArrowUp'); await tap(' ');
  assert((await text()).includes('sella Saturnī')); await p.keyboard.press(' '); assert((await st()).msgOpen, 'pause holds'); await cont();
  await tap('ArrowLeft', 3); await tap('ArrowUp'); await tap(' ');
  assert((await text()).includes('dormit')); await cont();
  await tap('ArrowRight', 9); await tap('ArrowUp', 3); await tap(' ');
  assert((await text()).includes('falx')); await cont();
  s = await st(); assert(s.inspected.obj_throne && s.inspected.obj_cradle && s.inspected.obj_sickle);
  await tap('ArrowDown', 3); await tap('ArrowLeft'); await tap(' ');
  assert((await text()).includes('Cēlā')); await cont();
  assert((await text()).includes('poscit')); await cont();
  assert((await text()).includes('Quid Ops'));
  assert(await p.isDisabled('#choices button:nth-child(1)'), 'choices wait for the pause');
  await choose(2);                                   // the baby: wrong
  assert((await text()).includes('retrahit')); await cont();
  assert((await text()).includes('Quid Ops'), 'choice comes around again');
  await p.screenshot({ path: process.env.SHOT || '/tmp/step2.png' });
  await choose(1);                                   // the stone: right
  assert((await text()).includes('Ops saxum Saturnō dat')); await cont();
  assert((await text()).includes('dēvorat')); await cont();
  assert((await text()).includes('salvus')); await cont();
  s = await st(); assert.equal(s.scene, 'done'); assert(!s.msgOpen);

  // --- English mode
  await open('?lang=en&drafts=1');
  await tap('ArrowUp', 3); await tap('ArrowRight', 2); await tap('ArrowUp'); await tap(' ');
  assert((await text()).includes("Saturn's throne"));
  assert.deepEqual(errs, []);
  await b.close(); console.log('all OK');
})().catch(e => { console.error(e); process.exit(1); });
