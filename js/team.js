// The team: Jupiter and up to three allies, chosen before a battle. With four allies or fewer to choose from there is nothing to pick.
// Every ally has their own hit points and moves (see battle.js).
var Team = (function () {
  var T = {};
  var BASE = { iuppiter: 6, neptunus: 5, pluto: 5, iuno: 5, ceres: 5, vesta: 5, amalthea: 4, curetes: 5, metis: 4, cyclopes: 5, centimani: 5, prometheus: 4, themis: 4, victoria: 4 };
  T.base = function (id) { return BASE[id] || 4; };
  // everyone who could fight now (Victory only helps in the final battle)
  T.roster = function (final) { return ['iuppiter'].concat(Book.members().filter(function (id) { return id !== 'victoria' || final; })); };
  // Jupiter and the remembered picks, filled up from the roster
  T.chosen = function (final) {
    var r = T.roster(final), p = Book.state().party.filter(function (id) { return r.indexOf(id) >= 0 && id !== 'iuppiter'; }).slice(0, 3);
    r.forEach(function (id) { if (p.length < 3 && id !== 'iuppiter' && p.indexOf(id) < 0) p.push(id); });
    return ['iuppiter'].concat(p);
  };
  // the screen before a battle: pick the three who fight beside Jupiter
  T.pick = function (final, done) {
    var r = T.roster(final); if (r.length <= 4) return done();
    var root = document.getElementById('teampick'), picks = T.chosen(final).slice(1), L = function (id) { return Game.clean(Game.line(id) || ''); };
    root.innerHTML = ''; root.hidden = false; Game.setBusy(true);
    var h = document.createElement('h2'); h.textContent = L('team_title'); root.appendChild(h);
    var grid = document.createElement('div'); grid.className = 'teamgrid'; root.appendChild(grid);
    var tiles = [], go = document.createElement('button'); go.className = 'go';
    function refresh() { tiles.forEach(function (t) { t.b.classList.toggle('sel', picks.indexOf(t.id) >= 0); }); go.disabled = picks.length !== 3; go.lastChild.nodeValue = L('team_go') + '  ' + picks.length + '/3'; }
    function tile(id, fixed) {
      var b = document.createElement('button'); b.className = 'tile' + (fixed ? ' fixed sel' : '');
      b.appendChild(Art.portrait(Art.allySprite(id), 56)); b.appendChild(document.createTextNode(Book.nameNom(id)));
      if (!fixed) b.onclick = function () { var i = picks.indexOf(id); if (i >= 0) picks.splice(i, 1); else if (picks.length < 3) picks.push(id); refresh(); };
      grid.appendChild(b); if (!fixed) tiles.push({ id: id, b: b }); return b;
    }
    tile('iuppiter', true);
    var btns = r.slice(1).map(function (id) { return tile(id, false); });
    go.appendChild(document.createTextNode('')); root.appendChild(go); refresh();
    go.onclick = function () { Book.setParty(picks); root.hidden = true; Game.setBusy(false); done(); };
    Game.numberButtons(btns);
  };
  return T;
})();
