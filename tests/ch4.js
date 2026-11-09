// Chapter 4: Tartarus. Inscription, Campe (underworld: fire is strong, sky is weak), the Cyclopes' three gifts,
// the Hundred-Handers, then on to Chapter 5.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, walk, act, text, cont, pcont, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=4');
  assert.equal((await st()).map, 'tartarus');
  await p.evaluate(() => Book.setParty(['vesta', 'neptunus', 'pluto']));
  await walk('D1'); assert((await text()).includes('sociōs līberā')); await cont();       // the exit is shut
  await walk('L4 U7 L1 U1'); await act(); assert((await text()).includes('Campē hīc custōs')); await cont();
  await walk('R5 D2 D1'); await act();                                                    // Campe
  assert((await text()).includes('Campē custōs Tartarī')); await cont(); assert((await text()).includes('Nēmō hinc exit')); await cont();
  await battleReady();
  assert.equal(await p.evaluate(() => Battle.def.el), 'inferi');
  assert.equal(await p.evaluate(() => Battle.teamHp), 5, 'the team is a little tougher in chapter 4');
  await cmd('Tonā'); assert((await text()).includes('Parvum vulnus'), 'sky is weak against the underworld');
  await cmd('Ignem accende'); assert((await text()).includes('Magnum vulnus'), 'fire beats the underworld');
  assert.equal(await p.evaluate(() => Battle.enemyHp), 3);
  await cmd('Ignem accende');
  await p.waitForFunction(() => !Battle.active);
  assert((await text()).includes('Claustra patent')); await cont();
  await p.screenshot({ path: process.env.SHOT || '/tmp/ch4.png' });
  // the Cyclopes: three gifts, three datives
  await walk('D3 L5 L1'); await act();
  assert((await text()).includes('Cyclōpēs līberat')); await cont();
  assert((await text()).includes('fulmen dant?')); await H.chooseLabel('Plūtōnī');
  assert((await text()).includes('Nōn ita')); await cont();
  await H.chooseLabel('Iovī'); assert((await text()).includes('Iovī fulmen dant')); await cont();
  assert((await text()).includes('tridentem dant?')); await H.chooseLabel('Neptūnō');
  assert((await text()).includes('Neptūnō tridentem dant')); await cont();
  assert((await text()).includes('galeam dant?')); await H.chooseLabel('Plūtōnī');
  assert((await text()).includes('Plūtōnī galeam dant')); await cont(); await cont();
  assert((await text()).includes('Fulmen iace')); await cont();
  let f = (await st()).flags; assert(f.cyclopes && f.fulmen && f.weapons);
  // the Hundred-Handers
  await walk('R10 R1'); await act();
  assert((await text()).includes('Centimanī līberī')); await cont(); await cont();
  assert((await text()).includes('Via aperta')); await cont();
  assert.deepEqual((await p.evaluate(() => Book.partyInfo())).helpers.sort(), ['amalthea', 'centimani', 'curetes', 'cyclopes', 'metis']);
  await walk('L5 D4');
  await pcont(); await pcont();
  assert.equal((await st()).map, 'olympus');
  await H.finish('ch4');
})().catch(e => { console.error(e); process.exit(1); });
