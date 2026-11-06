// Run: python3 tools/build_content.py && node tests/step1.js
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  const st = () => p.evaluate(() => Game.state());
  const tap = async k => { await p.keyboard.press(k); await p.waitForTimeout(30); };

  // Without ?drafts=1 the draft line must not reach students.
  await p.goto(url + '?lang=la');
  await p.waitForFunction(() => window.Game);
  for (let i = 0; i < 6; i++) await tap('ArrowRight');
  await tap('ArrowUp'); await tap('ArrowUp');
  for (let i = 0; i < 3; i++) await tap('ArrowRight');
  await tap(' ');
  assert(!(await st()).msgOpen, 'draft line leaked to students');

  // Drafts mode: walk to the NPC, collision, message, 3-second pause.
  await p.goto(url + '?lang=la&drafts=1');
  await p.waitForFunction(() => window.Game);
  for (let i = 0; i < 12; i++) await tap('ArrowLeft');
  assert.equal((await st()).player.x, 1, 'wall collision');
  for (let i = 0; i < 2; i++) await tap('ArrowUp'); // level with NPC row
  for (let i = 0; i < 12; i++) await tap('ArrowRight');
  let s = await st(); assert.equal(s.player.y, s.npc.y);
  assert.equal(s.player.x, s.npc.x - 1, 'NPC blocks');
  await tap('ArrowRight'); // face NPC
  await tap(' ');
  assert((await st()).msgOpen, 'message opens');
  assert((await p.textContent('#msg-text')).includes('Cēlā'), 'Latin text shown');
  await p.keyboard.press('Enter'); await p.keyboard.press(' ');
  assert((await st()).msgOpen, 'Enter/Space do nothing during pause');
  assert(await p.isDisabled('#msg-btn'));
  await p.waitForTimeout(3300);
  assert(!(await p.isDisabled('#msg-btn')), 'Continue enabled after 3s');
  await p.click('#msg-btn');
  assert(!(await st()).msgOpen);
  await p.screenshot({ path: process.env.SHOT || '/tmp/step1.png' });
  assert.deepEqual(errs, []);
  await b.close(); console.log('step1 OK');
})().catch(e => { console.error(e); process.exit(1); });
