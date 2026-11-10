// Losing is something you watch: before chapter 3 the guards find the cave; later the enemy seizes your latest sibling,
// the battle restarts without them, and winning frees them. Also: text already read never waits again.
(async () => {
  const H = await require('./lib')(); const { p, assert, text, cont, st } = H;
  await H.open('lang=la&drafts=1&ch=2');
  await p.evaluate(() => { window.again = 0; Story.lose(() => { window.again++; }, 'guard1'); });
  await p.waitForFunction(() => Game.state().scene, null, { timeout: 3000 });
  await H.scene(); assert.equal(await p.evaluate(() => window.again), 1, 'the battle restarts after the scene (no walls of text)');
  assert(!(await p.isVisible('#msg')), 'no message box in the way');

  await H.open('lang=la&drafts=1&ch=3');
  await p.evaluate(() => { ['neptunus', 'pluto', 'iuno'].forEach(s => Book.recruit(s, true)); window.again = 0; Story.lose(() => { window.again++; }, 'metis'); });
  await H.scene(); assert.equal(await p.evaluate(() => window.again), 1);
  assert.deepEqual(await p.evaluate(() => Book.members().includes('iuno')), true, 'nobody is lost for good: the fallen gods come back for the retry');
  assert((await p.textContent('#toast')) !== null);
  // lose again: the same
  await p.evaluate(() => { Story.lose(() => { window.again++; }, 'metis'); }); await H.scene();
  assert.equal(await p.evaluate(() => window.again), 2);

  // text already read never waits again (real 3-second pause)
  await H.open('lang=la&drafts=1&ch=3', { pause: null });
  await p.evaluate(() => { Story.talk('metis'); });
  const sel = '#msg-btn';
  await p.waitForSelector(sel + ':not([hidden])'); assert(await p.isDisabled(sel), 'first time: wait');
  await p.waitForSelector(sel + ':not([disabled])', { timeout: 5000 }); await p.click(sel);
  await p.waitForSelector(sel + ':not([disabled])', { timeout: 5000 }); await p.click(sel);       // second line of Metis, same wait
  await p.evaluate(() => { Story.talk('metis'); });                                                // Metis again: she says metis_2, already read
  await p.waitForSelector(sel + ':not([hidden])'); assert(!(await p.isDisabled(sel)), 'a line already read does not wait again');
  await H.finish('lose');
})().catch(e => { console.error(e); process.exit(1); });
