// Collection book: pause, question, retry rules, party; English labels.
(async () => {
  const H = await require('./lib')(); const { p, assert, st, tap } = H;
  await H.open('lang=la&ch=1', { pause: null });
  await p.evaluate(() => ['iuppiter', 'ops', 'saturnus'].forEach(Book.unlock));
  await p.keyboard.press('b');
  assert(await p.isVisible('#book'));
  await tap('ArrowLeft'); assert.equal((await st()).player.x, 3, 'no walking while the book is open');
  const page = n => p.click(`#book button:has-text("${n}")`), bt = () => p.textContent('#book');
  await page('Iuppiter, Iovis');
  assert(await p.isDisabled('#book button'), 'card waits 3 seconds');
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  assert((await bt()).includes('Graecē: Zeus'));
  await p.waitForTimeout(2800); await p.click('#book button');
  assert((await bt()).includes('Cuius fīlius'));
  await p.click('#book button:has-text("Neptūnī")');
  assert((await bt()).includes('Relege')); await p.click('#book button');
  assert((await bt()).includes('Graecē: Zeus'), 'wrong answer sends the student back to the text');
  assert(await p.isDisabled('#book button')); await p.waitForTimeout(3200); await p.click('#book button');
  await p.click('#book button:has-text("Saturnī et Opis")');
  assert((await bt()).includes('Rēctē')); await p.click('#book button');
  assert.deepEqual((await p.evaluate(() => Book.state())).results.iuppiter, { tries: 2, correct: true, firstTry: false });
  await page('Saturnus, Saturnī'); await p.waitForTimeout(3200); await p.click('#book button');
  await p.click('#book button:has-text("fulmen")');
  await p.click('#book button'); await p.waitForTimeout(3200); await p.click('#book button');
  await p.click('#book button:has-text("tridēns")');
  assert((await bt()).includes('Responsum rēctum: falx'), 'second miss shows the answer');
  await p.click('#book button');
  assert.equal((await p.evaluate(() => Book.state())).results.saturnus.correct, false);
  // book points: retry 25, miss 0
  const bk = await p.evaluate(() => Score.breakdown().find(r => r.key === 'book'));
  assert.equal(bk.pts, 25);
  // party: Neptune is recruited later in the story
  await p.evaluate(() => Book.recruit('neptunus'));
  assert.equal(await p.evaluate(() => Score.breakdown().find(r => r.key === 'allies').pts), 100);
  await p.click('#book button:has-text("Claudāmus")'); assert(!(await st()).msgOpen, 'book closes');
  await p.keyboard.press('b');
  assert.deepEqual((await p.evaluate(() => Book.state())).party, ['neptunus']);
  await p.click('#book button.pty');
  assert.deepEqual((await p.evaluate(() => Book.state())).party, []);

  await H.open('lang=en&ch=1');
  await p.evaluate(() => { Battle.start({ hp: 3 }); });
  await p.waitForSelector('#choices button:not([disabled])', { timeout: 6000 });
  const lab = (await p.textContent('#choices button')).replace(/\s+/g, ' ').trim();
  assert.equal(lab, '☁️ Thunder! Tonā!', 'English label (sky icon, English, small Latin): ' + lab);
  await H.finish('book');
})().catch(e => { console.error(e); process.exit(1); });
