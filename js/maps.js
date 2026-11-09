// Tile maps (placeholder art: one colour per tile). Each area fits one 15x10 screen.
// Entities are people/enemies; `show` says when they are present. Exits are handled by Story.
var TILES = {
  '#': { c: '#4a3b2a', solid: true },
  '.': { c: '#b9a98a' },
  'T': { c: '#c9a227', solid: true, obj: 'obj_throne' },
  'F': { c: '#9aa3ad', solid: true, obj: 'obj_sickle' },
  'C': { c: '#e8a0b4', solid: true, obj: 'obj_cradle' },
  'V': { c: '#2a2a33', solid: true, obj: 'obj_cave' },
  'H': { c: '#6fbf4a', solid: true, obj: 'obj_herba' },
  'g': { c: '#7aa05a' },
  '~': { c: '#2f6fb5', solid: true, obj: 'obj_ocean' },
  's': { c: '#e0cf9a' },
  'S': { c: '#f2c9d0', solid: true, obj: 'obj_concha' },
  'E': { c: '#d8c9a0' },
  'd': { c: '#4a4a5a' },
  'G': { c: '#8a8a99', solid: true },
  'I': { c: '#33333f', solid: true, obj: 'obj_inscr1' },
  'J': { c: '#33333f', solid: true, obj: 'obj_inscr2' },
  'K': { c: '#777777', solid: true, obj: 'obj_catena' },
  'P': { c: '#e6e6f5', solid: true, obj: 'obj_olympus' },
  'Q': { c: '#5a4a5a', solid: true, obj: 'obj_othrys' },
  'r': { c: '#8b7d6b' }
};
var MAPS = {
  hall: {            // Chapter 1: Saturn's hall (Ops)
    rows: ['###########F###', '#.............#', '#.C..TTT......#', '#.............#', '#.............#',
           '#.............#', '#.............#', '#.............#', '#.............#', '######...######'],
    start: { x: 3, y: 6 }, exits: [],
    ents: [{ id: 'servant', x: 10, y: 4, c: '#6a4fa3', show: function () { return true; } },
           { id: 'saturn_in', x: 7, y: 8, c: '#b02a2a', show: function () { return Story.flags.saturnIn; } }]
  },
  ida: {             // Chapter 2: Mount Ida, Crete (Jupiter)
    rows: ['###############', '#ggggggggggggg#', '#gVVgggggHgggg#', '#ggggggggggggg#', '#ggggggggggggg#',
           '#gggggggggggggE', '#ggggggggggggg#', '#ggggggggggggg#', '#ggggggggggggg#', '###############'],
    start: { x: 2, y: 3 }, exits: [{ x: 14, y: 5, id: 'ida_east' }],
    ents: [{ id: 'amalthea', x: 4, y: 4, c: '#f2f2f2', show: function () { return true; } },
           { id: 'curetes1', x: 11, y: 6, c: '#8a8a99', show: function () { return true; } },
           { id: 'curetes2', x: 12, y: 6, c: '#8a8a99', show: function () { return true; } },
           { id: 'guard1', x: 5, y: 7, c: '#b5651d', show: function () { return !Story.flags.guard1; } },
           { id: 'guard2', x: 11, y: 8, c: '#b5651d', show: function () { return !Story.flags.guard2; } }]
  },
  oceanus: {         // Chapter 3: the edge of Ocean (Metis)
    rows: ['~~~~~~~~~~~~~~~', '~~~~~~~~~~~~~~~', '#sssssssssssss#', '#sssSsssssssss#', '#sssssssssssss#',
           '#sssssssssssss#', '#ssssssssSssss#', '#sssssssssssss#', '#sssssssssssss#', '######E########'],
    start: { x: 6, y: 8 }, exits: [{ x: 6, y: 9, id: 'ocean_south' }],
    ents: [{ id: 'metis', x: 7, y: 4, c: '#5ac8c8', show: function () { return true; } }]
  },
  hall2: {           // Chapter 3: Saturn's hall again, more guards (Jupiter as cupbearer)
    rows: ['###########F###', '#.............#', '#....TTT......#', '#.............#', '#.............#',
           '#.............#', '#.............#', '#.............#', '#.............#', '######EEE######'],
    start: { x: 7, y: 8 }, exits: [{ x: 6, y: 9, id: 'hall2_exit' }, { x: 7, y: 9, id: 'hall2_exit' }, { x: 8, y: 9, id: 'hall2_exit' }],
    ents: [{ id: 'saturn', x: 6, y: 3, c: '#b02a2a', show: function () { return !Story.flags.cupDone; } },
           { id: 'guardH', x: 11, y: 6, c: '#b5651d', show: function () { return Story.flags.cupDone && !Story.flags.guardH; } }]
  },
  tartarus: {        // Chapter 4: Tartarus. Campe guards the cells of the Cyclopes (left) and the Hundred-Handers (right)
    rows: ['##I#########J##', '#ddddddddddddd#', '#dKdddddddddKd#', '#ddddddddddddd#', '#dGdddddddddGd#',
           '#dGdddddddddGd#', '#dGdddddddddGd#', '#ddddddddddddd#', '#ddddddddddddd#', '#######E#######'],
    start: { x: 7, y: 8 }, exits: [{ x: 7, y: 9, id: 'tart_exit' }],
    ents: [{ id: 'campe', x: 7, y: 3, c: '#7a2a5a', show: function () { return !Story.flags.campe; } },
           { id: 'cyclops1', x: 1, y: 4, c: '#d9822b', show: function () { return true; } },
           { id: 'cyclops2', x: 1, y: 5, c: '#d9822b', show: function () { return true; } },
           { id: 'cyclops3', x: 1, y: 6, c: '#d9822b', show: function () { return true; } },
           { id: 'cent1', x: 13, y: 4, c: '#c0c0e0', show: function () { return true; } },
           { id: 'cent2', x: 13, y: 5, c: '#c0c0e0', show: function () { return true; } },
           { id: 'cent3', x: 13, y: 6, c: '#c0c0e0', show: function () { return true; } }]
  },
  olympus: {         // Chapter 5: the camp on Olympus (Styx and Victory arrive first)
    rows: ['###############', '#gggPPPggggggg#', '#ggggggggggggg#', '#ggggggggggggg#', '#ggggggggggggg#',
           '#gggggggggggggE', '#ggggggggggggg#', '#ggggggggggggg#', '#ggggggggggggg#', '###############'],
    start: { x: 7, y: 8 }, exits: [{ x: 14, y: 5, id: 'olympus_east' }],
    ents: [{ id: 'styx', x: 4, y: 4, c: '#3a7bd5', show: function () { return true; } },
           { id: 'victoria', x: 5, y: 4, c: '#f5d76e', show: function () { return true; } }]
  },
  othrys: {          // Chapter 5: Mount Othrys. The bosses come one after another at the top of the path
    rows: ['##Q#########Q##', '#rrrrrrrrrrrrr#', '#rrrrrrrrrrrrr#', '#rrrrrrrrrrrrr#', '#rrrrrrrrrrrrr#',
           '#rrrrrrrrrrrrr#', '#rrrrrrrrrrrrr#', '#rrrrrrrrrrrrr#', '#rrrrrrrrrrrrr#', '###############'],
    start: { x: 7, y: 8 }, exits: [],
    ents: [{ id: 'hyperion', x: 7, y: 3, c: '#f0c040', show: function () { return !Story.flags.hyperion; } },
           { id: 'prometheus', x: 3, y: 7, c: '#e0622e', show: function () { return Story.flags.hyperion; } },
           { id: 'themis', x: 4, y: 7, c: '#c9a2e8', show: function () { return Story.flags.hyperion; } },
           { id: 'iapetus', x: 7, y: 3, c: '#8a6a4a', show: function () { return Story.flags.prom && Story.flags.them && !Story.flags.iapetus; } },
           { id: 'atlas', x: 7, y: 3, c: '#5a5a6a', show: function () { return Story.flags.iapetus && !Story.flags.atlas; } },
           { id: 'saturn_boss', x: 7, y: 3, c: '#b02a2a', show: function () { return Story.flags.atlas && !Story.flags.saturnBoss; } }]
  }
};
