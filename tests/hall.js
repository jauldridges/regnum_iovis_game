// Walls, Chapter 1, the guard's speech, the screen wipe, a paced battle, score and the finale.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, tap, text, cont } = H;
  await H.open('?lang=la');
  await tap('ArrowUp', 3); await tap('ArrowLeft', 12); assert.equal((await st()).player.x, 1, 'wall collision');
  await tap('ArrowDown'); await tap('ArrowRight', 12);
  let s = await st(); assert.equal(s.player.x, s.npc.x - 1, 'NPC blocks');

  await H.open('?lang=la&drafts=1');   // the guard's speech, battle and finale lines are still drafts
  await H.chapter1();
  await tap('ArrowDown'); await tap('ArrowDown'); await tap(' ');
  // the guard speaks first: it is clear why we fight
  assert((await text()).includes('Īnfāns hīc est')); await cont();
  assert((await text()).includes('Saturnō dō'));
  assert(!(await p.evaluate(() => Battle.active)), 'no battle during the speech');
  await cont();
  // screen wipe: covers the scene, then the battle is revealed
  assert((await st()).msgOpen, 'input locked during the wipe');
  await p.waitForFunction(() => Battle.active, null, { timeout: 3000 });
  await p.waitForSelector('#choices button:not([disabled])', { timeout: 6000 });
  assert.equal((await p.textContent('#choices button')).trim(), 'Tonā!', 'Latin-only button');

  // one attack, in order: Jupiter moves -> bolt -> guard reacts -> bar drains
  const A = () => p.evaluate(() => ({ s: Battle.anim(), e: Battle.enemyHp, log: document.getElementById('msg-text').textContent }));
  await p.click('#choices button');
  assert(await p.isDisabled('#choices button'), 'locked while animating');
  await p.waitForTimeout(250); let a = await A();
  assert(a.s.jx > 0 && a.e === 3 && !a.log.includes('Tonitrus'), 'Jupiter moves first');
  await p.waitForTimeout(600); a = await A();
  assert(a.s.bolt > 0 && a.e === 3, 'then the bolt travels');
  await p.waitForTimeout(450); a = await A();
  assert(a.e === 2 && a.s.gHit > 0 && a.log.includes('Tonitrus Iovis custōdem terret'), 'then the guard reacts');
  assert(a.s.shownE > 2, 'life bar has not yet emptied');
  await p.waitForTimeout(400); a = await A();
  assert(a.s.shownE < 3, 'life bar is draining');
  await p.waitForSelector('#choices button:not([disabled])', { timeout: 6000 });   // enemy's turn done
  assert.equal((await p.evaluate(() => Battle.jupHp)), 2, 'guard struck back');
  await p.screenshot({ path: process.env.SHOT || '/tmp/hall.png' });
  for (let i = 0; i < 2; i++) { await p.click('#choices button'); await p.waitForTimeout(500);
    await p.waitForFunction(() => !Battle.active || !document.querySelector('#choices button').disabled, null, { timeout: 8000 }); }
  await p.waitForFunction(() => !Battle.active, null, { timeout: 8000 });

  // finale
  await p.waitForSelector('#finale:not([hidden])');
  assert((await p.textContent('#finale')).includes('Fīnis'));
  await p.waitForSelector('#finale .rank', { timeout: 8000 });
  await p.waitForSelector('#finale .again', { timeout: 8000 });
  const ft = await p.textContent('#finale');
  assert(ft.includes('Glōria tua:') && ft.includes('Gradus tuus:') && ft.includes('Proelia victa'), 'finale content');
  // Score: 3 objects x20 + choice retry 50 + battle 150 + speed bonus
  const sc = await p.evaluate(() => ({ t: Score.total(), b: Score.breakdown() }));
  const base = sc.b.filter(r => r.key !== 'speed').reduce((x, r) => x + r.pts, 0);
  assert.equal(base, 60 + 50 + 150, JSON.stringify(sc.b));
  assert(sc.t >= base && sc.t <= base + 500);
  assert(ft.includes('Euge') === (sc.t >= 600) && ft.includes('Bene cōnāris') === (sc.t < 600), 'verdict matches goal');
  // play again asks first
  await p.click('#finale .again');
  assert((await p.textContent('#finale')).includes('Dē integrō incipiāmus'));
  await p.click('#finale button:has-text("Minimē")');
  assert(!(await p.textContent('#finale .confirm').catch(() => null)), 'No keeps the finale');
  assert(await p.isVisible('#finale .again'));
  await p.screenshot({ path: process.env.SHOT || '/tmp/hall.png' });
  await H.finish('hall');
})().catch(e => { console.error(e); process.exit(1); });
