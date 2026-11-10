// Chance, enemy kinds, XP and levels.
(async () => {
  const H = await require('./lib')(); const { p, assert, cmd, battleReady } = H;
  const start = (opts) => p.evaluate(o => { Battle.start(o, () => {}); }, opts);
  const solo = (o) => start(Object.assign({ team: ['iuppiter'] }, o));
  const hist = () => p.evaluate(() => Battle.history.join(' | '));
  const state = () => p.evaluate(() => ({ e: Battle.enemyHp, guard: Battle.eGuard, log: Battle.history.join(' | ') }));

  // a miss: nothing happens to the enemy, the log says so
  await H.open('lang=la&drafts=1&ch=4', { luck: 'miss' });
  await solo({ enemy: 'dux' }); await battleReady();
  await H.act('Tonā'); let s = await state();
  assert.equal(s.e, 14, 'a miss does no damage'); assert(s.log.includes('Ictus fallit'), 'the miss is announced');

  // the buttons show their chance
  await H.open('lang=la&drafts=1&ch=4', { luck: 'crit' });
  await solo({ enemy: 'dux' }); await battleReady();
  assert((await p.textContent('#choices button:has-text("Tonā")')).includes('95%'), 'a hit chance shows on the button');
  // a critical hit: double damage
  await H.act('Tonā'); s = await state();
  assert.equal(s.e, 10, 'critical: 2 x 2 = 4 damage'); assert(s.log.includes('Ictus gravis'));

  // the captain raises his shield on his second turn: a plain hit is halved
  await H.open('lang=la&drafts=1&ch=4', { luck: 'hit' });
  await solo({ enemy: 'dux' }); await battleReady();
  await H.act('Sē tege'); await H.act('Sē tege');                                                  // two rounds; after the 2nd he guards
  await H.turnReady(); s = await state(); assert.equal(s.guard, true, 'the captain has raised his shield');
  await H.act('Tonā'); s = await state();
  assert.equal(s.e, 13, 'a hit into the shield does 1, not 2'); assert.equal(s.guard, false, 'and the shield is spent');

  // Hyperion heals himself on his second turn (the sky beats the earth: Thunder does 4)
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await solo({ enemy: 'hyperion' }); await battleReady();
  await H.act('Tonā'); await H.turnReady(); const afterHit = (await state()).e;
  await H.act('Tonā'); await H.turnReady(); s = await state();
  assert.equal(afterHit, 14); assert.equal(s.e, 15, 'Hyperion took 4 and healed 5');

  // Saturn changes at half health
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await solo({ enemy: 'saturnus' }); await battleReady();
  await p.evaluate(() => { Battle.enemyHp = 16; });
  await H.act('Tonā'); await H.turnReady();
  assert.equal(await p.evaluate(() => Battle.pattern.join()), 'heavy,double,heavy', 'at half health Saturn changes his pattern');

  // moves rest after use: Fulmen is off for three of Jupiter's turns
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await solo({ enemy: 'saturnus' }); await battleReady();
  await H.act('Fulmen'); await H.turnReady();
  assert.equal(await p.evaluate(() => Battle.cdOf('iuppiter', 'fulmen')), 3);
  assert((await H.buttons()).some(c => c.includes('Fulmen') && c.includes('[off]')), 'a resting move cannot be pressed');
  // XP and levels: pure rules
  const r = await p.evaluate(() => {
    Prog.setLevel(1); const a = Prog.gain(25), b = Prog.gain(25), c = Prog.gain(60);
    return { a, b, c, lvl: Prog.level, hp: Prog.hpBonus() };
  });
  assert.deepEqual(r.a, []); assert.deepEqual(r.b, [2]); assert.deepEqual(r.c, [3]); assert.equal(r.lvl, 3); assert.equal(r.hp, 1, 'every second level: +1 hit point');
  // the boons: luck adds to the chances, power to Jupiter's damage, supply shortens rests, life to the hit points
  await H.open('lang=la&drafts=1&ch=4', { luck: 'hit' });
  const b = await p.evaluate(() => {
    Story.flags.fulmen = true; Prog.boons.fortuna = 2; Prog.boons.copia = 1; Prog.boons.vita = 1; Prog.boons.vis = 1;
    Battle.start({ enemy: 'guard', team: ['iuppiter'], hp: 20, max: 20 }, () => {});
    const c = Battle.chance('fulmen'); return { acc: c.acc, crit: c.crit, hp: Battle.maxOf('iuppiter'), tonaAcc: Battle.chance('tona').acc };
  });
  assert.equal(b.acc.toFixed(2), '0.87'); assert.equal(b.crit.toFixed(2), '0.25'); assert.equal(b.hp, 8, 'life: +1 hit point (and +1 for level 3)'); assert.equal(b.tonaAcc, 0.98, 'accuracy is capped');
  await battleReady();
  await H.act('Tonā'); assert.equal((await state()).e, 17, 'Power: Jupiter\'s thunder does 2 + 1');
  await H.turnReady(); await H.act('Fulmen');
  await H.turnReady(); assert.equal(await p.evaluate(() => Battle.cdOf('iuppiter', 'fulmen')), 2, 'Supply: a rest of 3 becomes 2');

  // a win gives XP; a level-up offers four boons and applies the one you pick
  await H.open('lang=la&drafts=1&ch=2');
  await p.evaluate(() => { window.cb = 0; Prog.setLevel(1); Prog.xp = 40; Story.reward('guard', () => { window.cb++; }); });                 // 40 + 25 >= 50
  await p.waitForSelector('#choices button:has-text("Fortūna")', { timeout: 8000 });
  assert.equal(await p.locator('#choices button').count(), 4, 'four boons to choose from');
  await p.click('#choices button:has-text("Fortūna")');
  await p.waitForFunction(() => window.cb === 1, null, { timeout: 5000 });
  assert.equal(await p.evaluate(() => Prog.boons.fortuna), 1); assert.equal(await p.evaluate(() => Prog.level), 2);
  assert((await p.textContent('#lvl')).includes('2'), 'the level shows on the map');
  // keyboard: every command has a key; pressing 1 plays the first command (thunder) with no clicking
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await solo({ enemy: 'dux' }); await battleReady();
  const labels = await p.$$eval('#choices button .kbd', ks => ks.map(k => k.textContent));
  assert.deepEqual(labels.slice(0, 3), ['1', '2', '3'], 'commands are numbered');
  const before = (await state()).e; await p.keyboard.press('1'); await p.waitForFunction(() => Battle.picks > 0, null, { timeout: 5000 });
  assert((await state()).e < before, 'the 1 key played the first command');
  assert.deepEqual(await p.evaluate(() => Sound.log.filter(n => n === 'hit' || n === 'crit' || n === 'miss').length > 0), true, 'a sound effect played');

  // the command box never covers the picture: it sits below the screen, with a full team of four
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await start({ enemy: 'saturnus', team: ['iuppiter', 'neptunus', 'pluto', 'vesta'] }); await battleReady();
  for (const [w, h] of [[1366, 768], [1280, 720], [1024, 700]]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const c = document.getElementById('game').getBoundingClientRect(), m = document.getElementById('msg').getBoundingClientRect(); return { canvasBottom: c.bottom, msgTop: m.top }; });
    assert(r.msgTop >= r.canvasBottom - 1, `box overlaps the picture at ${w}x${h}: box top ${r.msgTop} < picture bottom ${r.canvasBottom}`);
  }

  // captions last long enough to read: more than 4 seconds for a long sentence, never under 1.8
  assert.equal(await p.evaluate(() => Game.captionMs('x'.repeat(8))), 2180 > 1800 ? 2180 : 1800);
  assert(await p.evaluate(() => Game.captionMs('Titānēs in Tartarum dēscendunt. Centimanī eōs custōdiunt.') >= 6000), 'the long epilogue sentence gets about 6 seconds');
  assert.equal(await p.evaluate(() => Game.captionMs('', 3000)), 3000, 'an explicit longer time still wins');
  await H.finish('combat');
})().catch(e => { console.error(e); process.exit(1); });
