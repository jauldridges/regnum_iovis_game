// Chapter 5: the war. Styx and Victory, four bosses in order, two Titans change sides, Victory's power-up in the final battle.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, text, cont, pcont, cmd, battleReady } = H;
  await H.open('lang=la&drafts=1&ch=5');
  // the setup for ?ch=5 has Styx etc. already; undo that part to play it
  await p.evaluate(() => { const f = Story.flags; f.styx = f.hyperion = f.prom = f.them = f.iapetus = f.atlas = false; });
  assert.equal((await st()).map, 'olympus');
  await H.goTo(18, 6); await H.bump('R'); assert((await H.toast()).includes('Styx tē exspectat'));
  await H.talk('styx');
  assert((await text()).includes('Styx prīma')); await cont(); assert((await text()).includes('Victōriam')); await cont(); await H.calm();
  await H.goTo(18, 6); await H.bump('R');
  await p.waitForFunction(() => Game.state().map === 'othrys', null, { timeout: 5000 });
  await p.waitForFunction(() => !Game.state().trans, null, { timeout: 5000 });
  // Hyperion first (earth: the sky is strong)
  await H.talk('hyperion'); assert((await text()).includes('Hyperīōn prīmus')); await cont(); await H.enter();
  assert.equal(await p.evaluate(() => Battle.maxOf('iuppiter')), 8, 'Jupiter at level 5');
  const cmds = await H.buttons();
  assert(cmds.some(c => c.includes('Fulmen iace')), 'Fulmen iace is available');
  assert(!(await p.evaluate(() => Battle.team.some(m => m.id === 'victoria'))), 'Victory only helps in the final battle');
  await H.act('Fulmen iace'); assert((await p.evaluate(() => Battle.history.join('|'))).includes('Magnum vulnus'));
  await H.autoPlay();
  await H.won();
  assert((await text()).includes('Duo Titānēs')); await cont();
  // two Titans change sides; only then does Iapetus come
  await H.talk('themis'); assert((await text()).includes('Themis quoque')); await cont(); await H.calm();
  await H.talk('prometheus'); assert((await text()).includes('Promētheus Titān est, sed Iovī auxilium dat')); await cont(); await H.calm();
  assert((await text()).includes('Via aperta')); await cont();
  await H.talk('iapetus'); assert((await text()).includes('Hyperīōnis frāter')); await cont(); await H.enter();
  await H.autoPlay();
  await H.won();
  await H.talk('atlas'); assert((await text()).includes('Titānum dux')); await cont(); await H.enter();
  await H.autoPlay();
  await H.won();
  await H.talk('saturn_boss'); assert((await text()).includes('Saturnus ipse venit')); await cont();
  await H.pickTeam(['Victōri', 'Neptūn', 'Plūt']);                                                 // Victory only helps in the final battle
  await H.turnReady();
  assert(await p.evaluate(() => Battle.team.some(m => m.id === 'victoria')), 'Victory can be on the team in the final battle');
  await p.screenshot({ path: process.env.SHOT || '/tmp/ch5.png' });
  await H.autoPlay();
  await p.waitForFunction(() => !Battle.active, null, { timeout: 20000 });
  for (let k = 0; k < 40; k++) {                                                                    // a level-up boon choice may come first
    if (await p.locator('#choices button:has-text("Vīta")').count()) await p.click('#choices button:has-text("Vīta")');
    if ((await H.st()).map !== 'olympus') break; await p.waitForTimeout(250);
  }
  assert.notEqual((await H.st()).map, 'olympus', 'the epilogue film begins after Saturn falls (it leaves the throne room)');
  const bd = await p.evaluate(() => Score.breakdown().reduce((o, r) => (o[r.key] = r.pts, o), {}));
  assert.equal(bd.battles, 600, 'four boss battles');
  await H.finish('ch5');
})().catch(e => { console.error(e); process.exit(1); });
