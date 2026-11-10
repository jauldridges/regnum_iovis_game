// Chapter 4: Tartarus. Inscription, Campe (underworld: fire is strong, sky is weak), the Cyclopes' three gifts,
// the Hundred-Handers, then on to Chapter 5.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, text, cont, pcont, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=4');
  assert.equal((await st()).map, 'tartarus');
  await p.evaluate(() => Book.setParty(['vesta', 'neptunus', 'pluto']));
  await H.goTo(10, 11); await H.bump('D'); assert((await H.toast()).includes('sociōs līberā'));       // the exit is shut
  await H.useChar('I'); assert((await H.toast()).includes('Campē hīc custōs'));
  await H.talk('campe');
  assert((await text()).includes('Campē custōs Tartarī')); await cont(); assert((await text()).includes('Nēmō hinc exit')); await cont();
  await battleReady();
  assert.equal(await p.evaluate(() => Battle.def.el), 'inferi');
  assert.equal(await p.evaluate(() => Battle.teamHp), 5, 'the team is a little tougher in chapter 4');
  await cmd('Tonā'); assert((await text()).includes('Parvum vulnus'), 'sky is weak against the underworld');
  await cmd('Ignem accende'); assert((await text()).includes('Magnum vulnus'), 'fire beats the underworld');
  assert.equal(await p.evaluate(() => Battle.enemyHp), 3);
  await cmd('Ignem accende');
  await H.won(); await H.scene(); assert(!(await p.evaluate(() => MAPS.tartarus.rows.join('').includes('G'))), 'the cells are open');
  await p.screenshot({ path: process.env.SHOT || '/tmp/ch4.png' });
  // the Cyclopes: three gifts, three datives
  await H.talk('cyclops2');
  assert((await text()).includes('Cyclōpēs līberat')); await cont();
  assert((await text()).includes('fulmen dant?')); await H.choose('Plūtōnī');
  assert((await text()).includes('Nōn ita')); await cont();
  await H.choose('Iovī'); assert((await text()).includes('Iovī fulmen dant')); await cont();
  assert((await text()).includes('tridentem dant?')); await H.choose('Neptūnō');
  assert((await text()).includes('Neptūnō tridentem dant')); await cont();
  assert((await text()).includes('galeam dant?')); await H.choose('Plūtōnī');
  assert((await text()).includes('Plūtōnī galeam dant')); await cont(); await cont();
  assert((await text()).includes('Fulmen iace')); await cont(); await H.calm();
  let f = (await st()).flags; assert(f.cyclopes && f.fulmen && f.weapons);
  // the Hundred-Handers
  await H.talk('cent2');
  assert((await text()).includes('Centimanī līberī')); await cont(); await cont(); await H.calm();
  assert((await text()).includes('Via aperta')); await cont();
  assert.deepEqual((await p.evaluate(() => Book.partyInfo())).helpers.sort(), ['amalthea', 'centimani', 'curetes', 'cyclopes', 'metis']);
  await H.goTo(10, 11); await H.bump('D');
  await pcont(); await pcont();
  assert.equal((await st()).map, 'olympus');
  await H.finish('ch4');
})().catch(e => { console.error(e); process.exit(1); });
