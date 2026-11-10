// The story script: prologue, chapters 1-5 and the epilogue. Decides who says what, what is recruited,
// and when scenes change. All text comes from content/latin.yaml through Game.line(); missing lines are skipped.
var Story = (function () {
  var S = { flags: {} }, ch = 0, F = S.flags;
  var OBJ_SEEN = {};

  function lines(ids) { return ids.map(function (i) { return typeof i === 'string' ? Game.line(i) : i && i.raw; }).filter(Boolean); }
  function say(ids, done) { Game.showMessages(lines(ids), done); }
  function fill(id, x) { var t = Game.line(id); return t ? { raw: t.replace('{x}', Game.clean(x)) } : null; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function shuffle(a) {
    a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a;
  }

  S.ch = function () { return ch; };
  S.playerSprite = function () { return ch <= 1 ? 'ops' : 'jupiter'; };   // Ops, then Jupiter

  // Full-screen story cards: [textId, questionId|null] pairs, or 'fade' for a fade to black.
  async function panels(list, done) {
    var root = document.getElementById('story'); root.hidden = false; root.className = ''; Game.setBusy(true);
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e === 'fade') { root.classList.add('black'); root.innerHTML = ''; await wait(1300); root.classList.remove('black'); continue; }
      if (!Game.line(e[0])) continue;
      var q = e[1] && Game.qline(e[1]) ? e[1] : null;
      await new Promise(function (res) { Quiz.run(root, e[0], q, e[0], res, 'story'); });
    }
    root.hidden = true; Game.setBusy(false); if (done) done();
  }

  // ---- beginning, and chapter select for testing (?ch=N)
  S.begin = function (n) {
    if (n >= 6) { setupAllies(); setupCh3(); setupCh4(); setupCh5(); return epilogue(); }
    if (n === 5) { setupAllies(); setupCh3(); setupCh4(); return startCh5(true); }
    if (n === 4) { setupAllies(); setupCh3(); return startCh4(true); }
    if (n === 3) { setupAllies(); return startCh3(true); }
    if (n === 2) return startCh2(true);
    if (n === 1) return startCh1(true);
    panels([['pro_1'], ['pro_2'], ['pro_3'], ['pro_4', 'pro_4_q'], ['pro_5'], 'fade', ['pro_6', 'pro_6_q']], function () { startCh1(); });
  };
  function setupAllies() {
    ['amalthea', 'curetes'].forEach(function (a) { Book.recruit(a, true); });
    F.nubes = F.guard1 = F.guard2 = F.herb = F.amalthea = F.curetes = F.amalDone = F.curDone = true;
  }
  function setupCh3() {
    Book.recruit('metis', true); ['neptunus', 'pluto', 'iuno', 'ceres', 'vesta'].forEach(function (k) { Book.recruit(k, true); });
    F.metis = F.cupDone = F.guardH = true; Book.unlock('saxum');
  }
  function setupCh4() {
    ['cyclopes', 'centimani'].forEach(function (k) { Book.recruit(k, true); });
    F.campe = F.cyclopes = F.centimani = F.fulmen = F.weapons = true; openGates();
  }
  function setupCh5() { F.styx = F.hyperion = F.prom = F.them = F.iapetus = F.atlas = true; ['styx', 'victoria', 'prometheus', 'themis'].forEach(function (k) { Book.recruit(k, true); }); }
  function unlockCh1Pages() { ['iuppiter', 'ops', 'saturnus'].forEach(Book.unlock); }

  function startCh1(direct) { ch = 1; Game.loadMap('hall'); if (!direct) panels([['ch1_title']]); }
  function startCh2(direct) {
    ch = 2; unlockCh1Pages();
    var go = function () { Game.loadMap('ida'); };
    if (direct) go(); else panels([['ch1_end'], ['ch2_title']], go);
  }
  function startCh3(direct) {
    ch = 3; unlockCh1Pages();
    var go = function () { Game.loadMap('oceanus'); };
    if (direct) go(); else panels([['ch3_title'], ['ch3_intro']], go);
  }
  function startCh4(direct) {
    ch = 4; unlockCh1Pages();
    var go = function () { Game.loadMap('tartarus'); };
    if (direct) go(); else panels([['ch4_title'], ['ch4_intro']], go);
  }
  function startCh5(direct) {
    ch = 5; unlockCh1Pages();
    var go = function () { Game.loadMap('olympus'); };
    if (direct) go(); else panels([['ch5_title'], ['ch5_intro']], go);
  }
  // Epilogue: narrated cards, no battle, then the finale
  function epilogue() {
    ch = 6; Book.unlock('saturnus');
    panels([['war_1'], ['war_2'], ['aft_1'], ['aft_2', 'lib_atlas_q'], 'fade', ['ch6_title'], ['epi_1', 'epi_1_q'], ['epi_2', 'epi_2_q'],
            ['epi_3'], ['epi_4'], ['epi_5'], 'fade'], function () { Game.finish(); });
  }

  // ---- inspecting objects: a Latin description, glōria once per object
  S.inspect = function (id) {
    if (!Game.line(id)) return;
    if (!OBJ_SEEN[id]) { OBJ_SEEN[id] = true; Score.add('objects', Score.CFG.object); }
    if (id === 'obj_herba' && !F.herb) F.herb = true;
    say([id]);
  };

  // ---- exits
  S.canExit = function (id) {
    if (id === 'ida_east') return !!(F.amalthea && F.curetes && F.guard1 && F.guard2);
    if (id === 'ocean_south') return !!F.metis;
    if (id === 'hall2_exit') return !!(F.cupDone && F.guardH);
    if (id === 'tart_exit') return !!(F.campe && F.cyclopes && F.centimani);
    if (id === 'olympus_east') return !!F.styx;
    return true;
  };
  S.exitBlocked = function (id) {
    say([{ ida_east: 'gate_ch2', ocean_south: 'gate_ch3a', hall2_exit: F.cupDone ? 'gate_ch3c' : 'gate_ch3b',
           tart_exit: 'gate_ch4', olympus_east: 'gate_ch5a' }[id]]);
  };
  S.exit = function (id) {
    if (id === 'ida_east') startCh3();
    else if (id === 'ocean_south') { ch = 3; F.cupDone = false; Game.transition(function () { Game.loadMap('hall2'); }, true); }
    else if (id === 'hall2_exit') startCh4();
    else if (id === 'tart_exit') startCh5();
    else if (id === 'olympus_east') Game.transition(function () { Game.loadMap('othrys'); }, true);
  };

  // ---- talking
  S.talk = function (id) {
    if (id === 'servant') return servant();
    if (id === 'amalthea') return amalthea();
    if (id.indexOf('curetes') === 0) return curetes();
    if (id === 'guard1' || id === 'guard2') return fight(id, ['guard_1', 'guard_2'], { enemy: 'guard', hp: 3 });
    if (id === 'metis') return metis();
    if (id === 'saturn') return cup();
    if (id === 'guardH') return fight('guardH', ['guard_hall'], { enemy: 'guard', hp: 6 });
    if (id === 'campe') return fight('campe', ['campe_1', 'campe_2'], { enemy: 'campe' }, function () {
      Book.unlock('campe'); openGates(); say(['campe_down']);
    });
    if (id.indexOf('cyclops') === 0) return cyclopes();
    if (id.indexOf('cent') === 0) return centimani();
    if (id === 'styx' || id === 'victoria') return styx();
    if (id === 'hyperion') return fight('hyperion', ['hyp_1'], { enemy: 'hyperion' }, function () { Book.unlock('hyperion'); say(['prom_arr']); });
    if (id === 'prometheus') return titan('prom', 'prometheus', 'prom_1');
    if (id === 'themis') return titan('them', 'themis', 'them_1');
    if (id === 'iapetus') return fight('iapetus', ['iap_1'], { enemy: 'iapetus' }, function () { Book.unlock('iapetus'); });
    if (id === 'atlas') return fight('atlas', ['atl_1'], { enemy: 'atlas' }, function () { Book.unlock('atlas'); });
    if (id === 'saturn_boss') return fight('saturnBoss', ['sat_1'], { enemy: 'saturnus', final: true }, epilogue);
  };

  // Chapter 1: the servant warns Ops, Saturn comes, Ops must give him the stone (not the baby)
  function servant() {
    say(['ch1_servant_warn'], function () { if (!F.ch1Done && !F.saturnIn) saturnScene(); });
  }
  function saturnScene() {
    var missed = false;
    F.saturnIn = true;
    say(['ch1_saturn_comes'], ask);
    function ask() {
      Game.showChoice(Game.line('ch1_choice_prompt'), shuffle([
        { label: Game.line('ch1_choice_stone'), fn: function () {
          Score.add('choice', missed ? Score.CFG.choiceRetry : Score.CFG.choice);
          say(['ch1_right_1', 'ch1_right_2', 'ch1_right_3'], function () { F.saturnIn = false; F.ch1Done = true; startCh2(); });
        } },
        { label: Game.line('ch1_choice_baby'), fn: function () { missed = true; say(['ch1_wrong'], ask); } }
      ]));
    }
  }

  // A choice with one right answer (the buttons come in random order). Wrong answers have a small story
  // consequence and the choice repeats.
  function choice(promptId, rightId, wrongId, wrongText, onRight) {
    var missed = false;
    (function ask() {
      Game.showChoice(Game.line(promptId), shuffle([
        { label: Game.line(rightId), fn: function () { Score.add('choice', missed ? Score.CFG.choiceRetry : Score.CFG.choice); onRight(); } },
        { label: Game.line(wrongId), fn: function () { missed = true; say(wrongText, ask); } }
      ]));
    })();
  }

  // Chapter 2
  function amalthea() {
    if (F.amalDone) return say(['amal_done']);
    if (!F.herb) return say(['amal_hungry']);
    choice('amal_choice', 'opt_herba', 'ch1_choice_stone', ['amal_wrong'], function () {
      F.amalthea = F.amalDone = true; Book.recruit('amalthea');
      say(['amal_ate', 'amal_join'], checkReady);
    });
  }
  function curetes() {
    if (F.curDone) return say(['cur_done']);
    say(['cur_warn'], function () {
      choice('cur_choice', 'cur_opt_shields', 'cur_opt_sleep', ['cur_wrong'], function () {
        F.curetes = F.curDone = true; F.nubes = true; Book.recruit('curetes');
        say(['cur_ok', 'learn_nubes'], checkReady);
      });
    });
  }
  function checkReady() {
    if (ch === 2 && S.canExit('ida_east') && !F.readyShown) { F.readyShown = true; say(['ch2_ready']); }
    if (ch === 4 && S.canExit('tart_exit') && !F.ready4) { F.ready4 = true; say(['ch2_ready']); }
    if (ch === 5 && F.prom && F.them && !F.ready5) { F.ready5 = true; say(['ch2_ready']); }
  }

  // Chapter 3
  function metis() {
    if (F.metis) return say(['metis_2']);
    say(['metis_1', 'metis_2'], function () { F.metis = true; Book.recruit('metis'); });
  }
  // Jupiter as cupbearer: give the cup to Saturn; he brings up the stone and the five siblings; the war begins
  function cup() {
    say(['cup_1', 'cup_2'], function () {
      choice('cup_choice', 'opt_saturno', 'opt_custodi', ['cup_wrong'], function () {
        say(['cup_right', 'cup_drink', 'out_saxum'], function () {
          Book.unlock('saxum');
          var order = ['neptunus', 'pluto', 'iuno', 'ceres', 'vesta'];
          (function next(i) {
            if (i >= order.length) return say(['cup_end'], function () {
              F.cupDone = true;
              fight('guardH', ['guard_hall'], { enemy: 'guard', hp: 6 });      // the first battle of the war
            });
            say(['out_' + order[i]], function () { Book.recruit(order[i]); next(i + 1); });
          })(0);
        });
      });
    });
  }

  // Chapter 4: Campe's cells. Gates open when Campe falls.
  function openGates() {
    var rows = MAPS.tartarus.rows;
    for (var y = 0; y < rows.length; y++) rows[y] = rows[y].replace(/G/g, 'd');
  }
  // The Cyclopes' gifts: three datives. Each right answer is a gift; the sentence is the key line of the chapter.
  function cyclopes() {
    if (F.cyclopes) return say(['cyc_done']);
    if (F.campe !== true) return;
    say(['cyc_free'], function () {
      choice('q_fulmen', 'opt_iovi', 'opt_plutoni', ['cyc_wrong'], function () {
        say(['cyc_gift1'], function () {
          choice('q_tridens', 'opt_neptuno', 'opt_iovi', ['cyc_wrong'], function () {
            say(['cyc_gift2'], function () {
              choice('q_galea', 'opt_plutoni', 'opt_neptuno', ['cyc_wrong'], function () {
                F.cyclopes = F.fulmen = F.weapons = true; Book.recruit('cyclopes'); Book.unlock('cyclopes');
                say(['cyc_gift3', 'cyc_join', 'learn_fulmen'], checkReady);
              });
            });
          });
        });
      });
    });
  }
  function centimani() {
    if (F.centimani) return say(['cent_done']);
    if (F.campe !== true) return;
    say(['cent_1', 'cent_2'], function () { F.centimani = true; Book.recruit('centimani'); checkReady(); });
  }

  // Chapter 5
  function styx() {
    if (F.styx) return say(['styx_done']);
    say(['styx_1', 'styx_2'], function () { F.styx = true; Book.recruit('styx'); Book.recruit('victoria'); });
  }
  // Two Titans switch sides
  function titan(flag, book, lineId) {
    if (F[flag]) return say([lineId]);
    say([lineId], function () { F[flag] = true; Book.recruit(book); checkReady(); });
  }

  // ---- battles: the speaker says why we fight, the screen wipes, then the battle
  function fight(entId, pre, opts, after) {
    function run() { Game.transition(function () { Battle.start(opts, result); }); }
    function result(res) {
      if (res === 'won') { F[entId] = true; if (after) after(); else checkReady(); }
      else if (res === 'lost') lose(run);
    }
    say(pre, run);
  }
  // Losing changes the story: before chapter 3 the guards find the cave; after, Saturn swallows an ally
  function lose(again) {
    var sib = ch >= 3 ? Book.lastSibling() : null;
    if (!sib) return say(['lose_ch2_1', 'lose_ch2_2'], again);
    say([fill('lose_swallow', Game.line('acc_' + sib)), 'resc_start'], function () {
      choice('cup_choice', 'opt_saturno', 'opt_custodi', ['cup_wrong'], function () {
        say([fill('resc_ok', Book.nameNom(sib))], again);
      });
    });
  }
  S.lose = lose;   // also used by the tests
  return S;
})();
