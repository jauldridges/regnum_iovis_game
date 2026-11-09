// Epilogue: narrated cards, two questions, fade, then the finale with the recap and the allies count.
(async () => {
  const H = await require('./lib')(); const { p, assert, pcont } = H;
  await H.open('lang=la&drafts=1&ch=6');
  const pt = () => p.textContent('#story');
  await p.waitForSelector('#story .page');
  assert((await pt()).includes('Iuppiter fulmen iacit')); await pcont();
  assert((await pt()).includes('Saturnus cadit')); await pcont();
  assert((await pt()).includes('Centimanī eōs custōdiunt')); await pcont();
  assert((await pt()).includes('Atlās caelum umerīs portat')); await pcont();
  assert((await pt()).includes('Quid Atlās umerīs portat?')); await H.pick('caelum'); await pcont();
  await p.waitForFunction(() => document.getElementById('story').textContent.includes('Epilogus'), null, { timeout: 5000 }); await pcont();
  assert((await pt()).includes('sortem trahunt')); await pcont();
  assert((await pt()).includes('Quis mare habet?')); await H.pick('Plūtō'); await pcont(); await pcont();    // wrong, re-read
  await H.pick('Neptūnus'); await pcont();
  assert((await pt()).includes('Saturnus in Latium fugit')); await pcont();
  assert((await pt()).includes('Quō Saturnus fugit?')); await H.pick('in Latium'); await pcont();
  assert((await pt()).includes('Aetās aurea')); await pcont();
  assert((await pt()).includes('Saturnālia')); await pcont();
  assert((await pt()).includes('Ibi Carthāgō erit')); await pcont();
  await p.waitForSelector('#finale:not([hidden])', { timeout: 8000 });
  await p.waitForSelector('#finale .again', { timeout: 12000 });
  const ft = await p.textContent('#finale');
  assert(ft.includes('Iuppiter Saturnum vīcit. Nunc Iuppiter rēx deōrum est.') && ft.includes('Sociī tuī:') && ft.includes('Glōria tua:'), ft);
  await p.click('#finale .again');
  assert((await p.textContent('#finale')).includes('Dē integrō incipiāmus'));
  await p.click('#finale button:has-text("Minimē")'); assert(await p.isVisible('#finale .again'));
  await H.finish('epilogue');
})().catch(e => { console.error(e); process.exit(1); });
