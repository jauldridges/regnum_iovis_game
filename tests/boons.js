// What Chapter 1 carries into the rest of the game: the keepsake, and a suspicious Saturn.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, text, cont } = H;
  await H.open('lang=la&drafts=1&ch=2');
  // honey: Amalthea joins at once, no grass needed; shield: the Curetes join at once
  await p.evaluate(() => { Story.flags.item = 'mel'; });
  await H.talk('amalthea'); assert((await text()).includes('Capella mel amat')); await cont(); await cont();
  assert((await st()).flags.amalthea);
  await p.evaluate(() => { Story.flags.item = 'scutum'; });
  await H.talk('curetes1'); assert((await text()).includes('scūtum laudant')); await cont(); assert((await text()).includes('Nūbibus')); await cont();
  const f = (await st()).flags; assert(f.curetes && f.nubes);
  // a suspicious Saturn: a third guard, and the gate waits for him
  await p.evaluate(() => { Story.flags.suspect = true; Story.flags.guard1 = Story.flags.wolf = true; });
  assert(await H.entPos('guard3'), 'the third guard is there');
  assert.equal(await p.evaluate(() => Story.canExit('ida_east')), false, 'the gate stays shut');
  await p.evaluate(() => { Story.flags.guard3 = true; }); assert.equal(await p.evaluate(() => Story.canExit('ida_east')), true);
  // the keepsake in battle
  const begin = async (item, team) => { await H.open('lang=la&drafts=1&ch=2'); await p.evaluate(([item, team]) => { Story.flags.item = item; Story.flags.nubes = true; Battle.start({ enemy: 'dux', team }, () => {}); }, [item, team]); await H.turnReady(); };
  await begin(null, ['iuppiter']); assert.equal(await p.evaluate(() => Battle.maxOf('iuppiter')), 6);
  await begin('pallium', ['iuppiter']); assert.equal(await p.evaluate(() => Battle.maxOf('iuppiter')), 7, 'the cloak: one more hit point');
  await begin(null, ['iuppiter']); await H.act('Nūbibus'); assert.equal(await p.evaluate(() => Battle.cdOf('iuppiter', 'nubes')), 2);
  await begin('scutum', ['iuppiter']); await H.act('Nūbibus'); assert.equal(await p.evaluate(() => Battle.cdOf('iuppiter', 'nubes')), 1, 'the shield: the cloud rests less');
  await begin(null, ['iuppiter', 'amalthea']); await H.act('Sē tege'); await H.act('Iovī lac'); assert.equal(await p.evaluate(() => Battle.cdOf('amalthea', 'amalthea')), 2);
  await begin('mel', ['iuppiter', 'amalthea']); await H.act('Sē tege'); await H.act('Iovī lac'); assert.equal(await p.evaluate(() => Battle.cdOf('amalthea', 'amalthea')), 1, 'the honey: Amalthea heals more often');
  await H.finish('boons');
})().catch(e => { console.error(e); process.exit(1); });
