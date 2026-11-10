// XP and levels. Each battle won earns XP; each new level lets the player choose one boon:
//   vita (+1 hit point), vis (+1 damage on Jupiter's own moves), fortuna (more accuracy and critical hits), copia (+1 use on limited moves).
// Every second level also gives +1 hit point. Nothing is stored: a reload starts fresh.
var Prog = (function () {
  var P = { xp: 0, level: 1, boons: { vita: 0, vis: 0, fortuna: 0, copia: 0 } };
  var NEED = [0, 50, 110, 190, 300, 420, 560];      // xp to reach level 1, 2, 3 ...
  P.max = NEED.length;
  P.need = function () { return P.level < P.max ? NEED[P.level] : NEED[P.max - 1]; };
  P.frac = function () { if (P.level >= P.max) return 1; var lo = NEED[P.level - 1]; return (P.xp - lo) / (NEED[P.level] - lo); };
  // returns the list of levels reached (empty if none)
  P.gain = function (n) { var ups = []; P.xp += n; while (P.level < P.max && P.xp >= NEED[P.level]) { P.level++; ups.push(P.level); } return ups; };
  P.setLevel = function (l) { P.level = l; P.xp = NEED[l - 1]; };
  P.hpBonus = function () { return Math.floor((P.level - 1) / 2) + P.boons.vita; };
  P.accBonus = function () { return 0.06 * P.boons.fortuna; };
  P.critBonus = function () { return 0.05 * P.boons.fortuna; };
  return P;
})();
