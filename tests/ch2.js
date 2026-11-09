// Chapter 2: Crete. Gate shut, feed Amalthea, the Curetes, two guard battles (shield used), gate opens, Chapter 3 begins.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, walk, act, text, cont, choose, pcont, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=2');
  assert.equal((await st()).map, 'ida');
  await walk('D2 R11 R1');                                   // the gate is shut at first
  assert((await text()).includes('Nōndum')); await cont();
  await walk('L10 U1 R1'); await act();                      // Amalthea is hungry, no grass yet
  assert((await text()).includes('ēsurit')); await cont();
  await walk('U1 R6 U1'); await act();                       // pick up the grass
  assert((await text()).includes('herba')); await cont();
  await walk('L5 D1'); await act();                          // feed Amalthea: wrong, then right
  assert((await text()).includes('Quid capellae dās?')); await H.chooseLabel('Saxum');
  assert((await text()).includes('saxum nōn ēdit')); await cont();
  await H.chooseLabel('Herbam'); assert((await text()).includes('herbam ēdit')); await cont(); await cont();
  assert((await st()).flags.amalthea);
  assert.deepEqual((await p.evaluate(() => Book.partyInfo())).helpers, ['amalthea']);
  await walk('R7 D2 D1'); await act();                       // the Curetes: wrong, then right
  assert((await text()).includes('adsunt')); await cont();
  await H.chooseLabel('Dormiunt'); assert((await text()).includes('propius veniunt')); await cont();
  await H.chooseLabel('Scūta pulsant'); assert((await text()).includes('nihil audiunt')); await cont();
  assert((await text()).includes('Nūbibus')); await cont();
  let f = (await st()).flags; assert(f.curetes && f.nubes);
  await walk('L6 D1 D1'); await act();                       // guard 1
  assert((await text()).includes('Īnfāns hīc est')); await cont();
  assert((await text()).includes('Saturnō dō')); assert(!(await p.evaluate(() => Battle.active))); await cont();
  assert((await st()).msgOpen, 'locked during the wipe');
  await battleReady();
  let cmds = await p.$$eval('#choices button', bs => bs.map(b => b.textContent));
  assert(cmds.some(c => c.includes('Tonā')) && cmds.some(c => c.includes('Nūbibus')) && cmds.some(c => c.includes('Iovī lac')), 'party commands: ' + cmds);
  await cmd('Nūbibus');                                      // shield blocks the first spear
  assert((await text()).includes('Hasta nihil ferit')); assert.equal(await p.evaluate(() => Battle.teamHp), 4);
  await cmd('Tonā'); await cmd('Tonā'); await cmd('Tonā');
  await p.waitForFunction(() => !Battle.active);
  f = (await st()).flags; assert(f.guard1, 'guard 1 beaten');
  await walk('D1 R6 D1'); await act();                       // guard 2
  await cont(); await cont(); await battleReady();
  await cmd('Tonā'); await cmd('Iovī lac'); await cmd('Tonā'); await cmd('Tonā');
  await p.waitForFunction(() => !Battle.active);
  assert((await text()).includes('Via aperta')); await cont();
  const bd = await p.evaluate(() => Score.breakdown().reduce((o, r) => (o[r.key] = r.pts, o), {}));
  assert.equal(bd.battles, 300); assert.equal(bd.allies, 200); assert.equal(bd.choice, 100);   // Amalthea and Curetes recruited by hand, choices missed once
  await walk('R2 U2 R1');                                    // out through the gate to Chapter 3
  await pcont(); await pcont();
  assert.equal((await st()).map, 'oceanus');
  await H.finish('ch2');
})().catch(e => { console.error(e); process.exit(1); });
