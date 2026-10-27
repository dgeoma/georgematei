/* Animazioni: ogni effetto una volta sola, poi pietra. Tutte spente con prefers-reduced-motion.
   Gli effetti «Magna Grecia» sono componenti di 21st.dev portati in JavaScript puro:
   Text Blur Reveal (wensity) · Text Shimmer (wensity) · Mask Reveal (balick) · Line Draw SVG (pulkitxm) */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  if (reduce) return;
  document.documentElement.classList.add('motion');

  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function onView(els, cb, margin) {
    if (!els.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); }
      });
    }, { rootMargin: margin || '0px 0px -12% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* un solo ciclo per tutto ciò che segue lo scroll */
  var scrollers = [], ticking = false;
  function onScroll(fn) { scrollers.push(fn); fn(); }
  function run() { ticking = false; scrollers.forEach(function (f) { f(); }); }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  addEventListener('resize', function () { requestAnimationFrame(run); });

  /* 1. Titolo: le parole emergono dalla sfocatura (Text Blur Reveal) */
  var title = document.querySelector('.hero__title');
  if (title) {
    var i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach(function (part) {
            if (!part) return;
            if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'word';
            s.style.setProperty('--d', (i++ * 70) + 'ms');
            s.textContent = part;
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') split(n);
      });
    })(title);
    requestAnimationFrame(function () { title.classList.add('words-in'); });
    /* 2. Una sola passata di luce sul corsivo, quando le parole si sono posate (Text Shimmer) */
    var em = title.querySelector('em');
    if (em) setTimeout(function () { em.textContent = em.textContent; em.classList.add('gold'); }, 1000 + i * 70);
  }

  /* 3. Barra di avanzamento della lettura */
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  onScroll(function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  });

  /* 5. Il velo si alza su ouroboros e ritratto (Mask Reveal) */
  onView(all('.unveil'), function (el) { el.classList.add('is-in'); }, '0px 0px -10% 0px');

  /* 6. La greca si disegna una volta, all'ingresso (Line Draw SVG).
        Un solo tratto continuo, doppia spirale quadrata, moduli interi e centrati. */
  function meander(n, s, x0, y0) {
    function p(a, b) { return (x0 + a * s).toFixed(1) + ' ' + (y0 + b * s).toFixed(1); }
    var d = 'M' + p(0, 10);
    for (var k = 0, x = 0; k < n; k++, x += 12) {
      d += 'L' + p(x, 0) + 'L' + p(x + 10, 0) + 'L' + p(x + 10, 8) + 'L' + p(x + 4, 8) + 'L' + p(x + 4, 4) +
           'L' + p(x + 6, 4) + 'L' + p(x + 6, 6) + 'L' + p(x + 8, 6) + 'L' + p(x + 8, 2) + 'L' + p(x + 2, 2) +
           'L' + p(x + 2, 10) + 'L' + p(x + 12, 10);
    }
    return d;
  }
  all('.greca').forEach(function (box) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var parts = [0, 1, 2].map(function () {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('pathLength', '1');
      svg.appendChild(path);
      return path;
    });
    box.appendChild(svg);
    function build() {
      var w = box.clientWidth, h = box.clientHeight;
      if (!w || !h) return;
      var s = h / 15, unit = 12 * s, n = Math.max(1, Math.floor(w / unit));
      var x0 = (w - n * unit) / 2;
      svg.setAttribute('viewBox', '0 0 ' + w.toFixed(1) + ' ' + h.toFixed(1));
      parts[0].setAttribute('d', 'M' + x0.toFixed(1) + ' ' + (s * 0.5).toFixed(1) + 'H' + (x0 + n * unit).toFixed(1));
      parts[1].setAttribute('d', meander(n, s, x0, s * 2.5));
      parts[2].setAttribute('d', 'M' + x0.toFixed(1) + ' ' + (h - s * 0.5).toFixed(1) + 'H' + (x0 + n * unit).toFixed(1));
    }
    build();
    var lastW = box.clientWidth;
    addEventListener('resize', function () { if (box.clientWidth !== lastW) { lastW = box.clientWidth; build(); } });
  });
  onView(all('.greca'), function (el) { el.classList.add('is-drawn'); }, '0px 0px -8% 0px');

  /* 7. Ruote di Anticitera: si disegnano all'ingresso, poi la manovella è lo scroll.
        Rapporti veri tra i denti (56 : 24 : 14): se ti fermi, si ferma la macchina. */
  var mech = document.querySelector('.mech');
  if (mech) {
    onView([mech], function (el) { el.classList.add('is-in'); });
    var gears = [['.mech__gear--big', 30], ['.mech__gear--mid', -70], ['.mech__gear--small', 120]].map(function (g) {
      return [mech.querySelector(g[0]), g[1]];
    });
    onScroll(function () {
      var r = (mech.closest('section') || mech).getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      var p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      gears.forEach(function (g) { if (g[0]) g[0].style.transform = 'rotate(' + (g[1] * p).toFixed(2) + 'deg)'; });
    });
  }

  /* 8. La linea del percorso si disegna una volta */
  var tl = document.querySelector('.timeline');
  if (tl) {
    var line = document.createElement('span');
    line.className = 'timeline__line';
    tl.appendChild(line);
    onView([tl], function (el) { el.classList.add('is-drawn'); }, '0px 0px -20% 0px');
  }

  if (!fine) return; /* sul computer: un riflesso caldo sotto il cursore, solo dove si legge */

  /* 9. Riflesso che segue il cursore su card, colonne e passi */
  all('.card, .fit__col, .pole, .step').forEach(function (el) {
    el.classList.add('spot');
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    });
  });
})();
