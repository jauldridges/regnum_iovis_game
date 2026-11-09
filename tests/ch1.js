// Prologue (3-second pause, questions) then Chapter 1 (Ops in Saturn's hall) up to arriving in Crete.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, walk, act, text, cont, choose, pcont } = H;
  // 1. the real 3-second pause on the first prologue card
  await H.open('lang=la&drafts=1', { pause: null });
  await p.waitForSelector('#story .page');
  assert(await p.isDisabled('#story button'), 'first card waits');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  assert(await p.isDisabled('#story button'), 'Enter does nothing during the pause');
  await p.waitForTimeout(2500); assert(!(await p.isDisabled('#story button')), 'enabled after 3s');

  // 2. the whole prologue (quick pause)
  await H.open('lang=la&drafts=1');
  await p.waitForSelector('#story .page');
  const pt = () => p.textContent('#story');
  assert((await pt()).includes('Prīmō erat Chaos')); await pcont();
  assert((await pt()).includes('Titānās')); await pcont();
  await pcont();                                              // pro_3
  assert((await pt()).includes('falcem dat')); await pcont();
  assert((await pt()).includes('Quis Saturnō falcem dat?'));
  await H.pick('Caelus'); assert((await pt()).includes('Relege')); await pcont();
  assert((await pt()).includes('falcem dat'), 'wrong answer goes back to the text'); await pcont();
  await H.pick('Terra'); assert((await pt()).includes('Rēctē')); await pcont();
  assert((await pt()).includes('Saturnus patrem vincit')); await pcont();
  await p.waitForFunction(() => document.getElementById('story').classList.contains('black'), null, { timeout: 3000 });   // fade to black
  await p.waitForFunction(() => document.getElementById('story').textContent.includes('Fīlius tuus'), null, { timeout: 4000 });
  await pcont();
  await H.pick('Terra'); await pcont(); await pcont();       // miss, re-read, miss again
  await H.pick('Caelus');
  assert((await pt()).includes('Responsum rēctum: Fīlius Saturnī'), 'second miss shows the answer'); await pcont();
  assert((await pt()).includes('Aula Saturnī')); await pcont();     // chapter title

  // 3. Chapter 1
  assert.equal((await st()).map, 'hall');
  await walk('U3 R2 U1'); await act();
  assert((await text()).includes('sella Saturnī')); await cont();
  await walk('L3 U1'); await act(); assert((await text()).includes('dormit')); await cont();
  await walk('R9 U3'); await act(); assert((await text()).includes('falx')); await cont();
  await walk('D3 L1'); await act();                            // the servant
  assert((await text()).includes('Cēlā')); await cont();
  assert((await text()).includes('poscit')); await cont();
  assert((await text()).includes('Quid Ops')); await choose(2);   // the baby: wrong
  assert((await text()).includes('retrahit')); await cont();
  assert((await text()).includes('Quid Ops')); await choose(1);   // the stone
  await cont(); await cont(); await cont();
  assert((await pt()).includes('in Crētam portat')); await pcont();
  assert((await pt()).includes('Crēta')); await pcont();
  assert.equal((await st()).map, 'ida'); assert.equal((await st()).ch, 2);
  const bd = await p.evaluate(() => Score.breakdown().reduce((o, r) => (o[r.key] = r.pts, o), {}));
  assert.equal(bd.objects, 60); assert.equal(bd.choice, 50); assert.equal(bd.story, 25);
  await H.finish('ch1');
})().catch(e => { console.error(e); process.exit(1); });
