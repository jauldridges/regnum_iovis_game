// Chapter 3: Metis, the cup, the five siblings, an optional battle with the party, the finale.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, walk, act, text, cont, choose, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=3');
  assert.equal((await st()).map, 'oceanus');
  await walk('D1'); assert((await text()).includes('exspectat')); await cont();      // Metis first
  await walk('U4 R1'); await act();
  assert((await text()).includes('dea sapiēns')); await cont(); assert((await text()).includes('medicāmentum')); await cont();
  assert((await st()).flags.metis);
  await walk('D5 D1'.replace(' D1', ''));                    // down to the south exit
  await p.waitForFunction(() => Game.state().map === 'hall2', null, { timeout: 5000 });
  await walk('D1'); assert((await text()).includes('nōndum bibit')); await cont();   // exit shut until Saturn drinks
  await walk('U5 L1'); await act();                          // Jupiter brings the cup to Saturn
  await cont(); await cont();
  assert((await text()).includes('Cui pōculum dās?')); await choose(2);
  assert((await text()).includes('nōn accipit')); await cont();
  await choose(1);
  const seen = [];
  for (let i = 0; i < 9; i++) { seen.push(await text()); await cont(); }
  assert(seen[0].includes('Iuppiter Saturnō pōculum dat'));
  assert(seen[2].includes('saxum exit'));
  ['Neptūnus', 'Plūtō', 'Iūnō', 'Cerēs', 'Vesta'].forEach((n, i) => assert(seen[3 + i].includes(n + ' ex Saturnō exit'), seen[3 + i]));   // reverse order
  assert(seen[8].includes('Bellum incipit'));
  const party = await p.evaluate(() => Book.state().party);
  assert.deepEqual(party, ['neptunus', 'pluto', 'iuno'], 'first three siblings join the party');
  assert((await st()).flags.cupDone);
  // optional battle with the strong guard (6 hit points): the party's moves are needed
  await walk('D3 R3 R1'); await act(); await cont(); await battleReady();
  const cmds = await p.$$eval('#choices button', bs => bs.map(b => b.textContent.trim()));
  ['Tonā', 'Tridente', 'Galeam', 'Hostēs', 'Cōnsilium'].forEach(c => assert(cmds.some(x => x.includes(c)), c + ' in ' + cmds));
  await cmd('Cōnsilium'); await cmd('Tridente'); await cmd('Tridente');
  await p.screenshot({ path: process.env.SHOT || '/tmp/ch3.png' });
  await cmd('Tonā');
  await p.waitForFunction(() => !Battle.active);
  assert((await st()).flags.guardH);
  // out through the door: the finale
  await walk('L3 D3 D1');
  await p.waitForSelector('#finale:not([hidden])', { timeout: 6000 });
  await p.waitForSelector('#finale .again', { timeout: 10000 });
  const ft = await p.textContent('#finale');
  assert(ft.includes('Fīnis') && ft.includes('Proelia victa') && ft.includes('Sociī'), ft);
  await H.finish('ch3');
})().catch(e => { console.error(e); process.exit(1); });
