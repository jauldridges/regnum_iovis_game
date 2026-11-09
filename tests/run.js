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

  // Chapter 1 hall: objects, servant, Saturn, stone-or-baby. Ends with player at (11,4).
  async function chapter1() {
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
    await choose(2);                                   // the baby: wrong
    assert((await text()).includes('retrahit')); await cont();
    assert((await text()).includes('Quid Ops'), 'choice comes around again');
    await choose(1);                                   // the stone: right
    assert((await text()).includes('Ops saxum Saturnō dat')); await cont();
    assert((await text()).includes('dēvorat')); await cont();
    assert((await text()).includes('salvus')); await cont();
    const e = await st(); assert.equal(e.scene, 'done'); assert(!e.msgOpen);
  }

  // --- Student mode (approved lines only): walls, NPC collision, Chapter 1; no guard while battle lines are drafts
  await open('?lang=la');
  await tap('ArrowUp', 3); await tap('ArrowLeft', 12); assert.equal((await st()).player.x, 1, 'wall collision');
  await tap('ArrowDown'); await tap('ArrowRight', 12);
  let s = await st(); assert.equal(s.player.x, s.npc.x - 1, 'NPC blocks');
  await open('?lang=la');
  await chapter1();
  s = await st(); assert(!s.guard, 'no guard while its lines are drafts');  // remove this check once battle lines are approved

  // --- Draft mode: Chapter 1 then the battle
  await open('?lang=la&drafts=1');
  await chapter1();
  s = await st(); assert(s.guard, 'guard appears');
  await tap('ArrowDown'); await tap('ArrowDown'); await tap(' ');
  assert((await text()).includes('appāret'));
  assert(await p.evaluate(() => Battle.active));
  await p.waitForTimeout(1700);
  assert.equal((await p.textContent('#choices button')).trim(), 'Tonā!', 'Latin-only button');
  for (let i = 0; i < 3; i++) {
    await p.click('#choices button');
    assert(await p.isDisabled('#choices button'), 'buttons locked while animation plays');
    await p.waitForTimeout(i < 2 ? 2800 : 1000);
    if (i === 0) assert((await text()).includes('Tonitrus Iovis custōdem terret'));
    if (i === 1) await p.screenshot({ path: process.env.SHOT || '/tmp/step3.png' });
  }
  await p.waitForFunction(() => !Battle.active, null, { timeout: 8000 });
  s = await st(); assert.equal(s.scene, 'battled'); assert(!s.msgOpen && !s.guard);
  await tap('ArrowUp'); assert.equal((await st()).player.y, 4, 'can walk again');

  // --- Collection book (drafts mode): pause, question, retry rules, party
  await open('?lang=la&drafts=1');
  await p.evaluate(() => ['iuppiter', 'ops', 'saturnus'].forEach(Book.unlock));   // as Chapter 1 does when it ends
  await p.keyboard.press('b');
  assert(await p.isVisible('#book'));
  await tap('ArrowLeft'); assert.equal((await st()).player.x, 3, 'no walking while the book is open');
  const page = n => p.click(`#book button:has-text("${n}")`);
  const bookText = () => p.textContent('#book');
  await page('Iuppiter, Iovis');
  assert(await p.isDisabled('#book button'), 'card waits 3 seconds');
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  assert((await bookText()).includes('Graecē: Zeus'));
  await p.waitForTimeout(2800); await p.click('#book button');
  assert((await bookText()).includes('Cuius fīlius'));
  await p.click('#book button:has-text("Neptūnī")');           // wrong, 1st try
  assert((await bookText()).includes('Relege')); await p.click('#book button');
  assert((await bookText()).includes('Graecē: Zeus'), 'wrong answer sends the student back to the text');
  assert(await p.isDisabled('#book button'), 'pause again'); await p.waitForTimeout(3200); await p.click('#book button');
  await p.click('#book button:has-text("Saturnī et Opis")');   // right on retry
  assert((await bookText()).includes('Rēctē')); await p.click('#book button');
  let bs = await p.evaluate(() => Book.state());
  assert.deepEqual(bs.results.iuppiter, { tries: 2, correct: true, firstTry: false });
  await page('Saturnus, Saturnī'); await p.waitForTimeout(3200); await p.click('#book button');
  await p.click('#book button:has-text("fulmen")');            // wrong
  await p.click('#book button'); await p.waitForTimeout(3200); await p.click('#book button');
  await p.click('#book button:has-text("tridēns")');           // wrong again
  assert((await bookText()).includes('Responsum rēctum: falx'), 'second miss shows the answer');
  await p.click('#book button');
  assert.equal((await p.evaluate(() => Book.state())).results.saturnus.correct, false);
  // party: Neptune is recruited later in the story; toggle him in and out
  await p.evaluate(() => Book.recruit('neptunus'));
  await p.click('#book button:has-text("Claudāmus")');
  assert(!(await st()).msgOpen, 'book closes');
  await p.keyboard.press('b');
  await p.click('#book button.pty');
  assert.deepEqual((await p.evaluate(() => Book.state())).party, ['neptunus']);
  await p.screenshot({ path: process.env.SHOT || '/tmp/step4.png' });
  await p.click('#book button.pty');
  assert.deepEqual((await p.evaluate(() => Book.state())).party, []);

  // --- English mode: English button with small Latin label
  await open('?lang=en&drafts=1');
  await p.evaluate(() => Battle.start());
  await p.waitForTimeout(1700);
  const lab = (await p.textContent('#choices button')).replace(/\s+/g, ' ').trim();
  assert.equal(lab, 'Thunder! Tonā!', 'English label: ' + lab);
  assert.deepEqual(errs, []);
  await b.close(); console.log('all OK');
})().catch(e => { console.error(e); process.exit(1); });
