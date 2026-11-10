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
  const probe = async item => p.evaluate(item => { Story.flags.item = item; Battle.start({ enemy: 'guard', hp: 3 }, () => {}); return { hp: Battle.teamHp, nubes: Battle.uses.nubes, amal: Battle.uses.amalthea }; }, item);
  assert.deepEqual(await probe(null), { hp: 4, nubes: 2, amal: 2 });
  assert.deepEqual(await probe('pallium'), { hp: 5, nubes: 2, amal: 2 }, 'the cloak: one more hit point');
  assert.deepEqual(await probe('scutum'), { hp: 4, nubes: 3, amal: 2 }, 'the shield: one more cloud');
  assert.deepEqual(await probe('mel'), { hp: 4, nubes: 2, amal: 3 }, 'the honey: Amalthea heals more often');
  await H.finish('boons');
})().catch(e => { console.error(e); process.exit(1); });
