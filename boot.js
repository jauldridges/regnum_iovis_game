// Loads one mission's content, then the engine scripts in order.
(function () {
  var params = new URLSearchParams(location.search);
  window.DRAFTS = params.has('drafts');
  window.LANG = params.get('lang') === 'en' ? 'en' : 'la';
  function load(list, done) {
    if (!list.length) return done();
    var s = document.createElement('script');
    s.src = list[0]; s.onload = function () { load(list.slice(1), done); };
    document.head.appendChild(s);
  }
  load(['content/latin.js', 'js/sound.js', 'js/score.js', 'js/prog.js', 'js/art.js', 'js/maps.js', 'js/quiz.js', 'js/story.js', 'js/core.js', 'js/team.js', 'js/battle.js', 'js/book.js'], function () { Game.init(); });
})();
