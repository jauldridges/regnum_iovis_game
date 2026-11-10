// Chiptune sound: short jingles and effects made with the browser's own synth (no audio files).
// Music starts only after the first click or key press (browsers require that). A mute button sits over the screen; ?mute=1 silences it.
var Sound = (function () {
  var S = { log: [] }, ctx = null, master = null, muted = new URLSearchParams(location.search).has('mute');
  function ensure() {
    if (ctx) return ctx;
    try { var AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.22; master.connect(ctx.destination); } catch (e) { ctx = null; }
    return ctx;
  }
  S.unlock = function () { if (ensure() && ctx.state === 'suspended') ctx.resume(); };
  // [frequency, start (s), length (s), wave, volume, slide-to frequency]
  var N = function (f, t, d, w, v, to) { return [f, t, d, w || 'square', v === undefined ? 0.5 : v, to]; };
  var JINGLES = {
    // a new ally: a bright rising arpeggio and a held chord
    ally: [N(523, 0, .11), N(659, .11, .11), N(784, .22, .11), N(1047, .33, .55), N(784, .33, .55, 'triangle', .35), N(659, .33, .55, 'triangle', .3)],
    // a new power: a quick sparkling climb
    power: [N(392, 0, .07), N(523, .07, .07), N(659, .14, .07), N(784, .21, .07), N(1047, .28, .07), N(1319, .35, .07), N(1568, .42, .5), N(1047, .42, .5, 'triangle', .35)],
    // a new level: a short fanfare
    level: [N(523, 0, .1), N(523, .13, .1), N(523, .26, .1), N(659, .39, .3), N(587, .75, .12), N(659, .89, .12), N(784, 1.03, .22), N(1047, 1.28, .7), N(784, 1.28, .7, 'triangle', .35), N(523, 1.28, .7, 'triangle', .3)],
    hit: [N(260, 0, .09, 'square', .5, 90)], crit: [N(900, 0, .05), N(1350, .05, .12), N(260, 0, .12, 'square', .4, 80)],
    miss: [N(320, 0, .14, 'triangle', .35, 140)], block: [N(210, 0, .06, 'square', .4), N(160, .06, .08, 'square', .4)],
    heal: [N(660, 0, .08, 'triangle', .5), N(880, .08, .08, 'triangle', .5), N(1100, .16, .14, 'triangle', .5)],
    hurt: [N(180, 0, .16, 'sawtooth', .4, 60)], pick: [N(660, 0, .04, 'square', .3)]
  };
  S.play = function (name) {
    S.log.push(name);                                    // recorded even when muted (for tests)
    if (muted || !JINGLES[name] || !ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var t0 = ctx.currentTime + 0.02;
    JINGLES[name].forEach(function (n) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = n[3]; o.frequency.setValueAtTime(n[0], t0 + n[1]); if (n[5]) o.frequency.exponentialRampToValueAtTime(n[5], t0 + n[1] + n[2]);
      g.gain.setValueAtTime(0.0001, t0 + n[1]); g.gain.exponentialRampToValueAtTime(n[4], t0 + n[1] + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + n[2]);
      o.connect(g); g.connect(master); o.start(t0 + n[1]); o.stop(t0 + n[1] + n[2] + 0.05);
    });
  };
  S.toggle = function () { muted = !muted; if (!muted) S.play('pick'); return muted; };
  S.muted = function () { return muted; };
  return S;
})();
