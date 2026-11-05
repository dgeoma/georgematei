/* georgematei.com · tema «Tempio di Apollo»: robot in volo, portatori e cantiere che si costruisce con lo scroll */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Robot in volo: si possono fermare (WCAG 2.2.2); fuori schermo non consumano */
  var hero = document.querySelector('.hero'), pausa = document.querySelector('.volo__pausa');
  if (pausa) pausa.addEventListener('click', function () {
    var on = root.classList.toggle('robot-fermi');
    pausa.setAttribute('aria-pressed', on ? 'true' : 'false');
    pausa.setAttribute('aria-label', on ? 'Fai ripartire i robot in volo' : 'Ferma i robot in volo');
    pausa.innerHTML = on ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  });
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { hero.classList.toggle('is-fuori', !e[0].isIntersecting); }).observe(hero);
  }

  /* Cantiere: un pezzo alla volta, secondo quanto hai scorso il metodo */
  var cantiere = document.querySelector('.cantiere');
  var metodo = document.getElementById('metodo');
  var portatori = document.querySelector('.robot-portatori');
  var scena = document.querySelector('.loghi__scena');
  if (reduce || !('IntersectionObserver' in window)) return;

  var pezzi = [], passi = [], didas, robot, fine, fatti = -1, conta = [0, 0, 0], FASI = ['I · Le fondamenta', 'II · Le colonne', 'III · Il frontone'];
  if (cantiere && metodo) {
    pezzi = [].slice.call(cantiere.querySelectorAll('.p'));
    passi = [].slice.call(metodo.querySelectorAll('.step'));
    didas = cantiere.querySelector('.cantiere__didas');
    robot = cantiere.querySelector('.cantiere__robot');
    fine = metodo.querySelector('.cta-row');
    pezzi.forEach(function (p) { conta[+p.getAttribute('data-f')]++; });
    cantiere.classList.add('is-vivo');
  }

  function cantiereAggiorna() {
    var alto = innerHeight, top = metodo.getBoundingClientRect().top, fineTop = fine.getBoundingClientRect().top;
    var k, lato = cantiere.parentNode;
    if (innerWidth <= 980 && getComputedStyle(lato).position !== 'sticky') {
      /* schermi bassi: il cantiere non resta fisso, si costruisce mentre lo attraversi */
      var r = cantiere.getBoundingClientRect();
      k = (alto * 0.95 - r.top) / (alto * 0.95 - 70);
    } else {
      var da = alto * 0.62, a = alto * 0.78;         /* inizia con il metodo a 62%, finisce col bottone a 78% */
      var corsa = (fineTop - top) - (a - da);
      k = corsa > 0 ? (da - top) / corsa : 1;
    }
    k = Math.max(0, Math.min(1, k));
    /* ogni fase ha lo stesso tratto di scroll, anche se ha meno pezzi */
    var n = k < 1 / 3 ? k * 3 * conta[0] : k < 2 / 3 ? conta[0] + (k * 3 - 1) * conta[1] : conta[0] + conta[1] + (k * 3 - 2) * conta[2];
    n = Math.round(n);
    if (n === fatti) return;
    fatti = n;
    pezzi.forEach(function (p, i) { p.classList.toggle('on', i < n); });
    var ultimo = pezzi[Math.max(0, n - 1)], fase = +ultimo.getAttribute('data-f');
    var finito = n >= pezzi.length;
    cantiere.classList.toggle('is-finito', finito);
    cantiere.classList.toggle('is-iniziato', n > 0);
    robot.style.left = (+ultimo.getAttribute('data-x') / 640 * 100) + '%';
    robot.style.top = (+ultimo.getAttribute('data-y') / 490 * 100) + '%';
    didas.textContent = finito || !n ? 'Un pezzo alla volta.' : FASI[fase];
    passi.forEach(function (s, i) { s.classList.toggle('is-attivo', n > 0 && i === fase); s.classList.toggle('is-fatto', n > 0 && (i < fase || finito)); });
  }

  function portatoriAggiorna() {
    var r = scena.getBoundingClientRect(), k = (innerHeight - r.top) / (innerHeight + r.height);
    k = Math.max(0, Math.min(1, k));
    portatori.style.setProperty('--x', ((r.width - portatori.offsetWidth) * (0.04 + k * 0.92)).toFixed(1) + 'px');
  }

  var inVista = { c: false, p: false }, atteso = false;
  function aggiorna() {
    atteso = false;
    if (inVista.c) cantiereAggiorna();
    if (inVista.p) portatoriAggiorna();
  }
  function chiedi() { if (!atteso) { atteso = true; requestAnimationFrame(aggiorna); } }
  /* portatori e robot del cantiere si muovono solo mentre scorri: si fermano da soli */
  var fermo;
  addEventListener('scroll', function () {
    root.classList.add('is-scorre');
    clearTimeout(fermo);
    fermo = setTimeout(function () { root.classList.remove('is-scorre'); }, 220);
  }, { passive: true });
  addEventListener('scroll', chiedi, { passive: true });
  addEventListener('resize', chiedi, { passive: true });

  var oss = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (v.target === metodo) inVista.c = v.isIntersecting;
      if (v.target === scena) { inVista.p = v.isIntersecting; if (portatori) portatori.classList.toggle('is-fermo', !v.isIntersecting); }
    });
    chiedi();
  }, { rootMargin: '10% 0px 10% 0px' });
  if (cantiere && metodo) oss.observe(metodo);
  if (scena && portatori) oss.observe(scena);
})();
