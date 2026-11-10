// Battles forgive: a retry starts with the enemy as hurt as you left it, the team is healed, and the right buttons glow.
(async () => {
  const H = await require('./lib')(); const { p, assert, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=3');
  // lose on purpose: Jupiter alone, hit once, then left almost dead
  const result = p.evaluate(() => new Promise(res => { window.res = null; Battle.start({ enemy: 'guard', hp: 12, max: 12, team: ['iuppiter'] }, (r, hp, max) => { window.res = [r, hp, max]; res(); }); }));
  await battleReady();
  await H.act('Tonā'); await H.turnReady();                                                       // the guard's second light attack comes next
  await H.act('Tonā'); await H.turnReady();                                                       // after this, a heavy attack is planned: a defensive button glows
  assert.equal(await p.evaluate(() => Battle.plan.kind), 'heavy');
  assert((await p.locator('#choices button.hint').count()) > 0, 'a defensive button glowed before the heavy attack');
  await p.evaluate(() => { Battle.team[0].hp = 1; });
  await H.act('Tonā');
  await result; const [r, hp, max] = await p.evaluate(() => window.res);
  assert.equal(r, 'lost'); assert(hp < 12 && hp >= 1 && max === 12, `the enemy keeps its damage: ${hp}/${max}`);
  // the retry: the enemy starts where it was left, the team is full again
  await p.evaluate(([hp, max]) => Battle.start({ enemy: 'guard', hp, max, team: ['iuppiter'] }, () => {}), [hp, max]);
  await battleReady();
  const now = await p.evaluate(() => ({ e: Battle.enemyHp, t: Battle.hpOf('iuppiter'), max: Battle.maxEnemy }));
  assert.equal(now.e, hp, 'the enemy is as hurt as before'); assert.equal(now.max, 12, 'the bar still shows 12 as full'); assert.equal(now.t, 6, 'the team is healed');
  await H.finish('mercy');
})().catch(e => { console.error(e); process.exit(1); });
