/* Animazioni: tutte disattivate con prefers-reduced-motion */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) return;
  document.documentElement.classList.add('motion');

  /* 1. Titolo hero: parole che emergono dalla sfocatura */
  var title = document.querySelector('.hero__title');
  if (title) {
    var i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
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
  }

  /* 2. Barra di avanzamento della lettura */
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);
  var onScroll = function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? scrollY / h : 0) + ')';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 3. Numeri che contano quando entrano in vista */
  var nums = document.querySelectorAll('.stat__num');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      var el = e.target, raw = el.textContent, m = raw.match(/\d+/);
      if (!m) return;
      var end = +m[0], t0 = performance.now(), dur = 1400;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = raw.replace(m[0], v);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  nums.forEach(function (n) { io.observe(n); });

  /* 4. Linea del percorso che si disegna scorrendo */
  var tl = document.querySelector('.timeline');
  if (tl) {
    var line = document.createElement('span');
    line.className = 'timeline__line';
    tl.appendChild(line);
    var drawLine = function () {
      var r = tl.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
      line.style.transform = 'scaleY(' + p + ')';
    };
    addEventListener('scroll', drawLine, { passive: true });
    drawLine();
  }

  /* 5. Certificazioni come nastro continuo */
  var creds = document.querySelector('.creds ul');
  if (creds) {
    var track = document.createElement('div');
    track.className = 'marquee__track';
    var a = creds.cloneNode(true), b = creds.cloneNode(true);
    b.setAttribute('aria-hidden', 'true');
    track.appendChild(a); track.appendChild(b);
    var wrap = document.createElement('div');
    wrap.className = 'marquee';
    wrap.appendChild(track);
    creds.parentNode.replaceChild(wrap, creds);
  }

  if (!fine) return; /* gli effetti col mouse solo su computer */

  /* 6. Riflesso che segue il cursore su card, colonne e poli */
  document.querySelectorAll('.card, .fit__col, .pole, .step').forEach(function (el) {
    el.classList.add('spot');
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      el.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    });
  });

  /* 7. Bottoni magnetici */
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('pointermove', function (ev) {
      var r = btn.getBoundingClientRect();
      var x = (ev.clientX - r.left - r.width / 2) * 0.18, y = (ev.clientY - r.top - r.height / 2) * 0.3;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });

  /* 8. Affresco e ritratto con inclinazione leggera */
  document.querySelectorAll('.statue--hero .statue__frame, .about__photo').forEach(function (el) {
    el.classList.add('tilt');
    el.addEventListener('pointermove', function (ev) {
      var r = el.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(900px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
      el.style.setProperty('--gx', ((x + 0.5) * 100) + '%');
      el.style.setProperty('--gy', ((y + 0.5) * 100) + '%');
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });
})();
