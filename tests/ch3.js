// Chapter 3: Metis, the cup (a scene you watch), the five siblings, the war's first battle, then Tartarus.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, text, cont, pcont, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=3', { luck: 'crit' });
  assert.equal((await st()).map, 'oceanus');
  await H.goTo(9, 11); await H.bump('D'); assert((await H.toast()).includes('exspectat'));           // Metis first
  await H.talk('metis'); assert((await text()).includes('dea sapiēns')); await cont(); assert((await text()).includes('medicāmentum')); await cont();
  assert((await st()).flags.metis);
  await H.goTo(9, 11); await H.bump('D');
  await p.waitForFunction(() => Game.state().map === 'hall2', null, { timeout: 8000 }); await H.scene();
  await H.goTo(10, 11); await H.bump('D'); assert((await H.toast()).includes('nōndum bibit'), 'the exit is shut until Saturn drinks');
  await H.talk('saturn'); assert((await text()).includes('Saturnus pōculum poscit')); await cont();
  assert((await text()).includes('Cui pōculum dās?')); await H.choose('Custōdī');
  assert((await text()).includes('nōn accipit')); await cont();
  await H.choose('Saturnō');
  assert(await p.evaluate(() => new Promise(r => setTimeout(() => r(Game.state().scene), 300))), 'the cup is a cutscene: Saturn drinks, turns green, and brings it all up');
  await p.waitForFunction(() => Game.state().flags.cupWar, null, { timeout: 60000 });
  const info = await p.evaluate(() => ({ party: Book.state().party, stone: Story.flags.stoneOut }));
  assert.deepEqual(info.party, ['neptunus', 'pluto', 'iuno'], 'the first three siblings join the party'); assert(info.stone, 'the stone lies on the floor');
  // the war begins with something you see: Saturn orders the guards in, they storm the hall, then the fight starts (no lone guard, no text)
  await battleReady();
  const cmds = await p.$$eval('#choices button', bs => bs.map(b => b.textContent.trim()));
  ['Tonā', 'Tridente', 'Galeam', 'Hostēs', 'Cōnsilium'].forEach(c => assert(cmds.some(x => x.includes(c)), c + ' in ' + cmds));
  assert.equal(await p.evaluate(() => Battle.def.key), 'dux', 'the guards\' captain, not another guard');
  assert.equal(await p.evaluate(() => Battle.def.pattern.join()), 'light,guard,heavy');
  await cmd('Cōnsilium'); await cmd('Tridente'); await cmd('Tridente');                              // a critical blow breaks even a raised shield
  await H.won();
  assert((await st()).flags.guardH); await H.scene();                                              // the guards run for the doors
  assert.equal(await p.evaluate(() => Story.flags.guardsGone), true);
  await H.goTo(10, 11); await H.bump('D');                                                         // out through the door: on to Tartarus
  await pcont(); await pcont();
  assert.equal((await st()).map, 'tartarus');
  await H.finish('ch3');
})().catch(e => { console.error(e); process.exit(1); });
