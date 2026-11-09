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
  'E': { c: '#d8c9a0' }
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
           { id: 'guardH', x: 11, y: 6, c: '#b5651d', show: function () { return !Story.flags.guardH; } }]
  }
};
