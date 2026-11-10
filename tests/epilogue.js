// Epilogue: a film. Each beat is a scene; three questions follow; then the finale with the recap and the allies count.
(async () => {
  const H = await require('./lib')(); const { p, assert, pcont } = H;
  await H.open('lang=la&drafts=1&ch=6');
  const pt = () => p.textContent('#story');
  // the first beats are scenes with no cards at all: Saturn falls, the Titans go down, Atlas takes the sky
  await p.waitForFunction(() => Game.state().trans || Game.state().scene, null, { timeout: 8000 });
  assert.equal(await p.locator('#story').isVisible(), false, 'no text cards: it plays as a film');
  await p.waitForSelector('#story .page', { timeout: 40000 });
  assert((await pt()).includes('Quid Atlās umerīs portat?'), 'the question comes right after the Atlas scene'); await H.pick('caelum'); await pcont();
  await p.waitForFunction(() => document.getElementById('story').textContent.includes('Epilogus'), null, { timeout: 5000 }); await pcont();
  await p.waitForSelector('#story .page', { timeout: 40000 });
  assert((await pt()).includes('Quis mare habet?')); await H.pick('Plūtō'); await pcont();
  assert(!(await p.isDisabled('#story button')), 'the line was already on screen, so no waiting'); await pcont();
  await H.pick('Neptūnus'); await pcont();
  // Saturn sails to Latium on the map
  await p.waitForSelector('#story canvas.mapart', { timeout: 20000 });
  await pcont();
  await p.waitForFunction(() => document.getElementById('story').textContent.includes('Quō Saturnus fugit?'), null, { timeout: 5000 });
  await H.pick('in Latium'); await pcont();
  await p.waitForSelector('#finale:not([hidden])', { timeout: 60000 });
  await p.waitForSelector('#finale .again', { timeout: 15000 });
  const ft = await p.textContent('#finale');
  assert(ft.includes('Iuppiter Saturnum vīcit. Nunc Iuppiter rēx deōrum est.') && ft.includes('Sociī tuī:') && ft.includes('Glōria tua:'), ft);
  await p.click('#finale .again');
  assert((await p.textContent('#finale')).includes('Dē integrō incipiāmus'));
  await p.click('#finale button:has-text("Minimē")'); assert(await p.isVisible('#finale .again'));
  await H.finish('epilogue');
})().catch(e => { console.error(e); process.exit(1); });
