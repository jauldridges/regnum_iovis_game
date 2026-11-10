// Pixel art drawn by the game itself from small patterns: no image files to manage or license (design §10).
// Everything is built on a 16x16 pixel grid and drawn at 2x (a 32px map tile) or larger (battles).
var Art = (function () {
  var A = {}, cache = {};
  var OUT = '#1c1624';

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function shade(c, f) { var h = hex(c); return '#' + h.map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v * f))).toString(16)).slice(-2); }).join(''); }
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  // ---- a 16x16 pixel buffer
  function Buf() { this.g = []; for (var i = 0; i < 256; i++) this.g[i] = null; }
  Buf.prototype.p = function (x, y, c) { if (x >= 0 && y >= 0 && x < 16 && y < 16) this.g[y * 16 + x] = c; };
  Buf.prototype.r = function (x0, y0, x1, y1, c) { for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) this.p(x, y, c); };
  Buf.prototype.mirror = function () {
    var o = []; for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) o[y * 16 + x] = this.g[y * 16 + 15 - x]; this.g = o;
  };
  Buf.prototype.outline = function (c) {
    var o = this.g.slice();
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
      if (this.g[y * 16 + x]) continue;
      if ((x > 0 && this.g[y * 16 + x - 1]) || (x < 15 && this.g[y * 16 + x + 1]) || (y > 0 && this.g[(y - 1) * 16 + x]) || (y < 15 && this.g[(y + 1) * 16 + x])) o[y * 16 + x] = c;
    }
    this.g = o;
  };
  Buf.prototype.canvas = function (scale) {
    var c = mk(16 * scale, 16 * scale), x = c.getContext('2d');
    for (var i = 0; i < 256; i++) if (this.g[i]) { x.fillStyle = this.g[i]; x.fillRect((i % 16) * scale, Math.floor(i / 16) * scale, scale, scale); }
    return c;
  };

  // ---- characters
  function H(o) { // defaults for a humanoid
    o.kind = 'human'; o.skin = o.skin || '#f2c9a0'; o.hair = o.hair || '#5a3220'; o.cloth = o.cloth || '#888'; o.boots = o.boots || '#6a4a2a'; return o;
  }
  var helmet = function (col, crest) { return function (b, d) { if (d === 'up' || d === 'down') { b.r(4, 0, 11, 3, col); b.r(4, 4, 4, 5, col); b.r(11, 4, 11, 5, col); b.r(7, 0, 8, 0, crest); } else { b.r(4, 0, 11, 3, col); b.r(4, 4, 6, 6, col); b.r(7, 0, 8, 0, crest); } }; };
  var spear = function (b, d) { var x = d === 'left' ? 2 : 13; b.r(x, 1, x, 14, '#d6d6e0'); b.r(x - 1, 0, x + 1, 0, '#f0f0f8'); b.p(x, 0, '#fff'); };
  var shield = function (col) { return function (b, d) { if (d === 'up') return; var x = d === 'right' ? 8 : d === 'left' ? 4 : 2; b.r(x, 8, x + 2, 12, col); b.r(x, 8, x + 2, 8, shade(col, 1.3)); b.p(x + 1, 10, shade(col, .6)); }; };
  var trident = function (b, d) { var x = d === 'left' ? 2 : 13; b.r(x, 3, x, 14, '#c9a227'); b.r(x - 1, 1, x - 1, 3, '#e8e8f0'); b.r(x, 0, x, 3, '#e8e8f0'); b.r(x + 1, 1, x + 1, 3, '#e8e8f0'); };
  var wings = function (b) { b.r(1, 5, 3, 9, '#fff6c8'); b.r(0, 6, 1, 8, '#fff6c8'); b.r(12, 5, 14, 9, '#fff6c8'); b.r(14, 6, 15, 8, '#fff6c8'); };
  var crown = function (b, d) { b.r(5, 0, 10, 0, '#f0c020'); b.p(5, -1, '#f0c020'); b.p(7, 0, '#fff0a0'); b.p(9, 0, '#fff0a0'); };
  var torch = function (b, d) { var x = d === 'left' ? 2 : 13; b.r(x, 7, x, 13, '#7a5a2a'); b.r(x - 1, 4, x + 1, 6, '#ff9a20'); b.p(x, 3, '#ffd24a'); b.p(x, 5, '#fff0a0'); };
  var wheat = function (b, d) { var x = d === 'left' ? 2 : 13; b.r(x, 6, x, 13, '#c9a227'); b.p(x - 1, 5, '#f0d060'); b.p(x + 1, 5, '#f0d060'); b.p(x - 1, 7, '#f0d060'); b.p(x + 1, 7, '#f0d060'); b.p(x, 4, '#f0d060'); };
  var flame = function (b, d) { var x = d === 'left' ? 2 : 13; b.r(x - 1, 9, x + 1, 12, '#ff7a20'); b.r(x, 8, x, 11, '#ffd24a'); b.p(x, 7, '#ff7a20'); };
  var hammer = function (b, d) { var x = d === 'left' ? 2 : 13; b.r(x, 6, x, 14, '#7a5a2a'); b.r(x - 1, 4, x + 2, 6, '#8a8a99'); };
  var bolt = function (b, d) { var x = d === 'left' ? 3 : 12; b.p(x, 9, '#ffe94d'); b.p(x - 1, 10, '#ffe94d'); b.p(x, 11, '#ffe94d'); b.p(x - 1, 12, '#ffe94d'); };
  var laurel = function (b) { b.r(4, 2, 11, 2, '#e8b020'); };
  var beard = function (col) { return function (b, d) { if (d === 'down') b.r(6, 7, 9, 9, col); else if (d !== 'up') b.r(8, 7, 10, 9, col); }; };
  var blind = function (b, d) { if (d === 'down') b.r(5, 6, 10, 6, '#f4f4f8'); };
  var cyclopsEye = function (b, d) { if (d === 'down') { b.r(5, 5, 10, 7, '#d9a066'); b.r(7, 5, 8, 6, '#fff'); b.p(7, 6, '#1c1624'); b.p(8, 6, '#1c1624'); } };
  var manyArms = function (b) { for (var i = 0; i < 4; i++) { b.p(2 - (i % 2), 8 + i, '#c8b8a0'); b.p(13 + (i % 2), 8 + i, '#c8b8a0'); } b.p(0, 9, '#c8b8a0'); b.p(15, 10, '#c8b8a0'); b.p(1, 11, '#c8b8a0'); b.p(14, 12, '#c8b8a0'); };
  var both = function () { var f = Array.prototype.slice.call(arguments); return function (b, d, fr) { f.forEach(function (g) { g(b, d, fr); }); }; };

  var SPR = {
    ops:      H({ hair: '#5a3220', cloth: '#4a78c9', trim: '#f0e8d0', robe: true }),
    jupiter:  H({ hair: '#e8c850', cloth: '#f0f0f6', trim: '#e8a820', boots: '#9a6a3a', extra: both(laurel, bolt) }),
    servant:  H({ hair: '#8a7a6a', cloth: '#8a5fb0', trim: '#d8c8e8', robe: true }),
    saturn:   H({ hair: '#e8e8e8', cloth: '#a02828', trim: '#e8b020', robe: true, extra: both(crown, beard('#e8e8e8')) }),
    guard:    H({ cloth: '#b5651d', trim: '#e8c040', boots: '#4a3a2a', extra: both(helmet('#8a8a99', '#c03030'), spear, shield('#c0873a')) }),
    curete:   H({ skin: '#e0b088', cloth: '#6a7a9a', trim: '#e8c040', boots: '#4a3a2a', extra: both(helmet('#b08a3a', '#e8c040'), shield('#c0873a')) }),
    metis:    H({ hair: '#2a3a6a', cloth: '#3aa8a8', trim: '#e8f4f4', robe: true }),
    styx:     H({ hair: '#1a2a4a', cloth: '#2a5fb5', trim: '#9ac8f0', robe: true }),
    victoria: H({ hair: '#e8c850', cloth: '#f0d878', trim: '#fff', robe: true, extra: wings }),
    themis:   H({ hair: '#5a3a6a', cloth: '#b07ad0', trim: '#f0e0ff', robe: true, extra: blind }),
    neptunus: H({ hair: '#3a6a8a', cloth: '#2aa6c9', trim: '#e0f4f8', robe: true, extra: trident }),
    pluto:    H({ hair: '#2a2a3a', cloth: '#454556', trim: '#8a8a99', robe: true, extra: helmet('#2a2a34', '#2a2a34') }),
    iuno:     H({ hair: '#3a2a4a', cloth: '#a070c8', trim: '#f0e0ff', robe: true, extra: crown }),
    ceres:    H({ hair: '#b07a2a', cloth: '#e0b84a', trim: '#fff4c0', robe: true, extra: wheat }),
    vesta:    H({ hair: '#5a2a1a', cloth: '#e0622e', trim: '#ffe0b0', robe: true, extra: flame }),
    prometheus: H({ hair: '#8a3a1a', cloth: '#d9702a', trim: '#ffd8a0', extra: torch }),
    hyperion: H({ hair: '#f0d040', cloth: '#e8c040', trim: '#fff4b0', boots: '#9a6a2a', extra: both(crown, spear) }),
    iapetus:  H({ skin: '#d8b088', hair: '#4a3a2a', cloth: '#8a6a4a', trim: '#c0a070', extra: spear }),
    atlas:    H({ skin: '#c8a888', hair: '#3a3a44', cloth: '#5a5a6a', trim: '#9a9aa8', boots: '#3a3a44', extra: beard('#3a3a44') }),
    cyclops:  H({ skin: '#d9a066', hair: '#4a2a1a', cloth: '#d9822b', trim: '#7a4a1a', extra: both(cyclopsEye, hammer) }),
    centimanus: H({ skin: '#c8b8a0', hair: '#6a6a7a', cloth: '#7a7a9a', trim: '#b0b0d0', extra: manyArms }),
    baby:     { kind: 'baby' },
    stone:    { kind: 'stone' },
    orb:      { kind: 'orb' },
    terra:    H({ hair: '#3a6a2a', cloth: '#4a8a4a', trim: '#d8f0b8', robe: true }),
    cup:      { kind: 'cup' },
    goat:     { kind: 'goat' },
    lupus:    { kind: 'wolf' },
    dux:      H({ cloth: '#8a2a2a', trim: '#e8c040', boots: '#3a2a2a', extra: both(helmet('#aeb0bc', '#e03030'), shield('#8a2a2a'), function (b) { b.r(6, 0, 9, 0, '#e03030'); b.r(7, -1, 8, -1, '#e03030'); b.r(13, 3, 13, 14, '#d6d6e0'); b.r(12, 1, 14, 2, '#fff'); }) }),
    sky:      { kind: 'sky' }, urn: { kind: 'urn' }, boat: { kind: 'boat' }, city: { kind: 'city' },
    campe:    { kind: 'snake' }
  };

  function human(P, dir, fr) {
    var b = new Buf(), side = dir === 'left' || dir === 'right', back = dir === 'up';
    var cloth = P.cloth, dark = shade(cloth, 0.72), eye = OUT;
    // legs or long robe
    if (P.robe) { b.r(4, 12, 11, 15, cloth); b.r(4, 15, 11, 15, dark); if (fr) b.r(fr === 1 ? 4 : 8, 15, fr === 1 ? 7 : 11, 15, shade(cloth, 0.5)); }
    else {
      var l1 = fr === 1 ? 14 : 15, r1 = fr === 2 ? 14 : 15;
      if (side) { b.r(6, 13, 7, l1, P.boots); b.r(8, 13, 9, r1, P.boots); } else { b.r(5, 13, 6, l1, P.boots); b.r(9, 13, 10, r1, P.boots); }
      b.r(side ? 6 : 5, 13, side ? 9 : 10, 13, dark);
    }
    // torso and arms
    if (side) { b.r(5, 8, 10, 12, cloth); b.r(5, 11, 10, 11, dark); b.r(7, 9, 8, 11, shade(cloth, 0.88)); b.p(8, 12, P.skin); }
    else {
      b.r(4, 8, 11, 12, cloth); b.r(4, 11, 11, 11, dark); b.r(3, 9, 3, 11, cloth); b.r(12, 9, 12, 11, cloth); b.p(3, 12, P.skin); b.p(12, 12, P.skin);
      if (P.trim && !back) b.r(7, 8, 8, 10, P.trim);
    }
    // head
    if (dir === 'down') { b.r(5, 4, 10, 7, P.skin); b.r(4, 1, 11, 3, P.hair); b.r(5, 4, 10, 4, P.hair); b.r(4, 4, 4, 6, P.hair); b.r(11, 4, 11, 6, P.hair); b.p(6, 6, eye); b.p(9, 6, eye); }
    else if (back) { b.r(4, 1, 11, 6, P.hair); b.r(5, 7, 10, 7, P.hair); }
    else { b.r(7, 4, 11, 7, P.skin); b.r(4, 1, 11, 3, P.hair); b.r(7, 4, 10, 4, P.hair); b.r(4, 4, 6, 7, P.hair); b.p(10, 6, eye); }
    if (P.extra) P.extra(b, dir, fr);
    return b;
  }
  function goat(dir, fr) {
    var b = new Buf(), w = '#f4f0e8', sh = '#cfc8b8', st = fr === 1 ? 1 : 0;
    b.r(3, 7, 11, 11, w); b.r(3, 11, 11, 11, sh); b.r(2, 7, 2, 8, w);                      // body, tail
    b.r(4, 12, 4, 14 - st, '#5a4a3a'); b.r(6, 12, 6, 14, '#5a4a3a'); b.r(9, 12, 9, 14 - (st ? 0 : 0), '#5a4a3a'); b.r(11, 12, 11, 14 - st, '#5a4a3a');
    b.r(11, 5, 14, 8, w); b.r(11, 4, 12, 4, w); b.p(13, 6, OUT); b.p(14, 8, sh); b.r(14, 9, 14, 10, '#e8e0d0');  // head, eye, beard
    b.r(11, 2, 11, 3, '#c9a060'); b.r(13, 2, 13, 3, '#c9a060'); b.p(12, 1, '#c9a060');       // horns
    b.p(5, 8, sh); b.p(8, 9, sh); b.p(10, 8, sh);
    return b;
  }
  function baby() {
    var b = new Buf();
    b.r(5, 7, 10, 13, '#f4f0e0'); b.r(5, 12, 10, 13, '#d8d0b8'); b.r(7, 8, 8, 12, '#e8c0d0');       // wrapped in a blanket
    b.r(5, 2, 10, 7, '#f2c9a0'); b.r(5, 2, 10, 3, '#e8c850'); b.p(6, 5, OUT); b.p(9, 5, OUT); b.p(7, 6, '#e8a0a0'); b.p(8, 6, '#e8a0a0');
    return b;
  }
  function orb() { var b = new Buf(); b.r(6, 6, 9, 9, '#fff6a0'); b.r(5, 7, 10, 8, '#ffe040'); b.r(7, 5, 8, 10, '#ffe040'); b.r(7, 7, 8, 8, '#ffffff'); return b; }
  function stone() { var b = new Buf(); b.r(4, 6, 11, 12, '#8a8a96'); b.r(5, 5, 10, 5, '#8a8a96'); b.r(5, 6, 9, 7, '#b0b0bc'); b.r(5, 12, 10, 13, '#555560'); b.r(10, 8, 11, 11, '#6a6a76'); return b; }
  function cup() { var b = new Buf(); b.r(5, 5, 10, 9, '#e8c040'); b.r(6, 4, 9, 4, '#f0d060'); b.r(7, 10, 8, 12, '#c9a227'); b.r(5, 13, 10, 13, '#a07a10'); b.r(6, 6, 9, 7, '#8a2a3a'); b.r(11, 6, 12, 8, '#c9a227'); return b; }
  function wolf(dir, fr) {
    var b = new Buf(), c = '#6a6a76', d = '#4a4a56', l = '#9a9aa6', st = fr === 1 ? 1 : 0;
    b.r(3, 7, 11, 11, c); b.r(3, 7, 11, 8, l); b.r(3, 11, 11, 11, d); b.r(1, 6, 2, 9, c); b.r(0, 5, 1, 6, d);          // body, tail
    b.r(4, 12, 4, 14 - st, d); b.r(6, 12, 6, 14, d); b.r(9, 12, 9, 14, d); b.r(11, 12, 11, 14 - st, d);
    b.r(10, 5, 14, 9, c); b.r(13, 7, 15, 9, l); b.p(15, 8, OUT); b.r(10, 3, 11, 4, c); b.r(13, 3, 13, 4, c); b.p(12, 6, '#ffd24a'); b.p(14, 10, '#fff'); b.p(13, 10, '#fff');
    return b;
  }
  function sky() { var b = new Buf(); b.r(3, 3, 12, 12, '#3a5fb0'); b.r(2, 5, 13, 10, '#3a5fb0'); b.r(5, 2, 10, 13, '#3a5fb0'); b.r(4, 4, 6, 6, '#5a82d8'); b.p(8, 5, '#fff'); b.p(5, 9, '#fff'); b.p(10, 8, '#fff'); b.p(7, 11, '#ffe94d'); b.p(11, 6, '#ffe94d'); return b; }
  function urn() { var b = new Buf(); b.r(5, 3, 10, 4, '#a0643a'); b.r(4, 5, 11, 11, '#b8743a'); b.r(5, 12, 10, 13, '#8a542a'); b.r(4, 7, 11, 7, '#e8c040'); b.r(6, 5, 7, 10, '#d88a4a'); return b; }
  function boat() { var b = new Buf(); b.r(2, 10, 13, 12, '#8a5a2a'); b.r(3, 12, 12, 13, '#5a3a1a'); b.r(7, 2, 7, 10, '#5a3a1a'); b.r(8, 3, 12, 9, '#f4f0e0'); b.r(8, 3, 12, 4, '#e8e0c8'); b.p(7, 1, '#e03030'); b.r(8, 1, 9, 2, '#e03030'); return b; }
  function city() { var b = new Buf(); b.r(1, 8, 14, 14, '#c8b890'); b.r(1, 8, 14, 9, '#e0d0a8'); b.r(2, 4, 4, 8, '#d8c8a0'); b.r(7, 2, 9, 8, '#e0d0a8'); b.r(11, 5, 13, 8, '#d8c8a0'); b.r(7, 0, 9, 1, '#b03030'); b.p(3, 11, '#4a3a2a'); b.p(6, 11, '#4a3a2a'); b.p(9, 11, '#4a3a2a'); b.p(12, 11, '#4a3a2a'); b.r(7, 12, 8, 14, '#4a3a2a'); return b; }
  function snake() {
    var b = new Buf(), c = '#7a2a7a', l = '#b05ab0', d = '#4a1a4a';
    b.r(9, 2, 13, 5, c); b.r(10, 1, 10, 1, d); b.r(12, 1, 12, 1, d); b.p(12, 3, '#ffe040'); b.p(11, 3, '#ffe040'); b.r(14, 4, 15, 4, '#e03030'); b.r(9, 5, 13, 5, l);   // head
    b.r(9, 6, 11, 8, c); b.r(4, 8, 11, 10, c); b.r(4, 8, 11, 8, l); b.r(3, 11, 12, 13, c); b.r(3, 11, 12, 11, l); // neck, coils
    b.r(2, 10, 3, 12, c); b.r(1, 13, 4, 14, c); b.r(0, 14, 1, 14, d); b.r(2, 14, 12, 14, d);                       // tail
    b.p(6, 9, d); b.p(8, 9, d); b.p(10, 9, d); b.p(5, 12, d); b.p(7, 12, d); b.p(9, 12, d); b.p(11, 12, d);
    return b;
  }

  // sprite canvas: name, direction (up/down/left/right), walk frame (0 idle, 1, 2)
  A.sprite = function (name, dir, fr) {
    dir = dir || 'down'; fr = fr || 0;
    var key = name + '|' + dir + '|' + fr; if (cache[key]) return cache[key];
    var P = SPR[name] || SPR.servant, b;
    var left = dir === 'left';
    if (P.kind === 'goat') b = goat(dir, fr); else if (P.kind === 'snake') b = snake(); else if (P.kind === 'baby') b = baby(); else if (P.kind === 'wolf') b = wolf(dir, fr); else if (P.kind === 'sky') b = sky(); else if (P.kind === 'urn') b = urn(); else if (P.kind === 'boat') b = boat(); else if (P.kind === 'city') b = city(); else if (P.kind === 'orb') b = orb(); else if (P.kind === 'stone') b = stone(); else if (P.kind === 'cup') b = cup(); else b = human(P, left ? 'right' : dir, fr);
    if (left) b.mirror();
    if (P.kind !== 'orb') b.outline(OUT);
    return (cache[key] = b.canvas(1));
  };

  // which sprite an entity on a map uses
  A.entSprite = function (id) {
    if (id === 'saturn_in' || id === 'saturn' || id === 'saturn_boss') return 'saturn';
    if (id.indexOf('curetes') === 0) return 'curete';
    if (id.indexOf('guard') === 0) return 'guard';
    if (id.indexOf('cyclops') === 0) return 'cyclops';
    if (id.indexOf('cent') === 0) return 'centimanus';
    if (id === 'amalthea') return 'goat';
    if (id === 'wolf') return 'lupus';
    if (id === 'famula') return 'servant';
    if (id === 'gH2') return 'dux';
    if (id.indexOf('patrol') === 0 || id.indexOf('gH') === 0) return 'guard';
    return SPR[id] ? id : 'servant';
  };
  A.allySprite = function (id) { return { iuppiter: 'jupiter', amalthea: 'goat', curetes: 'curete', cyclopes: 'cyclops', centimani: 'centimanus' }[id] || id; };

  // map sprite (24px by default) with a soft shadow and a slight, slow idle bob
  A.char = function (ctx, name, px, py, dir, fr, t, seed, size, tint) {
    size = size || 24;
    var bob = fr === 0 && Math.sin(t / 700 + seed) > 0.75 ? 1 : 0, k = size / 24;
    ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.beginPath(); ctx.ellipse(px + 12, py + 22 + (24 - size) * 0.5, 7.5 * k + 1, 3 * k + 0.5, 0, 0, 6.3); ctx.fill();
    var dx = px + (24 - size) / 2, dy = py + (24 - size) - bob - 1;
    if (tint && tint.a > 0) { A.big(ctx, name, dir, dx, dy, size, tint); return; }
    ctx.drawImage(A.sprite(name, dir, fr), 0, 0, 16, 16, dx, dy, size, size);
  };
  // large sprite (battles): x, y top-left, size in px; tint flashes the sprite a colour
  var tmp = null;
  A.big = function (ctx, name, dir, x, y, size, tint, alpha) {
    var s = A.sprite(name, dir, 0);
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (tint && tint.a > 0) {
      tmp = tmp || mk(16, 16); var t = tmp.getContext('2d'); t.clearRect(0, 0, 16, 16); t.globalCompositeOperation = 'source-over'; t.drawImage(s, 0, 0);
      t.globalCompositeOperation = 'source-atop'; t.globalAlpha = tint.a; t.fillStyle = tint.c; t.fillRect(0, 0, 16, 16); t.globalAlpha = 1; t.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmp, 0, 0, 16, 16, x, y, size, size);
    } else ctx.drawImage(s, 0, 0, 16, 16, x, y, size, size);
    ctx.globalAlpha = 1;
  };

  // ---- tiles (16x16 grid drawn at 2x)
  var WALL = { hall: 'brick', hall2: 'brick', ida: 'trees', oceanus: 'cliff', tartarus: 'dungeon', olympus: 'trees', othrys: 'crag' };
  function speck(b, r, c, n) { for (var i = 0; i < n; i++) b.p(Math.floor(r() * 16), Math.floor(r() * 16), c); }
  function fillAll(b, c) { b.r(0, 0, 15, 15, c); }
  function brick(b, r, base, mortar, hi) {
    fillAll(b, base);
    for (var row = 0; row < 4; row++) {
      var y = row * 4; b.r(0, y + 3, 15, y + 3, mortar); b.r(0, y, 15, y, hi);
      var off = row % 2 ? 3 : 7; b.r(off, y, off, y + 2, mortar); b.r((off + 8) % 16, y, (off + 8) % 16, y + 2, mortar);
    }
  }
  var PAINT = {
    brick: function (b, r) { brick(b, r, '#6a533a', '#3b2d20', '#7d6548'); speck(b, r, '#58442e', 6); },
    dungeon: function (b, r) { brick(b, r, '#3d3b52', '#22212f', '#4d4b66'); speck(b, r, '#32304a', 6); },
    crag: function (b, r) { fillAll(b, '#4a3a4e'); speck(b, r, '#392c3c', 30); speck(b, r, '#5d4a62', 22); b.r(3, 4, 9, 4, '#2a1f2d'); b.r(9, 5, 9, 11, '#2a1f2d'); b.r(0, 0, 15, 0, '#5d4a62'); },
    cliff: function (b, r) { fillAll(b, '#8a8f99'); speck(b, r, '#6f747e', 30); speck(b, r, '#a8adb6', 24); b.r(0, 0, 15, 1, '#a8adb6'); b.r(0, 14, 15, 15, '#5e626b'); },
    trees: function (b, r) {
      fillAll(b, '#3f7a3a'); speck(b, r, '#2f6a2f', 24); speck(b, r, '#58a04a', 18);
      b.r(3, 2, 12, 11, '#2d6a2d'); b.r(4, 1, 11, 12, '#2d6a2d'); b.r(5, 3, 10, 8, '#3f8a3a'); b.r(6, 4, 8, 6, '#58a04a'); b.r(7, 12, 8, 15, '#5a3a1a');
    },
    '.': function (b, r) { fillAll(b, '#cdbd9a'); b.r(0, 7, 15, 7, '#b8a883'); b.r(7, 0, 7, 15, '#b8a883'); b.r(0, 0, 15, 0, '#d9cbaa'); speck(b, r, '#bfae88', 8); },
    g: function (b, r) {
      fillAll(b, '#7bb35a'); speck(b, r, '#6aa24a', 20); speck(b, r, '#92c86c', 12);
      for (var i = 0; i < 3; i++) { var x = Math.floor(r() * 13) + 1, y = Math.floor(r() * 12) + 3; b.p(x, y, '#4f8f3a'); b.p(x, y - 1, '#4f8f3a'); b.p(x + 1, y - 1, '#4f8f3a'); }
    },
    r: function (b, r) { fillAll(b, '#9b8a70'); speck(b, r, '#7d6e58', 22); speck(b, r, '#b3a38a', 16); },
    s: function (b, r) { fillAll(b, '#e7d6a0'); speck(b, r, '#d6c186', 20); speck(b, r, '#f4e8bc', 10); },
    d: function (b, r) { fillAll(b, '#4b4a5e'); b.r(0, 7, 15, 7, '#3a3948'); b.r(7, 0, 7, 15, '#3a3948'); speck(b, r, '#575670', 10); },
    '~': function (b, r, f) {
      fillAll(b, '#3a7bc8'); speck(b, r, '#2f6ab5', 12);
      for (var i = 0; i < 4; i++) { var y = i * 4 + (f ? 2 : 0), x = (i * 5 + (f ? 4 : 0)) % 12; b.r(x, y % 16, x + 3, y % 16, '#8cc0f4'); }
    },
    E: function (b, r) { fillAll(b, '#f2e8b8'); for (var y = 0; y < 16; y += 4) for (var x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) b.r(x, y, x + 3, y + 3, '#e6d89c'); },
    T: function (b, r, f, nb) {
      var l = nb.indexOf('l') >= 0, rt = nb.indexOf('r') >= 0;
      PAINT['.'](b, r); b.r(0, 0, 15, 15, '#c9a227'); b.r(0, 0, 15, 1, '#a07a10'); b.r(0, 2, 15, 3, '#f0d060'); b.r(0, 13, 15, 15, '#8a6a10');
      b.r(l ? 0 : 3, 5, rt ? 15 : 12, 11, '#a02828'); b.r(l ? 0 : 3, 5, rt ? 15 : 12, 6, '#c84040'); b.r(l ? 0 : 3, 11, rt ? 15 : 12, 11, '#7a1a1a');
      if (!l) b.r(0, 2, 2, 15, '#a07a10'); if (!rt) b.r(13, 2, 15, 15, '#a07a10');
    },
    F: function (b, r) {
      PAINT.brick(b, r); b.r(7, 1, 8, 5, '#7a5a2a');
      for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
        var dx = x - 8, dy = y - 9, d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 3.6 && d <= 5.6 && !(dx > 0 && dy < 0)) b.p(x, y, d < 4.4 ? '#8a909c' : '#e6ecf4');
      }
      b.p(8, 6, '#e6ecf4'); b.p(9, 5, '#8a909c');
    },
    C: function (b, r) { PAINT['.'](b, r); b.r(2, 7, 13, 12, '#7a4a1a'); b.r(2, 7, 13, 7, '#a06a2a'); b.r(3, 5, 12, 8, '#f0b0c4'); b.r(4, 4, 11, 5, '#f8d0dc'); b.r(1, 13, 14, 13, '#5a3a1a'); },
    V: function (b, r) { fillAll(b, '#6a6a70'); speck(b, r, '#55555b', 26); speck(b, r, '#85858c', 18); b.r(2, 5, 13, 15, '#0f0d14'); b.r(3, 4, 12, 4, '#0f0d14'); b.r(5, 3, 10, 3, '#0f0d14'); },
    H: function (b, r) {
      PAINT.g(b, r);
      for (var i = 0; i < 7; i++) { var x = 2 + i * 2; b.r(x, 5 + (i % 3), x, 12, '#3fb04a'); b.p(x, 4 + (i % 3), '#7ae060'); }
      b.p(5, 7, '#ffe040'); b.p(11, 6, '#ffe040');
    },
    S: function (b, r) { PAINT.s(b, r); b.r(4, 7, 11, 11, '#f2a0b8'); b.r(5, 6, 10, 6, '#f2a0b8'); b.r(4, 7, 11, 7, '#fcd0dc'); b.p(7, 9, '#c86a88'); b.p(9, 9, '#c86a88'); b.r(6, 12, 9, 12, '#d88aa0'); },
    G: function (b, r) { PAINT.d(b, r); b.r(0, 1, 15, 2, '#6a6a7a'); b.r(0, 13, 15, 14, '#6a6a7a'); [2, 6, 10, 14].forEach(function (x) { b.r(x, 1, x, 14, '#9a9aac'); b.r(x + 1, 1, x + 1, 14, '#55556a'); }); },
    I: function (b, r) { PAINT.dungeon(b, r); b.r(3, 3, 12, 11, '#2a2938'); [[4, 5, 6, 5], [5, 5, 5, 8], [8, 5, 11, 5], [9, 5, 9, 9], [4, 10, 11, 10], [6, 7, 7, 7]].forEach(function (s) { b.r(s[0], s[1], s[2], s[3], '#b8b0d8'); }); },
    K: function (b, r) { PAINT.d(b, r); for (var y = 0; y < 14; y += 3) { b.r(7, y, 8, y + 1, '#a0a0b0'); b.p(6, y + 2, '#707080'); b.p(9, y + 2, '#707080'); } b.r(4, 12, 11, 14, '#707080'); b.r(5, 12, 10, 12, '#a0a0b0'); },
    N: function (b, r) { PAINT['.'](b, r); [[2, 8, 7, 14], [6, 5, 12, 11], [9, 9, 14, 14]].forEach(function (q, i) { b.r(q[0], q[1], q[2], q[3], i === 1 ? '#8a8a96' : '#767682'); b.r(q[0], q[1], q[2], q[1], '#b0b0bc'); b.r(q[0], q[3], q[2], q[3], '#555560'); }); },
    M: function (b, r) { PAINT.brick(b, r); b.r(1, 8, 14, 9, '#6a4a2a'); b.r(4, 3, 11, 8, '#d99a2a'); b.r(4, 3, 11, 4, '#f0c050'); b.r(5, 2, 10, 2, '#7a5a2a'); b.r(6, 5, 9, 7, '#fff0b0'); b.r(2, 14, 13, 14, '#4a3018'); },
    W: function (b, r) { PAINT.brick(b, r); b.r(1, 12, 14, 13, '#6a4a2a'); b.r(3, 2, 12, 11, '#b0873a'); b.r(4, 3, 11, 10, '#c9a24a'); b.r(7, 3, 8, 10, '#8a6a2a'); b.r(4, 6, 11, 7, '#8a6a2a'); b.r(7, 6, 8, 7, '#e8d060'); },
    Y: function (b, r) { PAINT.brick(b, r); b.r(2, 1, 13, 2, '#5a3a1a'); b.r(4, 3, 11, 13, '#3a5fa0'); b.r(4, 3, 11, 4, '#5a82c8'); b.r(6, 5, 6, 13, '#2a4a8a'); b.r(9, 5, 9, 13, '#2a4a8a'); b.r(7, 3, 8, 5, '#e8c040'); },
    J: function (b, r) { PAINT.I(b, r); },
    Q: function (b, r) { PAINT.crag(b, r); b.r(5, 2, 10, 11, '#8a2a3a'); b.r(5, 2, 10, 3, '#b03a4a'); b.p(7, 12, '#8a2a3a'); b.p(8, 13, '#8a2a3a'); b.r(7, 5, 8, 8, '#e8c040'); },
    P: function (b, r) { fillAll(b, '#e8e8f4'); [3, 7, 11].forEach(function (x) { b.r(x, 3, x + 1, 13, '#c8c8dc'); b.r(x, 3, x, 13, '#fff'); }); b.r(0, 0, 15, 2, '#d0d0e4'); b.r(0, 14, 15, 15, '#b0b0c8'); b.r(0, 2, 15, 2, '#fff'); }
  };
  A.tile = function (ch, mapId, t, v, nb) {
    v = v || 0; nb = nb || '';
    var f = ch === '~' ? Math.floor(t / 600) % 2 : 0;
    var kind = ch === '#' ? WALL[mapId] || 'brick' : ch, key = 't|' + kind + '|' + mapId + '|' + f + '|' + v + '|' + nb;
    if (cache[key]) return cache[key];
    var b = new Buf(), r = rng(hash(kind + mapId) + v * 977);
    (PAINT[kind] || PAINT['.'])(b, r, f, nb);
    // a little light from above on every tile
    return (cache[key] = b.canvas(3));
  };

  // ---- lighting: a tint per place and a soft vignette
  var TINT = { hall: 'rgba(255,170,80,.10)', hall2: 'rgba(255,150,70,.14)', ida: 'rgba(255,255,200,.05)', oceanus: 'rgba(120,200,255,.08)',
               tartarus: 'rgba(40,20,80,.38)', olympus: 'rgba(255,255,255,.10)', othrys: 'rgba(120,30,40,.22)' };
  var vig = null;
  A.light = function (ctx, mapId) {
    if (TINT[mapId]) { ctx.fillStyle = TINT[mapId]; ctx.fillRect(0, 0, 480, 312); }
    if (!vig) { var c = mk(480, 312), x = c.getContext('2d'), g = x.createRadialGradient(240, 156, 130, 240, 156, 330); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.42)'); x.fillStyle = g; x.fillRect(0, 0, 480, 312); vig = c; }
    ctx.drawImage(vig, 0, 0);
  };
  // the title picture: Jupiter on a hill under a storm sky, lightning now and then
  var stars = null;
  A.title = function (ctx, t) {
    ctx.imageSmoothingEnabled = false;
    if (!stars) { var r = rng(5); stars = []; for (var i = 0; i < 40; i++) stars.push([Math.floor(r() * 240), Math.floor(r() * 80), r()]); }
    var flash = (t % 4200) < 140 ? 1 : (t % 4200) < 260 ? 0.4 : 0;
    var n = 10; for (var i = 0; i < n; i++) { var k = i / (n - 1); ctx.fillStyle = 'rgb(' + Math.round(18 + 40 * k + 80 * flash) + ',' + Math.round(18 + 30 * k + 80 * flash) + ',' + Math.round(48 + 60 * k + 60 * flash) + ')'; ctx.fillRect(0, i * 10, 240, 11); }
    stars.forEach(function (s) { ctx.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.5 * Math.abs(Math.sin(t / 700 + s[2] * 9))) + ')'; ctx.fillRect(s[0], s[1], 2, 2); });
    ctx.fillStyle = '#2a2448'; [[0, 70, 90], [70, 60, 90], [150, 72, 100]].forEach(function (h) { for (var k = 0; k < h[2]; k += 6) { var ht = 40 - Math.abs(h[2] / 2 - k) * 0.7; ctx.fillRect(h[0] + k, 112 - ht, 6, ht + 2); } });
    ctx.fillStyle = '#3a6a3e'; ctx.fillRect(0, 112, 240, 48); ctx.fillStyle = '#2f5a34'; for (var y = 118; y < 160; y += 10) ctx.fillRect(0, y, 240, 2);
    if (flash) { ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(176, 0); ctx.lineTo(164, 30); ctx.lineTo(178, 46); ctx.lineTo(166, 84); ctx.lineTo(172, 100); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(120, 148, 40, 8, 0, 0, 6.3); ctx.fill();
    var bob = Math.sin(t / 400) > 0.3 ? 2 : 0;
    ctx.drawImage(A.sprite('jupiter', 'down', 0), 0, 0, 16, 16, 64, 36 - bob, 112, 112);
    ctx.drawImage(A.sprite('saturn', 'down', 0), 0, 0, 16, 16, 8, 78, 48, 48);
    ctx.drawImage(A.sprite('goat', 'right', 0), 0, 0, 16, 16, 196, 100, 40, 40);
  };
  // ---- the Mediterranean, 120 x 80 pixels of land and sea, with Crete picked out
  var medMap = null;
  var LAND = [  // [colour, polygon points]
    ['n', [[0, 0], [120, 0], [120, 14], [112, 15], [104, 13], [96, 15], [90, 13], [84, 14], [76, 14], [66, 15], [56, 14], [48, 15], [40, 14], [32, 15], [24, 16], [18, 16], [14, 13], [0, 13]]],  // Europe, north
    ['n', [[0, 12], [17, 13], [19, 22], [15, 34], [7, 37], [0, 31]]],                                                                  // Iberia
    ['n', [[29, 14], [38, 15], [40, 21], [45, 27], [52, 37], [55, 44], [51, 45], [49, 41], [41, 33], [35, 25], [29, 19]]],              // Italy
    ['n', [[47, 14], [78, 14], [78, 22], [70, 24], [66, 28], [64, 34], [66, 42], [68, 50], [65, 49], [62, 44], [58, 36], [55, 28], [52, 22], [47, 19]]], // Balkans and Greece
    ['n', [[78, 13], [120, 13], [120, 36], [104, 37], [94, 36], [86, 33], [80, 28], [78, 20]]],                                         // Anatolia
    ['s', [[0, 62], [12, 60], [28, 58], [42, 60], [54, 58], [64, 61], [76, 60], [90, 62], [100, 58], [108, 54], [120, 54], [120, 80], [0, 80]]], // Africa
    ['n', [[47, 49], [54, 49], [56, 54], [49, 55]]], ['n', [[29, 33], [33, 33], [33, 43], [29, 43]]], ['n', [[100, 45], [109, 44], [107, 48], [100, 48]]]  // Sicily, Sardinia, Cyprus
  ];
  var CRETE = [[66, 56], [71, 55], [79, 55], [81, 56], [77, 58], [68, 58]];
  function buildMed() {
    var c = mk(120, 80), x = c.getContext('2d'), out = mk(120, 80), o = out.getContext('2d');
    ['n', 's', 'c'].forEach(function (kind) {
      x.clearRect(0, 0, 120, 80); x.fillStyle = '#000';
      LAND.concat([['c', CRETE]]).forEach(function (l) { if (l[0] !== kind) return; x.beginPath(); l[1].forEach(function (p, i) { i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); }); x.closePath(); x.fill(); });
      var d = x.getImageData(0, 0, 120, 80).data;
      for (var i = 0; i < 9600; i++) if (d[i * 4 + 3] > 110) { o.fillStyle = kind === 's' ? '#d9c38a' : kind === 'c' ? '#6fbf4a' : '#7bb35a'; o.fillRect(i % 120, Math.floor(i / 120), 1, 1); }
    });
    var img = o.getImageData(0, 0, 120, 80), px = img.data, res = o.createImageData(120, 80), r = res.data;
    function land(x, y) { return x >= 0 && y >= 0 && x < 120 && y < 80 && px[(y * 120 + x) * 4 + 3] > 0; }
    for (var y = 0; y < 80; y++) for (var xx = 0; xx < 120; xx++) {
      var i = (y * 120 + xx) * 4, near = land(xx - 1, y) || land(xx + 1, y) || land(xx, y - 1) || land(xx, y + 1);
      var col;
      if (land(xx, y)) col = near && !(land(xx - 1, y) && land(xx + 1, y) && land(xx, y - 1) && land(xx, y + 1)) ? [79, 143, 58] : [px[i], px[i + 1], px[i + 2]];
      else col = near ? [74, 143, 208] : null;
      if (col) { r[i] = col[0]; r[i + 1] = col[1]; r[i + 2] = col[2]; r[i + 3] = 255; }
    }
    o.putImageData(res, 0, 0); return out;
  }
  // t in ms since the slide appeared. The view starts on the whole sea, then settles on Crete.
  A.med = function (ctx, t, labels, ship) {
    ctx.imageSmoothingEnabled = false;
    if (!medMap) medMap = buildMed();
    var e = ship ? 1 : 1 + 0.85 * Math.min(1, Math.max(0, (t - 1100) / 1500)), cx = 73.5, cy = 56.5, sx = cx * 2, sy = cy * 2;
    ctx.save(); ctx.fillStyle = '#2f6ab5'; ctx.fillRect(0, 0, 240, 160);
    ctx.fillStyle = '#3a7bc8'; for (var wy = 0; wy < 160; wy += 8) for (var wx = (wy / 8 % 2) * 12; wx < 240; wx += 24) ctx.fillRect(wx + ((t / 400 + wy) % 3) * 2, wy, 8, 2);
    var ox = 120 - sx * e, oy = 75 - sy * e; ox = Math.min(0, Math.max(240 - 240 * e, ox)); oy = Math.min(0, Math.max(160 - 160 * e, oy));
    ctx.translate(ox, oy); ctx.scale(e, e);
    ctx.drawImage(medMap, 0, 0, 120, 80, 0, 0, 240, 160);
    if (labels) { ctx.fillStyle = '#2a1d12'; ctx.font = '10px "Jersey 10", "Pixelify Sans", sans-serif'; ctx.textAlign = 'center';
      labels.forEach(function (l) { ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(l.text, l.x * 2, l.y * 2); ctx.fillText(l.text, l.x * 2, l.y * 2); }); }
    // Crete: a pulsing ring and a bouncing arrow
    if (ship) {                                                  // a boat follows the route, leaving a dotted wake
      var pts = ship.path, total = pts.length - 1, q = Math.min(1, Math.max(0, (t - 500) / ship.ms)) * total, i = Math.min(total - 1, Math.floor(q)), f = q - i;
      ctx.fillStyle = '#fff'; for (var w = 0; w <= q; w += 0.08) { var wi = Math.min(total - 1, Math.floor(w)), wf = w - wi; ctx.fillRect((pts[wi][0] + (pts[wi + 1][0] - pts[wi][0]) * wf) * 2, (pts[wi][1] + (pts[wi + 1][1] - pts[wi][1]) * wf) * 2, 1.5, 1.5); }
      var bx = (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f) * 2, by = (pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f) * 2 + Math.sin(t / 200) * 1.2;
      ctx.drawImage(A.sprite('boat', 'down', 0), 0, 0, 16, 16, bx - 9, by - 14, 18, 18);
      var end = pts[total]; ctx.strokeStyle = 'rgba(255,230,90,' + (0.4 + 0.4 * Math.sin(t / 250)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(end[0] * 2, end[1] * 2, 8 + 2 * Math.sin(t / 250), 0, 6.3); ctx.stroke();
      ctx.globalAlpha = 1; ctx.restore(); return;
    }
    var px = cx * 2, py = 56.5 * 2, k = (t % 1400) / 1400, appear = Math.min(1, Math.max(0, (t - 700) / 400));
    ctx.strokeStyle = 'rgba(255,230,90,' + (1 - k) * appear + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 5 + 26 * k, 0, 6.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + appear + ')'; ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.3); ctx.stroke();
    var by = py - 26 - Math.abs(Math.sin(t / 220)) * 6;
    ctx.globalAlpha = appear; ctx.fillStyle = '#ffe94d'; ctx.strokeStyle = '#2a1d12'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, by + 12); ctx.lineTo(px - 8, by); ctx.lineTo(px - 3, by); ctx.lineTo(px - 3, by - 10); ctx.lineTo(px + 3, by - 10); ctx.lineTo(px + 3, by); ctx.lineTo(px + 8, by); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  };
  // ---- icons for choices: the Cyclopes' gifts, drawn big, and a god's portrait
  var ICONS = {
    bolt: function (b) { [[9, 1, 11, 1], [8, 2, 10, 2], [7, 3, 9, 3], [6, 4, 10, 4], [8, 5, 11, 5], [7, 6, 9, 6], [6, 7, 8, 7], [5, 8, 7, 8], [5, 9, 6, 9], [4, 10, 5, 10], [4, 11, 4, 12], [3, 13, 4, 13]].forEach(function (r) { b.r(r[0], r[1], r[2], r[3], '#ffe94d'); }); b.r(7, 4, 8, 4, '#fff8b0'); b.r(7, 3, 8, 3, '#fff8b0'); },
    trident: function (b) { b.r(7, 6, 8, 15, '#c9a227'); b.r(2, 2, 3, 7, '#e8e8f4'); b.r(12, 2, 13, 7, '#e8e8f4'); b.r(7, 0, 8, 6, '#e8e8f4'); b.r(2, 7, 13, 8, '#e8e8f4'); b.r(1, 1, 4, 1, '#fff'); b.r(11, 1, 14, 1, '#fff'); b.r(6, 0, 9, 0, '#fff'); },
    helmet: function (b) { b.r(3, 4, 12, 10, '#8a8a99'); b.r(4, 3, 11, 3, '#8a8a99'); b.r(5, 2, 10, 2, '#8a8a99'); b.r(3, 4, 12, 5, '#b0b0c0'); b.r(4, 8, 11, 10, '#5a5a68'); b.r(6, 8, 9, 10, '#1c1624'); b.r(7, 0, 8, 2, '#b03030'); b.r(3, 11, 12, 12, '#6a6a78'); b.r(2, 7, 3, 12, '#6a6a78'); b.r(12, 7, 13, 12, '#6a6a78'); }
  };
  A.icon = function (name, size) {
    var key = 'i|' + name + '|' + size; if (cache[key]) return cache[key];
    var b = new Buf(); ICONS[name](b); b.outline(OUT);
    var c = mk(size, size), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(b.canvas(1), 0, 0, 16, 16, 0, 0, size, size);
    return (cache[key] = c);
  };
  A.portrait = function (name, size) {
    var key = 'p|' + name + '|' + size; if (cache[key]) return cache[key];
    var c = mk(size, size), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(A.sprite(name, 'down', 0), 0, 0, 16, 16, 0, 0, size, size);
    return (cache[key] = c);
  };
  A.shade = shade;
  return A;
})();
