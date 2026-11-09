// The story script: prologue and chapters 1-3. Decides who says what, what is recruited, and when scenes change.
// All text comes from content/latin.yaml through Game.line(); missing lines are skipped so nothing blocks.
var Story = (function () {
  var S = { flags: {} }, ch = 0, F = S.flags;
  var OBJ_SEEN = {};

  function lines(ids) { return ids.map(function (i) { return typeof i === 'string' ? Game.line(i) : i && i.raw; }).filter(Boolean); }
  function say(ids, done) { Game.showMessages(lines(ids), done); }
  function fill(id, x) { var t = Game.line(id); return t ? { raw: t.replace('{x}', Game.clean(x)) } : null; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  S.ch = function () { return ch; };
  S.playerColor = function () { return ch <= 1 ? '#2f7fd1' : '#e8c547'; };   // Ops, then Jupiter

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
    if (n >= 3) { setupAllies(); return startCh3(true); }
    if (n === 2) { return startCh2(true); }
    if (n === 1) return startCh1(true);
    panels([['pro_1'], ['pro_2'], ['pro_3'], ['pro_4', 'pro_4_q'], ['pro_5'], 'fade', ['pro_6', 'pro_6_q']], function () { startCh1(); });
  };
  function setupAllies() {
    ['amalthea', 'curetes'].forEach(function (a) { Book.recruit(a, true); });
    F.nubes = F.guard1 = F.guard2 = true; F.herb = true;
  }
  function unlockCh1Pages() { ['iuppiter', 'ops', 'saturnus'].forEach(Book.unlock); }

  function startCh1(direct) {
    ch = 1; Game.loadMap('hall');
    if (!direct) { panels([['ch1_title']]); }
  }
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

  // ---- inspecting objects: a Latin description, glōria once per object
  S.inspect = function (id) {
    var t = Game.line(id); if (!t) return;
    if (!OBJ_SEEN[id]) { OBJ_SEEN[id] = true; Score.add('objects', Score.CFG.object); }
    if (id === 'obj_herba' && !F.herb) { F.herb = true; }
    say([id]);
  };
  S.seen = function () { return Object.keys(OBJ_SEEN); };

  // ---- exits
  S.canExit = function (id) {
    if (id === 'ida_east') return !!(F.amalthea && F.curetes && F.guard1 && F.guard2);
    if (id === 'ocean_south') return !!F.metis;
    if (id === 'hall2_exit') return !!F.cupDone;
    return true;
  };
  S.exitBlocked = function (id) {
    say([id === 'ida_east' ? 'gate_ch2' : id === 'ocean_south' ? 'gate_ch3a' : 'gate_ch3b']);
  };
  S.exit = function (id) {
    if (id === 'ida_east') startCh3();
    else if (id === 'ocean_south') {
      ch = 3; F.cupDone = false; Game.transition(function () { Game.loadMap('hall2'); }, true);
    } else if (id === 'hall2_exit') Game.transition(function () { Game.finish(); });   // chapter 4 is not built yet
  };

  // ---- talking
  S.talk = function (id) {
    if (id === 'servant') return servant();
    if (id === 'amalthea') return amalthea();
    if (id.indexOf('curetes') === 0) return curetes();
    if (id === 'guard1' || id === 'guard2') return fight(id, ['guard_1', 'guard_2'], { hp: 3 });
    if (id === 'metis') return metis();
    if (id === 'saturn') return cup();
    if (id === 'guardH') return fight('guardH', ['guard_hall'], { hp: 6 });
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
      Game.showChoice(Game.line('ch1_choice_prompt'), [
        { label: Game.line('ch1_choice_stone'), fn: function () {
          Score.add('choice', missed ? Score.CFG.choiceRetry : Score.CFG.choice);
          say(['ch1_right_1', 'ch1_right_2', 'ch1_right_3'], function () { F.saturnIn = false; F.ch1Done = true; startCh2(); });
        } },
        { label: Game.line('ch1_choice_baby'), fn: function () { missed = true; say(['ch1_wrong'], ask); } }
      ]);
    }
  }

  // A choice with one right answer. Wrong answers have a small story consequence and the choice repeats.
  function choice(promptId, rightId, wrongId, wrongText, onRight) {
    var missed = false;
    (function ask() {
      Game.showChoice(Game.line(promptId), [
        { label: Game.line(rightId), fn: function () { Score.add('choice', missed ? Score.CFG.choiceRetry : Score.CFG.choice); onRight(); } },
        { label: Game.line(wrongId), fn: function () { missed = true; say(wrongText, ask); } }
      ]);
    })();
  }

  // Chapter 2
  function amalthea() {
    if (F.amalthea) return say(['amal_done']);
    if (!F.herb) return say(['amal_hungry']);
    choice('amal_choice', 'opt_herba', 'ch1_choice_stone', ['amal_wrong'], function () {
      F.amalthea = true; Book.recruit('amalthea');
      say(['amal_ate', 'amal_join'], checkReady);
    });
  }
  function curetes() {
    if (F.curetes) return say(['cur_done']);
    say(['cur_warn'], function () {
      choice('cur_choice', 'cur_opt_shields', 'cur_opt_sleep', ['cur_wrong'], function () {
        F.curetes = true; F.nubes = true; Book.recruit('curetes');
        say(['cur_ok', 'learn_nubes'], checkReady);
      });
    });
  }
  function checkReady() {
    if (ch === 2 && S.canExit('ida_east') && !F.readyShown) { F.readyShown = true; say(['ch2_ready']); }
  }

  // Chapter 3
  function metis() {
    if (F.metis) return say(['metis_2']);
    say(['metis_1', 'metis_2'], function () { F.metis = true; Book.recruit('metis'); });
  }
  // Jupiter as cupbearer: give the cup to Saturn; he brings up the stone and the five siblings
  function cup() {
    say(['cup_1', 'cup_2'], function () {
      choice('cup_choice', 'opt_saturno', 'opt_custodi', ['cup_wrong'], function () {
        say(['cup_right', 'cup_drink', 'out_saxum'], function () {
          Book.unlock('saxum');
          var order = ['neptunus', 'pluto', 'iuno', 'ceres', 'vesta'], texts = [];
          order.forEach(function (k) { texts.push('out_' + k); });
          (function next(i) {
            if (i >= order.length) return say(['cup_end'], function () { F.cupDone = true; });
            say([texts[i]], function () { Book.recruit(order[i]); next(i + 1); });
          })(0);
        });
      });
    });
  }

  // ---- battles: the speaker says why we fight, the screen wipes, then the battle
  function fight(entId, pre, opts) {
    function run() { Game.transition(function () { Battle.start(opts, result); }); }
    function result(res) {
      if (res === 'won') { F[entId] = true; checkReady(); }
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
