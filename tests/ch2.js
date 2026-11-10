// Chapter 2: Crete. Gate shut, feed Amalthea, the Curetes, two guard battles (shield used), gate opens, Chapter 3 begins.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, text, cont, pcont, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=2', { luck: 'crit' });
  assert.equal((await st()).map, 'ida');
  await H.goTo(18, 6); await H.bump('R'); assert((await H.toast()).includes('Nōndum'), 'the gate is shut at first');
  await H.talk('amalthea'); assert((await text()).includes('ēsurit')); await cont();               // hungry, no grass yet
  await H.useChar('H'); assert((await H.toast()).includes('herba'));                                // pick up the grass (no dialogue)
  await H.talk('amalthea'); assert((await text()).includes('Quid capellae dās?')); await H.choose('Saxum');
  assert((await text()).includes('saxum nōn ēdit')); await cont();
  await H.choose('Herbam'); assert((await text()).includes('herbam ēdit')); await cont(); await cont();
  assert((await st()).flags.amalthea);
  assert.deepEqual((await p.evaluate(() => Book.partyInfo())).helpers, ['amalthea']);
  await H.talk('curetes1'); assert((await text()).includes('adsunt')); await cont();
  await H.choose('Dormiunt'); assert((await text()).includes('propius veniunt')); await cont();
  await H.choose('Scūta pulsant'); assert((await text()).includes('nihil audiunt')); await cont();
  assert((await text()).includes('Nūbibus')); await cont();
  let f = (await st()).flags; assert(f.curetes && f.nubes);
  await H.talk('guard1');                                                                          // guard 1
  assert((await text()).includes('Īnfāns hīc est')); await cont();
  assert((await text()).includes('Saturnō dō')); assert(!(await p.evaluate(() => Battle.active))); await cont();
  assert((await st()).msgOpen, 'locked during the wipe');
  await battleReady();
  const cmds = await p.$$eval('#choices button', bs => bs.map(b => b.textContent));
  assert(cmds.some(c => c.includes('Tonā')) && cmds.some(c => c.includes('Nūbibus')) && cmds.some(c => c.includes('Iovī lac')), 'party commands: ' + cmds);
  assert(!cmds.some(c => c.includes('Scūta pulsā')), 'the escape move is gone');
  await cmd('Nūbibus'); assert((await text()).includes('Hasta nihil ferit')); assert.equal(await p.evaluate(() => Battle.teamHp), 4);
  await cmd('Tonā'); await cmd('Tonā');                                                          // two critical hits
  await H.won();
  assert((await st()).flags.guard1, 'guard 1 beaten');
  await H.talk('wolf'); assert((await text()).includes('Lupus fremit')); await cont(); await battleReady();
  assert.equal(await p.evaluate(() => Battle.def.pattern.join()), 'double,light,double', 'a wolf bites twice');
  await cmd('Tonā'); await cmd('Tonā');
  await H.won();                                                                                    // 25 + 30 xp: level 2, choose a boon
  assert.equal(await p.evaluate(() => Prog.level), 2); assert.equal(await p.evaluate(() => Prog.boons.vita), 1, 'the boon was chosen');
  assert((await text()).includes('Via aperta')); await cont();
  const bd = await p.evaluate(() => Score.breakdown().reduce((o, r) => (o[r.key] = r.pts, o), {}));
  assert.equal(bd.battles, 300); assert.equal(bd.allies, 200); assert.equal(bd.choice, 100);
  await H.goTo(18, 6); await H.bump('R');                                                          // out through the gate to Chapter 3
  await pcont(); await pcont();
  assert.equal((await st()).map, 'oceanus');
  await H.finish('ch2');
})().catch(e => { console.error(e); process.exit(1); });
