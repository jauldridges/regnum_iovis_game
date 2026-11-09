// Losing changes the story: guards find the cave (before ch 3); Saturn swallows a sibling and Jupiter rescues it (ch 3+).
(async () => {
  const H = await require('./lib')(); const { p, assert, text, cont, choose, st } = H;
  await H.open('lang=la&drafts=1&ch=2');
  await p.evaluate(() => { window.again = 0; Story.lose(() => { window.again++; }); });
  assert((await text()).includes('speluncam inveniunt')); await cont();
  assert((await text()).includes('novum locum')); await cont();
  assert.equal(await p.evaluate(() => window.again), 1, 'battle restarts');
  await H.open('lang=la&drafts=1&ch=3');
  await p.evaluate(() => { ['neptunus', 'pluto', 'iuno'].forEach(s => Book.recruit(s, true)); window.again = 0; Story.lose(() => { window.again++; }); });
  assert((await text()).includes('Saturnus Iūnōnem dēvorat'), 'most recent sibling is swallowed'); await cont();
  assert((await text()).includes('pōculum quaerit')); await cont();
  await choose(2); assert((await text()).includes('nōn accipit')); await cont();
  await choose(1); assert((await text()).includes('Iūnō ē Saturnō redit')); await cont();
  assert.equal(await p.evaluate(() => window.again), 1);
  // English mode
  await H.open('lang=en&drafts=1&ch=3');
  await p.evaluate(() => { ['neptunus', 'pluto'].forEach(s => Book.recruit(s, true)); Story.lose(() => {}); });
  assert((await text()).includes('Saturn swallows Pluto!'));
  await H.finish('lose');
})().catch(e => { console.error(e); process.exit(1); });
