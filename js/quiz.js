// A text card followed by one question, used by the collection book and the story panels.
// Rules (design §16): 3-second pause before Continue; wrong answer -> re-read the text and ask again for
// half the points; a second miss shows the right answer and play goes on.
var Quiz = (function () {
  var Q = { results: {} };
  function L(id) { return Game.clean(Game.line(id) || ''); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text) e.textContent = text; if (cls) e.className = cls; return e; }
  function btn(text, fn) { var b = el('button', text); b.onclick = fn; return b; }

  // textId: card text; qId: its question (or null for a plain card); key: where the result is kept.
  Q.run = function (root, textId, qId, key, done, cat, askFirst) {
    cat = cat || 'book';
    function card(attempt) {
      root.innerHTML = '';
      root.appendChild(el('div', L(textId), 'page'));
      var b = btn('', function () { if (!qId || Q.results[key]) done(); else ask(attempt); });
      root.appendChild(b);
      Game.pauseButtons([b], [L('ui_continue')], L(textId));   // a card already read this session does not wait again
    }
    function ask(attempt) {
      var q = Game.qline(qId); root.innerHTML = '';
      root.appendChild(el('div', Game.clean(q.question), 'page'));
      q.choices.forEach(function (c, i) {
        root.appendChild(btn(c, function () { answer(attempt, i === q.answer, q); }));
      });
    }
    function answer(attempt, right, q) {
      root.innerHTML = '';
      if (right) {
        Q.results[key] = { tries: attempt, correct: true, firstTry: attempt === 1 };
        Score.add(cat, attempt === 1 ? Score.CFG.bookFirst : Score.CFG.bookRetry);
        root.appendChild(el('div', L('ui_correct'), 'page'));
        root.appendChild(btn(L('ui_continue'), done));
      } else if (attempt === 1) {
        root.appendChild(el('div', L('ui_wrong'), 'page'));
        root.appendChild(btn(L('ui_continue'), function () { card(2); }));      // back to re-read the text
      } else {
        Q.results[key] = { tries: 2, correct: false, firstTry: false };
        root.appendChild(el('div', L('ui_answer_is') + ' ' + q.choices[q.answer], 'page'));
        root.appendChild(btn(L('ui_continue'), done));
      }
    }
    if (askFirst && qId) ask(1); else card(1);   // askFirst: the text was just shown as a scene, go straight to the question
  };
  return Q;
})();
