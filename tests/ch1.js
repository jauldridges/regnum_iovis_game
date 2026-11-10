// Prologue (real 3-second pause), the opening cinematic, then Chapter 1 as a game: baby, stone, keepsake, servant, guards, Saturn.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, cont, pcont, text } = H;
  // 1. the real 3-second pause on the first prologue card
  await H.open('lang=la&drafts=1', { pause: null });
  await p.waitForSelector('#story .page');
  assert(await p.isDisabled('#story button'), 'first card waits');
  await p.keyboard.press('Enter'); await p.waitForTimeout(1000);
  assert(await p.isDisabled('#story button'), 'Enter does nothing during the pause');
  await p.waitForTimeout(2500); assert(!(await p.isDisabled('#story button')), 'enabled after 3s');

  // 2. the prologue, quickly
  await H.open('lang=la&drafts=1');
  await p.waitForSelector('#story .page');
  const pt = () => p.textContent('#story');
  assert((await pt()).includes('Prīmō erat Chaos')); await pcont();
  await pcont(); await pcont();
  assert((await pt()).includes('falcem dat')); await pcont();
  await H.pick('Caelus'); assert((await pt()).includes('Relege')); await pcont();
  await pcont(); await H.pick('Terra'); await pcont();
  await pcont();
  await p.waitForFunction(() => document.getElementById('story').classList.contains('black'), null, { timeout: 3000 });
  await p.waitForFunction(() => document.getElementById('story').textContent.includes('Fīlius tuus'), null, { timeout: 4000 });
  await pcont(); await H.pick('Terra'); await pcont(); await pcont(); await H.pick('Caelus'); await pcont();
  assert((await pt()).includes('Aula Saturnī')); await pcont();

  // 3. the opening cinematic plays on its own: input is locked, the guards are not out yet, no tracker yet
  await p.waitForFunction(() => Game.state().scene, null, { timeout: 4000 });
  assert.equal(await p.locator('#hud').isVisible(), false, 'no tracker during the cinematic');
  assert(!(await p.evaluate(() => Story.flags.patrolOn)), 'guards are not out yet');
  await H.scene(30000);
  let s = await st(); assert.equal(s.map, 'hall'); assert.equal(s.flags.baby, 'cradle', 'Jupiter is born in the cradle');
  assert.equal(await p.locator('#hud .hudi').count(), 3); assert(s.flags.patrolOn, 'guards patrol now');

  // 4. the game: stealth. Seen with the baby = the baby goes back and Ops is sent back.
  await p.evaluate(() => { Story.flags.patrolOn = true; });
  await H.useChar('C'); assert.equal((await st()).flags.baby, 'carried'); assert((await H.toast()).includes('Ops īnfantem tollit'));
  assert(await p.locator('#hud .hudi.on').count() >= 1);
  await p.evaluate(() => { const e = MAPS.hall.ents.find(e => e.id === 'patrol1'); e.patrol.wait = 1e9; e.rx = e.x = 8; e.ry = e.y = 6; e.face = 'right'; Game.teleport(10, 6); });
  await p.waitForFunction(() => Game.state().flags.caught === 1, null, { timeout: 4000 });
  await H.scene(); s = await st();
  assert.equal(s.flags.baby, 'cradle', 'the baby is back in the cradle'); assert.deepEqual([s.player.x, s.player.y], [3, 5]);

  // 5. the way through: no patrols, servant says no, stone, keepsake, out the garden door to Terra, Saturn comes, give him the stone
  await p.evaluate(() => { Story.flags.patrolOn = false; Game.resetPatrols(); });
  await H.useChar('C');
  await H.talk('famula'); assert((await text()).includes('Īnfantem mihi dā')); await cont();
  await H.choose('Nēminī'); assert((await H.toast()).includes('Ops īnfantem tenet'));
  await H.useChar('N'); assert.equal((await st()).flags.stone, true);
  await H.useChar('M'); assert((await text()).includes('Hoc mel dulce est')); await H.choose('Tolle');
  assert.equal((await st()).flags.item, 'mel');
  await H.useChar('W'); assert((await H.toast()).includes('Sacculus plēnus'), 'only one keepsake fits');
  await H.goTo(18, 10); await H.bump('R');                                   // the garden door
  await p.waitForFunction(() => Game.state().flags.saturnReady === true, null, { timeout: 20000 });
  assert.equal((await st()).flags.baby, 'hidden');
  await H.talk('saturn_in');                                                   // give him the stone
  await p.waitForSelector('#story .page', { timeout: 30000 });
  assert((await pt()).includes('in Crētam portat')); await pcont();
  assert(await p.locator('#story canvas.mapart').isVisible(), 'the title slide has a map of the Mediterranean');
  assert((await pt()).includes('Crēta')); await pcont();
  s = await st(); assert.equal(s.map, 'ida'); assert.equal(s.ch, 2); assert(s.flags.suspect, 'being caught once means Saturn is suspicious: an extra guard in Crete');
  assert(await H.entPos('guard3'), 'the third guard is on the hillside');
  const bd = await p.evaluate(() => Score.breakdown().reduce((o, r) => (o[r.key] = r.pts, o), {}));
  assert.equal(bd.choice, 50 + 50, 'keepsake 50 + Chapter 1 finished after being caught once 50'); assert.equal(bd.story, 25);
  await H.finish('ch1');
})().catch(e => { console.error(e); process.exit(1); });
