/* Scroll-driven word reveal for the hero block.
   Everything is a pure function of scroll progress, so scrolling
   back up plays the whole thing in reverse for free. */
(function () {
  var section  = document.getElementById('reveal');
  var card     = document.getElementById('card');
  var moveO    = document.getElementById('moveO');
  var stretch  = document.getElementById('moveStretch');
  var words    = Array.prototype.slice.call(document.querySelectorAll('[data-w]'));
  if (!section || !words.length) return;

  var N            = words.length;   // number of words in the sequence
  var REVEAL_END   = 0.80;           // words finish here, morph owns the rest
  var MORPH_START  = 0.82;
  var EXTRA_OS     = 12;             // extra "o"s grown out of move.
  var CARD_FROM    = 0;              // filled in below
  var CARD_TO      = 0;

  // "Hi," is the resting state at the top of the page, so the sequence is
  // shifted back by one step: word 1 starts the moment you scroll.
  var step    = REVEAL_END / (N - 1);
  var wordDur = step;                // one word fully lands before the next starts

  // no block behind "Hi," at all; fully solid the moment "Nuhman" lands.
  CARD_FROM = wordStart(1);
  CARD_TO   = wordStart(3) + wordDur;

  function wordStart(i) { return (i - 1) * step; }
  function clamp(v)     { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t)    { return t * t * (3 - 2 * t); }

  /* width of one "o" at the current font size, measured live */
  var oWidth = 0;
  function measure() {
    oWidth = moveO.getBoundingClientRect().width;
    // pre-build the extra glyphs once
    if (stretch.childElementCount !== EXTRA_OS) {
      stretch.textContent = '';
      for (var i = 0; i < EXTRA_OS; i++) {
        var s = document.createElement('span');
        s.className = 'o';
        s.textContent = 'o';
        stretch.appendChild(s);
      }
    }
  }

  function lerpColor(t) {
    // #0b0b0b -> #2b7fff
    var r = Math.round(11  + (43  - 11)  * t);
    var g = Math.round(11  + (127 - 11)  * t);
    var b = Math.round(11  + (255 - 11)  * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function render(p) {
    /* ---- words, one by one ---- */
    for (var i = 0; i < N; i++) {
      var t = smooth(clamp((p - wordStart(i)) / wordDur));
      var el = words[i];
      el.style.opacity   = t;
      el.style.filter    = t > 0.999 ? 'none' : 'blur(' + (6 * (1 - t)).toFixed(2) + 'px)';
      el.style.transform = 'translate3d(0,' + (0.32 * (1 - t)).toFixed(3) + 'em,0)';
    }

    /* ---- the white block fades up behind them ---- */
    var c = smooth(clamp((p - CARD_FROM) / (CARD_TO - CARD_FROM)));
    card.style.setProperty('--card-o', c.toFixed(3));
    card.style.setProperty('--card-s', (0.985 + 0.015 * c).toFixed(4));

    /* ---- move.  ->  moooooooooooove. ---- */
    var m = smooth(clamp((p - MORPH_START) / (1 - MORPH_START)));
    var grown = m * EXTRA_OS;

    var col  = lerpColor(clamp(m * 5));           // the original "o" turns blue first
    var glow = '0 0 ' + (22 * m).toFixed(1) + 'px rgba(43,127,255,' + (0.55 * m).toFixed(2) + ')';
    moveO.style.color = col;
    moveO.style.textShadow = m > 0 ? glow : 'none';

    var kids = stretch.children;
    for (var k = 0; k < kids.length; k++) {
      var kt = clamp(grown - k);                  // this glyph's own 0..1
      kids[k].style.width      = (kt * oWidth).toFixed(2) + 'px';
      kids[k].style.opacity    = kt.toFixed(3);
      kids[k].style.color      = col;
      kids[k].style.textShadow = glow;
    }
  }

  /* ---- progress from scroll position ---- */
  var ticking = false;
  function update() {
    ticking = false;
    var rect  = section.getBoundingClientRect();
    var range = section.offsetHeight - window.innerHeight;
    var p     = range > 0 ? clamp(-rect.top / range) : 0;
    render(p);
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });

  measure();
  update();
  // fonts land late and change the "o" width
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); update(); });
  }
})();
