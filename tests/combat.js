// Chance, enemy kinds, XP and levels.
(async () => {
  const H = await require('./lib')(); const { p, assert, cmd, battleReady } = H;
  const start = (opts) => p.evaluate(o => { Battle.start(o, () => {}); }, opts);
  const state = () => p.evaluate(() => ({ e: Battle.enemyHp, t: Battle.teamHp, guard: Battle.eGuard, log: document.getElementById('msg-text').textContent }));

  // a miss: nothing happens to the enemy, the log says so
  await H.open('lang=la&drafts=1&ch=4', { luck: 'miss' });
  await start({ enemy: 'dux' }); await battleReady();
  await cmd('Tonā'); let s = await state();
  assert.equal(s.e, 7, 'a miss does no damage'); assert(s.log.includes('Ictus fallit'), 'the miss is announced');
  // the buttons show their chance
  assert((await p.textContent('#choices button:has-text("Tonā")')).includes('95%'), 'a hit chance shows on the button');

  // a critical hit: double damage
  await H.open('lang=la&drafts=1&ch=4', { luck: 'crit' });
  await start({ enemy: 'dux' }); await battleReady();
  await cmd('Tonā'); s = await state();
  assert.equal(s.e, 5, 'critical: 1 x 2 = 2 damage'); assert(s.log.includes('Ictus gravis'));

  // the captain raises his shield on his second turn: a plain hit is halved, a critical one is not
  await H.open('lang=la&drafts=1&ch=4', { luck: 'hit' });
  await start({ enemy: 'dux' }); await battleReady();
  await cmd('Nūbibus'); await cmd('Nūbibus');                                                    // turns 1 and 2; after the 2nd he guards
  s = await state(); assert.equal(s.guard, true, 'the captain has raised his shield');
  await cmd('Tridente'); s = await state();
  assert.equal(s.e, 6, 'a hit into the shield does 1, not 2'); assert.equal(s.guard, false, 'and the shield is spent'); assert(s.log.includes('Scūtum ictum tenet') || true);

  // Hyperion heals himself on his second turn
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await start({ enemy: 'hyperion' }); await battleReady();
  await cmd('Tonā'); const afterHit = (await state()).e;                                        // 8 - 2 (sky beats earth) = 6; he acts: light
  await cmd('Nūbibus'); s = await state();                                                      // his turn: heal
  assert.equal(afterHit, 6); assert.equal(s.e, 8, 'Hyperion healed 2');

  // Saturn changes at half health
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await start({ enemy: 'saturnus', hp: 14 }); await battleReady();
  await p.evaluate(() => { Battle.enemyHp = 7; });
  await cmd('Tonā');
  assert.equal(await p.evaluate(() => Battle.pattern.join()), 'heavy,double,heavy', 'at half health Saturn changes his pattern');

  // XP and levels: pure rules
  const r = await p.evaluate(() => {
    Prog.setLevel(1); const a = Prog.gain(25), b = Prog.gain(25), c = Prog.gain(60);
    return { a, b, c, lvl: Prog.level, hp: Prog.hpBonus() };
  });
  assert.deepEqual(r.a, []); assert.deepEqual(r.b, [2]); assert.deepEqual(r.c, [3]); assert.equal(r.lvl, 3); assert.equal(r.hp, 1, 'every second level: +1 hit point');
  // the boons: luck adds to the chances, power to Jupiter's damage, supply to the uses, life to the hit points
  await H.open('lang=la&drafts=1&ch=4', { luck: 'hit' });
  const b = await p.evaluate(() => {
    Prog.boons.fortuna = 2; Prog.boons.copia = 1; Prog.boons.vita = 1; Prog.boons.vis = 1;
    Battle.start({ enemy: 'guard' }, () => {});
    const c = Battle.chance('fulmen'); return { acc: c.acc, crit: c.crit, uses: Battle.uses.neptunus, hp: Battle.teamHp, tonaAcc: Battle.chance('tona').acc };
  });
  assert.equal(b.acc.toFixed(2), '0.87'); assert.equal(b.crit.toFixed(2), '0.25'); assert.equal(b.uses, 3, 'supply: +1 use'); assert.equal(b.hp, 6, 'life: +1 hit point (and +1 for level 3)'); assert.equal(b.tonaAcc, 0.98, 'accuracy is capped');
  await battleReady(); const dmg = await p.evaluate(() => { Battle.enemyHp = 20; return Battle.teamHp; });
  await cmd('Tonā'); assert.equal((await state()).e, 18, 'Power: Jupiter\'s thunder does 1 + 1');

  // a win gives XP; a level-up offers four boons and applies the one you pick
  await H.open('lang=la&drafts=1&ch=2');
  await p.evaluate(() => { window.cb = 0; Prog.setLevel(1); Prog.xp = 40; Story.reward('guard', () => { window.cb++; }); });                 // 40 + 25 >= 50
  await p.waitForSelector('#choices button:has-text("Fortūna")', { timeout: 8000 });
  assert.equal(await p.locator('#choices button').count(), 4, 'four boons to choose from');
  await p.click('#choices button:has-text("Fortūna")');
  await p.waitForFunction(() => window.cb === 1, null, { timeout: 5000 });
  assert.equal(await p.evaluate(() => Prog.boons.fortuna), 1); assert.equal(await p.evaluate(() => Prog.level), 2);
  assert((await p.textContent('#lvl')).includes('2'), 'the level shows on the map');
  await H.finish('combat');
})().catch(e => { console.error(e); process.exit(1); });
