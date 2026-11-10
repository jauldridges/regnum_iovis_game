// Battles forgive: a retry starts with the enemy as hurt as you left it, the team is healed, and the right buttons glow.
(async () => {
  const H = await require('./lib')(); const { p, assert, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=3');
  // lose on purpose: one tough enemy, spam thunder
  const result = p.evaluate(() => new Promise(res => { window.res = null; Battle.start({ enemy: 'guard', hp: 6 }, (r, hp, max) => { window.res = [r, hp, max]; res(); }); }));
  await battleReady();
  let sawHint = false;
  for (let i = 0; i < 6 && !(await p.evaluate(() => window.res)); i++) {
    const heavy = await p.evaluate(() => Battle.pattern[Battle.turn % Battle.pattern.length] === 'heavy');
    if (heavy) { sawHint = (await p.locator('#choices button.hint').count()) > 0 || sawHint; }
    await cmd('Tonā');
  }
  await result; const [r, hp, max] = await p.evaluate(() => window.res);
  assert.equal(r, 'lost'); assert(hp < 6 && hp >= 1 && max === 6, `the enemy keeps its damage: ${hp}/${max}`); assert(sawHint, 'a defensive button glowed before the heavy attack');
  // the retry: the enemy starts where it was left, the team is full again
  await p.evaluate(([hp, max]) => Battle.start({ enemy: 'guard', hp, max }, () => {}), [hp, max]);
  await battleReady();
  const now = await p.evaluate(() => ({ e: Battle.enemyHp, t: Battle.teamHp, max: Battle.maxEnemy }));
  assert.equal(now.e, hp, 'the enemy is as hurt as before'); assert.equal(now.max, 6, 'the bar still shows 6 as full'); assert.equal(now.t, 4, 'the team is healed');
  await H.finish('mercy');
})().catch(e => { console.error(e); process.exit(1); });
