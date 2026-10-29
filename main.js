/* georgematei.com · comportamento della pagina (v15) */
(function () {
  window.gmPronto = true;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Comparsa al primo passaggio, una volta sola */
  var els = document.querySelectorAll('.reveal');
  var hero = document.querySelector('.hero');
  if (!('IntersectionObserver' in window) || reduce) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    if (hero) hero.classList.add('is-in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
    if (hero) setTimeout(function () { hero.classList.add('is-in'); }, 120);
  }

  /* Le tre etichette attorno alla foto: entrano, poi galleggiano piano */
  if (!reduce) {
    setTimeout(function () {
      document.querySelectorAll('.chip').forEach(function (c) { c.classList.add('is-floating'); });
    }, 2200);
  }

  /* Menu: ombra dopo lo scroll e voce della sezione in vista */
  var nav = document.querySelector('.nav');
  addEventListener('scroll', function () { nav.classList.toggle('is-scrolled', scrollY > 12); }, { passive: true });
  var links = document.querySelectorAll('.nav__links a');
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (a && e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* 105+ che conta, una volta */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && !reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        var el = e.target, to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '', t0 = null;
        function tick(t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 1400), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
          el.textContent = v + (k === 1 ? suf : '');
          if (k < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* Loghi: si possono fermare (WCAG 2.2.2) */
  var mq = document.querySelector('.marquee'), mt = document.querySelector('.marquee__pause');
  if (mq && mt) mt.addEventListener('click', function () {
    var on = mq.classList.toggle('is-paused');
    mt.setAttribute('aria-label', on ? 'Fai ripartire i loghi' : 'Ferma i loghi che scorrono');
    mt.innerHTML = on ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  });

  /* Calendario: parte dopo il caricamento della pagina (l'apertura resta veloce);
     «Carico le date libere…» finché HighLevel non lo disegna */
  var calBox = document.getElementById('calendario'), calFrame = calBox && calBox.querySelector('iframe[data-src]');
  if (calFrame) {
    var calPronto = function () { calBox.classList.add('is-ready'); };
    var calAvvia = function () {
      calFrame.addEventListener('load', function () { setTimeout(calPronto, 2500); });
      calFrame.src = calFrame.getAttribute('data-src');
      var s = document.createElement('script'); s.src = 'https://link.msgsndr.com/js/form_embed.js'; s.async = true;
      document.body.appendChild(s);
      setTimeout(calPronto, 10000);
    };
    if (document.readyState === 'complete') calAvvia(); else addEventListener('load', calAvvia);
  }

  /* Calendario: è già aperto sotto l'apertura; ogni «Prenota» porta lì e ci sposta il focus */
  var cal = document.getElementById('prenota'), calTitle = document.getElementById('cal-top-t');
  if (cal) document.querySelectorAll('a[href="#prenota"]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      cal.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (calTitle) calTitle.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', '#prenota');
    });
  });
})();
