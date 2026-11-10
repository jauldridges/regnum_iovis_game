// Enemy groups: up to three foes with their own health bars; choose whom to attack; one falls, the rest fight on.
(async () => {
  const H = await require('./lib')(); const { p, assert, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await p.evaluate(() => { Battle.start({ enemy: 'dux', extra: ['guard', 'guard'], team: ['iuppiter', 'neptunus'] }, () => {}); });
  await battleReady();
  assert.equal(await p.evaluate(() => Battle.foes.length), 3, 'a captain and two guards');
  // pick a move that hits: a second step asks whom to attack
  await p.click('#choices button:has-text("Tonā")');
  await p.waitForFunction(() => Battle.choosing, null, { timeout: 5000 });
  const labels = await H.buttons();
  assert(labels.length === 4 && labels[0].includes('Dux') && labels[1].includes('Custōs') && labels[3].includes('Redī'), 'three targets and Back: ' + labels);
  await p.click('#choices button:has-text("Redī")');                                              // back to the moves
  await p.waitForFunction(() => !Battle.choosing, null, { timeout: 5000 });
  assert((await H.buttons()).some(c => c.includes('Tonā')), 'the moves are back');
  // hit the second foe: only that one is hurt
  await H.act('Tonā', 'Custōs');
  const hp = await p.evaluate(() => Battle.foes.map(f => f.hp));
  assert.equal(hp[0], 14); assert(hp[1] < 6 || hp[1] === 6 - 2, 'the first guard is hurt: ' + hp); assert.equal(hp[2], 6);
  // a cover move needs no target and the turn moves on
  await H.turnReady(); await H.act('Sē tege');
  // knock the first guard out: it drops out, the others fight on, and the battle goes on
  await H.turnReady(); await p.evaluate(() => { Battle.foes[1].hp = 1; });
  await H.act('Tonā', 'Custōs');
  await p.waitForFunction(() => Battle.foes[1].down, null, { timeout: 8000 });
  assert.equal(await p.evaluate(() => Battle.foes.filter(f => !f.down).length), 2, 'two foes still fight');
  await H.turnReady();
  assert.equal(await p.evaluate(() => document.querySelectorAll('#choices button').length > 0), true);
  // a lone survivor needs no target step
  await p.evaluate(() => { Battle.foes[0].down = true; Battle.foes[0].hp = 0; });
  await H.turnReady();
  const n = await p.evaluate(() => Battle.picks); await H.act('Tonā');
  assert(!(await p.evaluate(() => Battle.choosing)));
  // winning needs all of them: kill the rest
  await p.evaluate(() => { Battle.foes.forEach(f => { if (!f.down) f.hp = 1; }); });
  await H.autoPlay(['Tonā']);
  assert.equal(await p.evaluate(() => Battle.active), false, 'the battle is won once every foe has fallen');
  // the xp of a group is added up
  assert.equal(await p.evaluate(() => Battle.xpOf(['dux', 'guard', 'guard'])), 95);
  // layout: the foes do not overlap the team, and the box stays below the picture
  await H.open('lang=la&drafts=1&ch=5', { luck: 'hit' });
  await p.evaluate(() => { Battle.start({ enemy: 'atlas', extra: ['guard', 'guard'], team: ['iuppiter', 'neptunus', 'pluto', 'vesta'] }, () => {}); });
  await battleReady();
  for (const [w, h] of [[1366, 768], [1024, 700]]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const c = document.getElementById('game').getBoundingClientRect(), m = document.getElementById('msg').getBoundingClientRect(); return { canvasBottom: c.bottom, msgTop: m.top }; });
    assert(r.msgTop >= r.canvasBottom - 1, 'the box overlaps the picture');
  }
  await p.screenshot({ path: process.env.SHOT || '/tmp/groups.png' });
  await H.finish('groups');
})().catch(e => { console.error(e); process.exit(1); });
